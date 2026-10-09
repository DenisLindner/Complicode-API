import { SIGNUP_BONUS_CREDITS } from '../../credit/credit.constants';
import { PhoneVerificationFailure } from '../phone-verification.error';

export const SHARE_CONTACT_BUTTON = '📱 Compartilhar meu telefone';

export const BOT_MESSAGES = {
  askContact:
    'Olá! Para verificar seu telefone no Complicode, toque no botão abaixo e compartilhe o número da sua conta do Telegram.',
  verified: '✅ Telefone verificado! Pode voltar ao Complicode.',
  bonus: `🎉 Você ganhou ${SIGNUP_BONUS_CREDITS} créditos para gerar seus desafios.`,
  help: 'Para verificar seu telefone, use o botão "Verificar com Telegram" no site do Complicode.',
  unexpected:
    'Não foi possível concluir a verificação agora. Tente novamente em instantes.',
};

export const FAILURE_MESSAGES: Record<PhoneVerificationFailure, string> = {
  CODE_NOT_FOUND:
    'Este link de verificação expirou ou é inválido. Gere um novo link no site do Complicode.',
  NOT_STARTED:
    'Não encontrei uma verificação em andamento. Gere um novo link no site do Complicode.',
  NOT_OWN_CONTACT:
    'Compartilhe o seu próprio número usando o botão abaixo, não o contato de outra pessoa.',
  PHONE_IN_USE: 'Este telefone já está vinculado a outra conta do Complicode.',
  TELEGRAM_IN_USE:
    'Esta conta do Telegram já está vinculada a outra conta do Complicode.',
  ALREADY_VERIFIED: 'Seu telefone já está verificado. ✅',
};
