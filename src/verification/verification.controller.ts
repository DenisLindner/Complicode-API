import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type User, VerificationChannel } from '../generated/prisma/client';
import { ConfirmCodeDTO } from './dto/confirm-code.dto';
import { SendPhoneCodeDTO } from './dto/send-phone-code.dto';
import { VerificationService } from './verification.service';

@ApiTags('verification')
@ApiBearerAuth()
@Throttle({ default: { ttl: 60_000, limit: 10 } })
@Controller('verification')
export class VerificationController {
  constructor(private readonly service: VerificationService) {}

  @Get()
  async status(@CurrentUser() user: User) {
    return await this.service.getStatus(user.id);
  }

  @Post('email/send')
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendEmailCode(@CurrentUser() user: User) {
    await this.service.sendEmailCode(user);
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmEmail(@CurrentUser() user: User, @Body() dto: ConfirmCodeDTO) {
    return await this.service.confirm(
      user,
      VerificationChannel.EMAIL,
      dto.code,
    );
  }

  @Post('phone/send')
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendPhoneCode(
    @CurrentUser() user: User,
    @Body() dto: SendPhoneCodeDTO,
  ) {
    await this.service.sendPhoneCode(user, dto.phone);
  }

  @Post('phone/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmPhone(@CurrentUser() user: User, @Body() dto: ConfirmCodeDTO) {
    return await this.service.confirm(
      user,
      VerificationChannel.PHONE,
      dto.code,
    );
  }
}
