import type { Metadata } from "next";
import Link from "next/link";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { StepDots } from "@/components/flow/StepDots";

export const metadata: Metadata = {
  title: "Delivery address",
};

export default function OnboardingAddressPage() {
  return (
    <>
      <FlowHeader title="Delivery address" backHref="/onboarding/personal" />
      <main className="hb-main">
        <StepDots total={5} current={2} />
        <p className="hb-caption">Step 2 of 5 · Where we deliver sealed bottles</p>
        <div className="hb-map-stub" aria-hidden="true">
          Map / search stub · territory TBD
        </div>
        <div className="hb-field">
          <label htmlFor="hb-street">Street address</label>
          <input
            id="hb-street"
            name="street"
            type="text"
            autoComplete="street-address"
            placeholder="Start typing address"
          />
        </div>
        <div className="hb-field">
          <label htmlFor="hb-suburb">Suburb / city</label>
          <input
            id="hb-suburb"
            name="suburb"
            type="text"
            autoComplete="address-level2"
            placeholder="Johannesburg"
          />
        </div>
        <div className="hb-field">
          <label htmlFor="hb-notes">Delivery notes</label>
          <input
            id="hb-notes"
            name="notes"
            type="text"
            placeholder="Optional · gate code, etc."
          />
        </div>
        <p className="hb-caption">
          Exact delivery territory and pricing are not finalized — UI only
          (delivery adapter stub).
        </p>
        <div className="hb-sticky-cta">
          <Link
            href="/onboarding/membership"
            className="hb-btn hb-btn--primary"
          >
            Save &amp; continue
          </Link>
        </div>
      </main>
    </>
  );
}
