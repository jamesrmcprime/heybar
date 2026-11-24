/**
 * Rewards seed — config display only.
 * Level XP/Tops table is identical across all 8 Guilds.
 * No earn / claim / debit / discount invention.
 */

import { GUILDS, type Guild } from "./guilds";

export type RewardLevel = 1 | 2 | 3 | 4 | 5;

export type LevelProgression = {
  level: RewardLevel;
  xpRequired: number;
  xpRewarded: number;
  blueTops: number;
  goldTops: number;
  /** Discount % when known from Airtable; null = blank / OPEN */
  discountPct: number | null;
};

/** Identical progression table for every Guild (rewards-seed.md). */
export const LEVEL_PROGRESSION: LevelProgression[] = [
  { level: 1, xpRequired: 50, xpRewarded: 10, blueTops: 50, goldTops: 5, discountPct: null },
  { level: 2, xpRequired: 150, xpRewarded: 20, blueTops: 100, goldTops: 10, discountPct: null },
  { level: 3, xpRequired: 300, xpRewarded: 30, blueTops: 150, goldTops: 15, discountPct: null },
  { level: 4, xpRequired: 500, xpRewarded: 40, blueTops: 200, goldTops: 20, discountPct: null },
  { level: 5, xpRequired: 750, xpRewarded: 50, blueTops: 250, goldTops: 25, discountPct: null },
];

export type RewardState = "earned" | "active" | "locked";

export type Reward = {
  id: string;
  guildId: string;
  level: RewardLevel;
  name: string;
  /** Short badge mark for stand-in art */
  code: string;
  /** Official name pending Airtable (Gin L5) */
  nameOpen?: boolean;
  xpRequired: number;
  xpRewarded: number;
  blueTops: number;
  goldTops: number;
  discountPct: number | null;
};

/** Gin Connoisseurs names from Glide / James (rewards-seed.md). */
const GIN_NAMES: Record<
  RewardLevel,
  { name: string; code: string; nameOpen?: boolean }
> = {
  1: { name: "Botanical Beginner", code: "BB" },
  2: { name: "Citrus Crafter", code: "CC" },
  3: { name: "Herb Hero", code: "HH" },
  4: { name: "Juniper Genius", code: "JG" },
  5: { name: "Gin Level 5", code: "G5", nameOpen: true },
};

function rewardNameForGuild(
  guild: Guild,
  level: RewardLevel,
): { name: string; code: string; nameOpen?: boolean } {
  if (guild.id === "gin") {
    return GIN_NAMES[level];
  }
  // Other Guilds: focus + Level N only — no invented cute names.
  return {
    name: `${guild.focus} Level ${level}`,
    code: `${guild.focus.charAt(0).toUpperCase()}${level}`,
  };
}

export function buildReward(guild: Guild, level: RewardLevel): Reward {
  const prog = LEVEL_PROGRESSION[level - 1];
  const label = rewardNameForGuild(guild, level);
  return {
    id: `${guild.id}-l${level}`,
    guildId: guild.id,
    level,
    name: label.name,
    code: label.code,
    nameOpen: label.nameOpen,
    xpRequired: prog.xpRequired,
    xpRewarded: prog.xpRewarded,
    blueTops: prog.blueTops,
    goldTops: prog.goldTops,
    discountPct: prog.discountPct,
  };
}

export function rewardsForGuild(guildId: string): Reward[] {
  const guild = GUILDS.find((g) => g.id === guildId);
  if (!guild) return [];
  return LEVEL_PROGRESSION.map((p) => buildReward(guild, p.level));
}

/** All 40 seed rewards (5 × 8 Guilds). */
export function allRewards(): Reward[] {
  return GUILDS.flatMap((g) => rewardsForGuild(g.id));
}

export function getReward(id: string): Reward | undefined {
  const match = /^([a-z]+)-l([1-5])$/.exec(id);
  if (!match) return undefined;
  const guild = GUILDS.find((g) => g.id === match[1]);
  if (!guild) return undefined;
  return buildReward(guild, Number(match[2]) as RewardLevel);
}

/**
 * Display-only badge state for the demo profile (Gin path).
 * Not eligibility / claim logic — backend owns that.
 */
export function demoRewardState(reward: Reward): RewardState {
  if (reward.guildId !== "gin") return "locked";
  if (reward.level <= 2) return "earned";
  if (reward.level === 3) return "active";
  return "locked";
}
