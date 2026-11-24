import type { Metadata } from "next";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { StepDots } from "@/components/flow/StepDots";
import { GuildPicker } from "./GuildPicker";

export const metadata: Metadata = {
  title: "Choose a Guild",
};

export default function OnboardingGuildPage() {
  return (
    <>
      <FlowHeader title="Choose a Guild" backHref="/onboarding/membership" />
      <main className="hb-main" style={{ gap: 8 }}>
        <StepDots total={5} current={4} />
        <p className="hb-caption">Step 4 of 5 · Single-select · eight Guilds</p>
        <GuildPicker />
      </main>
    </>
  );
}
