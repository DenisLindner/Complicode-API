import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { KeycloakService } from './keycloak/keycloak.service';

@Module({
  imports: [UserModule],
  providers: [AuthService, KeycloakService],
  controllers: [AuthController],
  exports: [KeycloakService],
})
export class AuthModule {}
