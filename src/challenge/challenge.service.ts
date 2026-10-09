import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { GeminiService } from '../ai/gemini.service';
import { ChallengeGenerationResult } from '../ai/ai.types';
import { CatalogService } from '../catalog/catalog.service';
import { PaginationDTO } from '../common/dto/pagination.dto';
import { CreditService } from '../credit/credit.service';
import {
  type Challenge,
  ChallengeStatus,
  CreditTransactionType,
  type Prisma,
  type User,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AVOID_TITLES_LIMIT,
  CHALLENGE_LIST_OMIT,
  CHALLENGE_SUMMARY_INCLUDE,
  GENERATION_COST,
  MAX_REGENERATIONS,
  STUCK_GENERATION_MS,
} from './challenge.constants';
import { renderChallengeMarkdown } from './challenge.markdown';
import { GenerateChallengeDTO } from './dto/generate-challenge.dto';

@Injectable()
export class ChallengeService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ChallengeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly credit: CreditService,
    private readonly gemini: GeminiService,
  ) {}

  /**
   * Recovers challenges left in GENERATING by a crash or restart: new
   * challenges fail with a refund, regenerations go back to the last version.
   */
  async onApplicationBootstrap() {
    const stuck = await this.prisma.challenge.findMany({
      where: {
        status: ChallengeStatus.GENERATING,
        updatedAt: { lt: new Date(Date.now() - STUCK_GENERATION_MS) },
      },
      include: { _count: { select: { versions: true } } },
    });

    for (const challenge of stuck) {
      if (challenge._count.versions > 0) {
        await this.prisma.challenge.update({
          where: { id: challenge.id },
          data: {
            status: ChallengeStatus.READY,
            regenerationsUsed: { decrement: 1 },
          },
        });
      } else {
        await this.failGeneration(challenge.id, challenge.userId);
      }
    }

    if (stuck.length > 0) {
      this.logger.warn(`Recovered ${stuck.length} stuck challenge(s)`);
    }
  }

  /**
   * Charges one credit and generates a new challenge. The credit is refunded
   * when the generation fails.
   */
  async generate(user: User, dto: GenerateChallengeDTO) {
    const { stack, framework } = await this.catalog.findSelection(
      dto.stackId,
      dto.frameworkId,
    );

    const challenge = await this.prisma.$transaction(async (tx) => {
      const created = await tx.challenge.create({
        data: {
          userId: user.id,
          stackId: stack.id,
          frameworkId: framework.id,
          level: dto.level,
        },
      });
      await this.credit.debit(tx, {
        userId: user.id,
        amount: GENERATION_COST,
        type: CreditTransactionType.CHALLENGE_GENERATION,
        referenceId: created.id,
      });

      return created;
    });

    let result: ChallengeGenerationResult;
    try {
      result = await this.gemini.generateChallenge({
        stack: stack.name,
        framework: framework.name,
        language: framework.language,
        level: dto.level,
        avoidTitles: await this.findPreviousTitles(user.id, framework.id),
      });
    } catch (error) {
      await this.failGeneration(challenge.id, user.id);
      throw error;
    }

    return this.saveVersion(challenge.id, 1, result);
  }

  /** Replaces the challenge content once, for free. */
  async regenerate(user: User, id: string) {
    const challenge = await this.findOwned(user.id, id);

    if (challenge.regenerationsUsed >= MAX_REGENERATIONS) {
      throw new BadRequestException('Challenge already regenerated');
    }

    const { count } = await this.prisma.challenge.updateMany({
      where: {
        id,
        status: ChallengeStatus.READY,
        regenerationsUsed: challenge.regenerationsUsed,
      },
      data: {
        status: ChallengeStatus.GENERATING,
        regenerationsUsed: { increment: 1 },
      },
    });
    if (count === 0) {
      throw new ConflictException('Challenge is not ready to be regenerated');
    }

    let result: ChallengeGenerationResult;
    try {
      result = await this.gemini.generateChallenge({
        stack: challenge.stack.name,
        framework: challenge.framework.name,
        language: challenge.framework.language,
        level: challenge.level,
        avoidTitles: await this.findPreviousTitles(
          user.id,
          challenge.frameworkId,
        ),
      });
    } catch (error) {
      await this.prisma.challenge.update({
        where: { id },
        data: {
          status: ChallengeStatus.READY,
          regenerationsUsed: challenge.regenerationsUsed,
        },
      });
      throw error;
    }

    return this.saveVersion(id, challenge.regenerationsUsed + 2, result);
  }

  async findMine(userId: string, pagination: PaginationDTO) {
    return this.paginate({ userId }, pagination);
  }

  async findPublic(pagination: PaginationDTO) {
    return this.paginate(
      { public: true, status: ChallengeStatus.READY },
      pagination,
    );
  }

  /** Owners see their challenge with every version; others only public ones. */
  async findById(id: string, viewer?: User) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        ...CHALLENGE_SUMMARY_INCLUDE,
        versions: { orderBy: { version: 'asc' } },
      },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }
    if (challenge.userId === viewer?.id) {
      return challenge;
    }
    if (!challenge.public || challenge.status !== ChallengeStatus.READY) {
      throw new NotFoundException('Challenge not found');
    }

    const { versions: _versions, ...publicChallenge } = challenge;
    return publicChallenge;
  }

  /** The current version as a markdown document, with the same visibility rules. */
  async renderMarkdown(id: string, viewer?: User) {
    const challenge = await this.findById(id, viewer);

    if (challenge.status !== ChallengeStatus.READY) {
      throw new ConflictException('Challenge is not ready');
    }

    return renderChallengeMarkdown(challenge);
  }

  async updateVisibility(user: User, id: string, isPublic: boolean) {
    const challenge = await this.findOwned(user.id, id);

    if (isPublic && challenge.status !== ChallengeStatus.READY) {
      throw new BadRequestException('Only ready challenges can be public');
    }

    return this.prisma.challenge.update({
      where: { id },
      data: { public: isPublic },
      include: CHALLENGE_SUMMARY_INCLUDE,
    });
  }

  async delete(user: User, id: string) {
    await this.findOwned(user.id, id);
    await this.prisma.challenge.delete({ where: { id } });
  }

  private async findOwned(userId: string, id: string) {
    const challenge = await this.prisma.challenge.findFirst({
      where: { id, userId },
      include: CHALLENGE_SUMMARY_INCLUDE,
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return challenge;
  }

  private async failGeneration(challengeId: string, userId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.challenge.update({
        where: { id: challengeId },
        data: { status: ChallengeStatus.FAILED },
      });
      await this.credit.grant(tx, {
        userId,
        amount: GENERATION_COST,
        type: CreditTransactionType.REFUND,
        referenceId: challengeId,
      });
    });
  }

  private async findPreviousTitles(userId: string, frameworkId: string) {
    const challenges = await this.prisma.challenge.findMany({
      where: { userId, frameworkId, title: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: AVOID_TITLES_LIMIT,
      select: { title: true, projectName: true },
    });

    return challenges.map(({ title, projectName }) =>
      projectName ? `${title} (${projectName})` : title!,
    );
  }

  private async saveVersion(
    challengeId: Challenge['id'],
    version: number,
    { challenge: generated, model }: ChallengeGenerationResult,
  ) {
    const [challenge] = await this.prisma.$transaction([
      this.prisma.challenge.update({
        where: { id: challengeId },
        data: { ...generated, status: ChallengeStatus.READY },
        include: CHALLENGE_SUMMARY_INCLUDE,
      }),
      this.prisma.challengeVersion.create({
        data: { challengeId, version, model, ...generated },
      }),
    ]);

    return challenge;
  }

  private async paginate(
    where: Prisma.ChallengeWhereInput,
    pagination: PaginationDTO,
  ) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.challenge.findMany({
        where,
        include: CHALLENGE_SUMMARY_INCLUDE,
        omit: CHALLENGE_LIST_OMIT,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.challenge.count({ where }),
    ]);

    return { items, total, page: pagination.page, limit: pagination.limit };
  }
}
