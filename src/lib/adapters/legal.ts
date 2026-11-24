/**
 * Legal / T&Cs adapter — STUB
 *
 * OPEN: counsel-approved terms copy. Prototype / Glide text is reference only.
 * Age-verification method also OPEN — collect-only in the UI shell.
 */

export type TermsDocument = {
  id: string;
  title: string;
  status: "draft-placeholder";
  body: string;
};

export type AgeGateCollectPayload = {
  affirmed18Plus: boolean;
  /** DOB / ID collected by form shells — never asserted as verified here. */
  dateOfBirth?: string;
  idNumberMasked?: string;
};

export type AgeGateCollectResult = {
  status: "collected" | "declined";
  verificationProvider: "OPEN";
  verified: false;
  message: string;
};

export interface LegalAdapter {
  getTermsPlaceholder(): TermsDocument;
  collectAgeGate(payload: AgeGateCollectPayload): Promise<AgeGateCollectResult>;
}

export const PLACEHOLDER_TERMS: TermsDocument = {
  id: "heybar-terms-draft",
  title: "HeyBar Terms (DRAFT — NON-FINAL)",
  status: "draft-placeholder",
  body: [
    "This text is a stand-in for counsel-approved terms. It must not be treated as binding legal language.",
    "",
    "Topics to cover in the final document include account use, age eligibility for alcohol purchase, payments, shared orders, memberships, delivery, privacy, and dispute handling — as approved by the business owner and legal advisors.",
    "",
    "Prototype T&Cs from Glide are reference only.",
  ].join("\n"),
};

export const stubLegalAdapter: LegalAdapter = {
  getTermsPlaceholder() {
    return PLACEHOLDER_TERMS;
  },

  async collectAgeGate(payload) {
    if (!payload.affirmed18Plus) {
      return {
        status: "declined",
        verificationProvider: "OPEN",
        verified: false,
        message: "Age gate declined — no verification provider invoked (OPEN).",
      };
    }
    return {
      status: "collected",
      verificationProvider: "OPEN",
      verified: false,
      message:
        "Age affirmation collected only — verification method OPEN; not asserting verified status.",
    };
  },
};
