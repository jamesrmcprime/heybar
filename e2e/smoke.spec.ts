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
