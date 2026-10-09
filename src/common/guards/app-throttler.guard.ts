import { isIP } from 'node:net';
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

export const CLIENT_IP_HEADER = 'x-client-ip';

/**
 * Rate limits by user when the request is authenticated and by client IP
 * otherwise. Every request from the frontend server shares its IP, so the
 * real client IP comes from X-Client-IP, which is only trusted when the
 * request carries the internal key.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(request: Request): Promise<string> {
    if (request.user) {
      return Promise.resolve(`user:${request.user.id}`);
    }

    return Promise.resolve(`ip:${clientIp(request)}`);
  }
}

export function clientIp(request: Request) {
  const forwarded = request.headers[CLIENT_IP_HEADER];
  if (
    request.fromFrontendServer &&
    typeof forwarded === 'string' &&
    isIP(forwarded)
  ) {
    return forwarded;
  }

  return request.ip ?? 'unknown';
}
