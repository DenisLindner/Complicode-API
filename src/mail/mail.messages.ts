import { Locale } from '../i18n/locale';

export interface VerificationMail {
  subject: (code: string) => string;
  greeting: (name: string) => string;
  codeIntro: string;
  expires: (minutes: number) => string;
  ignore: string;
}

export const VERIFICATION_MAIL: Record<Locale, VerificationMail> = {
  [Locale.en]: {
    subject: (code) => `${code} is your Complicode verification code`,
    greeting: (name) => `Hi, ${name}!`,
    codeIntro: 'Your verification code is:',
    expires: (minutes) => `It expires in ${minutes} minutes.`,
    ignore: "If you didn't request this code, you can ignore this email.",
  },
  [Locale.pt]: {
    subject: (code) => `${code} é o seu código de verificação do Complicode`,
    greeting: (name) => `Olá, ${name}!`,
    codeIntro: 'Seu código de verificação é:',
    expires: (minutes) => `Ele expira em ${minutes} minutos.`,
    ignore: 'Se você não solicitou este código, ignore este email.',
  },
  [Locale.es]: {
    subject: (code) => `${code} es tu código de verificación de Complicode`,
    greeting: (name) => `¡Hola, ${name}!`,
    codeIntro: 'Tu código de verificación es:',
    expires: (minutes) => `Caduca en ${minutes} minutos.`,
    ignore: 'Si no solicitaste este código, ignora este correo.',
  },
};
