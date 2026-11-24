import type { Metadata } from "next";
import Link from "next/link";
import { StackHeader } from "@/components/drinker/StackHeader";
import { GuildBadge } from "@/components/flow/GuildBadge";
import { RewardBadge } from "@/components/rewards/RewardBadge";
import { GUILDS } from "@/data/guilds";
import { DEMO_USER } from "@/data/demo-user";
import { demoRewardState, rewardsForGuild } from "@/data/rewards";
import styles from "./rewards.module.css";

export const metadata: Metadata = {
  title: "Rewards",
};

type PageProps = {
  searchParams: Promise<{ guild?: string }>;
};

/**
 * Rewards list — XP/Tops table from seed config.
 * No claim / debit / discount invention.
 */
export default async function RewardsListPage({ searchParams }: PageProps) {
  const { guild: guildParam } = await searchParams;
  const guildId =
    GUILDS.find((g) => g.id === guildParam)?.id ?? DEMO_USER.guildId;
  const guild = GUILDS.find((g) => g.id === guildId)!;
  const rewards = rewardsForGuild(guild.id);

  return (
    <>
      <StackHeader title="Rewards" backHref={`/guild/${guild.id}`} />
      <main className={`hb-main ${styles.main}`}>
        <div className={styles.header}>
          <GuildBadge accent={guild.accent} />
          <div>
            <div className={styles.guildName}>{guild.name}</div>
            <div className="hb-caption">
              5 of 40 seed rewards · same XP/Tops table all Guilds
            </div>
          </div>
        </div>

        {rewards.map((reward) => {
          const state = demoRewardState(reward);
          return (
            <Link
              key={reward.id}
              href={`/rewards/${reward.id}`}
              className={styles.row}
            >
              <RewardBadge
                code={reward.code}
                level={reward.level}
                state={state}
              />
              <div className={styles.body}>
                <div className={styles.name}>{reward.name}</div>
                <div className={styles.nums}>
                  <span>Req XP {reward.xpRequired}</span>
                  <span>+{reward.xpRewarded} XP</span>
                  <span className={styles.b}>Blue {reward.blueTops}</span>
                  <span className={styles.g}>Gold {reward.goldTops}</span>
                </div>
                {reward.nameOpen ? (
                  <div className="hb-caption" style={{ marginTop: 2 }}>
                    Official L5 name · OPEN (await Airtable)
                  </div>
                ) : null}
              </div>
              <span className="hb-caption">→</span>
            </Link>
          );
        })}

        <p className="hb-caption">
          Discount % / Bottle Top debit rules · OPEN. Eligibility = backend.
        </p>
      </main>
    </>
  );
}
