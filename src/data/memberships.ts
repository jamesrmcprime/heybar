/**
 * Membership tiers from the product brief (business-rules §3).
 * Product/delivery % applied by src/lib/membership-discount.ts and
 * src/lib/delivery-absorption.ts — never invent rates outside this table.
 */

export type MembershipTier = {
  id: string;
  name: string;
  feeZarPerMonth: number;
  productDiscountPct: number;
  deliveryDiscountPct: number;
};

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "straight-up",
    name: "Straight Up",
    feeZarPerMonth: 0,
    productDiscountPct: 0,
    deliveryDiscountPct: 0,
  },
  {
    id: "neat",
    name: "Neat",
    feeZarPerMonth: 150,
    productDiscountPct: 5,
    deliveryDiscountPct: 0,
  },
  {
    id: "the-reserve",
    name: "The Reserve",
    feeZarPerMonth: 200,
    productDiscountPct: 15,
    deliveryDiscountPct: 50,
  },
  {
    id: "top-shelf",
    name: "Top Shelf",
    feeZarPerMonth: 300,
    productDiscountPct: 25,
    deliveryDiscountPct: 100,
  },
];
