import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TelegramReplyMarkup,
  TelegramResponse,
  TelegramUpdate,
} from './telegram.types';

/** Thin client for the Telegram Bot API. */
@Injectable()
export class TelegramService {
  private readonly apiUrl: string;
  readonly botUsername: string;

  constructor(config: ConfigService) {
    this.apiUrl = `https://api.telegram.org/bot${config.getOrThrow<string>('TELEGRAM_BOT_TOKEN')}`;
    this.botUsername = config.getOrThrow<string>('TELEGRAM_BOT_USERNAME');
  }

  /** Link that opens the bot and sends `/start <payload>`. */
  deepLink(payload: string) {
    return `https://t.me/${this.botUsername}?start=${payload}`;
  }

  async sendMessage(
    chatId: number,
    text: string,
    replyMarkup?: TelegramReplyMarkup,
  ) {
    await this.call('sendMessage', {
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
    });
  }

  /** Long polling: waits up to `timeoutSeconds` for new updates. */
  async getUpdates(
    offset: number,
    timeoutSeconds: number,
    signal: AbortSignal,
  ) {
    return this.call<TelegramUpdate[]>(
      'getUpdates',
      { offset, timeout: timeoutSeconds, allowed_updates: ['message'] },
      signal,
    );
  }

  async setWebhook(url: string, secretToken: string) {
    await this.call('setWebhook', {
      url,
      secret_token: secretToken,
      allowed_updates: ['message'],
    });
  }

  async deleteWebhook() {
    await this.call('deleteWebhook', {});
  }

  private async call<T = unknown>(
    method: string,
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<T> {
    const response = await fetch(`${this.apiUrl}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    const data = (await response.json()) as TelegramResponse<T>;

    if (!data.ok) {
      throw new Error(`Telegram ${method} failed: ${data.description}`);
    }

    return data.result as T;
  }
}
