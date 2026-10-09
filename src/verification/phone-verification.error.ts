export type PhoneVerificationFailure =
  /** The deep link token is invalid, expired or already used. */
  | 'CODE_NOT_FOUND'
  /** A contact arrived without a verification started by this Telegram user. */
  | 'NOT_STARTED'
  /** The shared contact belongs to someone else. */
  | 'NOT_OWN_CONTACT'
  | 'PHONE_IN_USE'
  | 'TELEGRAM_IN_USE'
  | 'ALREADY_VERIFIED';

/** Raised by the Telegram flow; the bot turns it into a reply to the user. */
export class PhoneVerificationError extends Error {
  constructor(readonly reason: PhoneVerificationFailure) {
    super(reason);
  }
}
