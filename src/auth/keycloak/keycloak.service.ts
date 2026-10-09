import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import {
  CreateKeycloakUserInput,
  KeycloakAccessTokenPayload,
  KeycloakTokenResponse,
} from './keycloak.types';

@Injectable()
export class KeycloakService {
  private readonly logger = new Logger(KeycloakService.name);
  private readonly issuer: string;
  private readonly adminUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly jwks: JwksClient;
  private adminToken?: { value: string; expiresAt: number };

  constructor(config: ConfigService) {
    const baseUrl = config.getOrThrow<string>('KEYCLOAK_URL');
    const realm = config.getOrThrow<string>('KEYCLOAK_REALM');

    this.issuer = `${baseUrl}/realms/${realm}`;
    this.adminUrl = `${baseUrl}/admin/realms/${realm}`;
    this.clientId = config.getOrThrow<string>('KEYCLOAK_CLIENT_ID');
    this.clientSecret = config.getOrThrow<string>('KEYCLOAK_CLIENT_SECRET');
    this.jwks = new JwksClient({
      jwksUri: `${this.issuer}/protocol/openid-connect/certs`,
      cache: true,
      rateLimit: true,
    });
  }

  async verifyAccessToken(token: string): Promise<KeycloakAccessTokenPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        (header, callback) => {
          this.jwks
            .getSigningKey(header.kid)
            .then((key) => callback(null, key.getPublicKey()))
            .catch((error: Error) => callback(error));
        },
        {
          algorithms: ['RS256'],
          issuer: this.issuer,
          audience: this.clientId,
        },
        (error, payload) => {
          if (error || !payload || typeof payload === 'string') {
            return reject(new UnauthorizedException('Invalid access token'));
          }
          resolve(payload as KeycloakAccessTokenPayload);
        },
      );
    });
  }

  async login(email: string, password: string) {
    return this.requestToken(
      { grant_type: 'password', username: email, password, scope: 'openid' },
      'Invalid email or password',
    );
  }

  async refresh(refreshToken: string) {
    return this.requestToken(
      { grant_type: 'refresh_token', refresh_token: refreshToken },
      'Invalid refresh token',
    );
  }

  async logout(refreshToken: string) {
    const response = await fetch(
      `${this.issuer}/protocol/openid-connect/logout`,
      {
        method: 'POST',
        body: this.withClientCredentials({ refresh_token: refreshToken }),
      },
    );

    if (!response.ok) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async createUser(input: CreateKeycloakUserInput): Promise<string> {
    const [firstName, ...rest] = input.name.trim().split(/\s+/);
    const response = await this.adminRequest('/users', {
      method: 'POST',
      body: JSON.stringify({
        username: input.email,
        email: input.email,
        firstName,
        lastName: rest.join(' ') || firstName,
        enabled: true,
        emailVerified: false,
        credentials: [
          { type: 'password', value: input.password, temporary: false },
        ],
      }),
    });

    if (response.status === 409) {
      throw new ConflictException('Email already registered');
    }
    if (!response.ok) {
      this.logger.error(`Keycloak user creation failed: ${response.status}`);
      throw new InternalServerErrorException('Could not create user');
    }

    const location = response.headers.get('location');
    const id = location?.split('/').pop();
    if (!id) {
      throw new InternalServerErrorException('Could not create user');
    }

    return id;
  }

  async markEmailVerified(id: string) {
    const current = await this.adminRequest(`/users/${id}`, { method: 'GET' });
    if (!current.ok) {
      this.logger.error(`Keycloak user lookup failed: ${current.status}`);
      throw new InternalServerErrorException('Could not update user');
    }

    // PUT replaces the representation, so the current user is sent back with
    // only the changed field to avoid wiping profile attributes.
    const user = (await current.json()) as Record<string, unknown>;
    const response = await this.adminRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...user, emailVerified: true }),
    });

    if (!response.ok) {
      this.logger.error(`Keycloak user update failed: ${response.status}`);
      throw new InternalServerErrorException('Could not update user');
    }
  }

  async deleteUser(id: string) {
    const response = await this.adminRequest(`/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 404) {
      this.logger.error(`Keycloak user deletion failed: ${response.status}`);
    }
  }

  private async requestToken(
    params: Record<string, string>,
    errorMessage: string,
  ): Promise<KeycloakTokenResponse> {
    const response = await fetch(
      `${this.issuer}/protocol/openid-connect/token`,
      { method: 'POST', body: this.withClientCredentials(params) },
    );

    if (response.status === 400 || response.status === 401) {
      throw new UnauthorizedException(errorMessage);
    }
    if (!response.ok) {
      this.logger.error(`Keycloak token request failed: ${response.status}`);
      throw new InternalServerErrorException('Authentication unavailable');
    }

    return (await response.json()) as KeycloakTokenResponse;
  }

  private async adminRequest(path: string, init: RequestInit) {
    return fetch(`${this.adminUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${await this.getAdminToken()}`,
        'Content-Type': 'application/json',
      },
    });
  }

  private async getAdminToken() {
    if (this.adminToken && this.adminToken.expiresAt > Date.now()) {
      return this.adminToken.value;
    }

    const token = await this.requestToken(
      { grant_type: 'client_credentials' },
      'Keycloak service account unauthorized',
    ).catch((error: Error) => {
      this.logger.error(
        `Keycloak service account login failed: ${error.message}`,
      );
      throw new InternalServerErrorException('Authentication unavailable');
    });
    this.adminToken = {
      value: token.access_token,
      expiresAt: Date.now() + (token.expires_in - 30) * 1000,
    };

    return this.adminToken.value;
  }

  private withClientCredentials(params: Record<string, string>) {
    return new URLSearchParams({
      ...params,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
  }
}
