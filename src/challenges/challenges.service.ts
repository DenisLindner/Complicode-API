/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GenerativeService } from './generative/generative.service';
import { CreateChallengeDTO } from './dto/create-challenge.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { PaginationDTO } from './dto/pagination.dto';

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly generativeService: GenerativeService,
  ) {}

  async generateChallenge(
    data: CreateChallengeDTO,
    userId: string,
  ): Promise<any> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const challenge = await this.generativeService.generateContent(data);
    if (!challenge) {
      throw new InternalServerErrorException(
        'Error generating challenge, please try again later',
      );
    }

    return await this.prisma.challenge.create({
      data: { content: challenge, authorId: userId },
      select: { id: true, content: true, authorId: true, createdAt: true },
    });
  }

  async getUserChallenges(userId: string): Promise<any> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.prisma.challenge.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        content: true,
        authorId: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getPublicChallenges(pagination: PaginationDTO): Promise<any> {
    return await this.prisma.challenge.findMany({
      where: { isPublic: true },
      select: {
        id: true,
        content: true,
        authorId: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
      take: pagination.take,
      skip: pagination.skip,
    });
  }

  async updateChallenge(challengeId: string, userId: string): Promise<any> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const challenge = await this.findById(challengeId);

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.authorId !== userId) {
      throw new UnauthorizedException(
        'This challenge does not belong to this user',
      );
    }

    return await this.prisma.challenge.update({
      where: { id: challengeId },
      data: { isPublic: !challenge.isPublic },
      select: {
        id: true,
        content: true,
        authorId: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private async findById(id: string): Promise<any> {
    return await this.prisma.challenge.findUnique({
      where: { id },
      select: { id: true, authorId: true, isPublic: true },
    });
  }
}
