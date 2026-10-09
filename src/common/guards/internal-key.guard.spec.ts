import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { InternalKeyGuard } from './internal-key.guard';

describe('InternalKeyGuard', () => {
  const KEY = 'k'.repeat(32);

  const run = (options: {
    key?: string;
    sent?: string;
    external?: boolean;
  }) => {
    const request = {
      headers: options.sent ? { 'x-internal-key': options.sent } : {},
    } as unknown as Request;
    const reflector = {
      getAllAndOverride: () => options.external ?? false,
    } as unknown as Reflector;
    const config = { get: () => options.key } as unknown as ConfigService;
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;

    const guard = new InternalKeyGuard(reflector, config);
    return { request, allow: () => guard.canActivate(context) };
  };

  it('accepts requests with the right key and marks them', () => {
    const { request, allow } = run({ key: KEY, sent: KEY });

    expect(allow()).toBe(true);
    expect(request.fromFrontendServer).toBe(true);
  });

  it.each([
    ['without a key', undefined],
    ['with a wrong key', 'x'.repeat(32)],
    ['with a key of another length', 'short'],
  ])('rejects requests %s', (_case, sent) => {
    const { request, allow } = run({ key: KEY, sent });

    expect(allow).toThrow(ForbiddenException);
    expect(request.fromFrontendServer).toBe(false);
  });

  it('lets webhooks through without the key', () => {
    expect(run({ key: KEY, external: true }).allow()).toBe(true);
  });

  it('accepts everything when no key is configured (local development)', () => {
    const { request, allow } = run({ sent: KEY });

    expect(allow()).toBe(true);
    expect(request.fromFrontendServer).toBe(false);
  });
});
