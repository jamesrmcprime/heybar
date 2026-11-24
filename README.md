# HeyBar

Mobile-first Progressive Web App for sealed-bottle alcohol ordering in South Africa (ZAR).

Night Seal drinker shell: **Home · Bottles · Friends · Orders · Profile**. Cocktails / custom drinks are out of launch scope.

## Stack

- Next.js (App Router) + TypeScript
- Night Seal design tokens (`src/styles/design-tokens.css`)
- PWA via `@ducanh2912/next-pwa` (service worker in production builds)
- Playwright E2E (`e2e/`) — full journey + cancel/pay-fail matrix in CI
- Payment & delivery adapters are **stubs** — provider / model / territory still OPEN
- Delivery status machine: preparation → assigned → pickup → in_transit → delivered (exception / soft-cancel side paths; no hard-deletes)
- Supabase schema/RLS prep under `supabase/migrations/` + thin client stub (`src/lib/supabase/`) — placeholders only until a live project exists

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
npx playwright install chromium   # first time, for e2e
```

## Develop

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Local Next.js (Turbopack) |
| `npm run build` | Production build + PWA assets |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run test:unit` | Node unit tests (inventory + payment + delivery + membership + bottle tops + notifications + supabase stub/migrations) |
| `npm run test:e2e` | Playwright suite (shell smoke + full journey + matrix) |
| `npm run test:e2e:journey` | Func QA journey + cancel/pay-fail matrix only |

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs `lint` → `test:unit` → `build` → `test:e2e` on pull requests and pushes to `main` (`ubuntu-24.04`). E2E includes the Func QA journey (onboarding → bottles → shared order → pay stub → track) and the cancel/pay-fail matrix.

## Catalogue seed

Fifteen sealed bottles with **editable prototype prices** live in `src/data/bottles.ts` (from the master brief). They are not confirmed retail prices.

## Inventory skeleton

`src/lib/inventory.ts` — in-memory reserve / release / commit for **sealed bottles only**. Prevents naive oversell; cocktail SKUs rejected. Reservation timing (cart vs pay vs fulfill) remains OPEN.

## Supabase prep (stub)

SQL migrations + RLS sketch live in `supabase/migrations/` (profiles, bottles, orders, delivery, Tops ledger, membership). Env placeholders: `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, anon key, service role — **never** invent real secrets; service role stays server-only). Thin client: `src/lib/supabase/` — Auth adapter (`src/lib/adapters/auth.ts`) documents the swap to real Supabase Auth when credentials exist.

## Auth & onboarding shells

Secondary flows (no tab bar):

| Route | Purpose |
|---|---|
| `/auth/signup` | Signup stub — methods OPEN |
| `/age-gate` | 18+ affirmation collect-only |
| `/onboarding/personal` → `address` → `membership` → `guild` → `terms` | Ordered onboarding |
| `/profile/fields` | Profile fields collect shell |

## Account / Guild / Rewards shells

Nested under Profile tab (tab bar stays; Profile marked active):

| Route | Purpose |
|---|---|
| `/account` | Contact / security / membership entry |
| `/guild/[guildId]` | Guild detail — ranks ≤1000, Tops, rewards preview |
| `/profile/bottle-tops` | Bottle Tops ledger — derived Blue/Gold + append-only history |
| `/rewards?guild=` | Rewards list from seed config (5 levels × Guild) |
| `/rewards/[rewardId]` | Reward detail — claim CTA disabled shell |

Seed data: `src/data/ranks.ts`, `src/data/rewards.ts`, `src/data/demo-user.ts`, `src/data/bottle-tops.ts`.

## Bottle Tops ledger shell

`src/lib/bottle-tops.ts` — append-only Blue/Gold history; balances derived (no free-edit). Admin credit stub only. Earn / redeem / conversion remain OPEN (not invented).

## Friends graph shells

Friends tab stays active on nested `/friends/*` routes:

| Route | Purpose |
|---|---|
| `/friends` | Requests + Buddies + Discover (People folded in) |
| `/friends/requests/[requestId]` | Incoming request detail — Accept / Decline shell |
| `/friends/[personId]` | Buddy / Discover person detail |
| `/friends/invite/[personId]` | Invite into active shared order — absorption preview; confirm is local UI only |

Seed: `src/data/friends.ts`. Graph mutations are local UI only — not persisted.

## Shared orders + delivery absorption

Orders tab stays active on `/orders/[orderId]`:

| Route | Purpose |
|---|---|
| `/orders` | Active + past list (shared & solo) |
| `/orders/[orderId]` | Order room — participant carts, delivery split, HeyBar absorption |

Math:
- Delivery: `src/lib/delivery-absorption.ts` (equal split first; membership delivery % on own share; HeyBar absorbs gap — not redistributed; cent identity kept).
- Product: `src/lib/membership-discount.ts` (brief-table % only — Straight Up 0% / Neat 5% / The Reserve 15% / Top Shelf 25%; own sealed lines only; no reward stacking).

Seed: `src/data/orders.ts` (Friday night run = brief §2.3 example: R100 ÷ 4, absorbs R37.50). Sealed bottles only. Live payment **provider** remains OPEN (`checkoutUrl` always `null`).

Order-room stub mutations (local UI state, not a live backend):

| Control | Behavior |
|---|---|
| **Leave order** | Marks self `cancelled`; delivery recalculated for remaining; others untouched |
| **Pay share (stub)** | `POST /api/payments/simulate-fail` (intent + signed fail webhook) → self `failed`; others untouched |
| **Remove from order** | Drops an unpaid buddy; delivery equal-split recalculated; paid peers intact |

## Payment adapter stub

`src/lib/adapters/payment.ts` — intent/session + HMAC-signed webhook stub (idempotent by `eventId`). Live `checkoutUrl` is always `null`.

| Route | Purpose |
|---|---|
| `POST /api/payments/intent` | Create stub session (bound amount) |
| `POST /api/payments/webhook` | Signed webhook (`x-heybar-payment-signature`) |
| `POST /api/payments/simulate-fail` | QA: intent + failed webhook for one participant |

## OPEN / stubs

Do **not** invent:

- Bottle Top earn / redeem / conversion / debit rules
- Reward claim eligibility (backend-only; UI claim button disabled)
- Auth signup methods (see `src/lib/adapters/auth.ts`)
- Age-verification provider (age gate is collect-only)
- Final legal T&Cs copy (see `src/lib/adapters/legal.ts`)
- Payment **provider** / refunds / dunning (adapter stub only — see `src/lib/adapters/payment.ts`)
- Delivery model / territory / fee schedule (seed fee only; see `src/lib/adapters/delivery.ts`)
- XP &gt;1000 behaviour
- Gin Level 5 official name (placeholder until Airtable)
- Persisted invite / server-side participant ledger (invite confirm + order mutations are local shells)

## Visual QA

Playwright smoke tests check shell structure only. Screenshot baselines for Home, Bottles, Friends, Orders, and Profile require Visual QA + owner authorization before locking.
