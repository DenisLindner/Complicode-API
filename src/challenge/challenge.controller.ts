import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PaginationDTO } from '../common/dto/pagination.dto';
import type { User } from '../generated/prisma/client';
import { ChallengeService } from './challenge.service';
import { GenerateChallengeDTO } from './dto/generate-challenge.dto';
import { UpdateVisibilityDTO } from './dto/update-visibility.dto';

@ApiTags('challenges')
@ApiBearerAuth()
@Controller('challenges')
export class ChallengeController {
  constructor(private readonly service: ChallengeService) {}

  @Post('generate')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async generate(@CurrentUser() user: User, @Body() dto: GenerateChallengeDTO) {
    return await this.service.generate(user, dto);
  }

  @Post('/:id/regenerate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async regenerate(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.service.regenerate(user, id);
  }

  @Get()
  async findMine(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDTO,
  ) {
    return await this.service.findMine(user.id, pagination);
  }

  @Public()
  @Get('public')
  async findPublic(@Query() pagination: PaginationDTO) {
    return await this.service.findPublic(pagination);
  }

  @Public()
  @Get('/:id')
  async findById(
    @CurrentUser() user: User | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.service.findById(id, user);
  }

  @Public()
  @Get('/:id/markdown')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  @ApiProduces('text/markdown')
  async renderMarkdown(
    @CurrentUser() user: User | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.service.renderMarkdown(id, user);
  }

  @Patch('/:id/visibility')
  async updateVisibility(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVisibilityDTO,
  ) {
    return await this.service.updateVisibility(user, id, dto.public);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.service.delete(user, id);
  }
}
