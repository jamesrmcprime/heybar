/**
 * Inventory oversell skeleton — sealed bottles only.
 *
 * Backend-trusted stock: reserve → commit (decrement) or release.
 * Reservation timing (cart vs payment vs fulfillment) remains OPEN
 * (architecture.md §5); callers choose when to reserve.
 *
 * Cocktail / custom-drink SKUs are rejected. Client-claimed stock is
 * never authoritative — use this module (or a future DB) as source of truth.
 */

import { BOTTLE_SEED, getBottle } from "../data/bottles";

export type StockSnapshot = {
  bottleId: string;
  /** On-hand units not yet permanently decremented */
  onHand: number;
  /** Units held by open reservations */
  reserved: number;
  /** Units free to reserve: onHand − reserved */
  available: number;
};

export type ReserveLine = {
  bottleId: string;
  qty: number;
};

export type ReserveOk = {
  ok: true;
  reservationId: string;
  lines: ReserveLine[];
};

export type ReserveErr = {
  ok: false;
  reason:
    | "unknown_bottle"
    | "not_sealed_catalogue"
    | "invalid_qty"
    | "insufficient_stock"
    | "empty_lines";
  bottleId?: string;
  available?: number;
  requested?: number;
};

export type ReserveResult = ReserveOk | ReserveErr;

export type CommitResult =
  | { ok: true; reservationId: string }
  | { ok: false; reason: "unknown_reservation" };

export type ReleaseResult =
  | { ok: true; reservationId: string }
  | { ok: false; reason: "unknown_reservation" };

type Reservation = {
  id: string;
  lines: ReserveLine[];
};

type BottleStock = {
  onHand: number;
  reserved: number;
};

let seq = 0;

function nextReservationId(): string {
  seq += 1;
  return `rsv-${seq}`;
}

/**
 * In-memory inventory store seeded from the sealed-bottle catalogue.
 * Process-local skeleton — replace with durable stock when backend lands.
 */
export class InventoryStore {
  private stock = new Map<string, BottleStock>();
  private reservations = new Map<string, Reservation>();

  constructor(seed: ReadonlyArray<{ id: string; stock: number }> = BOTTLE_SEED) {
    for (const bottle of seed) {
      this.stock.set(bottle.id, {
        onHand: Math.max(0, Math.floor(bottle.stock)),
        reserved: 0,
      });
    }
  }

  /** Snapshot for one sealed bottle, or undefined if not in catalogue stock. */
  getSnapshot(bottleId: string): StockSnapshot | undefined {
    const row = this.stock.get(bottleId);
    if (!row) return undefined;
    return {
      bottleId,
      onHand: row.onHand,
      reserved: row.reserved,
      available: row.onHand - row.reserved,
    };
  }

  listSnapshots(): StockSnapshot[] {
    return [...this.stock.keys()]
      .sort()
      .map((id) => this.getSnapshot(id)!)
      .filter(Boolean);
  }

  available(bottleId: string): number {
    return this.getSnapshot(bottleId)?.available ?? 0;
  }

  /**
   * Atomically reserve qty per line if every line has enough available.
   * Rejects unknown / non-catalogue ids (cocktails never seeded).
   */
  reserve(lines: ReserveLine[]): ReserveResult {
    if (lines.length === 0) {
      return { ok: false, reason: "empty_lines" };
    }

    const normalized: ReserveLine[] = [];
    const needed = new Map<string, number>();

    for (const line of lines) {
      const qty = line.qty;
      if (!Number.isInteger(qty) || qty < 1) {
        return {
          ok: false,
          reason: "invalid_qty",
          bottleId: line.bottleId,
          requested: qty,
        };
      }

      if (!this.stock.has(line.bottleId)) {
        // Distinguish seed miss vs id that could never be a sealed bottle.
        if (!getBottle(line.bottleId)) {
          return {
            ok: false,
            reason: "not_sealed_catalogue",
            bottleId: line.bottleId,
          };
        }
        return {
          ok: false,
          reason: "unknown_bottle",
          bottleId: line.bottleId,
        };
      }

      needed.set(line.bottleId, (needed.get(line.bottleId) ?? 0) + qty);
      normalized.push({ bottleId: line.bottleId, qty });
    }

    for (const [bottleId, qty] of needed) {
      const available = this.available(bottleId);
      if (qty > available) {
        return {
          ok: false,
          reason: "insufficient_stock",
          bottleId,
          available,
          requested: qty,
        };
      }
    }

    for (const [bottleId, qty] of needed) {
      const row = this.stock.get(bottleId)!;
      row.reserved += qty;
    }

    const reservationId = nextReservationId();
    this.reservations.set(reservationId, { id: reservationId, lines: normalized });
    return { ok: true, reservationId, lines: normalized };
  }

  /** Drop a reservation and free reserved units (cancel / abandon). */
  release(reservationId: string): ReleaseResult {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      return { ok: false, reason: "unknown_reservation" };
    }
    for (const line of reservation.lines) {
      const row = this.stock.get(line.bottleId);
      if (row) {
        row.reserved = Math.max(0, row.reserved - line.qty);
      }
    }
    this.reservations.delete(reservationId);
    return { ok: true, reservationId };
  }

  /**
   * Commit a reservation: permanently decrement on-hand and clear reserved.
   * Call when payment/fulfillment gate says stock is sold (timing OPEN).
   */
  commit(reservationId: string): CommitResult {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      return { ok: false, reason: "unknown_reservation" };
    }
    for (const line of reservation.lines) {
      const row = this.stock.get(line.bottleId);
      if (!row) continue;
      row.reserved = Math.max(0, row.reserved - line.qty);
      row.onHand = Math.max(0, row.onHand - line.qty);
    }
    this.reservations.delete(reservationId);
    return { ok: true, reservationId };
  }
}

/** Default process-local store for stubs and smoke checks. */
export const inventoryStore = new InventoryStore();

/** Availability label for catalogue UI — derived from available qty only. */
export function availabilityLabel(
  available: number,
): "in_stock" | "out_of_stock" {
  return available > 0 ? "in_stock" : "out_of_stock";
}
