import { expect, test } from "@playwright/test";

/**
 * Drinker shell smoke tests — structure only.
 * Full Func QA journey + cancel/pay-fail matrix: e2e/journey.spec.ts (CI).
 * Do not treat screenshots here as approved Night Seal baselines.
 * Inventory/payment/bottle-tops unit tests: src/lib/*.test.ts (npm run test:unit).
 */

const TABS = [
  { name: "Home", path: "/" },
  { name: "Bottles", path: "/bottles" },
  { name: "Friends", path: "/friends" },
  { name: "Orders", path: "/orders" },
  { name: "Profile", path: "/profile" },
] as const;

const FLOW_ROUTES = [
  { name: "Signup stub", path: "/auth/signup", heading: /Create your account/i },
  { name: "Age gate", path: "/age-gate", heading: /Are you 18 or older/i },
  {
    name: "Onboarding personal",
    path: "/onboarding/personal",
    heading: /Your details/i,
  },
  {
    name: "Onboarding address",
    path: "/onboarding/address",
    heading: /Delivery address/i,
  },
  {
    name: "Onboarding membership",
    path: "/onboarding/membership",
    heading: /Membership/i,
  },
  {
    name: "Onboarding guild",
    path: "/onboarding/guild",
    heading: /Choose a Guild/i,
  },
  { name: "Onboarding terms", path: "/onboarding/terms", heading: /Terms/i },
  {
    name: "Profile fields",
    path: "/profile/fields",
    heading: /Profile fields/i,
  },
] as const;

test.describe("drinker 5-tab shell", () => {
  for (const tab of TABS) {
    test(`${tab.name} renders and marks tab active`, async ({ page }) => {
      await page.goto(tab.path);
      await expect(page.getByRole("navigation", { name: "Drinker" })).toBeVisible();
      await expect(
        page.getByRole("link", { name: tab.name, exact: true }),
      ).toHaveAttribute("aria-current", "page");
    });
  }

  test("Home is brand-first (HeyBar in first viewport)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /HeyBar/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse bottles" })).toBeVisible();
  });

  test("Bottles lists curated Wave 1 catalogue (5)", async ({ page }) => {
    await page.goto("/bottles");
    await expect(page.getByText("Sealed bottles only")).toBeVisible();
    await expect(page.getByText("Bombay Sapphire")).toBeVisible();
    await expect(page.getByText("Jack Daniel's")).toBeVisible();
    await expect(page.getByText("Grey Goose")).toBeVisible();
    await expect(page.getByText("Hendrick's")).toBeVisible();
    await expect(page.getByText("Jameson")).toBeVisible();
    await expect(page.getByText("Absolut")).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Tequila" })).toHaveCount(0);
    const rows = page.locator("main li");
    await expect(rows).toHaveCount(5);
    await expect(page.getByText(/In stock/i)).toHaveCount(0);
  });

  test("no cocktails tab or custom-drink CTA", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Drinker" });
    await expect(nav.getByRole("link", { name: "Cocktails" })).toHaveCount(0);
    await expect(page.getByText(/custom drink/i)).toHaveCount(0);
  });
});

test.describe("auth + onboarding flow shells", () => {
  for (const route of FLOW_ROUTES) {
    test(`${route.name} renders without tab bar`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "Drinker" }),
      ).toHaveCount(0);
    });
  }

  test("signup stub does not claim locked auth methods", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.getByText(/Auth methods OPEN/i)).toBeVisible();
    await expect(page.getByText("OPEN").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Continue \(stub\)/i })).toBeVisible();
  });

  test("age gate is collect-only (no verification provider)", async ({
    page,
  }) => {
    await page.goto("/age-gate");
    await expect(page.getByText(/Verification method OPEN/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Yes — I am 18\+/i }),
    ).toBeVisible();
  });

  test("onboarding sequence Personal → Address → Membership → Guild → T&Cs", async ({
    page,
  }) => {
    await page.goto("/onboarding/personal");
    await expect(page.getByText(/Step 1 of 5/i)).toBeVisible();
    await page.getByRole("link", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/onboarding\/address/);
    await expect(page.getByText(/Step 2 of 5/i)).toBeVisible();
    await page.getByRole("link", { name: /Save & continue/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/membership/);
    await expect(page.getByText(/Step 3 of 5/i)).toBeVisible();
    await expect(page.getByRole("radio", { name: /Straight Up/i })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Top Shelf/i })).toBeVisible();
    await page.getByRole("link", { name: /Continue with/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/guild/);
    await expect(page.getByText(/Step 4 of 5/i)).toBeVisible();
    await expect(
      page.getByRole("radio", { name: /Gin Connoisseurs/i }),
    ).toBeVisible();
    await page.getByRole("link", { name: /Join .* continue/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/terms/);
    await expect(page.getByText(/Step 5 of 5/i)).toBeVisible();
    await expect(page.getByText(/DRAFT — NON-FINAL/i)).toBeVisible();
    await expect(page.getByText(/Not final legal copy/i)).toBeVisible();
  });

  test("profile fields shell collects without asserting verification", async ({
    page,
  }) => {
    await page.goto("/profile/fields");
    await expect(page.getByLabel("Date of birth")).toBeVisible();
    await expect(page.getByLabel("ID number")).toBeVisible();
    await expect(page.getByText(/verification method is OPEN/i)).toBeVisible();
  });
});

const ACCOUNT_GUILD_REWARD_ROUTES = [
  { name: "Account", path: "/account", heading: /^Account$/ },
  { name: "Guild detail", path: "/guild/gin", heading: /^Guild$/ },
  { name: "Rewards list", path: "/rewards?guild=gin", heading: /^Rewards$/ },
  {
    name: "Reward detail",
    path: "/rewards/gin-l3",
    heading: /^Reward$/,
  },
  {
    name: "Bottle Tops ledger",
    path: "/profile/bottle-tops",
    heading: /^Bottle Tops$/,
  },
] as const;

test.describe("account + guild + rewards shells", () => {
  for (const route of ACCOUNT_GUILD_REWARD_ROUTES) {
    test(`${route.name} renders with Profile tab active`, async ({ page }) => {
      await page.goto(route.path);
      await expect(
        page.getByRole("heading", { name: route.heading }),
      ).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "Drinker" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Profile", exact: true }),
      ).toHaveAttribute("aria-current", "page");
    });
  }

  test("account shows contact fields without inventing auth methods", async ({
    page,
  }) => {
    await page.goto("/account");
    await expect(page.getByText("Sam Lady")).toBeVisible();
    await expect(page.getByText(/Auth methods OPEN/i)).toBeVisible();
  });

  test("guild detail shows ranks ≤1000 and OPEN flags", async ({ page }) => {
    await page.goto("/guild/gin");
    await expect(page.getByText("Gin Connoisseurs", { exact: true })).toBeVisible();
    await expect(page.getByText("Grand Reserve")).toBeVisible();
    await expect(page.getByText(/700–1[\s,]?000/)).toBeVisible();
    await expect(page.getByText(/XP > 1,000 · OPEN/i)).toBeVisible();
    await expect(page.getByText(/earn \/ debit · OPEN/i)).toBeVisible();
    await expect(page.getByText("Botanical Beginner")).toBeVisible();
  });

  test("bottle tops ledger shows derived balances and history shell", async ({
    page,
  }) => {
    await page.goto("/profile/bottle-tops");
    await expect(
      page.getByRole("heading", { name: /^Bottle Tops$/ }),
    ).toBeVisible();
    await expect(page.getByText("120").first()).toBeVisible();
    await expect(page.getByText("8").first()).toBeVisible();
    await expect(page.getByText(/Admin credit/i).first()).toBeVisible();
    await expect(page.getByText(/earn \/ redeem \/ conversion · OPEN/i)).toBeVisible();
    await expect(page.getByText(/cocktail/i)).toHaveCount(0);
  });

  test("profile matches Night Seal chrome (settings gear, balances, no shells)", async ({
    page,
  }) => {
    await page.goto("/profile");
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Cart (stub)" })).toHaveCount(0);
    await expect(page.getByText("Guild path")).toBeVisible();
    await expect(page.getByText("120").first()).toBeVisible();
    await expect(page.getByText("8").first()).toBeVisible();
    await expect(page.getByText(/Account & shells/i)).toHaveCount(0);
    await expect(page.getByText(/Derived from append-only ledger/i)).toHaveCount(
      0,
    );
    await expect(page.getByRole("link", { name: "Ledger →" })).toHaveCount(0);
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/account/);
  });

  test("friends tab has no developer footnote", async ({ page }) => {
    await page.goto("/friends");
    await expect(page.getByText(/Graph shell/i)).toHaveCount(0);
    await expect(page.getByText(/invite math OPEN/i)).toHaveCount(0);
  });

  test("rewards list shows Gin L1–L5 seed table", async ({ page }) => {
    await page.goto("/rewards?guild=gin");
    await expect(page.getByText("Botanical Beginner")).toBeVisible();
    await expect(page.getByText("Herb Hero")).toBeVisible();
    await expect(page.getByText("Gin Level 5")).toBeVisible();
    await expect(page.getByText(/Bottle Top debit rules · OPEN/i)).toBeVisible();
  });

  test("reward detail is claim-shell only (no debit logic)", async ({
    page,
  }) => {
    await page.goto("/rewards/gin-l3");
    await expect(
      page.getByRole("heading", { name: "Herb Hero" }),
    ).toBeVisible();
    await expect(page.getByText("XP required")).toBeVisible();
    await expect(page.getByText("300").first()).toBeVisible();
    await expect(page.getByText(/Bottle Top debit/i)).toBeVisible();
    const claim = page.getByRole("button", { name: /Claim reward/i });
    await expect(claim).toBeDisabled();
  });

  test("no cocktails surface on guild/rewards routes", async ({ page }) => {
    await page.goto("/guild/gin");
    await expect(page.getByText(/cocktail/i)).toHaveCount(0);
    await page.goto("/rewards?guild=gin");
    await expect(page.getByText(/cocktail/i)).toHaveCount(0);
  });
});

const FRIENDS_ROUTES = [
  { name: "Friends tab", path: "/friends", heading: /^Friends$/ },
  {
    name: "Friend request detail",
    path: "/friends/requests/james-mcintosh",
    heading: /^Request$/,
  },
  {
    name: "Buddy detail",
    path: "/friends/dave-person",
    heading: /^Friend$/,
  },
  {
    name: "Discover person detail",
    path: "/friends/alice-card",
    heading: /^Friend$/,
  },
  {
    name: "Invite shell",
    path: "/friends/invite/dave-person",
    heading: /^Invite$/,
  },
] as const;

test.describe("friends graph shells", () => {
  for (const route of FRIENDS_ROUTES) {
    test(`${route.name} renders with Friends tab active`, async ({ page }) => {
      await page.goto(route.path);
      await expect(
        page.getByRole("heading", { name: route.heading }),
      ).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "Drinker" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Friends", exact: true }),
      ).toHaveAttribute("aria-current", "page");
    });
  }

  test("Friends lists requests, buddies, and discover", async ({ page }) => {
    await page.goto("/friends");
    await expect(page.getByRole("heading", { name: "Requests" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Buddies" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();
    await expect(page.getByText("James McIntosh")).toBeVisible();
    await expect(page.getByText("Sam Lady")).toBeVisible();
    await expect(page.getByText("Dave Person")).toBeVisible();
    await expect(page.getByText("Jane Doe")).toBeVisible();
    await expect(page.getByText("Alice Card")).toBeVisible();
    await expect(page.getByText("Straight Up", { exact: true })).toBeVisible();
    await expect(page.getByText("Alex K")).toHaveCount(0);
    await expect(page.getByText("Riley M")).toHaveCount(0);
    await expect(page.getByPlaceholder("Find drinking buddies")).toBeVisible();
  });

  test("request detail Accept / Decline is shell-only", async ({ page }) => {
    await page.goto("/friends/requests/james-mcintosh");
    await expect(
      page.getByRole("heading", { name: "James McIntosh" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Accept" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Decline" })).toBeVisible();
    await page.getByRole("button", { name: "Accept" }).click();
    await expect(page.getByText(/Accepted shell/i)).toBeVisible();
  });

  test("invite for buddy already on order keeps confirm disabled", async ({
    page,
  }) => {
    await page.goto("/friends/invite/dave-person");
    await expect(page.getByText("Dave Person", { exact: true })).toBeVisible();
    await expect(page.getByText(/Already on this shared order/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Confirm invite/i }),
    ).toBeDisabled();
    await expect(page.getByText(/Sealed bottles only/i)).toBeVisible();
  });

  test("invite preview shows delivery absorption for new buddy", async ({
    page,
  }) => {
    await page.goto("/friends/invite/jane-doe");
    await expect(page.getByText("Jane Doe", { exact: true })).toBeVisible();
    await expect(page.getByText("Friday night run")).toBeVisible();
    await expect(page.getByText(/If Jane Doe joins/i)).toBeVisible();
    await expect(page.getByText(/HeyBar absorbs/i).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Confirm invite/i }),
    ).toBeEnabled();
    await page.getByRole("button", { name: /Confirm invite/i }).click();
    await expect(page.getByText(/Invite shell/i)).toBeVisible();
  });

  test("search filters the friends graph", async ({ page }) => {
    await page.goto("/friends");
    await page.getByPlaceholder("Find drinking buddies").fill("Alice");
    await expect(page.getByText("Alice Card")).toBeVisible();
    await expect(page.getByText("James McIntosh")).toHaveCount(0);
    await expect(page.getByText("Dave Person")).toHaveCount(0);
  });

  test("no cocktails surface on friends routes", async ({ page }) => {
    await page.goto("/friends");
    await expect(page.getByText(/cocktail/i)).toHaveCount(0);
    await page.goto("/friends/invite/dave-person");
    await expect(page.getByText(/cocktail/i)).toHaveCount(0);
  });
});

const ORDER_ROUTES = [
  { name: "Orders tab", path: "/orders", heading: /^Orders$/ },
  {
    name: "Shared order room",
    path: "/orders/ORD-8F2A",
    heading: /^Order$/,
  },
  {
    name: "Solo order detail",
    path: "/orders/ORD-3C91",
    heading: /^Order$/,
  },
] as const;

test.describe("shared orders + delivery absorption", () => {
  for (const route of ORDER_ROUTES) {
    test(`${route.name} renders with Orders tab active`, async ({ page }) => {
      await page.goto(route.path);
      await expect(
        page.getByRole("heading", { name: route.heading }),
      ).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "Drinker" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Orders", exact: true }),
      ).toHaveAttribute("aria-current", "page");
    });
  }

  test("Orders lists active shared and solo", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: "Active" })).toBeVisible();
    await expect(page.getByText("Friday night run")).toBeVisible();
    await expect(page.getByText("Quick top-up")).toBeVisible();
    await expect(page.getByText(/Shared · 4 people/i)).toBeVisible();
    await expect(page.getByText("ORD-8F2A")).toBeVisible();
  });

  test("shared order room shows brief absorption example", async ({
    page,
  }) => {
    await page.goto("/orders/ORD-8F2A");
    await expect(
      page.getByRole("heading", { name: "Friday night run" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Delivery split" })).toBeVisible();
    await expect(page.getByText(/Fee R100 ÷ 4 = R25 each/i)).toBeVisible();
    await expect(page.getByText("Straight Up · 0% delivery")).toBeVisible();
    await expect(page.getByText("Neat · 0% delivery")).toBeVisible();
    await expect(page.getByText("The Reserve · 50% delivery")).toBeVisible();
    await expect(page.getByText("Top Shelf · 100% delivery")).toBeVisible();
    await expect(
      page.getByText("HeyBar absorbs", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("R37.50").first()).toBeVisible();
    await expect(page.getByText("R12.50").first()).toBeVisible();
    await expect(page.getByText("Tanqueray")).toBeVisible();
    await expect(page.getByText("Absolut")).toBeVisible();
    await expect(page.getByText(/Sealed bottles only/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Pay share \(stub\)/i }),
    ).toBeEnabled();
    await expect(
      page.getByText(/Delivery territory \/ fee schedule · OPEN/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/Pays R62\.50 \+ absorbs R37\.50 = R100 fee/i),
    ).toBeVisible();
  });

  test("no cocktails or invented XP/Tops debit on orders", async ({
    page,
  }) => {
    await page.goto("/orders/ORD-8F2A");
    await expect(page.getByText(/cocktail/i)).toHaveCount(0);
    await expect(page.getByText(/Tops not spent here/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /redeem/i })).toHaveCount(0);
    await expect(page.getByText(/XP > ?1,?000/i)).toHaveCount(0);
  });

  test("P0 leave/abandon keeps other payment states intact", async ({
    page,
  }) => {
    await page.goto("/orders/ORD-8F2A");
    const carts = page.getByLabel("Participant carts");
    await expect(carts.getByText("Riley M")).toBeVisible();
    await expect(carts.getByText(/Locked in · Paid/i)).toBeVisible();
    await expect(carts.getByText("Alex K")).toBeVisible();
    await expect(carts.getByText("Dave Person")).toBeVisible();

    await page.getByRole("button", { name: "Leave order" }).click();

    await expect(
      page.getByText(/You left this shared order/i),
    ).toBeVisible();
    await expect(carts.getByText(/Left order · Cancelled/i)).toBeVisible();
    await expect(page.getByText(/Shared · 3 people/i)).toBeVisible();
    await expect(page.getByText(/Fee R100 ÷ 3 =/i)).toBeVisible();
    // Riley paid untouched; Alex / Dave still awaiting
    await expect(carts.getByText(/Locked in · Paid/i)).toBeVisible();
    await expect(carts.getByText("Alex K")).toBeVisible();
    await expect(carts.getByText("Dave Person")).toBeVisible();
    await expect(carts.getByText(/Still choosing · Awaiting pay/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Pay share/i }),
    ).toHaveCount(0);
    // Fee identity after awkward ÷3
    await expect(page.getByText(/= R100 fee/i)).toBeVisible();
  });

  test("P0 pay stub fail isolates failed state to self", async ({ page }) => {
    await page.goto("/orders/ORD-8F2A");
    const carts = page.getByLabel("Participant carts");
    const samCard = page.locator('[data-participant="part-sam"]');
    const alexCard = page.locator('[data-participant="part-alex"]');
    const rileyCard = page.locator('[data-participant="part-riley"]');
    const daveCard = page.locator('[data-participant="part-dave"]');
    await expect(rileyCard.getByText(/Locked in · Paid/i)).toBeVisible();
    await expect(samCard.getByText(/Locked in · Awaiting pay/i)).toBeVisible();
    await expect(alexCard.getByText(/Locked in · Awaiting pay/i)).toBeVisible();

    await page.getByRole("button", { name: /Pay share \(stub\)/i }).click();

    await expect(page.getByText(/Payment failed for you only/i)).toBeVisible();
    await expect(samCard.getByText(/Locked in · Payment failed/i)).toBeVisible();
    await expect(
      page.getByText(/Stub payment failed|provider OPEN/i).first(),
    ).toBeVisible();
    // Others untouched
    await expect(rileyCard.getByText(/Locked in · Paid/i)).toBeVisible();
    await expect(alexCard.getByText(/Locked in · Awaiting pay/i)).toBeVisible();
    await expect(daveCard.getByText(/Still choosing · Awaiting pay/i)).toBeVisible();
    await expect(carts.getByText("Alex K")).toBeVisible();
    await expect(carts.getByText("Dave Person")).toBeVisible();
    // Still 4 on delivery split
    await expect(page.getByText(/Shared · 4 people/i)).toBeVisible();
    await expect(page.getByText(/Fee R100 ÷ 4 = R25 each/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Retry pay \(stub\)/i }),
    ).toBeEnabled();
  });

  test("P0 remove participant recalculates absorption", async ({ page }) => {
    await page.goto("/orders/ORD-8F2A");
    const carts = page.getByLabel("Participant carts");
    const daveCard = page.locator('[data-participant="part-dave"]');
    await expect(daveCard).toBeVisible();
    await expect(daveCard.getByText(/Still choosing · Awaiting pay/i)).toBeVisible();

    await daveCard.getByRole("button", { name: "Remove from order" }).click();

    await expect(page.locator('[data-participant="part-dave"]')).toHaveCount(0);
    await expect(carts.getByText("Dave Person")).toHaveCount(0);
    await expect(page.getByText(/Shared · 3 people/i)).toBeVisible();
    await expect(page.getByText(/Fee R100 ÷ 3 =/i)).toBeVisible();
    // Remaining carts + Riley paid intact
    await expect(carts.getByText("Sam Lady")).toBeVisible();
    await expect(carts.getByText("Alex K")).toBeVisible();
    await expect(carts.getByText("Riley M")).toBeVisible();
    await expect(carts.getByText(/Locked in · Paid/i)).toBeVisible();
    await expect(carts.getByText(/Locked in · Awaiting pay/i).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Pay share \(stub\)/i }),
    ).toBeEnabled();
    // No remove on paid Riley
    const rileyCard = page.locator('[data-participant="part-riley"]');
    await expect(
      rileyCard.getByRole("button", { name: "Remove from order" }),
    ).toHaveCount(0);
    await expect(page.getByText(/= R100 fee/i)).toBeVisible();
  });
});

test.describe("inventory oversell skeleton (sealed bottles)", () => {
  test("catalogue add stays enabled for seeded stock (no stock append)", async ({
    page,
  }) => {
    await page.goto("/bottles");
    await expect(page.getByText(/In stock/i)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Add Bombay Sapphire to cart/i }),
    ).toBeEnabled();
  });
  // Reserve/oversell logic: src/lib/inventory.test.ts (npm run test:unit).
});

test.describe("payment adapter stub (API smoke)", () => {
  test("intent keeps checkoutUrl null; simulate-fail is isolated", async ({
    request,
  }) => {
    const intentRes = await request.post("/api/payments/intent", {
      data: {
        participantId: "part-sam",
        orderId: "ORD-8F2A",
        amountCents: 3600,
        currency: "ZAR",
      },
    });
    expect(intentRes.ok()).toBeTruthy();
    const intent = (await intentRes.json()) as {
      status: string;
      provider: string;
      checkoutUrl: string | null;
      sessionId: string;
    };
    expect(intent.status).toBe("stub");
    expect(intent.provider).toBe("OPEN");
    expect(intent.checkoutUrl).toBeNull();
    expect(intent.sessionId).toMatch(/^pay_sess_/);

    const badWebhook = await request.post("/api/payments/webhook", {
      data: {
        eventId: "evt_bad",
        sessionId: intent.sessionId,
        outcome: "failed",
      },
      headers: { "x-heybar-payment-signature": "sha256=deadbeef" },
    });
    expect(badWebhook.status()).toBe(400);

    const failRes = await request.post("/api/payments/simulate-fail", {
      data: {
        participantId: "part-alex",
        orderId: "ORD-8F2A",
        amountCents: 2500,
        currency: "ZAR",
      },
    });
    expect(failRes.ok()).toBeTruthy();
    const failBody = (await failRes.json()) as {
      intent: { checkoutUrl: string | null };
      webhook: { accepted: boolean; outcome: string; participantId: string };
    };
    expect(failBody.intent.checkoutUrl).toBeNull();
    expect(failBody.webhook.accepted).toBe(true);
    expect(failBody.webhook.outcome).toBe("failed");
    expect(failBody.webhook.participantId).toBe("part-alex");
  });
  // Idempotency / HMAC / peer ledger isolation: src/lib/adapters/payment.test.ts
});

test.describe("delivery status shell (ops stub)", () => {
  test("order room shows fulfillment track and OPEN stub fees", async ({
    page,
  }) => {
    await page.goto("/orders/ORD-8F2A");
    await expect(
      page.getByRole("heading", { name: "Delivery status" }),
    ).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Fulfillment track" }),
    ).toBeVisible();
    await expect(page.getByText("Preparation").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Advance status" }),
    ).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Raise exception" }),
    ).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Soft cancel" }),
    ).toBeEnabled();
    await expect(
      page.getByText(/territory OPEN \(A8/i),
    ).toBeVisible();
  });

  test("soft cancel retains peers — no hard-delete of carts/payments", async ({
    page,
  }) => {
    await page.goto("/orders/ORD-8F2A");
    const carts = page.getByLabel("Participant carts");
    await expect(carts.getByText(/Locked in · Paid/i)).toBeVisible();
    await expect(carts.getByText("Alex K")).toBeVisible();
    await expect(carts.getByText("Dave Person")).toBeVisible();

    await page.getByRole("button", { name: "Soft cancel" }).click();

    await expect(
      page.getByText(/Soft-cancelled · shipment retained/i),
    ).toBeVisible();
    // Participants still listed with prior payment states (peer-safe)
    await expect(carts.getByText("Riley M")).toBeVisible();
    await expect(carts.getByText(/Locked in · Paid/i)).toBeVisible();
    await expect(carts.getByText("Alex K")).toBeVisible();
    await expect(carts.getByText("Dave Person")).toBeVisible();
    await expect(carts.getByText("Sam Lady")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Advance status" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Pay share/i }),
    ).toHaveCount(0);
  });

  test("advance API walks happy path; exception API is peer-safe", async ({
    request,
  }) => {
    const statusRes = await request.get(
      "/api/delivery/status?orderId=ORD-ADV-E2E",
    );
    expect(statusRes.ok()).toBeTruthy();
    const statusBody = (await statusRes.json()) as {
      territoryFlag: string;
      stubFees: { territoryFlag: string; sharedBaseZar: number };
      shipment: { status: string };
    };
    expect(statusBody.territoryFlag).toBe("OPEN");
    expect(statusBody.stubFees.territoryFlag).toBe("OPEN");
    expect(statusBody.stubFees.sharedBaseZar).toBe(100);
    expect(statusBody.shipment.status).toBe("preparation");

    for (const expected of ["assigned", "pickup", "in_transit"] as const) {
      const adv = await request.post("/api/delivery/advance", {
        data: { orderId: "ORD-ADV-E2E" },
      });
      expect(adv.ok()).toBeTruthy();
      const body = (await adv.json()) as {
        shipment: { status: string };
        territoryFlag: string;
      };
      expect(body.shipment.status).toBe(expected);
      expect(body.territoryFlag).toBe("OPEN");
    }

    const ex = await request.post("/api/delivery/exception", {
      data: { orderId: "ORD-ADV-E2E", note: "e2e exception stub" },
    });
    expect(ex.ok()).toBeTruthy();
    const exBody = (await ex.json()) as {
      shipment: { status: string; exceptionNote: string | null };
    };
    expect(exBody.shipment.status).toBe("exception");
    expect(exBody.shipment.exceptionNote).toBe("e2e exception stub");

    const cancel = await request.post("/api/delivery/soft-cancel", {
      data: { orderId: "ORD-ADV-E2E", note: "close" },
    });
    expect(cancel.ok()).toBeTruthy();
    const cancelBody = (await cancel.json()) as {
      shipment: { status: string; softCancelled: boolean };
    };
    expect(cancelBody.shipment.status).toBe("cancelled");
    expect(cancelBody.shipment.softCancelled).toBe(true);

    // Still readable — no hard-delete
    const after = await request.get(
      "/api/delivery/status?orderId=ORD-ADV-E2E",
    );
    expect(after.ok()).toBeTruthy();
    const afterBody = (await after.json()) as {
      shipment: { status: string };
      events: { kind: string }[];
    };
    expect(afterBody.shipment.status).toBe("cancelled");
    expect(afterBody.events.some((e) => e.kind === "soft_cancel")).toBe(true);
  });
});
