import { expect, test } from "@playwright/test";

/**
 * Drinker shell smoke tests — structure only.
 * Do not treat screenshots here as approved Night Seal baselines.
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

  test("Bottles lists all 15 seed bottles", async ({ page }) => {
    await page.goto("/bottles");
    await expect(page.getByText("Sealed bottles only")).toBeVisible();
    await expect(page.getByText("Absolut")).toBeVisible();
    await expect(page.getByText("Tanqueray")).toBeVisible();
    await expect(page.getByText("Bombay Sapphire")).toBeVisible();
    const rows = page.locator("main li");
    await expect(rows).toHaveCount(15);
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
