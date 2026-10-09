import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppProvider } from '../whatsapp.provider';

/**
 * WhatsApp Cloud API (Meta). Requires an approved "authentication" template
 * with a copy-code button, whose body has a single {{1}} parameter.
 */
@Injectable()
export class MetaWhatsAppProvider implements WhatsAppProvider {
  private readonly logger = new Logger(MetaWhatsAppProvider.name);

  constructor(private readonly config: ConfigService) {}

  async sendVerificationCode(phone: string, code: string) {
    const version = this.config.getOrThrow<string>('WHATSAPP_META_API_VERSION');
    const phoneNumberId = this.config.getOrThrow<string>(
      'WHATSAPP_META_PHONE_NUMBER_ID',
    );

    const response = await fetch(
      `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.getOrThrow<string>('WHATSAPP_META_ACCESS_TOKEN')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.replace('+', ''),
          type: 'template',
          template: {
            name: this.config.getOrThrow<string>('WHATSAPP_META_TEMPLATE_NAME'),
            language: {
              code: this.config.getOrThrow<string>(
                'WHATSAPP_META_TEMPLATE_LANGUAGE',
              ),
            },
            components: [
              { type: 'body', parameters: [{ type: 'text', text: code }] },
              {
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [{ type: 'text', text: code }],
              },
            ],
          },
        }),
      },
    );

    if (!response.ok) {
      this.logger.error(
        `WhatsApp message failed: ${response.status} ${await response.text()}`,
      );
      throw new ServiceUnavailableException(
        'Could not send the WhatsApp message',
      );
    }
  }
}
