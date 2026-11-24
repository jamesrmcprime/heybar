/**
 * Demo Bottle Tops ledger seed — display history only.
 * Balances for DEMO_USER derive from these rows (120 Blue / 8 Gold).
 * Reasons are display_seed / admin_credit — not earn or redeem rates.
 */

import {
  BottleTopsLedger,
  type SeedEntry,
} from "@/lib/bottle-tops";
import { DEMO_USER_ID } from "./demo-user";

/** Fixture history — opaque seed credits, not invented earn events. */
export const DEMO_BOTTLE_TOP_SEED: readonly SeedEntry[] = [
  {
    id: "bt_seed_1",
    userId: DEMO_USER_ID,
    currency: "blue",
    delta: 50,
    reason: "display_seed",
    actor: "system",
    note: "Display history (earn rules OPEN)",
    recordedAt: "2026-11-10T10:00:00.000Z",
  },
  {
    id: "bt_seed_2",
    userId: DEMO_USER_ID,
    currency: "blue",
    delta: 40,
    reason: "display_seed",
    actor: "system",
    note: "Display history (earn rules OPEN)",
    recordedAt: "2026-11-14T16:30:00.000Z",
  },
  {
    id: "bt_seed_3",
    userId: DEMO_USER_ID,
    currency: "gold",
    delta: 5,
    reason: "display_seed",
    actor: "system",
    note: "Display history (earn rules OPEN)",
    recordedAt: "2026-11-14T16:30:00.000Z",
  },
  {
    id: "bt_seed_4",
    userId: DEMO_USER_ID,
    currency: "blue",
    delta: 30,
    reason: "admin_credit",
    actor: "admin",
    note: "Admin credit stub",
    recordedAt: "2026-11-20T09:15:00.000Z",
  },
  {
    id: "bt_seed_5",
    userId: DEMO_USER_ID,
    currency: "gold",
    delta: 3,
    reason: "admin_credit",
    actor: "admin",
    note: "Admin credit stub",
    recordedAt: "2026-11-22T12:00:00.000Z",
  },
] as const;

/** Process-local demo ledger — balances derived, not free-edit. */
export const demoBottleTopsLedger = new BottleTopsLedger(DEMO_BOTTLE_TOP_SEED);

export function demoBottleTopBalances() {
  return demoBottleTopsLedger.balances(DEMO_USER_ID);
}

export function demoBottleTopHistory() {
  return demoBottleTopsLedger.historyForUser(DEMO_USER_ID);
}
