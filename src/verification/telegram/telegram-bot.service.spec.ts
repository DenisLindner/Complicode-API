import { ConfigService } from '@nestjs/config';
import { Locale } from '../../i18n/locale';
import { TelegramService } from '../../telegram/telegram.service';
import { TelegramUpdate } from '../../telegram/telegram.types';
import { PhoneVerificationError } from '../phone-verification.error';
import { VerificationService } from '../verification.service';
import { BOT_MESSAGES } from './telegram-bot.messages';
import { TelegramBotService } from './telegram-bot.service';

describe('TelegramBotService', () => {
  const from = { id: 42, is_bot: false, first_name: 'Ana' };
  const chat = { id: 42, type: 'private' };

  let telegram: { sendMessage: jest.Mock };
  let verification: {
    resolveTelegramLocale: jest.Mock;
    linkTelegram: jest.Mock;
    confirmTelegramContact: jest.Mock;
  };
  let bot: TelegramBotService;

  const update = (message: object): TelegramUpdate => ({
    update_id: 1,
    message: { message_id: 1, from, chat, ...message },
  });

  beforeEach(() => {
    telegram = { sendMessage: jest.fn().mockResolvedValue(undefined) };
    verification = {
      resolveTelegramLocale: jest.fn().mockResolvedValue(Locale.pt),
      linkTelegram: jest.fn().mockResolvedValue({ locale: Locale.pt }),
      confirmTelegramContact: jest
        .fn()
        .mockResolvedValue({ bonusGranted: true }),
    };
    bot = new TelegramBotService(
      telegram as unknown as TelegramService,
      verification as unknown as VerificationService,
      { getOrThrow: () => 'disabled' } as unknown as ConfigService,
    );
  });

  it('links the account on /start and asks for the contact', async () => {
    await bot.handleUpdate(update({ text: '/start abc123' }));

    expect(verification.linkTelegram).toHaveBeenCalledWith('abc123', '42');
    expect(telegram.sendMessage).toHaveBeenCalledWith(
      42,
      BOT_MESSAGES.pt.askContact,
      expect.objectContaining({
        keyboard: [[expect.objectContaining({ request_contact: true })]],
      }),
    );
  });

  it('answers in the language chosen on the website', async () => {
    verification.resolveTelegramLocale.mockResolvedValue(Locale.en);
    verification.linkTelegram.mockResolvedValue({ locale: Locale.es });

    await bot.handleUpdate(update({ text: '/start abc123' }));

    expect(telegram.sendMessage).toHaveBeenCalledWith(
      42,
      BOT_MESSAGES.es.askContact,
      expect.objectContaining({
        keyboard: [
          [
            {
              text: BOT_MESSAGES.es.shareContactButton,
              request_contact: true,
            },
          ],
        ],
      }),
    );
  });

  it('falls back to the language of the Telegram app', async () => {
    verification.resolveTelegramLocale.mockRejectedValue(new Error('down'));

    await bot.handleUpdate({
      update_id: 3,
      message: {
        message_id: 3,
        from: { ...from, language_code: 'es-AR' },
        chat,
        text: 'hola',
      },
    });

    expect(telegram.sendMessage).toHaveBeenCalledWith(
      42,
      BOT_MESSAGES.es.help,
      undefined,
    );
  });

  it('confirms the shared contact and announces the bonus', async () => {
    await bot.handleUpdate(
      update({
        contact: {
          phone_number: '5511987654321',
          first_name: 'Ana',
          user_id: 42,
        },
      }),
    );

    expect(verification.confirmTelegramContact).toHaveBeenCalledWith('42', {
      phone: '5511987654321',
      telegramId: '42',
    });
    expect(telegram.sendMessage).toHaveBeenCalledWith(
      42,
      `${BOT_MESSAGES.pt.verified}\n${BOT_MESSAGES.pt.bonus}`,
      { remove_keyboard: true },
    );
  });

  it('answers verification failures with a friendly message', async () => {
    verification.linkTelegram.mockRejectedValue(
      new PhoneVerificationError('CODE_NOT_FOUND'),
    );

    await bot.handleUpdate(update({ text: '/start expired' }));

    expect(telegram.sendMessage).toHaveBeenCalledWith(
      42,
      BOT_MESSAGES.pt.failures.CODE_NOT_FOUND,
      { remove_keyboard: true },
    );
  });

  it('never throws on unexpected errors', async () => {
    verification.linkTelegram.mockRejectedValue(new Error('database down'));

    await expect(
      bot.handleUpdate(update({ text: '/start abc123' })),
    ).resolves.toBeUndefined();
    expect(telegram.sendMessage).toHaveBeenCalledWith(
      42,
      BOT_MESSAGES.pt.unexpected,
      { remove_keyboard: true },
    );
  });

  it('shows help for other messages and ignores groups', async () => {
    await bot.handleUpdate(update({ text: 'oi' }));
    await bot.handleUpdate({
      update_id: 2,
      message: {
        message_id: 2,
        from,
        chat: { id: -1, type: 'group' },
        text: '/start x',
      },
    });

    expect(telegram.sendMessage).toHaveBeenCalledTimes(1);
    expect(telegram.sendMessage).toHaveBeenCalledWith(
      42,
      BOT_MESSAGES.pt.help,
      undefined,
    );
  });
});
