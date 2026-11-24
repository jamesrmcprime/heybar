import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/drinker/TopBar";
import {
  activeOrders,
  orderListAmountZar,
  orderListDetail,
  pastOrders,
} from "@/data/orders";
import { formatZar } from "@/lib/format";
import styles from "./orders.module.css";

export const metadata: Metadata = {
  title: "Orders",
};

export default function OrdersPage() {
  const active = activeOrders();
  const past = pastOrders();

  return (
    <>
      <TopBar title="Orders" />
      <main className="hb-main">
        <p className="hb-caption">Current & past · shared and solo</p>

        <section>
          <div className="hb-section-label">
            <h2 className="hb-h3">Active</h2>
          </div>
          {active.map((order) => {
            const amount = orderListAmountZar(order);
            const detail = orderListDetail(order);
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className={styles.cardLink}
              >
                <article className={styles.card}>
                  <div className={styles.head}>
                    <div>
                      <div
                        className={
                          order.kind === "shared"
                            ? styles.sharedTag
                            : styles.soloTag
                        }
                      >
                        {order.kind === "shared"
                          ? `Shared · ${order.participants.length} people`
                          : "Solo"}
                      </div>
                      <div className={styles.title}>{order.title}</div>
                      <div className={styles.id}>{order.id}</div>
                    </div>
                    <span
                      className={`hb-status-pill${order.pending ? " hb-status-pill--pending" : ""}`}
                    >
                      {order.statusLabel}
                    </span>
                  </div>
                  <div className="hb-caption">{order.note}</div>
                  <div className={styles.metaRow}>
                    <span className="hb-price">{formatZar(amount)}</span>
                    <span className="hb-caption">{detail}</span>
                  </div>
                </article>
              </Link>
            );
          })}
        </section>

        <section>
          <div className="hb-section-label">
            <h2 className="hb-h3">Past</h2>
          </div>
          {past.map((order) => {
            const amount = orderListAmountZar(order);
            const detail = orderListDetail(order);
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className={styles.cardLink}
              >
                <article className={styles.card} style={{ opacity: 0.85 }}>
                  <div className={styles.head}>
                    <div>
                      <div
                        className={
                          order.kind === "shared"
                            ? styles.sharedTag
                            : styles.soloTag
                        }
                      >
                        {order.kind === "shared"
                          ? `Shared · ${order.participants.length} people`
                          : "Solo"}
                      </div>
                      <div className={styles.title}>{order.title}</div>
                      <div className={styles.id}>{order.id}</div>
                    </div>
                    <span
                      className="hb-status-pill"
                      style={{
                        background: "rgba(185,175,163,0.12)",
                        color: "var(--hb-fog)",
                      }}
                    >
                      {order.statusLabel}
                    </span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className="hb-price">{formatZar(amount)}</span>
                    <span className="hb-caption">{detail}</span>
                  </div>
                </article>
              </Link>
            );
          })}
        </section>
      </main>
    </>
  );
}
