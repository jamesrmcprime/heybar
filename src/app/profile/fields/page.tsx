import type { Metadata } from "next";
import Link from "next/link";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { ProfileFieldsForm } from "@/components/flow/ProfileFieldsForm";

export const metadata: Metadata = {
  title: "Profile fields",
};

/**
 * Profile fields shell — collect-only.
 * Outside onboarding sequence; same fields as Personal step.
 */
export default function ProfileFieldsPage() {
  return (
    <>
      <FlowHeader title="Profile fields" backHref="/profile" />
      <main className="hb-main">
        <p className="hb-caption">
          Contact &amp; age fields · collect-only shell · verification OPEN
        </p>
        <ProfileFieldsForm
          defaults={{
            firstName: "Sam",
            lastName: "Lady",
            mobile: "+27 ·········",
          }}
        />
        <div className="hb-sticky-cta">
          <Link href="/profile" className="hb-btn hb-btn--primary">
            Save (stub)
          </Link>
          <Link href="/age-gate" className="hb-btn hb-btn--secondary">
            Review age gate
          </Link>
        </div>
      </main>
    </>
  );
}
