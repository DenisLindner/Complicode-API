import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../../telegram/telegram.service';
import {
  TelegramMessage,
  TelegramReplyMarkup,
  TelegramUpdate,
} from '../../telegram/telegram.types';
import { PhoneVerificationError } from '../phone-verification.error';
import { VerificationService } from '../verification.service';
import {
  BOT_MESSAGES,
  FAILURE_MESSAGES,
  SHARE_CONTACT_BUTTON,
} from './telegram-bot.messages';

const POLLING_TIMEOUT_SECONDS = 25;
const POLLING_RETRY_MS = 5_000;

const CONTACT_KEYBOARD: TelegramReplyMarkup = {
  keyboard: [[{ text: SHARE_CONTACT_BUTTON, request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};
const REMOVE_KEYBOARD: TelegramReplyMarkup = { remove_keyboard: true };

export type TelegramUpdatesMode = 'polling' | 'webhook' | 'disabled';

/**
 * Telegram bot of the phone verification. Receives updates by long polling
 * (development) or webhook (production).
 */
@Injectable()
export class TelegramBotService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly polling = new AbortController();
  readonly mode: TelegramUpdatesMode;

  constructor(
    private readonly telegram: TelegramService,
    private readonly verification: VerificationService,
    private readonly config: ConfigService,
  ) {
    this.mode = config.getOrThrow<TelegramUpdatesMode>('TELEGRAM_UPDATES_MODE');
  }

  async onApplicationBootstrap() {
    try {
      if (this.mode === 'polling') {
        await this.telegram.deleteWebhook();
        void this.poll();
      } else if (this.mode === 'webhook') {
        await this.telegram.setWebhook(
          this.config.getOrThrow<string>('TELEGRAM_WEBHOOK_URL'),
          this.config.getOrThrow<string>('TELEGRAM_WEBHOOK_SECRET'),
        );
      }
    } catch (error) {
      this.logger.error(
        `Telegram bot setup failed: ${(error as Error).message}`,
      );
    }
  }

  onModuleDestroy() {
    this.polling.abort();
  }

  /** Never throws: failures are answered to the user and logged. */
  async handleUpdate(update: TelegramUpdate) {
    const message = update.message;
    if (
      !message?.from ||
      message.from.is_bot ||
      message.chat.type !== 'private'
    ) {
      return;
    }

    try {
      await this.handleMessage(message);
    } catch (error) {
      if (error instanceof PhoneVerificationError) {
        const keyboard =
          error.reason === 'NOT_OWN_CONTACT'
            ? CONTACT_KEYBOARD
            : REMOVE_KEYBOARD;
        await this.reply(message, FAILURE_MESSAGES[error.reason], keyboard);
        return;
      }

      this.logger.error(
        `Telegram update ${update.update_id} failed: ${(error as Error).message}`,
      );
      await this.reply(message, BOT_MESSAGES.unexpected, REMOVE_KEYBOARD);
    }
  }

  private async handleMessage(message: TelegramMessage) {
    const telegramId = String(message.from!.id);

    if (message.contact) {
      const { bonusGranted } = await this.verification.confirmTelegramContact(
        telegramId,
        {
          phone: message.contact.phone_number,
          telegramId: message.contact.user_id?.toString(),
        },
      );
      const text = bonusGranted
        ? `${BOT_MESSAGES.verified}\n${BOT_MESSAGES.bonus}`
        : BOT_MESSAGES.verified;
      return this.reply(message, text, REMOVE_KEYBOARD);
    }

    const [command, token] = message.text?.trim().split(/\s+/) ?? [];
    if (command === '/start' && token) {
      await this.verification.linkTelegram(token, telegramId);
      return this.reply(message, BOT_MESSAGES.askContact, CONTACT_KEYBOARD);
    }

    return this.reply(message, BOT_MESSAGES.help);
  }

  private async reply(
    message: TelegramMessage,
    text: string,
    replyMarkup?: TelegramReplyMarkup,
  ) {
    await this.telegram
      .sendMessage(message.chat.id, text, replyMarkup)
      .catch((error: Error) =>
        this.logger.warn(`Telegram reply failed: ${error.message}`),
      );
  }

  private async poll() {
    let offset = 0;
    this.logger.log('Telegram bot listening with long polling');

    while (!this.polling.signal.aborted) {
      try {
        const updates = await this.telegram.getUpdates(
          offset,
          POLLING_TIMEOUT_SECONDS,
          this.polling.signal,
        );
        for (const update of updates) {
          offset = update.update_id + 1;
          await this.handleUpdate(update);
        }
      } catch (error) {
        if (this.polling.signal.aborted) {
          return;
        }
        this.logger.warn(
          `Telegram polling failed: ${(error as Error).message}`,
        );
        await new Promise((resolve) => setTimeout(resolve, POLLING_RETRY_MS));
      }
    }
  }
}
