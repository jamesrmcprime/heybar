import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/drinker/TopBar";
import { RewardBadge } from "@/components/rewards/RewardBadge";
import { demoBottleTopBalances } from "@/data/bottle-tops";
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
  const tops = demoBottleTopBalances();
  const ginRewards = rewardsForGuild(guild.id);
  const progressPct = Math.min(
    100,
    Math.round((DEMO_USER.xp / rank.maxPoints) * 100),
  );

  return (
    <>
      <TopBar title="Profile" action="settings" />
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
            <span className="hb-caption">Guild path</span>
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
        </section>

        <section className={styles.panel}>
          <div className="hb-section-label">
            <span style={{ fontWeight: 700, fontSize: 13 }}>Bottle Tops</span>
          </div>
          <div className={styles.tops}>
            <div className={`${styles.topBox} ${styles.blue}`}>
              <div className="hb-caption">Blue</div>
              <div className={styles.n}>{tops.blue}</div>
            </div>
            <div className={`${styles.topBox} ${styles.gold}`}>
              <div className="hb-caption">Gold</div>
              <div className={styles.n}>{tops.gold}</div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
