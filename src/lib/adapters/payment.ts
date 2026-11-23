/**
 * Payment provider adapter — STUB
 *
 * OPEN (architecture A7): provider choice (PayFast / Peach / Stripe SA / Ozow / …),
 * refund mapping, and membership dunning. Do not invent a live integration here.
 */

export type PaymentIntentRequest = {
  participantId: string;
  /** Server-computed amount in ZAR cents — never trust client totals. */
  amountCents: number;
  currency: "ZAR";
  orderId: string;
};

export type PaymentIntentResult = {
  status: "stub";
  provider: "OPEN";
  checkoutUrl: null;
  message: string;
};

export type PaymentWebhookResult = {
  accepted: false;
  reason: string;
};

export interface PaymentAdapter {
  createIntent(req: PaymentIntentRequest): Promise<PaymentIntentResult>;
  handleWebhook(payload: unknown, signature: string | null): Promise<PaymentWebhookResult>;
}

export const stubPaymentAdapter: PaymentAdapter = {
  async createIntent(req) {
    return {
      status: "stub",
      provider: "OPEN",
      checkoutUrl: null,
      message: `Payment adapter stub — provider OPEN. Refusing to charge R${(req.amountCents / 100).toFixed(2)} for participant ${req.participantId}.`,
    };
  },

  async handleWebhook() {
    return {
      accepted: false,
      reason: "Payment provider not selected (OPEN A7). Webhook ignored.",
    };
  },
};
