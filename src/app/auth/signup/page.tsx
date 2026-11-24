import type { Metadata } from "next";
import Link from "next/link";
import styles from "./signup.module.css";

export const metadata: Metadata = {
  title: "Sign up",
};

/**
 * Signup stub — auth methods remain OPEN (architecture A3).
 * Do not claim email / phone / OAuth as locked providers.
 */
export default function SignupPage() {
  return (
    <main className={`hb-main ${styles.main}`}>
      <div className="hb-gate-center">
        <div className="hb-gate-brand">
          Hey<em>Bar</em>
        </div>
        <h1 className="hb-h2">Create your account</h1>
        <p className="hb-muted" style={{ maxWidth: 300 }}>
          Sealed bottles delivered. Signup shell only — authentication methods
          are not locked yet.
        </p>

        <div className="hb-notice" role="note">
          Auth methods OPEN — stub only. Do not treat this screen as a live
          signup provider (email / phone / social undecided).
        </div>

        <div className={styles.methodList} aria-label="Signup methods (stub)">
          <div className={styles.method}>
            <span className={styles.methodLabel}>Method A</span>
            <span className="hb-caption">OPEN</span>
          </div>
          <div className={styles.method}>
            <span className={styles.methodLabel}>Method B</span>
            <span className="hb-caption">OPEN</span>
          </div>
        </div>

        <div className="hb-sticky-cta" style={{ marginTop: 20 }}>
          <Link href="/age-gate" className="hb-btn hb-btn--primary">
            Continue (stub)
          </Link>
          <Link href="/" className="hb-btn hb-btn--secondary">
            Browse without account
          </Link>
        </div>
        <p className="hb-caption" style={{ textAlign: "center" }}>
          No credentials are collected or stored by this stub.
        </p>
      </div>
    </main>
  );
}
