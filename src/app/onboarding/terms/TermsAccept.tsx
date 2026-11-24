"use client";

import Link from "next/link";
import { useState } from "react";
import type { TermsDocument } from "@/lib/adapters/legal";

type TermsAcceptProps = {
  terms: TermsDocument;
};

export function TermsAccept({ terms }: TermsAcceptProps) {
  const [accepted, setAccepted] = useState(true);

  return (
    <>
      <div className="hb-notice" role="note">
        Not final legal copy — placeholder / explanatory text only. Replace
        before live launch.
      </div>
      <div className="hb-legal-box">
        <strong style={{ color: "var(--hb-mist)" }}>{terms.title}</strong>
        {"\n\n"}
        {terms.body}
      </div>
      <button
        type="button"
        className="hb-check-row"
        aria-pressed={accepted}
        onClick={() => setAccepted((v) => !v)}
      >
        <span className="hb-check" data-on={accepted ? "true" : "false"}>
          {accepted ? "✓" : ""}
        </span>
        <span>
          I confirm I am 18+ and I accept the (non-final) terms for account
          setup.
        </span>
      </button>
      <div className="hb-sticky-cta">
        {accepted ? (
          <Link href="/" className="hb-btn hb-btn--primary">
            Create account
          </Link>
        ) : (
          <button
            type="button"
            className="hb-btn hb-btn--primary"
            disabled
            style={{ opacity: 0.45, cursor: "not-allowed" }}
          >
            Create account
          </button>
        )}
      </div>
    </>
  );
}
