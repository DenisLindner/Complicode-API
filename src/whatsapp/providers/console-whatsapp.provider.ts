import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppProvider } from '../whatsapp.provider';

/** Development provider: prints the code instead of sending a message. */
@Injectable()
export class ConsoleWhatsAppProvider implements WhatsAppProvider {
  private readonly logger = new Logger(ConsoleWhatsAppProvider.name);

  async sendVerificationCode(phone: string, code: string) {
    this.logger.log(`WhatsApp verification code for ${phone}: ${code}`);
    return Promise.resolve();
  }
}
