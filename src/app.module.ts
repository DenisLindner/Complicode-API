import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AuthTokenGuard } from './auth/guards/auth-token.guard';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule],
  controllers: [],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: AuthTokenGuard,
    },
  ],
})
export class AppModule {}
