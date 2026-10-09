import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { KeycloakService } from './keycloak/keycloak.service';

@Module({
  imports: [UserModule],
  providers: [
    AuthService,
    KeycloakService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  controllers: [AuthController],
  exports: [KeycloakService],
})
export class AuthModule {}
