/**
 * Display stub for Account / Profile / Guild shells.
 * Balances & XP are config-demo only — no earn/debit logic.
 */

import { GUILDS } from "./guilds";
import { MEMBERSHIP_TIERS } from "./memberships";
import { rankForPoints } from "./ranks";

export const DEMO_USER = {
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
