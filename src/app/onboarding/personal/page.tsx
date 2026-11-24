import type { Metadata } from "next";
import Link from "next/link";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { ProfileFieldsForm } from "@/components/flow/ProfileFieldsForm";
import { StepDots } from "@/components/flow/StepDots";

export const metadata: Metadata = {
  title: "Your details",
};

export default function OnboardingPersonalPage() {
  return (
    <>
      <FlowHeader title="Your details" backHref="/age-gate" />
      <main className="hb-main">
        <StepDots total={5} current={1} />
        <p className="hb-caption">Step 1 of 5 · Personal information</p>
        <ProfileFieldsForm
          defaults={{
            firstName: "Sam",
            lastName: "Lady",
            mobile: "+27 ·········",
          }}
        />
        <div className="hb-sticky-cta">
          <Link href="/onboarding/address" className="hb-btn hb-btn--primary">
            Continue
          </Link>
        </div>
      </main>
    </>
  );
}
