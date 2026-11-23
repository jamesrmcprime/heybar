import Link from "next/link";
import { TopBar } from "@/components/drinker/TopBar";
import styles from "./home.module.css";

export default function HomePage() {
  return (
    <>
      <TopBar showBrandMark cartBadge />
      <main className="hb-main">
        <section className={styles.hero} aria-label="HeyBar home">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.bottleSil} aria-hidden="true" />
          <h1 className={styles.brand}>
            Hey<em>Bar</em>
          </h1>
          <p className={styles.support}>
            Sealed bottles. Shared orders. Night delivered.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/bottles" className="hb-btn hb-btn--primary">
              Browse bottles
            </Link>
            <Link href="/bottles" className="hb-btn hb-btn--secondary">
              Open cart
            </Link>
          </div>
        </section>

        <section className={styles.below} aria-label="Your night">
          <div className="hb-section-label">
            <span className="hb-caption">Your night</span>
            <span className="hb-chip hb-chip--amber">The Reserve</span>
          </div>
          <div className={styles.statStrip}>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Rank</div>
              <div className={styles.statVal}>Sipper</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Blue Tops</div>
              <div className={`${styles.statVal} ${styles.blue}`}>120</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Gold Tops</div>
              <div className={`${styles.statVal} ${styles.gold}`}>8</div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
