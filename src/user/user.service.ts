import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { KeycloakAccessTokenPayload } from '../auth/keycloak/keycloak.types';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async syncFromToken(payload: KeycloakAccessTokenPayload) {
    const user = await this.prisma.user.findUnique({
      where: { keycloakId: payload.sub },
    });

    if (user) {
      return user;
    }

    return this.prisma.user.upsert({
      where: { keycloakId: payload.sub },
      update: {},
      create: {
        keycloakId: payload.sub,
        email: payload.email,
        name: payload.name ?? payload.email,
      },
    });
  }
}
