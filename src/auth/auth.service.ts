import { ConflictException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginDTO } from './dto/login.dto';
import { RegisterDTO } from './dto/register.dto';
import { TokenResponseDTO } from './dto/token-response.dto';
import { KeycloakService } from './keycloak/keycloak.service';
import { KeycloakTokenResponse } from './keycloak/keycloak.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly keycloak: KeycloakService,
    private readonly userService: UserService,
  ) {}

  async register(dto: RegisterDTO) {
    if (await this.userService.findByEmail(dto.email)) {
      throw new ConflictException('Email already registered');
    }

    const keycloakId = await this.keycloak.createUser(dto);

    try {
      await this.userService.create({
        keycloakId,
        name: dto.name,
        email: dto.email,
      });
    } catch (error) {
      await this.keycloak.deleteUser(keycloakId);
      throw error;
    }

    return this.login({ email: dto.email, password: dto.password });
  }

  async login(dto: LoginDTO) {
    const token = await this.keycloak.login(dto.email, dto.password);
    return this.toTokenResponse(token);
  }

  async refresh(refreshToken: string) {
    const token = await this.keycloak.refresh(refreshToken);
    return this.toTokenResponse(token);
  }

  async logout(refreshToken: string) {
    await this.keycloak.logout(refreshToken);
  }

  private toTokenResponse(token: KeycloakTokenResponse): TokenResponseDTO {
    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresIn: token.expires_in,
      refreshExpiresIn: token.refresh_expires_in,
      tokenType: token.token_type,
    };
  }
}
