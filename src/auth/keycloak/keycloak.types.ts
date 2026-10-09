export interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  token_type: string;
}

export interface KeycloakAccessTokenPayload {
  sub: string;
  email: string;
  name?: string;
  email_verified?: boolean;
}

export interface CreateKeycloakUserInput {
  name: string;
  email: string;
  password: string;
}
