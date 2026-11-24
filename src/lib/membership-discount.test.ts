import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyMembershipProductDiscount,
  applySharedMembershipProductDiscounts,
  productDiscountPctForMembership,
  roundZar,
} from "./membership-discount";

describe("membership product discounts (brief table only)", () => {
  it("exposes only brief-table product rates", () => {
    assert.equal(productDiscountPctForMembership("straight-up"), 0);
    assert.equal(productDiscountPctForMembership("neat"), 5);
    assert.equal(productDiscountPctForMembership("the-reserve"), 15);
    assert.equal(productDiscountPctForMembership("top-shelf"), 25);
    assert.equal(productDiscountPctForMembership("invented-vip"), undefined);
  });

  it("solo Top Shelf 25% on sealed Absolut R20", () => {
    const result = applyMembershipProductDiscount("top-shelf", [
      { bottleId: "bottle-absolut", qty: 1, listUnitZar: 20 },
    ]);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.productDiscountPct, 25);
    assert.equal(result.listSubtotalZar, 20);
    assert.equal(result.discountZar, 5);
    assert.equal(result.productSubtotalZar, 15);
    assert.equal(
      roundZar(result.discountZar + result.productSubtotalZar),
      result.listSubtotalZar,
    );
  });

  it("solo Neat 5% rounds cents without inventing rates", () => {
    // Bombay Sapphire R32 × 5% = R1.60 off → R30.40
    const result = applyMembershipProductDiscount("neat", [
      { bottleId: "bottle-bombay-sapphire", qty: 1, listUnitZar: 32 },
    ]);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.productDiscountPct, 5);
    assert.equal(result.listSubtotalZar, 32);
    assert.equal(result.discountZar, 1.6);
    assert.equal(result.productSubtotalZar, 30.4);
  });

  it("solo Straight Up 0% leaves list intact", () => {
    const result = applyMembershipProductDiscount("straight-up", [
      { bottleId: "bottle-bacardi-superior", qty: 2, listUnitZar: 22 },
    ]);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.listSubtotalZar, 44);
    assert.equal(result.discountZar, 0);
    assert.equal(result.productSubtotalZar, 44);
  });

  it("rejects cocktails / non-sealed catalogue SKUs", () => {
    const result = applyMembershipProductDiscount("the-reserve", [
      { bottleId: "cocktail-custom-negroni", qty: 1, listUnitZar: 80 },
    ]);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.reason, "not_sealed_catalogue");
    assert.equal(result.bottleId, "cocktail-custom-negroni");
  });

  it("rejects unknown membership ids (no invented rates)", () => {
    const result = applyMembershipProductDiscount("gold-club", [
      { bottleId: "bottle-absolut", qty: 1, listUnitZar: 20 },
    ]);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.reason, "unknown_membership");
  });

  it("shared order: each participant's own brief % on own lines only", () => {
    // Friday night run product cast — sealed catalogue list prices.
    const shared = applySharedMembershipProductDiscounts([
      {
        id: "part-sam",
        membershipId: "top-shelf",
        lines: [
          { bottleId: "bottle-tanqueray", qty: 1, listUnitZar: 28 },
          { bottleId: "bottle-absolut", qty: 1, listUnitZar: 20 },
        ],
      },
      {
        id: "part-alex",
        membershipId: "straight-up",
        lines: [
          { bottleId: "bottle-bacardi-superior", qty: 1, listUnitZar: 22 },
        ],
      },
      {
        id: "part-dave",
        membershipId: "neat",
        lines: [
          { bottleId: "bottle-bombay-sapphire", qty: 1, listUnitZar: 32 },
        ],
      },
      {
        id: "part-riley",
        membershipId: "the-reserve",
        lines: [{ bottleId: "bottle-jameson", qty: 1, listUnitZar: 25 }],
      },
    ]);

    assert.equal(shared.ok, true);
    if (!shared.ok) return;

    const byId = Object.fromEntries(
      shared.result.participants.map((p) => [p.id, p]),
    );

    // Top Shelf 25% on R48 → R12 off → R36
    assert.equal(byId["part-sam"].listSubtotalZar, 48);
    assert.equal(byId["part-sam"].discountZar, 12);
    assert.equal(byId["part-sam"].productSubtotalZar, 36);

    // Straight Up 0% on R22
    assert.equal(byId["part-alex"].productSubtotalZar, 22);
    assert.equal(byId["part-alex"].discountZar, 0);

    // Neat 5% on R32 → R30.40
    assert.equal(byId["part-dave"].productSubtotalZar, 30.4);

    // The Reserve 15% on R25 → R3.75 off → R21.25
    assert.equal(byId["part-riley"].discountZar, 3.75);
    assert.equal(byId["part-riley"].productSubtotalZar, 21.25);

    // Aggregates keep cent identity; no cross-participant redistribution.
    assert.equal(
      roundZar(
        shared.result.discountZar + shared.result.productSubtotalZar,
      ),
      shared.result.listSubtotalZar,
    );
    assert.equal(shared.result.listSubtotalZar, 48 + 22 + 32 + 25);
    assert.equal(shared.result.discountZar, 12 + 0 + 1.6 + 3.75);
    assert.equal(shared.result.productSubtotalZar, 36 + 22 + 30.4 + 21.25);
  });

  it("does not apply reward discounts (OPEN — no stacking invented)", () => {
    // Same sealed line under The Reserve must match brief 15% only —
    // a hypothetical reward % is never an input to this module.
    const result = applyMembershipProductDiscount("the-reserve", [
      { bottleId: "bottle-jameson", qty: 1, listUnitZar: 25 },
    ]);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.productDiscountPct, 15);
    assert.equal(result.productSubtotalZar, 21.25);
  });
});
