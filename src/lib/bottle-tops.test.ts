import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BottleTopsLedger,
  balancesFromEntries,
} from "./bottle-tops";
import { DEMO_BOTTLE_TOP_SEED } from "../data/bottle-tops";
import { DEMO_USER_ID } from "../data/demo-user";

describe("BottleTopsLedger", () => {
  it("derives Blue/Gold balances from append-only seed (120 / 8)", () => {
    const ledger = new BottleTopsLedger(DEMO_BOTTLE_TOP_SEED);
    const bal = ledger.balances(DEMO_USER_ID);
    assert.equal(bal.blue, 120);
    assert.equal(bal.gold, 8);
    assert.deepEqual(
      balancesFromEntries(DEMO_BOTTLE_TOP_SEED, DEMO_USER_ID),
      { blue: 120, gold: 8 },
    );
  });

  it("adminCredit appends and re-derives; no free-edit balance", () => {
    const ledger = new BottleTopsLedger([]);
    const first = ledger.adminCredit({
      userId: "user-a",
      currency: "blue",
      amount: 10,
      note: "ops stub",
    });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.equal(first.balances.blue, 10);
    assert.equal(first.entry.reason, "admin_credit");
    assert.equal(first.entry.delta, 10);

    const gold = ledger.adminCredit({
      userId: "user-a",
      currency: "gold",
      amount: 2,
    });
    assert.equal(gold.ok, true);
    if (!gold.ok) return;
    assert.deepEqual(ledger.balances("user-a"), { blue: 10, gold: 2 });
    assert.equal(ledger.list().length, 2);
  });

  it("rejects invalid admin amounts and empty user", () => {
    const ledger = new BottleTopsLedger([]);
    assert.equal(
      ledger.adminCredit({ userId: "u", currency: "blue", amount: 0 }).ok,
      false,
    );
    assert.equal(
      ledger.adminCredit({ userId: "u", currency: "blue", amount: -5 }).ok,
      false,
    );
    assert.equal(
      ledger.adminCredit({ userId: "u", currency: "blue", amount: 1.5 }).ok,
      false,
    );
    assert.equal(
      ledger.adminCredit({ userId: "  ", currency: "blue", amount: 1 }).ok,
      false,
    );
  });

  it("refuses earn/redeem seam without inventing rates", () => {
    const ledger = new BottleTopsLedger([]);
    const refused = ledger.earnOrRedeem();
    assert.equal(refused.ok, false);
    assert.equal(refused.reason, "earn_redeem_not_implemented");
    assert.equal(ledger.list().length, 0);
  });

  it("rejects debit seed rows (redeem OPEN)", () => {
    assert.throws(
      () =>
        new BottleTopsLedger([
          {
            userId: "u",
            currency: "blue",
            delta: -1,
            reason: "display_seed",
            actor: "system",
            recordedAt: "2026-11-01T00:00:00.000Z",
          },
        ]),
      /debit not allowed/,
    );
  });

  it("isolates users and keeps Blue/Gold separate", () => {
    const ledger = new BottleTopsLedger([]);
    ledger.adminCredit({ userId: "a", currency: "blue", amount: 7 });
    ledger.adminCredit({ userId: "b", currency: "gold", amount: 3 });
    assert.deepEqual(ledger.balances("a"), { blue: 7, gold: 0 });
    assert.deepEqual(ledger.balances("b"), { blue: 0, gold: 3 });
    assert.equal(ledger.historyForUser("a").length, 1);
    assert.equal(ledger.historyForUser("b")[0]?.currency, "gold");
  });
});
