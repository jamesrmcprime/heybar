"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  abandonParticipant,
  removeParticipant,
  resolveOrder,
  setParticipantPaymentState,
  type OrderSeed,
  type PaymentState,
  type ResolvedParticipant,
} from "@/data/orders";
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
 * leave/abandon, pay-fail via signed payment stub API, remove participant.
 * Does not invent a live gateway, XP, or Bottle Tops.
 */
export function OrderRoom({ initialOrder }: OrderRoomProps) {
  const [order, setOrder] = useState(initialOrder);
  const [payNote, setPayNote] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const resolved = useMemo(() => resolveOrder(order), [order]);
  const { delivery, participants, self, selfPayableZar } = resolved;
  const isShared = order.kind === "shared";
  const activeSplitCount = delivery.participantCount;
  const selfSeed = self ? seedFor(order, self) : undefined;
  const canLeave =
    isShared &&
    selfSeed &&
    selfSeed.paymentState !== "cancelled" &&
    selfSeed.paymentState !== "paid";
  const canPay =
    selfSeed &&
    (selfSeed.paymentState === "awaiting_pay" ||
      selfSeed.paymentState === "failed");

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

      {self && selfSeed?.paymentState !== "cancelled" && (
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
        webhook); live gateway OPEN
      </p>
    </main>
  );
}
