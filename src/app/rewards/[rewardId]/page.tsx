import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StackHeader } from "@/components/drinker/StackHeader";
import { RewardBadge } from "@/components/rewards/RewardBadge";
import { GUILDS } from "@/data/guilds";
import {
  allRewards,
  demoRewardState,
  getReward,
} from "@/data/rewards";
import styles from "./detail.module.css";

type PageProps = {
  params: Promise<{ rewardId: string }>;
};

export function generateStaticParams() {
  return allRewards().map((r) => ({ rewardId: r.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { rewardId } = await params;
  const reward = getReward(rewardId);
  return { title: reward ? reward.name : "Reward" };
}

/**
 * Reward detail — seed numbers only.
 * Claim CTA is a disabled shell; eligibility / debit = OPEN / backend.
 */
export default async function RewardDetailPage({ params }: PageProps) {
  const { rewardId } = await params;
  const reward = getReward(rewardId);
  if (!reward) notFound();

  const guild = GUILDS.find((g) => g.id === reward.guildId)!;
  const state = demoRewardState(reward);
  const discountLabel =
    reward.discountPct == null
      ? reward.level === 3
        ? "OPEN / blank at L3"
        : "OPEN"
      : `${reward.discountPct}%`;

  return (
    <>
      <StackHeader title="Reward" backHref={`/rewards?guild=${guild.id}`} />
      <main className={`hb-main ${styles.main}`}>
        <div className={styles.hero}>
          <RewardBadge
            code={reward.code}
            level={reward.level}
            state={state}
            size="xl"
          />
          <h2 className="hb-h2" style={{ fontSize: 22 }}>
            {reward.name}
          </h2>
          <div className="hb-caption">
            {guild.name} · Level {reward.level}
            {reward.nameOpen ? " · name OPEN" : ""}
          </div>
        </div>

        <section className={styles.panel}>
          <div className={styles.kv}>
            <span>XP required</span>
            <span className={styles.v}>{reward.xpRequired}</span>
          </div>
          <div className={styles.kv}>
            <span>XP rewarded</span>
            <span className={styles.v}>+{reward.xpRewarded}</span>
          </div>
          <div className={styles.kv}>
            <span>Blue Bottle Tops</span>
            <span className={`${styles.v} ${styles.b}`}>{reward.blueTops}</span>
          </div>
          <div className={styles.kv}>
            <span>Gold Bottle Tops</span>
            <span className={`${styles.v} ${styles.g}`}>{reward.goldTops}</span>
          </div>
          <div className={styles.kv}>
            <span>Discount %</span>
            <span className={styles.v}>{discountLabel}</span>
          </div>
        </section>

        <div className="hb-notice">
          Claim only when backend reports eligible. Bottle Top debit (alt vs
          cumulative) · OPEN. No invented earn rates.
        </div>

        <div className={styles.cta}>
          <button
            type="button"
            className="hb-btn hb-btn--primary"
            disabled
            aria-disabled="true"
            title="Eligibility enforced by backend — claim not wired"
          >
            Claim reward
          </button>
          <p className="hb-caption" style={{ textAlign: "center" }}>
            Claim disabled until backend eligibility · duplicates blocked
            server-side
          </p>
        </div>
      </main>
    </>
  );
}
