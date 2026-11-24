import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PaymentStore, signPaymentWebhook } from "./payment";

describe("PaymentStore stub (intent + signed webhook)", () => {
  it("intent / signed fail webhook / idempotency / peer isolation", async () => {
    const store = new PaymentStore("test-stub-secret");

    const sam = await store.createIntent({
      participantId: "part-sam",
      orderId: "ORD-8F2A",
      amountCents: 3600,
      currency: "ZAR",
    });
    assert.equal(sam.status, "stub");
    assert.equal(sam.provider, "OPEN");
    assert.equal(sam.checkoutUrl, null);
    assert.match(sam.sessionId, /^pay_sess_/);

    const riley = await store.createIntent({
      participantId: "part-riley",
      orderId: "ORD-8F2A",
      amountCents: 5000,
      currency: "ZAR",
    });

    const failBody = JSON.stringify({
      eventId: "evt_test_fail_1",
      sessionId: sam.sessionId,
      outcome: "failed",
    });
    const badSig = await store.handleWebhook(failBody, "sha256=deadbeef");
    assert.equal(badSig.accepted, false);

    const missing = await store.handleWebhook(failBody, null);
    assert.equal(missing.accepted, false);

    const sig = signPaymentWebhook(failBody, "test-stub-secret");
    const failed = await store.handleWebhook(failBody, sig);
    assert.equal(failed.accepted, true);
    if (!failed.accepted) return;
    assert.equal(failed.duplicate, false);
    assert.equal(failed.outcome, "failed");
    assert.equal(failed.participantId, "part-sam");

    const again = await store.handleWebhook(failBody, sig);
    assert.equal(again.accepted, true);
    if (!again.accepted) return;
    assert.equal(again.duplicate, true);
    assert.equal(
      store.listLedgerForParticipant("ORD-8F2A", "part-sam").length,
      1,
    );

    assert.equal(store.getSession(sam.sessionId)?.status, "failed");
    assert.equal(store.getSession(riley.sessionId)?.status, "open");
    assert.equal(
      store.listLedgerForParticipant("ORD-8F2A", "part-riley").length,
      0,
    );

    const paidBody = JSON.stringify({
      eventId: "evt_test_paid_riley",
      sessionId: riley.sessionId,
      outcome: "succeeded",
    });
    const paid = await store.handleWebhook(
      paidBody,
      signPaymentWebhook(paidBody, "test-stub-secret"),
    );
    assert.equal(paid.accepted, true);
    assert.equal(store.getSession(riley.sessionId)?.status, "succeeded");
    assert.equal(store.getSession(sam.sessionId)?.status, "failed");
  });

  it("simulateParticipantFail is self-contained", async () => {
    const store = new PaymentStore();

    const { intent, webhook } = await store.simulateParticipantFail({
      participantId: "part-sam",
      orderId: "ORD-8F2A",
      amountCents: 3600,
      currency: "ZAR",
    });

    assert.equal(intent.checkoutUrl, null);
    assert.equal(webhook.accepted, true);
    if (!webhook.accepted) return;
    assert.equal(webhook.outcome, "failed");
    assert.equal(store.getSession(intent.sessionId)?.status, "failed");
  });
});
