/**
 * Global ranks from Airtable / developer report.
 * Cap display at Grand Reserve (700–1,000). XP >1000 behaviour is OPEN.
 */

export type Rank = {
  id: string;
  name: string;
  minPoints: number;
  maxPoints: number;
};

export const RANKS: Rank[] = [
  { id: "taster", name: "Taster", minPoints: 0, maxPoints: 99 },
  { id: "sipper", name: "Sipper", minPoints: 100, maxPoints: 299 },
  { id: "pour-pro", name: "Pour Pro", minPoints: 300, maxPoints: 499 },
  { id: "barrel-master", name: "Barrel Master", minPoints: 500, maxPoints: 699 },
  { id: "grand-reserve", name: "Grand Reserve", minPoints: 700, maxPoints: 1000 },
];

/** Highest configured band max — do not invent >1000 behaviour. */
export const RANK_POINTS_CAP = 1000;

/**
 * Map display XP into a configured rank band.
 * Values above the cap still resolve to Grand Reserve for UI only — no overflow rule.
 */
export function rankForPoints(points: number): Rank {
  const clamped = Math.min(Math.max(0, points), RANK_POINTS_CAP);
  for (const rank of RANKS) {
    if (clamped >= rank.minPoints && clamped <= rank.maxPoints) {
      return rank;
    }
  }
  return RANKS[RANKS.length - 1];
}
