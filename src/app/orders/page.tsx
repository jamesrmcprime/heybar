import type { Metadata } from "next";
import { TopBar } from "@/components/drinker/TopBar";
import { formatZar } from "@/lib/format";
import styles from "./orders.module.css";

export const metadata: Metadata = {
  title: "Orders",
};

const ACTIVE = [
  {
    id: "ORD-8F2A",
    kind: "shared" as const,
    people: 4,
    title: "Friday night run",
    status: "Awaiting pay",
    pending: true,
    note: "Your share locked · delivery split applied",
    amount: 87.5,
    detail: "2 bottles",
  },
  {
    id: "ORD-3C91",
    kind: "solo" as const,
    title: "Quick top-up",
    status: "Out for delivery",
    pending: false,
    note: "Driver assigned · ETA tonight",
    amount: 30,
    detail: "1 bottle",
  },
];

const PAST = [
  {
    id: "ORD-11B0",
    kind: "solo" as const,
    title: "Weeknight gin",
    status: "Delivered",
    amount: 67,
    detail: "12 Sep 2026",
  },
];

export default function OrdersPage() {
  return (
    <>
      <TopBar title="Orders" />
      <main className="hb-main">
        <p className="hb-caption">Current & past · shared and solo</p>

        <section>
          <div className="hb-section-label">
            <h2 className="hb-h3">Active</h2>
          </div>
          {ACTIVE.map((order) => (
            <article key={order.id} className={styles.card}>
              <div className={styles.head}>
                <div>
                  <div
                    className={
                      order.kind === "shared" ? styles.sharedTag : styles.soloTag
                    }
                  >
                    {order.kind === "shared"
                      ? `Shared · ${order.people} people`
                      : "Solo"}
                  </div>
                  <div className={styles.title}>{order.title}</div>
                  <div className={styles.id}>{order.id}</div>
                </div>
                <span
                  className={`hb-status-pill${order.pending ? " hb-status-pill--pending" : ""}`}
                >
                  {order.status}
                </span>
              </div>
              <div className="hb-caption">{order.note}</div>
              <div className={styles.metaRow}>
                <span className="hb-price">{formatZar(order.amount)}</span>
                <span className="hb-caption">{order.detail}</span>
              </div>
            </article>
          ))}
        </section>

        <section>
          <div className="hb-section-label">
            <h2 className="hb-h3">Past</h2>
          </div>
          {PAST.map((order) => (
            <article key={order.id} className={styles.card} style={{ opacity: 0.85 }}>
              <div className={styles.head}>
                <div>
                  <div className={styles.soloTag}>Solo</div>
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
                  {order.status}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className="hb-price">{formatZar(order.amount)}</span>
                <span className="hb-caption">{order.detail}</span>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
