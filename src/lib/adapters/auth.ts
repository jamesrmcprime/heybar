/**
 * Auth adapter — STUB
 *
 * OPEN (architecture A3): signup methods (email / phone / …).
 * Do not lock a provider or invent a live auth flow here.
 */

export type SignupMethod = "OPEN";

export type SignupStubRequest = {
  /** Opaque client shell payload — not persisted by this stub. */
  displayHint?: string;
};

export type SignupStubResult = {
  status: "stub";
  method: SignupMethod;
  sessionId: null;
  message: string;
};

export interface AuthAdapter {
  signupStub(req: SignupStubRequest): Promise<SignupStubResult>;
}

export const stubAuthAdapter: AuthAdapter = {
  async signupStub(req) {
    return {
      status: "stub",
      method: "OPEN",
      sessionId: null,
      message: `Auth adapter stub — signup methods OPEN. No session created${
        req.displayHint ? ` (${req.displayHint})` : ""
      }.`,
    };
  },
};
