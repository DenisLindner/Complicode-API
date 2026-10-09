import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { External } from '../../common/decorators/external.decorator';
import { timingSafeEqual } from 'node:crypto';
import { Public } from '../../auth/decorators/public.decorator';
import type { TelegramUpdate } from '../../telegram/telegram.types';
import { TelegramBotService } from './telegram-bot.service';

@ApiExcludeController()
@Public()
@External()
@SkipThrottle()
@Controller('webhooks')
export class TelegramWebhookController {
  constructor(
    private readonly bot: TelegramBotService,
    private readonly config: ConfigService,
  ) {}

  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  async telegramWebhook(
    @Headers('x-telegram-bot-api-secret-token') secret: string | undefined,
    @Body() update: TelegramUpdate,
  ) {
    if (this.bot.mode !== 'webhook') {
      throw new NotFoundException();
    }
    if (!this.isValidSecret(secret)) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    await this.bot.handleUpdate(update);
    return { ok: true };
  }

  private isValidSecret(secret: string | undefined) {
    const expected = Buffer.from(
      this.config.get<string>('TELEGRAM_WEBHOOK_SECRET') ?? '',
    );
    if (expected.length === 0) {
      return false;
    }
    const received = Buffer.from(secret ?? '');
    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    );
  }
}
