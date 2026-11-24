/**
 * Auth adapter — STUB
 *
 * OPEN (architecture A3): signup methods (email / phone / …).
 * Do not lock a provider or invent a live auth flow here.
 *
 * Swap seam (when James supplies a real Supabase project):
 * 1. Fill NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 *    (see `.env.example`). Never put SUPABASE_SERVICE_ROLE_KEY in the client.
 * 2. Install `@supabase/supabase-js` and replace `createSupabaseClient`
 *    stub bodies in `src/lib/supabase/client.ts` with createClient(...).
 * 3. Implement AuthAdapter.signupStub → real signUp / OTP against Supabase Auth
 *    (methods still OPEN until product locks them).
 * 4. Keep this module as the app-facing adapter so UI shells stay unchanged.
 */

import { createSupabaseClient } from "@/lib/supabase";

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
    // Delegates to the thin Supabase client stub so the Auth→Supabase
    // swap path is exercised without a live project.
    const client = createSupabaseClient();
    const fromClient = await client.authSignupStub(req.displayHint);
    return {
      status: "stub",
      method: "OPEN",
      sessionId: null,
      message: `${fromClient.message} Auth adapter signup methods OPEN. No session created.`,
    };
  },
};
