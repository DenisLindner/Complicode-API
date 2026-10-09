import { BadRequestException, Injectable } from '@nestjs/common';
import { ChallengeLevel } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LEVEL_LABELS } from './catalog.constants';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findStacks() {
    return this.prisma.stack.findMany({
      orderBy: { name: 'asc' },
      include: {
        frameworks: {
          where: { active: true },
          orderBy: { name: 'asc' },
          select: { id: true, slug: true, name: true, language: true },
        },
      },
    });
  }

  findLevels() {
    return Object.values(ChallengeLevel).map((value) => ({
      value,
      label: LEVEL_LABELS[value],
    }));
  }

  /** Ensures the framework exists, is active and belongs to the stack. */
  async findSelection(stackId: string, frameworkId: string) {
    const framework = await this.prisma.framework.findFirst({
      where: {
        id: frameworkId,
        active: true,
        stacks: { some: { id: stackId } },
      },
      include: { stacks: { where: { id: stackId } } },
    });

    if (!framework) {
      throw new BadRequestException(
        'Framework not available for the selected stack',
      );
    }

    return { stack: framework.stacks[0], framework };
  }
}
