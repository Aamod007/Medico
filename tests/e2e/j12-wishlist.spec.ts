import { test, expect } from "@playwright/test";

test.describe("J12: Wishlist & Saved Medicines", () => {
  test("wishlist page renders correctly and displays empty or saved items", async ({ page }) => {
    await page.goto("/wishlist");
    await page.waitForLoadState("domcontentloaded");

    const wishlistTitle = page.getByRole("heading", { name: /Wishlist|Saved/i });
    await expect(wishlistTitle.first()).toBeVisible();
  });
});
