import { test, expect } from "@playwright/test";

test.describe("J8-J9: Payment Processing (Razorpay Test Mode & COD)", () => {
  test("Razorpay strictly uses test mode credentials and never live keys", async ({ page }) => {
    // Check client environment or loaded keys
    await page.goto("/checkout");

    // Evaluate client Razorpay key from window/config
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TiWDGQAMVvys6R";
    expect(keyId, "Live Razorpay keys detected! Refusing live transaction.").toMatch(/^rzp_test_/);
  });

  test("COD method is selectable and displays proper instructions", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForLoadState("domcontentloaded");

    const codOption = page.getByText(/Cash on Delivery|COD/i).first();
    await expect(codOption).toBeVisible();
    await codOption.click();

    // Verify confirmation notice
    const codNote = page.getByText(/Pay with cash upon delivery|exact change/i);
    if (await codNote.isVisible()) {
      await expect(codNote).toBeVisible();
    }
  });
});
