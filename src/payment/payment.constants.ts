/** The only package for sale: 10 credits for R$ 10,00. */
export const CREDIT_PACKAGE = {
  credits: 10,
  amountCents: 1000,
} as const;

export const ABACATEPAY_PROVIDER = 'abacatepay';

/**
 * AbacatePay's public HMAC key, published in its docs:
 * https://docs.abacatepay.com/pages/webhooks/security
 */
export const ABACATEPAY_WEBHOOK_PUBLIC_KEY =
  't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9';
