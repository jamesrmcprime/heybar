/**
 * Supabase env helpers — placeholders only.
 *
 * Real URL / anon / service keys are owner-supplied when a project exists.
 * Never invent secrets. Never expose the service role to the browser client.
 */

export type SupabasePublicEnv = {
  url: string | null;
  anonKey: string | null;
  configured: boolean;
};

const PLACEHOLDER_MARKERS = [
  "your-project",
  "your-anon",
  "your-service",
  "placeholder",
  "REPLACE_ME",
  "changeme",
] as const;

function readTrimmed(name: string): string | null {
  const raw = process.env[name];
  if (raw == null) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function looksLikePlaceholder(value: string): boolean {
  const lower = value.toLowerCase();
  return PLACEHOLDER_MARKERS.some((m) => lower.includes(m.toLowerCase()));
}

/**
 * Public (browser-safe) Supabase config.
 * Uses NEXT_PUBLIC_* only — never the service role.
 */
export function getSupabasePublicEnv(): SupabasePublicEnv {
  const url = readTrimmed("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = readTrimmed("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const configured = Boolean(
    url &&
      anonKey &&
      !looksLikePlaceholder(url) &&
      !looksLikePlaceholder(anonKey),
  );
  return { url, anonKey, configured };
}

/**
 * Server-only service role — must never reach client bundles.
 * Returns null when unset / placeholder so stubs keep running locally.
 */
export function getSupabaseServiceRoleKey(): string | null {
  const key = readTrimmed("SUPABASE_SERVICE_ROLE_KEY");
  if (!key || looksLikePlaceholder(key)) return null;
  return key;
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicEnv().configured;
}
