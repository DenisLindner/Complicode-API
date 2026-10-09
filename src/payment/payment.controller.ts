import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationDTO } from '../common/dto/pagination.dto';
import type { User } from '../generated/prisma/client';
import { PaymentService } from './payment.service';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Post('checkout')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async checkout(@CurrentUser() user: User) {
    return await this.service.createCheckout(user);
  }

  @Get()
  async findMine(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDTO,
  ) {
    return await this.service.findMine(user.id, pagination);
  }

  @Get('/:id')
  async findById(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.service.findById(user.id, id);
  }
}
