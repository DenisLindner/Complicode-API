import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationDTO } from '../common/dto/pagination.dto';
import type { User } from '../generated/prisma/client';
import { CreditService } from './credit.service';

@ApiTags('credits')
@ApiBearerAuth()
@Controller('credits')
export class CreditController {
  constructor(private readonly service: CreditService) {}

  @Get()
  async balance(@CurrentUser() user: User) {
    return await this.service.getBalance(user.id);
  }

  @Get('transactions')
  async transactions(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDTO,
  ) {
    return await this.service.listTransactions(user.id, pagination);
  }
}
