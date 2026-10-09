export type AbacatePayCheckoutStatus =
  'PENDING' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'REFUNDED';

export interface AbacatePayCheckout {
  id: string;
  externalId: string | null;
  url: string;
  amount: number;
  paidAmount: number | null;
  status: AbacatePayCheckoutStatus;
}

export interface AbacatePayResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface CreateCheckoutInput {
  productId: string;
  externalId: string;
  returnUrl: string;
  completionUrl: string;
  metadata?: Record<string, string>;
}

/** Envelope shared by every v2 webhook. */
export interface AbacatePayWebhookEvent {
  id?: string;
  event: string;
  apiVersion: number;
  devMode: boolean;
  data: { checkout?: AbacatePayCheckout } & Record<string, unknown>;
}
