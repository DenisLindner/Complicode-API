import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreditModule } from '../credit/credit.module';
import { MailModule } from '../mail/mail.module';
import { TelegramModule } from '../telegram/telegram.module';
import { TelegramBotService } from './telegram/telegram-bot.service';
import { TelegramWebhookController } from './telegram/telegram-webhook.controller';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [AuthModule, CreditModule, MailModule, TelegramModule],
  providers: [VerificationService, TelegramBotService],
  controllers: [VerificationController, TelegramWebhookController],
})
export class VerificationModule {}
