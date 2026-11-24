import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/drinker/TopBar";
import { RewardBadge } from "@/components/rewards/RewardBadge";
import {
  DEMO_USER,
  demoGuild,
  demoMembership,
  demoRank,
} from "@/data/demo-user";
import { demoRewardState, rewardsForGuild } from "@/data/rewards";
import { formatZar } from "@/lib/format";
import styles from "./profile.module.css";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  const membership = demoMembership();
  const guild = demoGuild();
  const rank = demoRank();
  const ginRewards = rewardsForGuild(guild.id);
  const progressPct = Math.min(
    100,
    Math.round((DEMO_USER.xp / rank.maxPoints) * 100),
  );

  return (
    <>
      <TopBar title="Profile" />
      <main className={`hb-main ${styles.main}`}>
        <div className={styles.hero}>
          <div className={styles.avatar}>{DEMO_USER.initials}</div>
          <div>
            <h2 className="hb-h3" style={{ fontSize: 16 }}>
              {DEMO_USER.firstName} {DEMO_USER.lastName}
            </h2>
            <div className="hb-caption">
              Verified 18+ · {DEMO_USER.city}
            </div>
            <div className={styles.chips}>
              <span className="hb-chip hb-chip--gold">{membership.name}</span>
              <span className="hb-chip hb-chip--amber">{guild.focus}</span>
            </div>
          </div>
        </div>

        <section className={styles.panel}>
          <div className="hb-section-label">
            <span style={{ fontWeight: 700, fontSize: 13 }}>
              {guild.focus} reward badges
            </span>
            <Link href={`/rewards?guild=${guild.id}`} className="hb-caption">
              See all →
            </Link>
          </div>
          <div className={styles.badgeRow}>
            {ginRewards.map((reward) => {
              const state = demoRewardState(reward);
              return (
                <Link
                  key={reward.id}
                  href={`/rewards/${reward.id}`}
                  className={styles.badgeCol}
                >
                  <RewardBadge
                    code={reward.code}
                    level={reward.level}
                    state={state}
                  />
                  <div className={styles.badgeCap}>{reward.name}</div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className={styles.panel}>
          <div className="hb-section-label">
            <span style={{ fontWeight: 700, fontSize: 13 }}>Membership</span>
            <span className="hb-caption">
              {formatZar(membership.feeZarPerMonth)} / mo
            </span>
          </div>
          <div className="hb-caption">
            {membership.productDiscountPct}% product ·{" "}
            {membership.deliveryDiscountPct}% delivery
          </div>
        </section>

        <section className={styles.panel}>
          <div className="hb-section-label">
            <span style={{ fontWeight: 700, fontSize: 13 }}>Guild</span>
            <Link href={`/guild/${guild.id}`} className="hb-chip hb-chip--amber">
              {guild.name}
            </Link>
          </div>
          <div className={styles.kv}>
            <span className="hb-muted">Rank</span>
            <span className="hb-price">{rank.name}</span>
          </div>
          <div className={styles.kv}>
            <span className="hb-muted">XP</span>
            <span className="hb-price">
              {DEMO_USER.xp} / {rank.maxPoints}
            </span>
          </div>
          <div className={styles.progress} aria-hidden="true">
            <i style={{ width: `${progressPct}%` }} />
          </div>
          <p className="hb-caption" style={{ marginTop: 6 }}>
            XP &gt; 1,000 · OPEN
          </p>
        </section>

        <section className={styles.panel}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
            Bottle Tops
          </div>
          <div className={styles.tops}>
            <div className={`${styles.topBox} ${styles.blue}`}>
              <div className="hb-caption">Blue</div>
              <div className={styles.n}>{DEMO_USER.blueTops}</div>
            </div>
            <div className={`${styles.topBox} ${styles.gold}`}>
              <div className="hb-caption">Gold</div>
              <div className={styles.n}>{DEMO_USER.goldTops}</div>
            </div>
          </div>
          <p className="hb-caption" style={{ marginTop: 8 }}>
            Earn/redeem rules OPEN — balances are display stubs only.
          </p>
        </section>

        <section className={styles.panel}>
          <div className="hb-section-label">
            <span style={{ fontWeight: 700, fontSize: 13 }}>Account &amp; shells</span>
            <span className="hb-caption">Day 2</span>
          </div>
          <div className={styles.kv}>
            <Link href="/account" className="hb-muted">
              Account
            </Link>
            <span className="hb-caption">Contact →</span>
          </div>
          <div className={styles.kv}>
            <Link href={`/guild/${guild.id}`} className="hb-muted">
              Guild detail
            </Link>
            <span className="hb-caption">Ranks · Tops →</span>
          </div>
          <div className={styles.kv}>
            <Link href={`/rewards?guild=${guild.id}`} className="hb-muted">
              Rewards
            </Link>
            <span className="hb-caption">List →</span>
          </div>
          <div className={styles.kv}>
            <Link href="/profile/fields" className="hb-muted">
              Profile fields
            </Link>
            <span className="hb-caption">Collect →</span>
          </div>
          <div className={styles.kv}>
            <Link href="/auth/signup" className="hb-muted">
              Sign up stub
            </Link>
            <span className="hb-caption">Methods OPEN →</span>
          </div>
          <div className={styles.kv}>
            <Link href="/onboarding/personal" className="hb-muted">
              Onboarding
            </Link>
            <span className="hb-caption">5 steps →</span>
          </div>
        </section>
      </main>
    </>
  );
}
