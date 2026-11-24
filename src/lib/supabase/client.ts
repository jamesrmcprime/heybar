/**
 * Thin Supabase client stub.
 *
 * When NEXT_PUBLIC_SUPABASE_URL + anon key are real (not placeholders),
 * swap this module to `@supabase/supabase-js` createClient.
 * Until then: local stub — no network, no secrets invented.
 *
 * CRITICAL: Instantiation uses the anon key only. Service-role keys stay
 * server-side (API routes / migrations) and must never land in client code.
 */

import {
  getSupabasePublicEnv,
  isSupabaseConfigured,
  type SupabasePublicEnv,
} from "./env";

export type StubSupabaseSession = {
  userId: null;
  accessToken: null;
  status: "stub";
};

export type StubSupabaseClient = {
  mode: "stub" | "ready_for_real_client";
  env: SupabasePublicEnv;
  /**
   * Placeholder for future Auth session read.
   * Real path: supabase.auth.getSession() via @supabase/supabase-js.
   */
  getSession(): Promise<StubSupabaseSession>;
  /**
   * Placeholder for future Auth sign-up.
   * Real path: supabase.auth.signUp(...) once methods are chosen (OPEN).
   */
  authSignupStub(displayHint?: string): Promise<{
    status: "stub";
    message: string;
  }>;
};

/**
 * Build the browser/server public client.
 * Still a stub when credentials are missing or placeholders —
 * does not call createClient from @supabase/supabase-js yet.
 */
export function createSupabaseClient(): StubSupabaseClient {
  const env = getSupabasePublicEnv();
  const mode = env.configured ? "ready_for_real_client" : "stub";

  return {
    mode,
    env,
    async getSession() {
      // SWAP POINT → real Supabase Auth:
      //   const supabase = createClient(env.url!, env.anonKey!)
      //   const { data } = await supabase.auth.getSession()
      // Never pass SUPABASE_SERVICE_ROLE_KEY here.
      return { userId: null, accessToken: null, status: "stub" };
    },
    async authSignupStub(displayHint) {
      if (mode === "ready_for_real_client") {
        return {
          status: "stub",
          message:
            "Supabase env present — wire @supabase/supabase-js Auth here (signup methods still OPEN).",
        };
      }
      return {
        status: "stub",
        message: `Supabase client stub — no live project${
          displayHint ? ` (${displayHint})` : ""
        }.`,
      };
    },
  };
}

export function supabaseClientMode(): StubSupabaseClient["mode"] {
  return isSupabaseConfigured() ? "ready_for_real_client" : "stub";
}
