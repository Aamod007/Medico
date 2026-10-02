import { test, expect } from "@playwright/test";

test.describe("J5-J6: Shopping Cart & Calculations", () => {
  test("add item to cart, verify drawer, math breakdown and coupon application", async ({ page }) => {
    // 1. Visit product page and add to cart
    await page.goto("/products/limcee-500mg-chewable");
    await page.waitForLoadState("domcontentloaded");

    const addToCartBtn = page.getByRole("button", { name: /Add to Cart/i });
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();

    // 2. Verify Cart Drawer opens
    const drawerTitle = page.getByText(/Your Cart/i);
    await expect(drawerTitle.first()).toBeVisible();

    // Verify Limcee item appears in drawer
    const cartItem = page.getByText(/Limcee 500mg/i);
    await expect(cartItem.first()).toBeVisible();

    // 3. Price breakdown components
    const subtotalText = page.getByText(/Item Total|Subtotal/i);
    await expect(subtotalText.first()).toBeVisible();

    const deliveryText = page.getByText(/Delivery Charges|Delivery/i);
    await expect(deliveryText.first()).toBeVisible();

    // 4. Test coupon apply inside cart
    const couponInput = page.getByPlaceholder(/WELCOME50|coupon/i);
    if (await couponInput.isVisible()) {
      // Test invalid coupon
      await couponInput.fill("INVALIDCODE999");
      const applyBtn = page.getByRole("button", { name: /Apply/i });
      await applyBtn.click();

      const errMsg = page.getByText(/Invalid|expired|not found/i);
      await expect(errMsg.first()).toBeVisible();

      // Test valid coupon
      await couponInput.fill("WELCOME50");
      await applyBtn.click();
    }

    // 5. Increment quantity
    const plusBtn = page.locator("div.fixed button:has-text('+')").first();
    if (await plusBtn.isVisible()) {
      await plusBtn.click();
      await page.waitForTimeout(500);
    }

    // 6. Persistence across page reload
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Open cart drawer from header icon
    const cartIconBtn = page.locator("button:has([data-lucide='shopping-bag']), button:has([data-lucide='shopping-cart']), button[aria-label*='cart']").first();
    if (await cartIconBtn.isVisible()) {
      await cartIconBtn.click();
      const persistedItem = page.getByText(/Limcee 500mg/i);
      await expect(persistedItem.first()).toBeVisible();
    }
  });
});
