import { timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_EXTERNAL_KEY } from '../decorators/external.decorator';

export const INTERNAL_KEY_HEADER = 'x-internal-key';

/**
 * Only the frontend server (BFF) may call the API: it sends the shared
 * INTERNAL_API_KEY in X-Internal-Key. Webhooks are marked with @External().
 * Without a configured key (local development) every request is accepted.
 */
@Injectable()
export class InternalKeyGuard implements CanActivate {
  private readonly key?: Buffer;

  constructor(
    private readonly reflector: Reflector,
    config: ConfigService,
  ) {
    const key = config.get<string>('INTERNAL_API_KEY');
    this.key = key ? Buffer.from(key) : undefined;
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    request.fromFrontendServer = this.hasValidKey(request);

    const isExternal = this.reflector.getAllAndOverride<boolean>(
      IS_EXTERNAL_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!this.key || isExternal || request.fromFrontendServer) {
      return true;
    }

    throw new ForbiddenException('Forbidden');
  }

  private hasValidKey(request: Request) {
    const sent = request.headers[INTERNAL_KEY_HEADER];
    if (!this.key || typeof sent !== 'string') {
      return false;
    }

    const received = Buffer.from(sent);
    return (
      received.length === this.key.length && timingSafeEqual(received, this.key)
    );
  }
}
