import { Module } from '@nestjs/common';
import { CreditModule } from '../credit/credit.module';
import { AbacatePayService } from './abacatepay/abacatepay.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [CreditModule],
  providers: [PaymentService, AbacatePayService],
  controllers: [PaymentController, WebhookController],
})
export class PaymentModule {}
