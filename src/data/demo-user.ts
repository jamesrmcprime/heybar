/**
 * Display stub for Account / Profile / Guild shells.
 * XP is config-demo only — no earn/debit logic.
 * Bottle Tops balances are derived from the append-only ledger
 * (`src/data/bottle-tops.ts`); blueTops/goldTops mirror that fixture.
 */

import { GUILDS } from "./guilds";
import { MEMBERSHIP_TIERS } from "./memberships";
import { rankForPoints } from "./ranks";

/** Stable demo user id for ledger rows. */
export const DEMO_USER_ID = "user-sam";

export const DEMO_USER = {
  id: DEMO_USER_ID,
  firstName: "Sam",
  lastName: "Lady",
  initials: "SL",
  mobileMasked: "+27 ·········",
  emailMasked: "sam@······.za",
  dobLabel: "Verified 18+",
  city: "Johannesburg",
  savedAddressCount: 2,
  membershipId: "top-shelf",
  guildId: "gin",
  /** Display XP within configured ranks (≤1000). */
  xp: 186,
  /** Must match derived ledger balances (no free-edit). */
  blueTops: 120,
  goldTops: 8,
} as const;

export function demoMembership() {
  return MEMBERSHIP_TIERS.find((t) => t.id === DEMO_USER.membershipId)!;
}

export function demoGuild() {
  return GUILDS.find((g) => g.id === DEMO_USER.guildId)!;
}

export function demoRank() {
  return rankForPoints(DEMO_USER.xp);
}
