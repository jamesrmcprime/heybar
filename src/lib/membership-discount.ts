/**
 * Membership product discount apply — brief table only.
 * Rules: business-rules.md §3 / heybar-master-brief §4.
 *
 * Solo + shared: each participant's product % applies to their own
 * sealed-bottle lines only. Delivery discounts stay in
 * delivery-absorption.ts. Reward discounts are NOT stacked here
 * (OPEN — business-rules §3.2; do not invent).
 *
 * Rates are never invented: lookup from MEMBERSHIP_TIERS only
 * (Straight Up 0% / Neat 5% / The Reserve 15% / Top Shelf 25%).
 *
 * Cent identity: listSubtotalZar === discountZar + productSubtotalZar.
 */

import { getBottle } from "@/data/bottles";
import { MEMBERSHIP_TIERS, type MembershipTier } from "@/data/memberships";

export type DiscountLineInput = {
  bottleId: string;
  qty: number;
  /** List unit price ZAR from sealed catalogue */
  listUnitZar: number;
};

export type DiscountedLine = {
  bottleId: string;
  qty: number;
  listUnitZar: number;
  lineListZar: number;
  lineDiscountZar: number;
  linePayableZar: number;
};

export type ProductDiscountResult = {
  membershipId: string;
  membershipName: string;
  productDiscountPct: number;
  lines: DiscountedLine[];
  listSubtotalZar: number;
  discountZar: number;
  productSubtotalZar: number;
};

export type ProductDiscountOk = { ok: true } & ProductDiscountResult;

export type ProductDiscountErr = {
  ok: false;
  reason:
    | "unknown_membership"
    | "not_sealed_catalogue"
    | "invalid_qty"
    | "invalid_price"
    | "empty_participants";
  bottleId?: string;
};

export type ProductDiscountApplyResult = ProductDiscountOk | ProductDiscountErr;

export type SharedParticipantDiscountInput = {
  id: string;
  membershipId: string;
  lines: DiscountLineInput[];
};

export type SharedParticipantDiscount = ProductDiscountResult & {
  id: string;
};

export type SharedProductDiscountResult = {
  participants: SharedParticipantDiscount[];
  listSubtotalZar: number;
  discountZar: number;
  productSubtotalZar: number;
};

export type SharedProductDiscountOk = {
  ok: true;
  result: SharedProductDiscountResult;
};

export type SharedProductDiscountApplyResult =
  | SharedProductDiscountOk
  | ProductDiscountErr;

/** Round to cents (ZAR) — same helper contract as delivery-absorption. */
export function roundZar(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function centsToZar(cents: number): number {
  return cents / 100;
}

function zarToCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Brief-table tier lookup — undefined if id is not one of the four. */
export function membershipTierById(
  membershipId: string,
): MembershipTier | undefined {
  return MEMBERSHIP_TIERS.find((t) => t.id === membershipId);
}

/**
 * Product discount % from the brief table only.
 * Returns undefined for unknown ids — never invents a rate.
 */
export function productDiscountPctForMembership(
  membershipId: string,
): number | undefined {
  return membershipTierById(membershipId)?.productDiscountPct;
}

/**
 * Apply one membership's product discount to sealed-bottle lines.
 * Used for solo carts and for one shared-order participant's own lines.
 */
export function applyMembershipProductDiscount(
  membershipId: string,
  lines: DiscountLineInput[],
): ProductDiscountApplyResult {
  const tier = membershipTierById(membershipId);
  if (!tier) {
    return { ok: false, reason: "unknown_membership" };
  }

  const discountedLines: DiscountedLine[] = [];
  let listCentsTotal = 0;
  let discountCentsTotal = 0;

  // Empty cart is valid (solo or shared participant before bottles added).
  if (lines.length === 0) {
    return {
      ok: true,
      membershipId: tier.id,
      membershipName: tier.name,
      productDiscountPct: tier.productDiscountPct,
      lines: [],
      listSubtotalZar: 0,
      discountZar: 0,
      productSubtotalZar: 0,
    };
  }

  for (const line of lines) {
    if (!Number.isInteger(line.qty) || line.qty < 1) {
      return {
        ok: false,
        reason: "invalid_qty",
        bottleId: line.bottleId,
      };
    }
    if (!Number.isFinite(line.listUnitZar) || line.listUnitZar < 0) {
      return {
        ok: false,
        reason: "invalid_price",
        bottleId: line.bottleId,
      };
    }
    // Sealed bottles only — cocktails / custom drinks never in seed.
    if (!getBottle(line.bottleId)) {
      return {
        ok: false,
        reason: "not_sealed_catalogue",
        bottleId: line.bottleId,
      };
    }

    const lineListCents = zarToCents(line.listUnitZar) * line.qty;
    const lineDiscountCents = Math.round(
      (lineListCents * tier.productDiscountPct) / 100,
    );
    const linePayableCents = lineListCents - lineDiscountCents;

    listCentsTotal += lineListCents;
    discountCentsTotal += lineDiscountCents;

    discountedLines.push({
      bottleId: line.bottleId,
      qty: line.qty,
      listUnitZar: roundZar(line.listUnitZar),
      lineListZar: centsToZar(lineListCents),
      lineDiscountZar: centsToZar(lineDiscountCents),
      linePayableZar: centsToZar(linePayableCents),
    });
  }

  const payableCentsTotal = listCentsTotal - discountCentsTotal;

  return {
    ok: true,
    membershipId: tier.id,
    membershipName: tier.name,
    productDiscountPct: tier.productDiscountPct,
    lines: discountedLines,
    listSubtotalZar: centsToZar(listCentsTotal),
    discountZar: centsToZar(discountCentsTotal),
    productSubtotalZar: centsToZar(payableCentsTotal),
  };
}

/**
 * Shared-order product discounts: each participant's brief-table % on
 * their own sealed lines only. No cross-participant stacking or redistribution.
 */
export function applySharedMembershipProductDiscounts(
  participants: SharedParticipantDiscountInput[],
): SharedProductDiscountApplyResult {
  if (participants.length === 0) {
    return { ok: false, reason: "empty_participants" };
  }

  const resolved: SharedParticipantDiscount[] = [];
  let listCentsTotal = 0;
  let discountCentsTotal = 0;

  for (const participant of participants) {
    const applied = applyMembershipProductDiscount(
      participant.membershipId,
      participant.lines,
    );
    if (!applied.ok) {
      return applied;
    }
    resolved.push({ id: participant.id, ...applied });
    listCentsTotal += zarToCents(applied.listSubtotalZar);
    discountCentsTotal += zarToCents(applied.discountZar);
  }

  return {
    ok: true,
    result: {
      participants: resolved,
      listSubtotalZar: centsToZar(listCentsTotal),
      discountZar: centsToZar(discountCentsTotal),
      productSubtotalZar: centsToZar(listCentsTotal - discountCentsTotal),
    },
  };
}
