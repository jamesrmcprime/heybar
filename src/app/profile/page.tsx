import type { Metadata } from "next";
import { TopBar } from "@/components/drinker/TopBar";
import styles from "./profile.module.css";

export const metadata: Metadata = {
  title: "Profile",
};

const GIN_BADGES = [
  { code: "BB", level: "L1", name: "Botanical Beginner", state: "earned" },
  { code: "CC", level: "L2", name: "Citrus Crafter", state: "earned" },
  { code: "HH", level: "L3", name: "Herb Hero", state: "active" },
  { code: "JG", level: "L4", name: "Juniper Genius", state: "locked" },
  { code: "G5", level: "L5", name: "Gin Level 5", state: "locked" },
] as const;

export default function ProfilePage() {
  return (
    <>
      <TopBar title="Profile" />
      <main className={`hb-main ${styles.main}`}>
        <div className={styles.hero}>
          <div className={styles.avatar}>SL</div>
          <div>
            <h2 className="hb-h3" style={{ fontSize: 16 }}>
              Sam Lady
            </h2>
            <div className="hb-caption">Verified 18+ · Johannesburg</div>
            <div className={styles.chips}>
              <span className="hb-chip hb-chip--gold">Top Shelf</span>
              <span className="hb-chip hb-chip--amber">Gin</span>
            </div>
          </div>
        </div>

        <section className={styles.panel}>
          <div className="hb-section-label">
            <span style={{ fontWeight: 700, fontSize: 13 }}>Gin reward badges</span>
            <span className="hb-caption">Guild path</span>
          </div>
          <div className={styles.badgeRow}>
            {GIN_BADGES.map((badge) => (
              <div key={badge.code} className={styles.badgeCol}>
                <div
                  className={`${styles.badge} ${
                    badge.state === "earned"
                      ? styles.earned
                      : badge.state === "locked"
                        ? styles.locked
                        : ""
                  }`}
                >
                  {badge.code}
                  <span className={styles.lvl}>{badge.level}</span>
                </div>
                <div className={styles.badgeCap}>{badge.name}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className="hb-section-label">
            <span style={{ fontWeight: 700, fontSize: 13 }}>Membership</span>
            <span className="hb-caption">R300 / mo</span>
          </div>
          <div className="hb-caption">25% product · 100% delivery</div>
        </section>

        <section className={styles.panel}>
          <div className="hb-section-label">
            <span style={{ fontWeight: 700, fontSize: 13 }}>Guild</span>
            <span className="hb-chip hb-chip--amber">Gin Connoisseurs</span>
          </div>
          <div className={styles.kv}>
            <span className="hb-muted">Rank</span>
            <span className="hb-price">Sipper</span>
          </div>
          <div className={styles.kv}>
            <span className="hb-muted">XP</span>
            <span className="hb-price">186 / 299</span>
          </div>
          <div className={styles.progress} aria-hidden="true">
            <i />
          </div>
        </section>

        <section className={styles.panel}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
            Bottle Tops
          </div>
          <div className={styles.tops}>
            <div className={`${styles.topBox} ${styles.blue}`}>
              <div className="hb-caption">Blue</div>
              <div className={styles.n}>120</div>
            </div>
            <div className={`${styles.topBox} ${styles.gold}`}>
              <div className="hb-caption">Gold</div>
              <div className={styles.n}>8</div>
            </div>
          </div>
          <p className="hb-caption" style={{ marginTop: 8 }}>
            Earn/redeem rules OPEN — balances are display stubs only.
          </p>
        </section>
      </main>
    </>
  );
}
