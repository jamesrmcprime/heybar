import type { Metadata } from "next";
import Link from "next/link";
import { StackHeader } from "@/components/drinker/StackHeader";
import { DEMO_USER, demoGuild, demoMembership } from "@/data/demo-user";
import styles from "./account.module.css";

export const metadata: Metadata = {
  title: "Account",
};

/**
 * Account shell — contact / security / membership entry.
 * Config display only; auth methods & sign-out remain stubs.
 */
export default function AccountPage() {
  const membership = demoMembership();
  const guild = demoGuild();

  return (
    <>
      <StackHeader title="Account" backHref="/profile" />
      <main className={`hb-main ${styles.main}`}>
        <p className="hb-caption">From Profile · contact &amp; security fields</p>

        <section className={styles.panel}>
          <div className={styles.kv}>
            <span>Name</span>
            <span className={styles.v}>
              {DEMO_USER.firstName} {DEMO_USER.lastName}
            </span>
          </div>
          <div className={styles.kv}>
            <span>Mobile</span>
            <span className={styles.v}>{DEMO_USER.mobileMasked}</span>
          </div>
          <div className={styles.kv}>
            <span>Email</span>
            <span className={styles.v}>{DEMO_USER.emailMasked}</span>
          </div>
          <div className={styles.kv}>
            <span>Date of birth</span>
            <span className={styles.v}>{DEMO_USER.dobLabel}</span>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.kv}>
            <span>Default address</span>
            <Link href="/onboarding/address" className={styles.v}>
              {DEMO_USER.city} →
            </Link>
          </div>
          <div className={styles.kv}>
            <span>Saved addresses</span>
            <span className={styles.v}>{DEMO_USER.savedAddressCount} →</span>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.kv}>
            <span>Membership</span>
            <Link href="/onboarding/membership" className={styles.v}>
              {membership.name} →
            </Link>
          </div>
          <div className={styles.kv}>
            <span>Guild</span>
            <Link href={`/guild/${guild.id}`} className={styles.v}>
              {guild.name} →
            </Link>
          </div>
          <div className={styles.kv}>
            <span>Password / sign-in</span>
            <Link href="/auth/signup" className={styles.v}>
              Manage →
            </Link>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.kv}>
            <span>Privacy &amp; data</span>
            <span className={styles.v}>→</span>
          </div>
          <div className={styles.kv}>
            <span>Sign out</span>
            <span className={`${styles.v} ${styles.danger}`}>Stub →</span>
          </div>
        </section>

        <p className="hb-caption">
          Auth methods OPEN · age verification method OPEN · no live sign-out
        </p>
      </main>
    </>
  );
}
