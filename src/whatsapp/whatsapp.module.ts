import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsoleWhatsAppProvider } from './providers/console-whatsapp.provider';
import { MetaWhatsAppProvider } from './providers/meta-whatsapp.provider';
import { WHATSAPP_PROVIDER } from './whatsapp.provider';

@Module({
  providers: [
    {
      provide: WHATSAPP_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('WHATSAPP_PROVIDER') === 'meta'
          ? new MetaWhatsAppProvider(config)
          : new ConsoleWhatsAppProvider(),
    },
  ],
  exports: [WHATSAPP_PROVIDER],
})
export class WhatsAppModule {}
