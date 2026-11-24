# HeyBar

Mobile-first Progressive Web App for sealed-bottle alcohol ordering in South Africa (ZAR).

Night Seal drinker shell: **Home · Bottles · Friends · Orders · Profile**. Cocktails / custom drinks are out of launch scope.

## Stack

- Next.js (App Router) + TypeScript
- Night Seal design tokens (`src/styles/design-tokens.css`)
- PWA via `@ducanh2912/next-pwa` (service worker in production builds)
- Playwright smoke tests (`e2e/`)
- Payment & delivery adapters are **stubs** — provider / model still OPEN

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
| `npm run test:e2e` | Playwright smoke suite |

## Catalogue seed

Fifteen sealed bottles with **editable prototype prices** live in `src/data/bottles.ts` (from the master brief). They are not confirmed retail prices.

## Auth & onboarding shells

Secondary flows (no tab bar):

| Route | Purpose |
|---|---|
| `/auth/signup` | Signup stub — methods OPEN |
| `/age-gate` | 18+ affirmation collect-only |
| `/onboarding/personal` → `address` → `membership` → `guild` → `terms` | Ordered onboarding |
| `/profile/fields` | Profile fields collect shell |

## OPEN / stubs

Do **not** invent:

- Bottle Top earn / redeem / conversion rules
- Auth signup methods (see `src/lib/adapters/auth.ts`)
- Age-verification provider (age gate is collect-only)
- Final legal T&Cs copy (see `src/lib/adapters/legal.ts`)
- Payment provider (see `src/lib/adapters/payment.ts`)
- Delivery model / territory (see `src/lib/adapters/delivery.ts`)
- XP &gt;1000 behaviour

## Visual QA

Playwright smoke tests check shell structure only. Screenshot baselines for Home, Bottles, Friends, Orders, and Profile require Visual QA + owner authorization before locking.
