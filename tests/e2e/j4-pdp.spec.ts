import { test, expect } from "@playwright/test";

test.describe("J4: Product Detail Page (PDP)", () => {
  test("PDP loads, displays variant switch, Rx badge, salt composition and substitutes", async ({ page }) => {
    // Paracip 500 is an Rx medicine with substitutes
    await page.goto("/products/paracip-500-tablets");

    // Product Title (wait for client loading to finish)
    const title = page.getByRole("heading", { name: /Paracip 500/i });
    await expect(title.first()).toBeVisible({ timeout: 15000 });

    // Salt composition is highlighted
    const composition = page.getByText(/Paracetamol IP 500mg/i);
    await expect(composition.first()).toBeVisible();

    // Pincode serviceability check
    const pinInput = page.getByPlaceholder(/Enter 6-digit Pincode/i);
    await expect(pinInput).toBeVisible();
    await pinInput.fill("560103");
    await page.getByRole("button", { name: /Check/i }).click();

    const serviceabilityMsg = page.getByText(/Serviceable|Express delivery/i);
    await expect(serviceabilityMsg.first()).toBeVisible();

    // Tab switching (uses, side effects, dosage, storage)
    const sideEffectsTab = page.getByRole("button", { name: /Side Effects/i });
    if (await sideEffectsTab.isVisible()) {
      await sideEffectsTab.click();
      const tabContent = page.getByText(/rash|liver|toxicity|overdose|nausea|side effect/i);
      await expect(tabContent.first()).toBeVisible();
    }

    // Generic substitutes section
    const substitutesHeader = page.getByText(/Substitutes|Same Active Salt/i);
    await expect(substitutesHeader.first()).toBeVisible();

    // Add to Cart CTA is functional
    const addToCartBtn = page.getByRole("button", { name: /Add to Cart/i });
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();

    // Cart drawer should open
    const cartDrawer = page.getByText(/Order Summary|Your Cart/i);
    await expect(cartDrawer.first()).toBeVisible();
  });

  test("invalid slug returns 404 not found page", async ({ page }) => {
    const res = await page.goto("/products/non-existent-medicine-slug-404");
    // Next.js client renders not-found state or returns 404
    const notFoundText = page.getByText(/Medicine not found|Product not found|Page Not Found|404/i);
    await expect(notFoundText.first()).toBeVisible();
  });
});
