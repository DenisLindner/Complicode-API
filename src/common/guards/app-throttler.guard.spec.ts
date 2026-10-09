import type { Request } from 'express';
import type { User } from '../../generated/prisma/client';
import { AppThrottlerGuard, clientIp } from './app-throttler.guard';

describe('AppThrottlerGuard', () => {
  const request = (data: Partial<Request>) =>
    ({ headers: {}, ip: '10.0.0.1', ...data }) as Request;

  it('tracks authenticated requests by user', async () => {
    const guard = Object.create(
      AppThrottlerGuard.prototype,
    ) as AppThrottlerGuard;
    const tracker = await (
      guard as unknown as { getTracker: (r: Request) => Promise<string> }
    ).getTracker(request({ user: { id: 'user-1' } as User }));

    expect(tracker).toBe('user:user-1');
  });

  it('uses the client IP forwarded by the frontend server', () => {
    expect(
      clientIp(
        request({
          fromFrontendServer: true,
          headers: { 'x-client-ip': '203.0.113.7' },
        }),
      ),
    ).toBe('203.0.113.7');
  });

  it('ignores a forwarded IP from anyone else', () => {
    expect(
      clientIp(request({ headers: { 'x-client-ip': '203.0.113.7' } })),
    ).toBe('10.0.0.1');
  });

  it('ignores a forwarded value that is not an IP', () => {
    expect(
      clientIp(
        request({
          fromFrontendServer: true,
          headers: { 'x-client-ip': 'not-an-ip' },
        }),
      ),
    ).toBe('10.0.0.1');
  });
});
