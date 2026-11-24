import type { Metadata } from "next";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { StepDots } from "@/components/flow/StepDots";
import { stubLegalAdapter } from "@/lib/adapters/legal";
import { TermsAccept } from "./TermsAccept";

export const metadata: Metadata = {
  title: "Terms",
};

export default function OnboardingTermsPage() {
  const terms = stubLegalAdapter.getTermsPlaceholder();

  return (
    <>
      <FlowHeader title="Terms" backHref="/onboarding/guild" />
      <main className="hb-main">
        <StepDots total={5} current={5} />
        <p className="hb-caption">Step 5 of 5 · Acceptance</p>
        <TermsAccept terms={terms} />
      </main>
    </>
  );
}
