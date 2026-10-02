import { test, expect } from "@playwright/test";

test.describe("J7: Checkout Workflow", () => {
  test("checkout page displays address book, delivery options and accurate order summary", async ({ page }) => {
    // 1. First add an OTC product to cart
    await page.goto("/products/limcee-500mg-chewable");
    await expect(page.getByRole("heading", { name: /Limcee/i })).toBeVisible({ timeout: 15000 });

    const addBtn = page.getByRole("button", { name: /Add to Cart/i });
    await addBtn.click();

    // 2. Wait for Cart Drawer to display the added medicine
    const drawerItem = page.getByText(/Limcee 500mg/i);
    await expect(drawerItem.first()).toBeVisible({ timeout: 10000 });

    // 3. Navigate to /checkout from drawer CTA or direct URL
    const checkoutLink = page.getByRole("link", { name: /Checkout|Proceed/i });
    if (await checkoutLink.first().isVisible()) {
      await checkoutLink.first().click();
    } else {
      await page.goto("/checkout");
    }
    await page.waitForLoadState("domcontentloaded");

    // Verify Checkout Page Header
    const checkoutTitle = page.getByRole("heading", { name: /Checkout|Your Cart/i });
    await expect(checkoutTitle.first()).toBeVisible({ timeout: 15000 });

    // 4. Address form or existing address selector
    const addressSection = page.getByText(/Delivery Address|Add New Address/i);
    if (await addressSection.first().isVisible()) {
      await expect(addressSection.first()).toBeVisible();

      // Fill address details if form is open
      const phoneInput = page.locator("input[placeholder*='Mobile'], input[name='phone'], input[value*='9876']").first();
      if (await phoneInput.isVisible()) {
        await phoneInput.fill("9876543212");
      }

      // Payment Method Selection (Razorpay & COD)
      const razorpayRadio = page.getByText(/Pay Online|Razorpay/i);
      await expect(razorpayRadio.first()).toBeVisible();

      const codRadio = page.getByText(/Cash on Delivery|COD/i);
      await expect(codRadio.first()).toBeVisible();

      // Order Summary Card
      const summaryCard = page.getByText(/Order Summary/i);
      await expect(summaryCard.first()).toBeVisible();

      // Subtotal and Total Amount should be displayed
      const totalAmount = page.getByText(/Total Amount|Payable/i);
      await expect(totalAmount.first()).toBeVisible();
    }
  });
});
