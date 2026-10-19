import { SIGNUP_BONUS_CREDITS } from '../../credit/credit.constants';
import { Locale } from '../../i18n/locale';
import { PhoneVerificationFailure } from '../phone-verification.error';

export interface BotMessages {
  shareContactButton: string;
  askContact: string;
  verified: string;
  bonus: string;
  help: string;
  unexpected: string;
  failures: Record<PhoneVerificationFailure, string>;
}

export const BOT_MESSAGES: Record<Locale, BotMessages> = {
  [Locale.en]: {
    shareContactButton: '📱 Share my phone number',
    askContact:
      'Hi! To verify your phone on Complicode, tap the button below and share the number of your Telegram account.',
    verified: '✅ Phone verified! You can go back to Complicode.',
    bonus: `🎉 You earned ${SIGNUP_BONUS_CREDITS} credits to generate your challenges.`,
    help: 'To verify your phone, use the "Verify with Telegram" button on the Complicode website.',
    unexpected:
      "We couldn't complete the verification right now. Please try again in a moment.",
    failures: {
      CODE_NOT_FOUND:
        'This verification link has expired or is invalid. Generate a new link on the Complicode website.',
      NOT_STARTED:
        "I couldn't find a verification in progress. Generate a new link on the Complicode website.",
      NOT_OWN_CONTACT:
        "Share your own number using the button below, not someone else's contact.",
      PHONE_IN_USE:
        'This phone is already linked to another Complicode account.',
      TELEGRAM_IN_USE:
        'This Telegram account is already linked to another Complicode account.',
      ALREADY_VERIFIED: 'Your phone is already verified. ✅',
    },
  },
  [Locale.pt]: {
    shareContactButton: '📱 Compartilhar meu telefone',
    askContact:
      'Olá! Para verificar seu telefone no Complicode, toque no botão abaixo e compartilhe o número da sua conta do Telegram.',
    verified: '✅ Telefone verificado! Pode voltar ao Complicode.',
    bonus: `🎉 Você ganhou ${SIGNUP_BONUS_CREDITS} créditos para gerar seus desafios.`,
    help: 'Para verificar seu telefone, use o botão "Verificar com Telegram" no site do Complicode.',
    unexpected:
      'Não foi possível concluir a verificação agora. Tente novamente em instantes.',
    failures: {
      CODE_NOT_FOUND:
        'Este link de verificação expirou ou é inválido. Gere um novo link no site do Complicode.',
      NOT_STARTED:
        'Não encontrei uma verificação em andamento. Gere um novo link no site do Complicode.',
      NOT_OWN_CONTACT:
        'Compartilhe o seu próprio número usando o botão abaixo, não o contato de outra pessoa.',
      PHONE_IN_USE:
        'Este telefone já está vinculado a outra conta do Complicode.',
      TELEGRAM_IN_USE:
        'Esta conta do Telegram já está vinculada a outra conta do Complicode.',
      ALREADY_VERIFIED: 'Seu telefone já está verificado. ✅',
    },
  },
  [Locale.es]: {
    shareContactButton: '📱 Compartir mi teléfono',
    askContact:
      '¡Hola! Para verificar tu teléfono en Complicode, toca el botón de abajo y comparte el número de tu cuenta de Telegram.',
    verified: '✅ ¡Teléfono verificado! Ya puedes volver a Complicode.',
    bonus: `🎉 Ganaste ${SIGNUP_BONUS_CREDITS} créditos para generar tus desafíos.`,
    help: 'Para verificar tu teléfono, usa el botón "Verificar con Telegram" en el sitio de Complicode.',
    unexpected:
      'No pudimos completar la verificación ahora. Inténtalo de nuevo en unos instantes.',
    failures: {
      CODE_NOT_FOUND:
        'Este enlace de verificación caducó o no es válido. Genera un nuevo enlace en el sitio de Complicode.',
      NOT_STARTED:
        'No encontré una verificación en curso. Genera un nuevo enlace en el sitio de Complicode.',
      NOT_OWN_CONTACT:
        'Comparte tu propio número con el botón de abajo, no el contacto de otra persona.',
      PHONE_IN_USE:
        'Este teléfono ya está vinculado a otra cuenta de Complicode.',
      TELEGRAM_IN_USE:
        'Esta cuenta de Telegram ya está vinculada a otra cuenta de Complicode.',
      ALREADY_VERIFIED: 'Tu teléfono ya está verificado. ✅',
    },
  },
};
