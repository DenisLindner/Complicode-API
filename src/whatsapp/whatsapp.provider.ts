export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER');

export interface WhatsAppProvider {
  /** @param phone E.164 phone number, e.g. +5511999999999 */
  sendVerificationCode(phone: string, code: string): Promise<void>;
}
