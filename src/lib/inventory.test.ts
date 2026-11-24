import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InventoryStore } from "./inventory";

describe("InventoryStore (sealed bottles)", () => {
  it("reserve / commit / release prevent naive oversell", () => {
    const store = new InventoryStore([
      { id: "bottle-absolut", stock: 2 },
      { id: "bottle-tanqueray", stock: 1 },
    ]);

    const first = store.reserve([{ bottleId: "bottle-absolut", qty: 2 }]);
    assert.equal(first.ok, true);
    if (!first.ok) return;

    const oversell = store.reserve([{ bottleId: "bottle-absolut", qty: 1 }]);
    assert.equal(oversell.ok, false);
    if (!oversell.ok) {
      assert.equal(oversell.reason, "insufficient_stock");
      assert.equal(oversell.available, 0);
    }

    const cocktail = store.reserve([
      { bottleId: "cocktail-custom-negroni", qty: 1 },
    ]);
    assert.equal(cocktail.ok, false);
    if (!cocktail.ok) {
      assert.equal(cocktail.reason, "not_sealed_catalogue");
    }

    store.release(first.reservationId);
    assert.equal(store.available("bottle-absolut"), 2);

    const again = store.reserve([{ bottleId: "bottle-absolut", qty: 2 }]);
    assert.equal(again.ok, true);
    if (!again.ok) return;

    const committed = store.commit(again.reservationId);
    assert.equal(committed.ok, true);
    assert.equal(store.available("bottle-absolut"), 0);
    assert.equal(store.getSnapshot("bottle-absolut")?.onHand, 0);

    const afterCommit = store.reserve([{ bottleId: "bottle-absolut", qty: 1 }]);
    assert.equal(afterCommit.ok, false);
  });
});
