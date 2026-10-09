import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  AbacatePayCheckout,
  AbacatePayResponse,
  CreateCheckoutInput,
} from './abacatepay.types';

@Injectable()
export class AbacatePayService {
  private readonly logger = new Logger(AbacatePayService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly webhookPublicKey: string;

  constructor(config: ConfigService) {
    this.apiUrl = config.getOrThrow<string>('ABACATEPAY_API_URL');
    this.apiKey = config.getOrThrow<string>('ABACATEPAY_API_KEY');
    this.webhookSecret = config.getOrThrow<string>('ABACATEPAY_WEBHOOK_SECRET');
    this.webhookPublicKey = config.getOrThrow<string>(
      'ABACATEPAY_WEBHOOK_PUBLIC_KEY',
    );
  }

  async createCheckout(input: CreateCheckoutInput) {
    const response = await fetch(`${this.apiUrl}/checkouts/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ id: input.productId, quantity: 1 }],
        methods: ['PIX', 'CARD'],
        externalId: input.externalId,
        returnUrl: input.returnUrl,
        completionUrl: input.completionUrl,
        metadata: input.metadata,
      }),
    }).catch((error: Error) => {
      this.logger.error(`AbacatePay request failed: ${error.message}`);
      return undefined;
    });

    const body = (await response
      ?.json()
      .catch(() => null)) as AbacatePayResponse<AbacatePayCheckout> | null;

    if (!response?.ok || !body?.success || !body.data) {
      this.logger.error(
        `AbacatePay checkout creation failed: ${response?.status} ${body?.error}`,
      );
      throw new ServiceUnavailableException(
        'Payment provider unavailable, try again later',
      );
    }

    return body.data;
  }

  /** The secret in the URL proves the origin of the webhook. */
  isValidSecret(secret: string | undefined) {
    return !!secret && this.safeEqual(secret, this.webhookSecret);
  }

  /** The HMAC signature guarantees the body was not changed in transit. */
  isValidSignature(rawBody: Buffer, signature: string | undefined) {
    if (!signature) {
      return false;
    }

    const expected = createHmac('sha256', this.webhookPublicKey)
      .update(rawBody)
      .digest('base64');

    return this.safeEqual(expected, signature);
  }

  private safeEqual(a: string, b: string) {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    return (
      bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB)
    );
  }
}
