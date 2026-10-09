import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CatalogModule } from './catalog/catalog.module';
import { ChallengeModule } from './challenge/challenge.module';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { InternalKeyGuard } from './common/guards/internal-key.guard';
import { CreditModule } from './credit/credit.module';
import { envValidationSchema } from './config/env.validation';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    UserModule,
    CreditModule,
    VerificationModule,
    CatalogModule,
    ChallengeModule,
    PaymentModule,
  ],
  controllers: [],
  // Global guards run in this order: the throttler needs the user that the
  // JWT guard sets, and the client IP that the internal key guard trusts.
  providers: [
    { provide: APP_GUARD, useClass: InternalKeyGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
  ],
})
export class AppModule {}
