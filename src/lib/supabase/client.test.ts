/**
 * Unit tests for Supabase env + thin client stub — no live project.
 */

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { stubAuthAdapter } from "@/lib/adapters/auth";
import {
  createSupabaseClient,
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
  isSupabaseConfigured,
  supabaseClientMode,
} from "./index";

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> =
  {};

function stashEnv() {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  restoreEnv();
});

describe("Supabase env helpers", () => {
  it("treats missing / placeholder env as not configured", () => {
    stashEnv();
    assert.equal(isSupabaseConfigured(), false);
    assert.deepEqual(getSupabasePublicEnv(), {
      url: null,
      anonKey: null,
      configured: false,
    });
    assert.equal(getSupabaseServiceRoleKey(), null);

    process.env.NEXT_PUBLIC_SUPABASE_URL =
      "https://your-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key";
    assert.equal(isSupabaseConfigured(), false);
    assert.equal(getSupabaseServiceRoleKey(), null);
  });

  it("marks real-looking public env as configured (still no network)", () => {
    stashEnv();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcd1234.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      "local-anon-not-a-real-jwt-for-tests";
    assert.equal(isSupabaseConfigured(), true);
    assert.equal(getSupabasePublicEnv().configured, true);
  });
});

describe("Supabase thin client stub", () => {
  it("stays in stub mode without credentials and never invents a session", async () => {
    stashEnv();
    assert.equal(supabaseClientMode(), "stub");
    const client = createSupabaseClient();
    assert.equal(client.mode, "stub");
    const session = await client.getSession();
    assert.equal(session.status, "stub");
    assert.equal(session.userId, null);
    assert.equal(session.accessToken, null);
  });

  it("signals ready_for_real_client when public env is filled", async () => {
    stashEnv();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcd1234.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "local-anon-test-key";
    const client = createSupabaseClient();
    assert.equal(client.mode, "ready_for_real_client");
    // Still stub session until @supabase/supabase-js is wired
    const session = await client.getSession();
    assert.equal(session.status, "stub");
    const signup = await client.authSignupStub("qa");
    assert.equal(signup.status, "stub");
    assert.match(signup.message, /wire @supabase\/supabase-js/i);
  });
});

describe("Auth adapter ↔ Supabase stub seam", () => {
  it("signupStub delegates through the thin client without a session", async () => {
    stashEnv();
    const result = await stubAuthAdapter.signupStub({
      displayHint: "shell",
    });
    assert.equal(result.status, "stub");
    assert.equal(result.method, "OPEN");
    assert.equal(result.sessionId, null);
    assert.match(result.message, /OPEN/i);
  });
});
