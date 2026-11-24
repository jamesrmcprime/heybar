import { expect, test } from "@playwright/test";

/**
 * Func QA full journey — CI-facing happy path.
 *
 * onboarding → bottles → shared order → pay stub → track
 *
 * Cancel / pay-fail matrix stays in e2e/smoke.spec.ts (leave, pay-fail,
 * remove, soft-cancel) and runs in the same CI `test:e2e` job.
 * Does not invent OPEN rules (payment provider, territory, XP>1000, Tops).
 */

test.describe("Func QA full journey", () => {
  test("onboarding → bottles → shared order → pay stub → track", async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);
    // --- Onboarding (signup stub → age gate → 5 steps → home) ---
    await page.goto("/auth/signup");
    await expect(page.getByText(/Auth methods OPEN/i)).toBeVisible();
    await page.getByRole("link", { name: /Continue \(stub\)/i }).click();
    await expect(page).toHaveURL(/\/age-gate/);

    await page.getByRole("link", { name: /Yes — I am 18\+/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/personal/);
    await expect(page.getByText(/Step 1 of 5/i)).toBeVisible();
    await page.getByRole("link", { name: "Continue" }).click();

    await expect(page).toHaveURL(/\/onboarding\/address/);
    await expect(page.getByText(/Step 2 of 5/i)).toBeVisible();
    await page.getByRole("link", { name: /Save & continue/i }).click();

    await expect(page).toHaveURL(/\/onboarding\/membership/);
    await expect(page.getByText(/Step 3 of 5/i)).toBeVisible();
    await expect(page.getByRole("radio", { name: /Top Shelf/i })).toBeVisible();
    await page.getByRole("link", { name: /Continue with/i }).click();

    await expect(page).toHaveURL(/\/onboarding\/guild/);
    await expect(page.getByText(/Step 4 of 5/i)).toBeVisible();
    await page.getByRole("link", { name: /Join .* continue/i }).click();

    await expect(page).toHaveURL(/\/onboarding\/terms/);
    await expect(page.getByText(/Step 5 of 5/i)).toBeVisible();
    await expect(page.getByText(/DRAFT — NON-FINAL/i)).toBeVisible();
    await page.getByRole("link", { name: /Create account/i }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: /HeyBar/i })).toBeVisible();

    // --- Bottles (sealed catalogue — Wave 1 curated 5) ---
    await page.getByRole("link", { name: "Browse bottles" }).click();
    await expect(page).toHaveURL(/\/bottles/);
    await expect(page.getByText("Sealed bottles only")).toBeVisible();
    await expect(page.getByText("Bombay Sapphire")).toBeVisible();
    await expect(page.getByText("Jameson")).toBeVisible();
    await expect(page.locator("main li")).toHaveCount(5);
    await expect(page.getByText(/cocktail/i)).toHaveCount(0);

    // --- Shared order (brief absorption fixture) ---
    await page.getByRole("link", { name: "Orders", exact: true }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByText("Friday night run")).toBeVisible();
    await page.locator('a[href="/orders/ORD-8F2A"]').click();
    await expect(page).toHaveURL(/\/orders\/ORD-8F2A/);
    await expect(
      page.getByRole("heading", { name: "Friday night run" }),
    ).toBeVisible();
    await expect(page.getByText(/Fee R100 ÷ 4 = R25 each/i)).toBeVisible();
    await expect(page.getByText("R37.50").first()).toBeVisible();
    await expect(
      page.getByText(/Delivery territory \/ fee schedule · OPEN/i).first(),
    ).toBeVisible();

    // --- Pay stub (provider OPEN — simulate-fail isolates self) ---
    const samCard = page.locator('[data-participant="part-sam"]');
    const rileyCard = page.locator('[data-participant="part-riley"]');
    await expect(rileyCard.getByText(/Locked in · Paid/i)).toBeVisible();
    await page.getByRole("button", { name: /Pay share \(stub\)/i }).click();
    await expect(page.getByText(/Payment failed for you only/i)).toBeVisible();
    await expect(samCard.getByText(/Locked in · Payment failed/i)).toBeVisible();
    await expect(rileyCard.getByText(/Locked in · Paid/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Retry pay \(stub\)/i }),
    ).toBeEnabled();

    // --- Track (fulfillment shell on order room + isolated API walk) ---
    await expect(
      page.getByRole("heading", { name: "Delivery status" }),
    ).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Fulfillment track" }),
    ).toBeVisible();
    await expect(page.getByText("Preparation").first()).toBeVisible();
    await expect(page.getByText(/territory OPEN \(A8/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Advance status" }),
    ).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Soft cancel" }),
    ).toBeEnabled();

    // Full prep → delivered on a dedicated orderId — avoids ORD-8F2A races
    // with the cancel/pay-fail matrix in smoke.spec.ts.
    const trackOrderId = "ORD-JOURNEY-TRACK";
    const statusRes = await request.get(
      `/api/delivery/status?orderId=${trackOrderId}`,
    );
    expect(statusRes.ok()).toBeTruthy();
    const statusBody = (await statusRes.json()) as {
      territoryFlag: string;
      shipment: { status: string };
    };
    expect(statusBody.territoryFlag).toBe("OPEN");
    expect(statusBody.shipment.status).toBe("preparation");

    for (const expected of [
      "assigned",
      "pickup",
      "in_transit",
      "delivered",
    ] as const) {
      const adv = await request.post("/api/delivery/advance", {
        data: { orderId: trackOrderId },
      });
      expect(adv.ok()).toBeTruthy();
      const body = (await adv.json()) as {
        shipment: { status: string };
        territoryFlag: string;
      };
      expect(body.shipment.status).toBe(expected);
      expect(body.territoryFlag).toBe("OPEN");
    }
  });
});
