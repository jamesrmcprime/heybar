import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StackHeader } from "@/components/drinker/StackHeader";
import {
  ORDERS,
  getOrder,
  resolveOrder,
  type PaymentState,
} from "@/data/orders";
import { formatZar } from "@/lib/format";
import styles from "./order.module.css";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export function generateStaticParams() {
  return ORDERS.map((o) => ({ orderId: o.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderId } = await params;
  const order = getOrder(orderId);
  return { title: order ? order.title : "Order" };
}

function paymentLabel(state: PaymentState): string {
  switch (state) {
    case "awaiting_pay":
      return "Awaiting pay";
    case "paid":
      return "Paid";
    case "out_for_delivery":
      return "Out for delivery";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
  }
}

/**
 * Shared / solo order room — sealed bottles only.
 * Delivery split + HeyBar absorption from computeDeliveryAbsorption.
 * Payment provider, fulfillment mutations, XP / Bottle Tops: not invented.
 */
export default async function OrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  const order = getOrder(orderId);
  if (!order) notFound();

  const resolved = resolveOrder(order);
  const { delivery, participants, self, selfPayableZar } = resolved;
  const isShared = order.kind === "shared";

  return (
    <>
      <StackHeader title="Order" backHref="/orders" />
      <main className={`hb-main ${styles.main}`}>
        <header className={styles.header}>
          <div
            className={isShared ? styles.sharedTag : styles.soloTag}
          >
            {isShared
              ? `Shared · ${participants.length} people`
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

        {isShared && (
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
              {participants.map((p) => {
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
              const share = delivery.participants.find((d) => d.id === p.id)!;
              const payable = Math.round(
                (p.productSubtotalZar + share.participantPaysZar) * 100,
              ) / 100;
              return (
                <li key={p.id} className={styles.partCard}>
                  <div className={styles.partHead}>
                    <div className={styles.splitWho}>
                      <span className="hb-avatar" aria-hidden="true">
                        {p.initials}
                      </span>
                      <div>
                        <div className={styles.partName}>{p.displayName}</div>
                        <div className="hb-caption">
                          {p.locked ? "Locked in" : "Still choosing"} ·{" "}
                          {paymentLabel(p.paymentState)}
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
                      Delivery · {formatZar(share.participantPaysZar)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {self && (
          <section className={styles.youPay}>
            <div>
              <div className="hb-caption">Your payable (stub)</div>
              <div className={styles.youPayAmt}>{formatZar(selfPayableZar)}</div>
            </div>
            <button type="button" className={styles.payBtn} disabled>
              Pay share (provider OPEN)
            </button>
          </section>
        )}

        {isShared && (
          <Link href="/friends" className={styles.secondary}>
            Invite more buddies
          </Link>
        )}

        <p className="hb-caption">
          No XP earn rules · Tops not spent here · payment adapter stub only
        </p>
      </main>
    </>
  );
}
