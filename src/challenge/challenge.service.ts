import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChallengeDTO } from './dto/create-challenge.dto';

@Injectable()
export class ChallengeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChallengeDTO) {
    return this.prisma.challenge.create({
      data: dto,
    });
  }

  async findById(id: string) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id } });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return challenge;
  }

  async findAll() {
    return await this.prisma.challenge.findMany();
  }

  async delete(id: string) {
    await this.findById(id);
    await this.prisma.challenge.delete({ where: { id } });
  }
}
