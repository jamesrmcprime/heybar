import type { Metadata } from "next";
import Link from "next/link";
import styles from "./age-gate.module.css";

export const metadata: Metadata = {
  title: "Age gate",
};

/**
 * Age gate — collect affirmation only.
 * Verification provider remains OPEN; do not assert verified status.
 */
export default function AgeGatePage() {
  return (
    <main className={`hb-main ${styles.main}`}>
      <div className="hb-gate-center">
        <div className="hb-gate-brand">
          Hey<em>Bar</em>
        </div>
        <h1 className="hb-h2">Are you 18 or older?</h1>
        <p className="hb-muted" style={{ maxWidth: 300 }}>
          HeyBar sells sealed alcohol in South Africa. You must be of legal
          drinking age to continue.
        </p>
        <div className="hb-notice hb-notice--danger" role="note">
          Age verification is required for alcohol sales. Misrepresentation may
          result in account closure. Verification method OPEN — this screen
          collects affirmation only.
        </div>
        <div className="hb-sticky-cta" style={{ marginTop: 28 }}>
          <Link href="/onboarding/personal" className="hb-btn hb-btn--primary">
            Yes — I am 18+
          </Link>
          <Link href="/" className="hb-btn hb-btn--secondary">
            No — exit
          </Link>
        </div>
        <p className="hb-caption" style={{ textAlign: "center", marginTop: 8 }}>
          Drink responsibly. Please have valid ID ready.
        </p>
      </div>
    </main>
  );
}
