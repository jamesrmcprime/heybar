#!/usr/bin/env node
/**
 * PWA installability smoke — works against localhost or any preview URL.
 *
 *   BASE_URL=http://127.0.0.1:3000 EXPECT_SW=1 npm run test:pwa-smoke
 *   BASE_URL=https://<preview>.vercel.app EXPECT_SW=1 npm run test:pwa-smoke
 *
 * Checks: web manifest fields, icon URLs, HTML manifest link, and (when
 * EXPECT_SW=1) a reachable service worker script. Does not assert a real
 * beforeinstallprompt event (browser/OS gated).
 */

const base = (process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const expectSw = process.env.EXPECT_SW === "1" || process.env.EXPECT_SW === "true";

/** @param {string} path */
function url(path) {
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** @param {string} label */
function fail(label, detail) {
  console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  process.exitCode = 1;
}

/** @param {string} label */
function ok(label, detail) {
  console.log(`OK    ${label}${detail ? ` — ${detail}` : ""}`);
}

async function fetchOk(path, init) {
  const res = await fetch(url(path), init);
  return res;
}

async function main() {
  console.log(`PWA smoke → ${base} (EXPECT_SW=${expectSw ? "1" : "0"})`);

  // --- Manifest ---
  const manifestRes = await fetchOk("/manifest.webmanifest");
  if (!manifestRes.ok) {
    fail("manifest", `HTTP ${manifestRes.status}`);
    return;
  }
  const ct = manifestRes.headers.get("content-type") ?? "";
  if (!/manifest|json/i.test(ct)) {
    fail("manifest content-type", ct || "(missing)");
  } else {
    ok("manifest content-type", ct);
  }

  /** @type {Record<string, unknown>} */
  let manifest;
  try {
    manifest = await manifestRes.json();
  } catch (err) {
    fail("manifest JSON", String(err));
    return;
  }

  const requiredStrings = {
    name: "HeyBar",
    short_name: "HeyBar",
    display: "standalone",
    start_url: "/",
  };
  for (const [key, expected] of Object.entries(requiredStrings)) {
    const actual = manifest[key];
    if (actual !== expected) {
      fail(`manifest.${key}`, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    } else {
      ok(`manifest.${key}`, String(actual));
    }
  }

  if (!manifest.theme_color || !manifest.background_color) {
    fail("manifest colors", "theme_color / background_color required");
  } else {
    ok("manifest colors", `${manifest.theme_color} / ${manifest.background_color}`);
  }

  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  if (icons.length < 2) {
    fail("manifest.icons", `need ≥2 icons, got ${icons.length}`);
  } else {
    ok("manifest.icons", `${icons.length} entries`);
  }

  for (const icon of icons) {
    const src = typeof icon?.src === "string" ? icon.src : null;
    if (!src) {
      fail("icon src", JSON.stringify(icon));
      continue;
    }
    const iconRes = await fetchOk(src);
    if (!iconRes.ok) {
      fail(`icon ${src}`, `HTTP ${iconRes.status}`);
    } else {
      ok(`icon ${src}`, `HTTP ${iconRes.status}`);
    }
  }

  // --- HTML link rel=manifest ---
  const homeRes = await fetchOk("/");
  if (!homeRes.ok) {
    fail("home", `HTTP ${homeRes.status}`);
  } else {
    const html = await homeRes.text();
    if (!/rel=["']manifest["']/i.test(html)) {
      fail("home link[rel=manifest]", "not found in HTML");
    } else {
      ok("home link[rel=manifest]");
    }
  }

  // --- Service worker (production / preview only) ---
  if (expectSw) {
    const swRes = await fetchOk("/sw.js");
    if (!swRes.ok) {
      fail("sw.js", `HTTP ${swRes.status} — rebuild with next-pwa (production) or wait for Vercel preview`);
    } else {
      const swCt = swRes.headers.get("content-type") ?? "";
      const body = await swRes.text();
      if (body.length < 32) {
        fail("sw.js body", "too short / empty");
      } else {
        ok("sw.js", `HTTP ${swRes.status}; ${swCt || "no content-type"}; ${body.length} bytes`);
      }
    }
  } else {
    console.log("SKIP  sw.js (set EXPECT_SW=1 for production / preview builds)");
  }

  if (process.exitCode) {
    console.error("\nPWA smoke FAILED");
    process.exit(process.exitCode);
  }
  console.log("\nPWA smoke PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
