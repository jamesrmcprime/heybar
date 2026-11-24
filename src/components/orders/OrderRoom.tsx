"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  abandonParticipant,
  raiseOrderException,
  removeParticipant,
  resolveOrder,
  setOrderFulfillmentStatus,
  setParticipantPaymentState,
  softCancelOrder,
  type OrderSeed,
  type PaymentState,
  type ResolvedParticipant,
} from "@/data/orders";
import {
  DELIVERY_FORWARD,
  DELIVERY_STUB_FEES,
  canAdvance,
  canRaiseException,
  canSoftCancel,
  deliveryStatusLabel,
  type DeliveryStatus,
} from "@/lib/adapters/delivery";
import { formatZar } from "@/lib/format";
import styles from "@/app/orders/[orderId]/order.module.css";

type OrderRoomProps = {
  initialOrder: OrderSeed;
};

function paymentLabel(state: PaymentState): string {
  switch (state) {
    case "awaiting_pay":
      return "Awaiting pay";
    case "paid":
      return "Paid";
    case "failed":
      return "Payment failed";
    case "out_for_delivery":
      return "Out for delivery";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
  }
}

function seedFor(
  order: OrderSeed,
  participant: ResolvedParticipant,
) {
  return order.participants.find((p) => p.id === participant.id);
}

/**
 * Shared / solo order room with stub mutation surfaces:
 * leave/abandon, pay-fail via signed payment stub API, remove participant,
 * delivery status machine (advance / exception / soft-cancel).
 * Does not invent a live gateway, territory, XP, or Bottle Tops.
 */
export function OrderRoom({ initialOrder }: OrderRoomProps) {
  const [order, setOrder] = useState(initialOrder);
  const [payNote, setPayNote] = useState<string | null>(null);
  const [opsNote, setOpsNote] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [opsBusy, setOpsBusy] = useState(false);

  const resolved = useMemo(() => resolveOrder(order), [order]);
  const { delivery, participants, self, selfPayableZar } = resolved;
  const isShared = order.kind === "shared";
  const activeSplitCount = delivery.participantCount;
  const selfSeed = self ? seedFor(order, self) : undefined;
  const fulfillment = order.fulfillmentStatus;
  const canLeave =
    isShared &&
    selfSeed &&
    selfSeed.paymentState !== "cancelled" &&
    selfSeed.paymentState !== "paid" &&
    fulfillment !== "cancelled";
  const canPay =
    selfSeed &&
    fulfillment !== "cancelled" &&
    fulfillment !== "exception" &&
    (selfSeed.paymentState === "awaiting_pay" ||
      selfSeed.paymentState === "failed");
  const showAdvance = canAdvance(fulfillment);
  const showException = canRaiseException(fulfillment);
  const showSoftCancel = canSoftCancel(fulfillment);

  async function handlePay() {
    if (!self || !canPay || paying) return;
    setPaying(true);
    setPayNote(null);
    try {
      const amountCents = Math.round(selfPayableZar * 100);
      // Server stub: intent + signed failed webhook (checkoutUrl stays null).
      // Live gateway remains OPEN — no client import of node:crypto adapter.
      const res = await fetch("/api/payments/simulate-fail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: self.id,
          amountCents,
          currency: "ZAR",
          orderId: order.id,
        }),
      });
      const data = (await res.json()) as {
        message?: string;
        error?: string;
        intent?: { message?: string; checkoutUrl?: null };
        webhook?: { accepted?: boolean; outcome?: string };
      };
      if (!res.ok || !data.webhook?.accepted) {
        setPayNote(data.error ?? "Payment stub simulate-fail rejected");
        return;
      }
      // Failed state for this participant only (DEF-SO-2).
      setOrder((prev) =>
        setParticipantPaymentState(prev, self.id, "failed"),
      );
      setPayNote(
        data.message ??
          data.intent?.message ??
          "Payment adapter stub — provider OPEN. Charge refused.",
      );
    } catch {
      setPayNote("Network error calling payment stub");
    } finally {
      setPaying(false);
    }
  }

  function handleLeave() {
    if (!self || !canLeave) return;
    setPayNote(null);
    setOrder((prev) => abandonParticipant(prev, self.id));
  }

  function handleRemove(participantId: string) {
    setPayNote(null);
    setOrder((prev) => removeParticipant(prev, participantId));
  }

  async function postDelivery(
    path: "/api/delivery/advance" | "/api/delivery/exception" | "/api/delivery/soft-cancel",
    body: Record<string, string>,
  ) {
    setOpsBusy(true);
    setOpsNote(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        shipment?: {
          status: DeliveryStatus;
          exceptionNote: string | null;
        };
      };
      if (!res.ok || !data.shipment) {
        setOpsNote(data.error ?? "Delivery stub rejected");
        return;
      }
      const nextStatus = data.shipment.status;
      if (nextStatus === "cancelled") {
        setOrder((prev) => softCancelOrder(prev, data.message));
      } else if (nextStatus === "exception") {
        setOrder((prev) =>
          raiseOrderException(
            prev,
            data.shipment?.exceptionNote ?? "Exception · ops stub",
          ),
        );
      } else {
        setOrder((prev) =>
          setOrderFulfillmentStatus(prev, nextStatus, {
            note: data.message,
          }),
        );
      }
      setOpsNote(data.message ?? `Fulfillment → ${nextStatus}`);
    } catch {
      setOpsNote("Network error calling delivery stub");
    } finally {
      setOpsBusy(false);
    }
  }

  function handleAdvance() {
    if (!showAdvance || opsBusy) return;
    void postDelivery("/api/delivery/advance", { orderId: order.id });
  }

  function handleException() {
    if (!showException || opsBusy) return;
    void postDelivery("/api/delivery/exception", {
      orderId: order.id,
      note: "Ops exception stub · no live dispatch",
    });
  }

  function handleSoftCancel() {
    if (!showSoftCancel || opsBusy) return;
    void postDelivery("/api/delivery/soft-cancel", {
      orderId: order.id,
      note: "Soft cancel · records retained",
    });
  }

  return (
    <main className={`hb-main ${styles.main}`}>
      <header className={styles.header}>
        <div className={isShared ? styles.sharedTag : styles.soloTag}>
          {isShared
            ? `Shared · ${activeSplitCount} people`
            : "Solo"}
        </div>
        <h2 className={styles.title}>{order.title}</h2>
        <div className={styles.id}>{order.id}</div>
        <span
          className={`hb-status-pill${order.pending ? " hb-status-pill--pending" : ""}`}
        >
          {order.statusLabel}
        </span>
        <p className="hb-caption">{order.note}</p>
      </header>

      <section className={styles.panel} aria-labelledby="fulfillment-heading">
        <div className="hb-section-label">
          <h3 id="fulfillment-heading" className="hb-h3">
            Delivery status
          </h3>
        </div>
        <p className="hb-caption">
          Prep → assigned → pickup → transit → delivered · exception / soft
          cancel as side paths · no hard-deletes
        </p>
        <ol className={styles.track} aria-label="Fulfillment track">
          {DELIVERY_FORWARD.map((step) => {
            const forwardIdx =
              fulfillment === "exception" || fulfillment === "cancelled"
                ? -1
                : DELIVERY_FORWARD.indexOf(fulfillment);
            const stepIdx = DELIVERY_FORWARD.indexOf(step);
            const reached = forwardIdx >= 0 && stepIdx <= forwardIdx;
            const isCurrent = step === fulfillment;
            return (
              <li
                key={step}
                className={`${styles.trackStep}${reached ? ` ${styles.trackReached}` : ""}${isCurrent ? ` ${styles.trackCurrent}` : ""}`}
                data-status={step}
              >
                {deliveryStatusLabel(step)}
              </li>
            );
          })}
        </ol>
        {(fulfillment === "exception" || fulfillment === "cancelled") && (
          <p
            className={
              fulfillment === "exception" ? styles.exceptionBanner : styles.cancelBanner
            }
            role="status"
          >
            {fulfillment === "exception"
              ? `Exception · ${order.exceptionNote ?? "ops"} · peers unchanged`
              : "Soft-cancelled · shipment retained · participant carts/payments not deleted"}
          </p>
        )}
        <div className={styles.opsRow}>
          {showAdvance && (
            <button
              type="button"
              className={styles.opsBtn}
              disabled={opsBusy}
              onClick={handleAdvance}
            >
              Advance status
            </button>
          )}
          {showException && (
            <button
              type="button"
              className={styles.opsBtnMuted}
              disabled={opsBusy}
              onClick={handleException}
            >
              Raise exception
            </button>
          )}
          {showSoftCancel && (
            <button
              type="button"
              className={styles.opsBtnMuted}
              disabled={opsBusy}
              onClick={handleSoftCancel}
            >
              Soft cancel
            </button>
          )}
        </div>
        <p className={styles.openFlag}>
          Stub fee {formatZar(order.deliveryFeeZar)} · shared base{" "}
          {formatZar(DELIVERY_STUB_FEES.sharedBaseZar)} / solo{" "}
          {formatZar(DELIVERY_STUB_FEES.soloBaseZar)} · territory{" "}
          {DELIVERY_STUB_FEES.territoryFlag} (A8 — stub constants only)
        </p>
        {opsNote && (
          <p className={styles.payFailNote} role="status">
            {opsNote}
          </p>
        )}
      </section>

      {isShared && activeSplitCount > 0 && (
        <section className={styles.panel} aria-labelledby="delivery-heading">
          <div className="hb-section-label">
            <h3 id="delivery-heading" className="hb-h3">
              Delivery split
            </h3>
          </div>
          <p className="hb-caption">
            Fee {formatZar(delivery.deliveryFeeZar)} ÷ {delivery.participantCount}{" "}
            = {formatZar(delivery.equalShareZar)} each before membership
            delivery %. HeyBar absorbs the gap — not redistributed.
          </p>
          <ul className={styles.splitList}>
            {participants
              .filter((p) => p.paymentState !== "cancelled")
              .map((p) => {
                const share = delivery.participants.find((d) => d.id === p.id)!;
                return (
                  <li key={p.id} className={styles.splitRow}>
                    <div className={styles.splitWho}>
                      <span className="hb-avatar" aria-hidden="true">
                        {p.initials}
                      </span>
                      <div>
                        <div className={styles.partName}>{p.displayName}</div>
                        <div className="hb-caption">
                          {p.membershipName} · {p.deliveryDiscountPct}% delivery
                        </div>
                      </div>
                    </div>
                    <div className={styles.splitAmounts}>
                      <span className="hb-price">
                        {formatZar(share.participantPaysZar)}
                      </span>
                      {share.absorbedZar > 0 && (
                        <span className={styles.absorb}>
                          HeyBar {formatZar(share.absorbedZar)}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
          <div className={styles.absorbTotal}>
            <span>HeyBar absorbs</span>
            <span className="hb-price">
              {formatZar(delivery.heyBarAbsorbsZar)}
            </span>
          </div>
          <p className={styles.identity}>
            Pays {formatZar(delivery.participantsPayTotalZar)} + absorbs{" "}
            {formatZar(delivery.heyBarAbsorbsZar)} ={" "}
            {formatZar(delivery.deliveryFeeZar)} fee
          </p>
          <p className={styles.openFlag}>
            Delivery territory / fee schedule · OPEN (seed fee for demo)
          </p>
        </section>
      )}

      <section className={styles.panel} aria-labelledby="carts-heading">
        <div className="hb-section-label">
          <h3 id="carts-heading" className="hb-h3">
            {isShared ? "Participant carts" : "Your cart"}
          </h3>
        </div>
        <p className="hb-caption">Sealed bottles only · product % on own lines</p>
        <ul className={styles.partList}>
          {participants.map((p) => {
            const share = delivery.participants.find((d) => d.id === p.id);
            const deliveryPays = share?.participantPaysZar ?? 0;
            const payable =
              Math.round((p.productSubtotalZar + deliveryPays) * 100) / 100;
            const seed = seedFor(order, p);
            const removable =
              isShared &&
              seed &&
              seed.personKey !== "self" &&
              (seed.paymentState === "awaiting_pay" ||
                seed.paymentState === "failed");

            return (
              <li key={p.id} className={styles.partCard} data-participant={p.id}>
                <div className={styles.partHead}>
                  <div className={styles.splitWho}>
                    <span className="hb-avatar" aria-hidden="true">
                      {p.initials}
                    </span>
                    <div>
                      <div className={styles.partName}>{p.displayName}</div>
                      <div className="hb-caption">
                        {p.paymentState === "cancelled"
                          ? "Left order"
                          : p.locked
                            ? "Locked in"
                            : "Still choosing"}{" "}
                        · {paymentLabel(p.paymentState)}
                      </div>
                    </div>
                  </div>
                  <span className="hb-price">{formatZar(payable)}</span>
                </div>
                <ul className={styles.lines}>
                  {p.lines.map((line) => (
                    <li key={`${p.id}-${line.bottle.id}`}>
                      <span>
                        {line.bottle.name}
                        {line.qty > 1 ? ` ×${line.qty}` : ""}
                      </span>
                      <span className="hb-caption">
                        {formatZar(line.lineListZar)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className={styles.partMeta}>
                  <span className="hb-caption">
                    Product after {p.productDiscountPct}% ·{" "}
                    {formatZar(p.productSubtotalZar)}
                  </span>
                  <span className="hb-caption">
                    Delivery ·{" "}
                    {p.paymentState === "cancelled"
                      ? "—"
                      : formatZar(deliveryPays)}
                  </span>
                </div>
                {removable && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleRemove(p.id)}
                  >
                    Remove from order
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {self &&
        selfSeed?.paymentState !== "cancelled" &&
        fulfillment !== "cancelled" &&
        fulfillment !== "exception" && (
        <section className={styles.youPay}>
          <div>
            <div className="hb-caption">Your payable (stub)</div>
            <div className={styles.youPayAmt}>{formatZar(selfPayableZar)}</div>
          </div>
          <button
            type="button"
            className={styles.payBtn}
            disabled={!canPay || paying}
            onClick={handlePay}
          >
            {paying
              ? "Paying…"
              : selfSeed?.paymentState === "failed"
                ? "Retry pay (stub)"
                : "Pay share (stub)"}
          </button>
        </section>
      )}

      {payNote && (
        <p className={styles.payFailNote} role="status">
          {payNote}
        </p>
      )}

      {selfSeed?.paymentState === "failed" && (
        <p className={styles.failBanner} role="status">
          Payment failed for you only · other participants unchanged · provider
          OPEN
        </p>
      )}

      {isShared && (
        <div className={styles.mutationRow}>
          {canLeave && (
            <button
              type="button"
              className={styles.leaveBtn}
              onClick={handleLeave}
            >
              Leave order
            </button>
          )}
          <Link href="/friends" className={styles.secondary}>
            Invite more buddies
          </Link>
        </div>
      )}

      {selfSeed?.paymentState === "cancelled" && (
        <p className={styles.failBanner} role="status">
          You left this shared order · delivery recalculated for remaining
          participants · their carts and payment states are unchanged
        </p>
      )}

      <p className="hb-caption">
        No XP earn rules · Tops not spent here · payment stub (intent + signed
        webhook); delivery status stub · live gateway / territory OPEN
      </p>
    </main>
  );
}
