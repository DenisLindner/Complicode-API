import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import { CreateChallengeDTO } from './dto/create-challenge.dto';

@Controller('challenge')
export class ChallengeController {
  constructor(private readonly service: ChallengeService) {}

  @Post()
  async create(@Body() dto: CreateChallengeDTO) {
    return await this.service.create(dto);
  }

  @Get('/:id')
  async findById(@Param('id') id: string) {
    return await this.service.findById(id);
  }

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Delete('/:id')
  async delete(@Param('id') id: string) {
    return await this.service.delete(id);
  }
}
