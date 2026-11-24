import type { Metadata } from "next";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { StepDots } from "@/components/flow/StepDots";
import { MembershipPicker } from "./MembershipPicker";

export const metadata: Metadata = {
  title: "Membership",
};

export default function OnboardingMembershipPage() {
  return (
    <>
      <FlowHeader title="Membership" backHref="/onboarding/address" />
      <main className="hb-main" style={{ gap: 6 }}>
        <StepDots total={5} current={3} />
        <p className="hb-caption">Step 3 of 5 · Four tiers from product brief (ZAR)</p>
        <MembershipPicker />
      </main>
    </>
  );
}
