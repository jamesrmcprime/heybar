/**
 * Smoke tests for Supabase SQL migrations — no live project required.
 * Parses migration files from disk and asserts core tables / RLS markers.
 */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

const EXPECTED_TABLES = [
  "membership_tiers",
  "guilds",
  "profiles",
  "customer_addresses",
  "bottles",
  "inventory_reservations",
  "orders",
  "order_participants",
  "order_line_items",
  "delivery_shipments",
  "delivery_events",
  "bottle_tops_ledger",
  "friend_relations",
] as const;

function loadMigrations(): { name: string; sql: string }[] {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  return files.map((name) => ({
    name,
    sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
  }));
}

describe("Supabase migrations (parse / smoke)", () => {
  it("ships ordered .sql migrations under supabase/migrations", () => {
    const migrations = loadMigrations();
    assert.ok(migrations.length >= 2, "expected schema + RLS migrations");
    assert.match(migrations[0]!.name, /^\d+_/);
    assert.ok(
      migrations.every((m) => m.sql.trim().length > 0),
      "migrations must be non-empty",
    );
  });

  it("defines core tables matching app models", () => {
    const combined = loadMigrations()
      .map((m) => m.sql)
      .join("\n");
    for (const table of EXPECTED_TABLES) {
      assert.match(
        combined,
        new RegExp(`create table if not exists public\\.${table}\\b`, "i"),
        `missing table ${table}`,
      );
    }
  });

  it("sketches RLS enablement and owner policies (no service-role in client)", () => {
    const combined = loadMigrations()
      .map((m) => m.sql)
      .join("\n");
    assert.match(combined, /enable row level security/i);
    assert.match(combined, /profiles_select_own/);
    assert.match(combined, /bottle_tops_ledger_select_own/);
    assert.match(combined, /orders_select_participant/);
    // Ledger stays append-only for customers
    assert.doesNotMatch(
      combined,
      /create policy bottle_tops_ledger_update/i,
    );
    assert.doesNotMatch(
      combined,
      /create policy bottle_tops_ledger_delete/i,
    );
    // Migrations must not embed real credentials
    assert.doesNotMatch(combined, /eyJ[A-Za-z0-9_-]{20,}/);
    assert.doesNotMatch(combined, /service_role\s*=\s*['"][^'"]+['"]/i);
  });

  it("keeps Tops earn/redeem and XP>1000 out of schema invents", () => {
    const combined = loadMigrations()
      .map((m) => m.sql)
      .join("\n")
      .toLowerCase();
    assert.match(combined, /earn\/redeem/);
    assert.match(combined, /open/);
    assert.doesNotMatch(combined, /earn_rate|redeem_rate|conversion_rate/);
  });
});
