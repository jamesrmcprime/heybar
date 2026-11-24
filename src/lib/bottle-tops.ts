/**
 * Bottle Tops ledger shell — Blue and Gold as distinct currencies.
 *
 * Append-only history; balances are derived (sum of deltas).
 * Admin credit stub only — no earn / redeem / conversion rates
 * (OPEN per architecture.md §8.2 / business-rules.md §6).
 *
 * Process-local in-memory store — replace with durable DB when backend lands.
 */

export type BottleTopCurrency = "blue" | "gold";

/**
 * Allowed reason codes for the shell.
 * Deliberately excludes earn / redeem / convert — those remain OPEN.
 */
export type BottleTopReason = "admin_credit" | "display_seed";

export type BottleTopLedgerEntry = {
  id: string;
  userId: string;
  currency: BottleTopCurrency;
  /** Positive = credit. Shell only accepts credits (admin / seed). */
  delta: number;
  reason: BottleTopReason;
  actor: "system" | "admin";
  note?: string;
  /** Optional link; sealed-bottle order scope only when set. */
  relatedOrderId?: string;
  relatedRewardId?: string;
  recordedAt: string;
};

export type BottleTopBalances = {
  blue: number;
  gold: number;
};

export type AdminCreditInput = {
  userId: string;
  currency: BottleTopCurrency;
  /** Must be a positive integer. */
  amount: number;
  note?: string;
  actor?: "admin";
  relatedOrderId?: string;
  relatedRewardId?: string;
  recordedAt?: string;
};

export type AdminCreditOk = {
  ok: true;
  entry: BottleTopLedgerEntry;
  balances: BottleTopBalances;
};

export type AdminCreditErr = {
  ok: false;
  reason:
    | "invalid_amount"
    | "unknown_currency"
    | "empty_user"
    | "earn_redeem_not_implemented";
};

export type AdminCreditResult = AdminCreditOk | AdminCreditErr;

export type SeedEntry = Omit<BottleTopLedgerEntry, "id"> & { id?: string };

let ledgerSeq = 0;

function nextLedgerId(): string {
  ledgerSeq += 1;
  return `bt_led_${ledgerSeq}`;
}

function isoNow(): string {
  return new Date().toISOString();
}

function isCurrency(value: string): value is BottleTopCurrency {
  return value === "blue" || value === "gold";
}

/**
 * Derive Blue / Gold balances from ledger deltas for one user.
 * Never free-edit — callers must append credits (or seed) instead.
 */
export function balancesFromEntries(
  entries: ReadonlyArray<Pick<BottleTopLedgerEntry, "userId" | "currency" | "delta">>,
  userId: string,
): BottleTopBalances {
  let blue = 0;
  let gold = 0;
  for (const e of entries) {
    if (e.userId !== userId) continue;
    if (e.currency === "blue") blue += e.delta;
    else if (e.currency === "gold") gold += e.delta;
  }
  return { blue, gold };
}

/**
 * In-memory append-only Bottle Tops ledger.
 * No setBalance / free-edit. No earn or redeem APIs.
 */
export class BottleTopsLedger {
  private entries: BottleTopLedgerEntry[] = [];

  constructor(seed: ReadonlyArray<SeedEntry> = []) {
    for (const row of seed) {
      this.pushValidated(row);
    }
  }

  /** Full history, oldest → newest. */
  list(): BottleTopLedgerEntry[] {
    return [...this.entries];
  }

  listForUser(userId: string): BottleTopLedgerEntry[] {
    return this.entries.filter((e) => e.userId === userId);
  }

  /** Newest first — for display shells. */
  historyForUser(userId: string): BottleTopLedgerEntry[] {
    return this.listForUser(userId).slice().reverse();
  }

  balances(userId: string): BottleTopBalances {
    return balancesFromEntries(this.entries, userId);
  }

  /**
   * Admin credit stub — positive Blue or Gold only.
   * Does not implement earn/redeem rates (OPEN).
   */
  adminCredit(input: AdminCreditInput): AdminCreditResult {
    if (!input.userId.trim()) {
      return { ok: false, reason: "empty_user" };
    }
    if (!isCurrency(input.currency)) {
      return { ok: false, reason: "unknown_currency" };
    }
    const amount = input.amount;
    if (!Number.isInteger(amount) || amount <= 0) {
      return { ok: false, reason: "invalid_amount" };
    }

    const entry = this.pushValidated({
      userId: input.userId,
      currency: input.currency,
      delta: amount,
      reason: "admin_credit",
      actor: input.actor ?? "admin",
      note: input.note,
      relatedOrderId: input.relatedOrderId,
      relatedRewardId: input.relatedRewardId,
      recordedAt: input.recordedAt ?? isoNow(),
    });

    return {
      ok: true,
      entry,
      balances: this.balances(input.userId),
    };
  }

  /**
   * Explicit refusal for earn / redeem / conversion — OPEN, do not invent.
   * Keeps a typed seam for a future backend without shipping rates.
   */
  earnOrRedeem(): AdminCreditErr {
    return { ok: false, reason: "earn_redeem_not_implemented" };
  }

  private pushValidated(row: SeedEntry): BottleTopLedgerEntry {
    if (!row.userId.trim()) {
      throw new Error("bottle-tops: empty userId");
    }
    if (!isCurrency(row.currency)) {
      throw new Error("bottle-tops: unknown currency");
    }
    if (!Number.isInteger(row.delta) || row.delta === 0) {
      throw new Error("bottle-tops: delta must be non-zero integer");
    }
    // Shell: credits only. Debits would invent redeem rules.
    if (row.delta < 0) {
      throw new Error("bottle-tops: debit not allowed — earn/redeem OPEN");
    }
    if (row.reason !== "admin_credit" && row.reason !== "display_seed") {
      throw new Error("bottle-tops: unknown reason");
    }

    const entry: BottleTopLedgerEntry = {
      id: row.id ?? nextLedgerId(),
      userId: row.userId,
      currency: row.currency,
      delta: row.delta,
      reason: row.reason,
      actor: row.actor,
      note: row.note,
      relatedOrderId: row.relatedOrderId,
      relatedRewardId: row.relatedRewardId,
      recordedAt: row.recordedAt,
    };
    this.entries.push(entry);
    return entry;
  }
}
