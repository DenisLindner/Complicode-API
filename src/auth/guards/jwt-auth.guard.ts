import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { UserService } from '../../user/user.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { KeycloakService } from '../keycloak/keycloak.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly keycloak: KeycloakService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<Request>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    const hasToken = type === 'Bearer' && !!token;

    if (isPublic) {
      // Public routes still identify the user when a valid token is sent.
      if (hasToken) {
        await this.authenticate(request, token).catch(() => undefined);
      }
      return true;
    }

    if (!hasToken) {
      throw new UnauthorizedException('Missing access token');
    }

    await this.authenticate(request, token);
    return true;
  }

  private async authenticate(request: Request, token: string) {
    const payload = await this.keycloak.verifyAccessToken(token);
    request.user = await this.userService.syncFromToken(payload);
  }
}
