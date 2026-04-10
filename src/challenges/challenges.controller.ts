import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDTO } from './dto/create-challenge.dto';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PaginationDTO } from './dto/pagination.dto';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengeService: ChallengesService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 2 } })
  async generateChallenge(
    @Body() data: CreateChallengeDTO,
    @CurrentUser('sub') user: string,
  ): Promise<any> {
    return this.challengeService.generateChallenge(data, user);
  }

  @Get('me')
  async getUserChallenges(@CurrentUser('sub') user: string): Promise<any> {
    return this.challengeService.getUserChallenges(user);
  }

  @Get('public')
  @IsPublic()
  async getPublicChallenges(@Query() pagination: PaginationDTO): Promise<any> {
    return this.challengeService.getPublicChallenges(pagination);
  }

  @Patch(':id')
  async updateChallenge(
    @Param('id') id: string,
    @CurrentUser('sub') user: string,
  ): Promise<any> {
    return this.challengeService.updateChallenge(id, user);
  }
}
