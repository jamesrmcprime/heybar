/**
 * Payment provider adapter — hardened STUB
 *
 * OPEN (architecture A7): provider choice (PayFast / Peach / Stripe SA / Ozow / …),
 * refund mapping, and membership dunning. Do not invent a live integration here.
 *
 * Pattern (architecture §6.2):
 * 1. createIntent → session bound to participant + server-computed amount
 * 2. checkoutUrl stays null — live Pay CTA stays disabled until provider chosen
 * 3. handleWebhook — HMAC-signed, idempotent by eventId
 * 4. Stub outcomes include `failed` so QA can exercise independence without a gateway
 */

import { createHmac, timingSafeEqual } from "node:crypto";

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
  sessionId: string;
  /** Live checkout URL — always null until provider is chosen. */
  checkoutUrl: null;
  message: string;
};

export type StubWebhookOutcome = "succeeded" | "failed";

export type StubWebhookPayload = {
  eventId: string;
  sessionId: string;
  outcome: StubWebhookOutcome;
};

export type PaymentWebhookAccepted = {
  accepted: true;
  duplicate: boolean;
  sessionId: string;
  outcome: StubWebhookOutcome;
  participantId: string;
  orderId: string;
  amountCents: number;
};

export type PaymentWebhookRejected = {
  accepted: false;
  reason: string;
};

export type PaymentWebhookResult =
  | PaymentWebhookAccepted
  | PaymentWebhookRejected;

export type PaymentSessionStatus = "open" | "succeeded" | "failed";

export type PaymentSession = {
  sessionId: string;
  orderId: string;
  participantId: string;
  amountCents: number;
  currency: "ZAR";
  status: PaymentSessionStatus;
  createdAt: string;
};

export type PaymentLedgerEntry = {
  id: string;
  eventId: string;
  sessionId: string;
  orderId: string;
  participantId: string;
  amountCents: number;
  currency: "ZAR";
  outcome: StubWebhookOutcome;
  recordedAt: string;
};

export interface PaymentAdapter {
  createIntent(req: PaymentIntentRequest): Promise<PaymentIntentResult>;
  handleWebhook(
    payload: string | StubWebhookPayload,
    signature: string | null,
  ): Promise<PaymentWebhookResult>;
}

/** Dev/QA stub secret — replace when a real provider is chosen (OPEN A7). */
export const PAYMENT_STUB_SECRET =
  process.env.HEYBAR_PAYMENT_STUB_SECRET ?? "heybar-payment-stub-dev";

const SIG_PREFIX = "sha256=";

let sessionSeq = 0;
let ledgerSeq = 0;
let eventSeq = 0;

function nextSessionId(): string {
  sessionSeq += 1;
  return `pay_sess_${sessionSeq}`;
}

function nextLedgerId(): string {
  ledgerSeq += 1;
  return `pay_led_${ledgerSeq}`;
}

function nextEventId(prefix: string): string {
  eventSeq += 1;
  return `${prefix}_${eventSeq}`;
}

function isoNow(): string {
  return new Date().toISOString();
}

function canonicalBody(payload: string | StubWebhookPayload): string {
  if (typeof payload === "string") return payload;
  return JSON.stringify(payload);
}

export function signPaymentWebhook(
  payload: string | StubWebhookPayload,
  secret: string = PAYMENT_STUB_SECRET,
): string {
  const body = canonicalBody(payload);
  const digest = createHmac("sha256", secret).update(body, "utf8").digest("hex");
  return `${SIG_PREFIX}${digest}`;
}

function signaturesMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function parsePayload(
  payload: string | StubWebhookPayload,
): StubWebhookPayload | null {
  if (typeof payload !== "string") {
    if (
      payload &&
      typeof payload.eventId === "string" &&
      typeof payload.sessionId === "string" &&
      (payload.outcome === "succeeded" || payload.outcome === "failed")
    ) {
      return payload;
    }
    return null;
  }
  try {
    const parsed = JSON.parse(payload) as Partial<StubWebhookPayload>;
    if (
      typeof parsed.eventId !== "string" ||
      typeof parsed.sessionId !== "string" ||
      (parsed.outcome !== "succeeded" && parsed.outcome !== "failed")
    ) {
      return null;
    }
    return {
      eventId: parsed.eventId,
      sessionId: parsed.sessionId,
      outcome: parsed.outcome,
    };
  } catch {
    return null;
  }
}

/**
 * In-memory payment sessions + append-only ledger.
 * Process-local stub — replace with durable provider + DB when OPEN A7 lands.
 */
export class PaymentStore implements PaymentAdapter {
  private sessions = new Map<string, PaymentSession>();
  private ledger: PaymentLedgerEntry[] = [];
  private seenEventIds = new Map<string, PaymentLedgerEntry>();
  private secret: string;

  constructor(secret: string = PAYMENT_STUB_SECRET) {
    this.secret = secret;
  }

  async createIntent(req: PaymentIntentRequest): Promise<PaymentIntentResult> {
    if (!Number.isInteger(req.amountCents) || req.amountCents < 0) {
      throw new Error("amountCents must be a non-negative integer");
    }
    if (req.currency !== "ZAR") {
      throw new Error("Only ZAR is supported in the stub");
    }

    const sessionId = nextSessionId();
    const session: PaymentSession = {
      sessionId,
      orderId: req.orderId,
      participantId: req.participantId,
      amountCents: req.amountCents,
      currency: "ZAR",
      status: "open",
      createdAt: isoNow(),
    };
    this.sessions.set(sessionId, session);

    return {
      status: "stub",
      provider: "OPEN",
      sessionId,
      checkoutUrl: null,
      message: `Payment session ${sessionId} created (stub). Provider OPEN — no live checkout. Bound R${(req.amountCents / 100).toFixed(2)} for participant ${req.participantId} on ${req.orderId}.`,
    };
  }

  getSession(sessionId: string): PaymentSession | undefined {
    return this.sessions.get(sessionId);
  }

  listSessionsForOrder(orderId: string): PaymentSession[] {
    return [...this.sessions.values()].filter((s) => s.orderId === orderId);
  }

  listLedger(): PaymentLedgerEntry[] {
    return [...this.ledger];
  }

  listLedgerForOrder(orderId: string): PaymentLedgerEntry[] {
    return this.ledger.filter((e) => e.orderId === orderId);
  }

  listLedgerForParticipant(
    orderId: string,
    participantId: string,
  ): PaymentLedgerEntry[] {
    return this.ledger.filter(
      (e) => e.orderId === orderId && e.participantId === participantId,
    );
  }

  sign(payload: string | StubWebhookPayload): string {
    return signPaymentWebhook(payload, this.secret);
  }

  /**
   * Signed webhook stub. Idempotent on eventId — duplicates do not
   * re-append the ledger or flip other participants' sessions.
   */
  async handleWebhook(
    payload: string | StubWebhookPayload,
    signature: string | null,
  ): Promise<PaymentWebhookResult> {
    if (!signature) {
      return { accepted: false, reason: "Missing webhook signature" };
    }

    const body = canonicalBody(payload);
    const expected = signPaymentWebhook(body, this.secret);
    if (!signaturesMatch(signature, expected)) {
      return { accepted: false, reason: "Invalid webhook signature" };
    }

    const parsed = parsePayload(payload);
    if (!parsed) {
      return { accepted: false, reason: "Malformed webhook payload" };
    }

    const prior = this.seenEventIds.get(parsed.eventId);
    if (prior) {
      return {
        accepted: true,
        duplicate: true,
        sessionId: prior.sessionId,
        outcome: prior.outcome,
        participantId: prior.participantId,
        orderId: prior.orderId,
        amountCents: prior.amountCents,
      };
    }

    const session = this.sessions.get(parsed.sessionId);
    if (!session) {
      return { accepted: false, reason: "Unknown payment session" };
    }

    if (session.status !== "open" && session.status !== parsed.outcome) {
      return {
        accepted: false,
        reason: `Session already ${session.status}; refusing conflicting outcome ${parsed.outcome}`,
      };
    }

    session.status = parsed.outcome;

    const entry: PaymentLedgerEntry = {
      id: nextLedgerId(),
      eventId: parsed.eventId,
      sessionId: session.sessionId,
      orderId: session.orderId,
      participantId: session.participantId,
      amountCents: session.amountCents,
      currency: "ZAR",
      outcome: parsed.outcome,
      recordedAt: isoNow(),
    };
    this.ledger.push(entry);
    this.seenEventIds.set(parsed.eventId, entry);

    return {
      accepted: true,
      duplicate: false,
      sessionId: session.sessionId,
      outcome: parsed.outcome,
      participantId: session.participantId,
      orderId: session.orderId,
      amountCents: session.amountCents,
    };
  }

  /**
   * QA helper: create a signed failed webhook for an open session.
   * Does not enable a live gateway — only exercises the fail path.
   */
  async simulateFailedWebhook(
    sessionId: string,
  ): Promise<PaymentWebhookResult> {
    const payload: StubWebhookPayload = {
      eventId: nextEventId("evt_stub_fail"),
      sessionId,
      outcome: "failed",
    };
    const body = JSON.stringify(payload);
    return this.handleWebhook(body, this.sign(body));
  }

  /**
   * QA helper: intent + signed failed webhook in one step.
   * Other participants' sessions/ledger rows are untouched.
   */
  async simulateParticipantFail(
    req: PaymentIntentRequest,
  ): Promise<{
    intent: PaymentIntentResult;
    webhook: PaymentWebhookResult;
  }> {
    const intent = await this.createIntent(req);
    const webhook = await this.simulateFailedWebhook(intent.sessionId);
    return { intent, webhook };
  }
}

/** Default process-local store for stubs, API routes, and smoke checks. */
export const paymentStore = new PaymentStore();

export const stubPaymentAdapter: PaymentAdapter = {
  createIntent(req) {
    return paymentStore.createIntent(req);
  },
  handleWebhook(payload, signature) {
    return paymentStore.handleWebhook(payload, signature);
  },
};
