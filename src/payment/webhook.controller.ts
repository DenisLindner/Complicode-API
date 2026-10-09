import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  type RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { External } from '../common/decorators/external.decorator';
import type { Request } from 'express';
import { createHash } from 'node:crypto';
import { Public } from '../auth/decorators/public.decorator';
import { AbacatePayService } from './abacatepay/abacatepay.service';
import type { AbacatePayWebhookEvent } from './abacatepay/abacatepay.types';
import { PaymentService } from './payment.service';

@ApiExcludeController()
@Public()
@External()
@SkipThrottle()
@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly abacatePay: AbacatePayService,
    private readonly payments: PaymentService,
  ) {}

  @Post('abacatepay')
  @HttpCode(HttpStatus.OK)
  async abacatePayWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Query('webhookSecret') secret: string | undefined,
    @Headers('x-webhook-signature') signature: string | undefined,
    @Body() event: AbacatePayWebhookEvent,
  ) {
    if (!this.abacatePay.isValidSecret(secret)) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    const rawBody = request.rawBody;
    if (!rawBody || !this.abacatePay.isValidSignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    if (!event?.event || !event.data) {
      throw new BadRequestException('Invalid webhook payload');
    }

    // Retries share the event id; fall back to the body hash when absent.
    const eventId =
      event.id ?? createHash('sha256').update(rawBody).digest('hex');
    await this.payments.handleWebhook(event, eventId);

    return { received: true };
  }
}
