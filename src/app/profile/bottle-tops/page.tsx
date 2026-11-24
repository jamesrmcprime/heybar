import type { Metadata } from "next";
import Link from "next/link";
import { StackHeader } from "@/components/drinker/StackHeader";
import {
  demoBottleTopBalances,
  demoBottleTopHistory,
} from "@/data/bottle-tops";
import type { BottleTopLedgerEntry } from "@/lib/bottle-tops";
import styles from "./bottle-tops.module.css";

export const metadata: Metadata = {
  title: "Bottle Tops",
};

function reasonLabel(entry: BottleTopLedgerEntry): string {
  if (entry.reason === "admin_credit") return "Admin credit";
  return "History (display)";
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Bottle Tops ledger shell — derived Blue/Gold balances + append-only history.
 * No earn / redeem / conversion rates (OPEN).
 */
export default function BottleTopsPage() {
  const balances = demoBottleTopBalances();
  const history = demoBottleTopHistory();

  return (
    <>
      <StackHeader title="Bottle Tops" backHref="/profile" />
      <main className={`hb-main ${styles.main}`}>
        <p className="hb-caption">
          Append-only ledger · balances derived · earn/redeem OPEN
        </p>

        <section className={styles.panel} aria-label="Balances">
          <div className={styles.tops}>
            <div className={`${styles.topBox} ${styles.blue}`}>
              <div className="hb-caption">Blue</div>
              <div className={styles.n}>{balances.blue}</div>
            </div>
            <div className={`${styles.topBox} ${styles.gold}`}>
              <div className="hb-caption">Gold</div>
              <div className={styles.n}>{balances.gold}</div>
            </div>
          </div>
          <p className="hb-caption" style={{ marginTop: 8 }}>
            Not free-edit totals — sum of ledger credits only.
          </p>
        </section>

        <section className={styles.panel} aria-label="Ledger history">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
            History
          </div>
          <ul className={styles.list}>
            {history.map((entry) => (
              <li key={entry.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <span
                    className={
                      entry.currency === "blue" ? styles.tagBlue : styles.tagGold
                    }
                  >
                    {entry.currency === "blue" ? "Blue" : "Gold"}
                  </span>
                  <span className={styles.delta}>+{entry.delta}</span>
                </div>
                <div className={styles.meta}>
                  <span>{reasonLabel(entry)}</span>
                  <span>{formatWhen(entry.recordedAt)}</span>
                </div>
                {entry.note ? (
                  <div className="hb-caption">{entry.note}</div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <p className="hb-caption">
          Admin credit stub only. Earn / redeem / conversion · OPEN.{" "}
          <Link href="/profile">Back to Profile</Link>
        </p>
      </main>
    </>
  );
}
