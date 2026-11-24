import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StackHeader } from "@/components/drinker/StackHeader";
import { GuildBadge } from "@/components/flow/GuildBadge";
import { RewardBadge } from "@/components/rewards/RewardBadge";
import { demoBottleTopBalances } from "@/data/bottle-tops";
import { GUILDS } from "@/data/guilds";
import { DEMO_USER, demoRank } from "@/data/demo-user";
import { RANKS } from "@/data/ranks";
import { demoRewardState, rewardsForGuild } from "@/data/rewards";
import styles from "./guild.module.css";

type PageProps = {
  params: Promise<{ guildId: string }>;
};

export async function generateStaticParams() {
  return GUILDS.map((g) => ({ guildId: g.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { guildId } = await params;
  const guild = GUILDS.find((g) => g.id === guildId);
  return { title: guild ? guild.name : "Guild" };
}

/**
 * Guild detail — ranks ≤1000, Bottle Tops balances, rewards preview.
 * Config display only; no XP>1000 rule; no Tops debit.
 */
export default async function GuildDetailPage({ params }: PageProps) {
  const { guildId } = await params;
  const guild = GUILDS.find((g) => g.id === guildId);
  if (!guild) notFound();

  const isDemoGuild = guild.id === DEMO_USER.guildId;
  const rank = isDemoGuild ? demoRank() : null;
  const xp = isDemoGuild ? DEMO_USER.xp : null;
  const tops = isDemoGuild ? demoBottleTopBalances() : null;
  const progressPct =
    rank && xp != null
      ? Math.min(100, Math.round((xp / rank.maxPoints) * 100))
      : 0;
  const rewards = rewardsForGuild(guild.id);

  return (
    <>
      <StackHeader title="Guild" backHref="/profile" />
      <main className={`hb-main ${styles.main}`}>
        <section className={styles.panel}>
          <div className={styles.hero}>
            <GuildBadge accent={guild.accent} size="lg" />
            <div>
              <div className={styles.heroName}>{guild.name}</div>
              <div className="hb-caption">Primary focus · {guild.focus}</div>
            </div>
          </div>

          {isDemoGuild && rank && xp != null ? (
            <>
              <div className={styles.stats}>
                <div>
                  <div className="hb-caption">Rank</div>
                  <div className="hb-price" style={{ fontSize: 16 }}>
                    {rank.name}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="hb-caption">XP</div>
                  <div className="hb-price" style={{ fontSize: 16 }}>
                    {xp} / {rank.maxPoints}
                  </div>
                </div>
              </div>
              <div className={styles.progress} aria-hidden="true">
                <i style={{ width: `${progressPct}%` }} />
              </div>
            </>
          ) : (
            <p className="hb-caption">
              Join this Guild to see rank &amp; XP (display stub).
            </p>
          )}

          <div className={styles.rankList}>
            {RANKS.map((r) => {
              const here = isDemoGuild && rank?.id === r.id;
              return (
                <div
                  key={r.id}
                  className={`${styles.rankRow}${here ? ` ${styles.here}` : ""}`}
                >
                  <span>
                    {r.name}
                    {here ? " ← you" : ""}
                  </span>
                  <span>
                    {r.minPoints}–{r.maxPoints.toLocaleString("en-ZA")}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="hb-caption" style={{ marginTop: 6 }}>
            XP &gt; 1,000 · OPEN. Rank pts vs reward XP · OPEN.
          </p>
        </section>

        <section className={styles.panel}>
          <div className="hb-section-label" style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Bottle Tops</span>
            {isDemoGuild ? (
              <Link href="/profile/bottle-tops" className="hb-caption">
                Ledger →
              </Link>
            ) : null}
          </div>
          <div className={styles.tops}>
            <div className={`${styles.topBox} ${styles.blue}`}>
              <div className="hb-caption">Blue</div>
              <div className={styles.n}>{tops ? tops.blue : "—"}</div>
            </div>
            <div className={`${styles.topBox} ${styles.gold}`}>
              <div className="hb-caption">Gold</div>
              <div className={styles.n}>{tops ? tops.gold : "—"}</div>
            </div>
          </div>
          <p className="hb-caption" style={{ marginTop: 6 }}>
            Derived balances · earn / debit · OPEN
          </p>
        </section>

        <section className={styles.panel}>
          <div className="hb-section-label" style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Rewards preview</span>
            <Link href={`/rewards?guild=${guild.id}`} className="hb-caption">
              See all →
            </Link>
          </div>
          {rewards.map((reward) => {
            const state = demoRewardState(reward);
            return (
              <Link
                key={reward.id}
                href={`/rewards/${reward.id}`}
                className={styles.rew}
              >
                <RewardBadge
                  code={reward.code}
                  level={reward.level}
                  state={state}
                />
                <div>
                  <div className={styles.nm}>{reward.name}</div>
                  <div className={styles.meta}>
                    XP {reward.xpRequired} · B{reward.blueTops} · G
                    {reward.goldTops}
                    {reward.nameOpen ? " · name OPEN" : ""}
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      </main>
    </>
  );
}
