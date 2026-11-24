import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { DeliveryStore } from "../adapters/delivery";
import {
  NOTIFICATION_CHANNELS_OPEN,
  OrderStatusNotificationStore,
  notifyOrderStatusChange,
  orderStatusNotificationStore,
} from "./order-status";

describe("order-status notifications stub", () => {
  beforeEach(() => {
    orderStatusNotificationStore.clear();
  });

  it("flags channels OPEN with no providers", () => {
    assert.equal(NOTIFICATION_CHANNELS_OPEN.configured, false);
    assert.equal(NOTIFICATION_CHANNELS_OPEN.flag, "OPEN");
    assert.equal(NOTIFICATION_CHANNELS_OPEN.providers, null);
    assert.match(NOTIFICATION_CHANNELS_OPEN.note, /OPEN/);
  });

  it("records event shape without sending channels", () => {
    const event = notifyOrderStatusChange({
      orderId: "ORD-N1",
      fromStatus: "preparation",
      toStatus: "assigned",
      deliveryEventKind: "advance",
    });

    assert.equal(event.kind, "order_status_change");
    assert.equal(event.orderId, "ORD-N1");
    assert.equal(event.fromStatus, "preparation");
    assert.equal(event.toStatus, "assigned");
    assert.equal(event.deliveryEventKind, "advance");
    assert.equal(event.delivered, false);
    assert.deepEqual(event.channelsAttempted, []);
    assert.match(event.placeholderBody, /ORD-N1/);
    assert.match(event.placeholderBody, /preparation → assigned/);
    assert.ok(event.id.startsWith("notif_evt_"));
    assert.ok(event.recordedAt);

    const listed = orderStatusNotificationStore.listEventsForOrder("ORD-N1");
    assert.equal(listed.length, 1);
    assert.equal(listed[0]?.id, event.id);
  });

  it("includes optional note in placeholder body", () => {
    const store = new OrderStatusNotificationStore();
    const event = store.notifyOrderStatusChange({
      orderId: "ORD-NOTE",
      fromStatus: "pickup",
      toStatus: "exception",
      deliveryEventKind: "exception",
      note: "Driver unreachable · stub",
    });
    assert.match(event.placeholderBody, /Driver unreachable/);
    assert.equal(event.delivered, false);
  });

  it("rejects empty orderId", () => {
    assert.throws(
      () =>
        notifyOrderStatusChange({
          orderId: "   ",
          fromStatus: null,
          toStatus: "preparation",
          deliveryEventKind: "dispatch",
        }),
      /orderId required/,
    );
  });

  it("status transitions invoke the stub (dispatch / advance / exception / soft-cancel)", async () => {
    const delivery = new DeliveryStore();

    await delivery.dispatch({
      orderId: "ORD-HOOK",
      addressSummary: "Demo · territory OPEN",
      kind: "solo",
    });
    assert.equal(
      orderStatusNotificationStore.listEventsForOrder("ORD-HOOK").length,
      1,
    );
    assert.equal(
      orderStatusNotificationStore.lastEvent()?.toStatus,
      "preparation",
    );
    assert.equal(
      orderStatusNotificationStore.lastEvent()?.deliveryEventKind,
      "dispatch",
    );

    const advanced = await delivery.advance("ORD-HOOK");
    assert.equal(advanced.ok, true);
    const afterAdvance = orderStatusNotificationStore.listEventsForOrder(
      "ORD-HOOK",
    );
    assert.equal(afterAdvance.length, 2);
    assert.equal(afterAdvance[1]?.fromStatus, "preparation");
    assert.equal(afterAdvance[1]?.toStatus, "assigned");
    assert.equal(afterAdvance[1]?.deliveryEventKind, "advance");
    assert.equal(afterAdvance[1]?.delivered, false);
    assert.deepEqual(afterAdvance[1]?.channelsAttempted, []);

    const raised = await delivery.raiseException(
      "ORD-HOOK",
      "ops exception stub",
    );
    assert.equal(raised.ok, true);
    const afterException = orderStatusNotificationStore.listEventsForOrder(
      "ORD-HOOK",
    );
    assert.equal(afterException.length, 3);
    assert.equal(afterException[2]?.toStatus, "exception");
    assert.equal(afterException[2]?.deliveryEventKind, "exception");
    assert.match(afterException[2]?.placeholderBody ?? "", /ops exception stub/);

    const cancelled = await delivery.softCancel("ORD-HOOK", "ops soft cancel");
    assert.equal(cancelled.ok, true);
    const afterCancel = orderStatusNotificationStore.listEventsForOrder(
      "ORD-HOOK",
    );
    assert.equal(afterCancel.length, 4);
    assert.equal(afterCancel[3]?.toStatus, "cancelled");
    assert.equal(afterCancel[3]?.deliveryEventKind, "soft_cancel");
    assert.equal(afterCancel[3]?.delivered, false);

    // Failed transition does not emit
    const blocked = await delivery.advance("ORD-HOOK");
    assert.equal(blocked.ok, false);
    assert.equal(
      orderStatusNotificationStore.listEventsForOrder("ORD-HOOK").length,
      4,
    );

    // Idempotent soft-cancel does not re-emit a status-change notice
    const again = await delivery.softCancel("ORD-HOOK");
    assert.equal(again.ok, true);
    assert.equal(
      orderStatusNotificationStore.listEventsForOrder("ORD-HOOK").length,
      4,
    );
  });

  it("isolates notifications per order", async () => {
    const delivery = new DeliveryStore();
    await delivery.dispatch({
      orderId: "ORD-A",
      addressSummary: "A",
      kind: "solo",
    });
    await delivery.dispatch({
      orderId: "ORD-B",
      addressSummary: "B",
      kind: "shared",
    });
    await delivery.advance("ORD-A");

    assert.equal(
      orderStatusNotificationStore.listEventsForOrder("ORD-A").length,
      2,
    );
    assert.equal(
      orderStatusNotificationStore.listEventsForOrder("ORD-B").length,
      1,
    );
  });
});
