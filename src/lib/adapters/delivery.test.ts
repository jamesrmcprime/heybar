import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DELIVERY_STUB_FEES,
  DeliveryStore,
  canAdvance,
  canRaiseException,
  canSoftCancel,
  nextForwardStatus,
  stubFeeForKind,
} from "./delivery";

describe("DeliveryStore stub (status machine + soft cancel)", () => {
  it("exposes OPEN territory stub fee constants only", () => {
    assert.equal(DELIVERY_STUB_FEES.territoryConfigured, false);
    assert.equal(DELIVERY_STUB_FEES.territoryFlag, "OPEN");
    assert.equal(DELIVERY_STUB_FEES.sharedBaseZar, 100);
    assert.equal(DELIVERY_STUB_FEES.soloBaseZar, 30);
    assert.equal(stubFeeForKind("shared"), 100);
    assert.equal(stubFeeForKind("solo"), 30);
    assert.match(DELIVERY_STUB_FEES.note, /OPEN/);
  });

  it("happy path: prep → assigned → pickup → in_transit → delivered", async () => {
    const store = new DeliveryStore();
    const dispatched = await store.dispatch({
      orderId: "ORD-TEST-1",
      addressSummary: "Demo · territory OPEN",
      kind: "shared",
    });
    assert.equal(dispatched.status, "stub");
    assert.equal(dispatched.provider, "OPEN");
    assert.equal(dispatched.trackingId, null);
    assert.equal(dispatched.fulfillmentStatus, "preparation");
    assert.equal(dispatched.stubFeeZar, 100);
    assert.equal(dispatched.territoryFlag, "OPEN");

    const steps = ["assigned", "pickup", "in_transit", "delivered"] as const;
    for (const expected of steps) {
      const result = await store.advance("ORD-TEST-1");
      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.equal(result.shipment.status, expected);
    }

    const blocked = await store.advance("ORD-TEST-1");
    assert.equal(blocked.ok, false);

    const events = store.listEventsForOrder("ORD-TEST-1");
    assert.equal(events.length, 5); // dispatch + 4 advances
    assert.equal(store.getShipment("ORD-TEST-1")?.status, "delivered");
  });

  it("soft cancel retains shipment + events; no hard-delete", async () => {
    const store = new DeliveryStore();
    await store.dispatch({
      orderId: "ORD-SOFT",
      addressSummary: "A",
      kind: "solo",
    });
    await store.advance("ORD-SOFT"); // assigned
    await store.advance("ORD-SOFT"); // pickup

    const cancel = await store.softCancel("ORD-SOFT", "ops soft cancel");
    assert.equal(cancel.ok, true);
    if (!cancel.ok) return;
    assert.equal(cancel.shipment.status, "cancelled");
    assert.equal(cancel.shipment.softCancelled, true);

    // Record retained
    const shipment = store.getShipment("ORD-SOFT");
    assert.ok(shipment);
    assert.equal(shipment.status, "cancelled");
    assert.equal(shipment.stubFeeZar, 30);

    const events = store.listEventsForOrder("ORD-SOFT");
    assert.ok(events.some((e) => e.kind === "soft_cancel"));
    assert.equal(events.length, 4); // dispatch + 2 advances + soft_cancel

    // Cannot advance after soft cancel
    const advance = await store.advance("ORD-SOFT");
    assert.equal(advance.ok, false);

    // Idempotent soft-cancel keeps the retained row
    const again = await store.softCancel("ORD-SOFT");
    assert.equal(again.ok, true);
    if (!again.ok) return;
    assert.equal(again.shipment.status, "cancelled");
    assert.equal(store.getShipment("ORD-SOFT")?.softCancelled, true);
  });

  it("exception path retains shipment; peers are fulfillment-only", async () => {
    const store = new DeliveryStore();
    await store.dispatch({
      orderId: "ORD-EX",
      addressSummary: "B",
      kind: "shared",
    });
    await store.advance("ORD-EX"); // assigned
    await store.advance("ORD-EX"); // pickup
    await store.advance("ORD-EX"); // in_transit

    const empty = await store.raiseException("ORD-EX", "   ");
    assert.equal(empty.ok, false);

    const raised = await store.raiseException(
      "ORD-EX",
      "Driver unreachable · stub",
    );
    assert.equal(raised.ok, true);
    if (!raised.ok) return;
    assert.equal(raised.shipment.status, "exception");
    assert.equal(raised.shipment.exceptionNote, "Driver unreachable · stub");

    // Still listed — no hard-delete
    assert.equal(store.listShipments().length, 1);
    assert.equal(store.listEventsForOrder("ORD-EX").length, 5);

    // Terminal for advance / exception
    assert.equal((await store.advance("ORD-EX")).ok, false);
    assert.equal(
      (await store.raiseException("ORD-EX", "again")).ok,
      false,
    );

    // Soft cancel still allowed from exception
    const cancel = await store.softCancel("ORD-EX", "close exception");
    assert.equal(cancel.ok, true);
    if (!cancel.ok) return;
    assert.equal(cancel.shipment.status, "cancelled");
    assert.equal(store.getShipment("ORD-EX")?.softCancelled, true);
  });

  it("dispatch is idempotent; peer orders stay isolated", async () => {
    const store = new DeliveryStore();
    await store.dispatch({
      orderId: "ORD-A",
      addressSummary: "A",
      kind: "solo",
    });
    await store.dispatch({
      orderId: "ORD-B",
      addressSummary: "B",
      kind: "shared",
    });

    await store.advance("ORD-A");
    await store.softCancel("ORD-A");

    assert.equal(store.getShipment("ORD-A")?.status, "cancelled");
    assert.equal(store.getShipment("ORD-B")?.status, "preparation");
    assert.equal(store.listEventsForOrder("ORD-B").length, 1);

    const again = await store.dispatch({
      orderId: "ORD-B",
      addressSummary: "B-updated",
      kind: "shared",
    });
    assert.equal(again.fulfillmentStatus, "preparation");
    assert.equal(store.getShipment("ORD-B")?.addressSummary, "B");
  });

  it("transition helpers match architecture vocabulary", () => {
    assert.equal(nextForwardStatus("preparation"), "assigned");
    assert.equal(nextForwardStatus("assigned"), "pickup");
    assert.equal(nextForwardStatus("pickup"), "in_transit");
    assert.equal(nextForwardStatus("in_transit"), "delivered");
    assert.equal(nextForwardStatus("delivered"), null);
    assert.equal(canAdvance("in_transit"), true);
    assert.equal(canAdvance("delivered"), false);
    assert.equal(canRaiseException("pickup"), true);
    assert.equal(canRaiseException("exception"), false);
    assert.equal(canSoftCancel("exception"), true);
    assert.equal(canSoftCancel("delivered"), false);
    assert.equal(canSoftCancel("cancelled"), false);
  });
});
