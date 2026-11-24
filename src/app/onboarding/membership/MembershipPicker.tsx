"use client";

import Link from "next/link";
import { useState } from "react";
import { MEMBERSHIP_TIERS } from "@/data/memberships";
import { formatZar } from "@/lib/format";

export function MembershipPicker() {
  const [selectedId, setSelectedId] = useState("the-reserve");
  const selected =
    MEMBERSHIP_TIERS.find((t) => t.id === selectedId) ?? MEMBERSHIP_TIERS[2];

  return (
    <>
      <div role="radiogroup" aria-label="Membership tier">
        {MEMBERSHIP_TIERS.map((tier) => {
          const checked = tier.id === selectedId;
          return (
            <button
              key={tier.id}
              type="button"
              role="radio"
              aria-checked={checked}
              className="hb-choice"
              onClick={() => setSelectedId(tier.id)}
            >
              <span className="hb-choice__radio" aria-hidden="true" />
              <span style={{ flex: 1 }}>
                <span className="hb-choice__name">{tier.name}</span>
                <span className="hb-choice__meta">
                  {tier.productDiscountPct}% product ·{" "}
                  {tier.deliveryDiscountPct}% delivery
                </span>
              </span>
              <span className="hb-choice__fee">
                {formatZar(tier.feeZarPerMonth)}/mo
              </span>
            </button>
          );
        })}
      </div>
      <p className="hb-caption">
        Fees &amp; discounts per brief only. Billing UX follows backend —
        payment adapter stub (provider OPEN).
      </p>
      <div className="hb-sticky-cta">
        <Link href="/onboarding/guild" className="hb-btn hb-btn--primary">
          Continue with {selected.name}
        </Link>
      </div>
    </>
  );
}
