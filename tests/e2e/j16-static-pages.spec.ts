import { test, expect } from "@playwright/test";

test.describe("J16: Static, Legal and Policy Pages", () => {
  const pages = [
    { path: "/about", expectedText: /About Pharmico|Mission|Healthcare/i },
    { path: "/contact", expectedText: /Contact Us|Get in Touch|Support/i },
    { path: "/faqs", expectedText: /Frequently Asked Questions|FAQ/i },
    { path: "/terms", expectedText: /Terms of Service|Terms & Conditions/i },
    { path: "/privacy", expectedText: /Privacy Policy|Data Protection/i },
    { path: "/refund", expectedText: /Shipping & Returns Policy|Refund/i },
    { path: "/shipping", expectedText: /Shipping & Returns Policy|Delivery/i },
    { path: "/shipping-returns", expectedText: /Shipping & Returns Policy/i },
  ];

  for (const p of pages) {
    test(`page ${p.path} loads with HTTP 200 and renders expected content`, async ({ page }) => {
      const res = await page.goto(p.path);
      expect(res?.status()).toBe(200);
      await page.waitForLoadState("domcontentloaded");

      const match = page.getByText(p.expectedText);
      await expect(match.first()).toBeVisible();
    });
  }

  test("custom 404 page renders for missing routes", async ({ page }) => {
    const res = await page.goto("/completely-unknown-route-404-check");
    await page.waitForLoadState("domcontentloaded");

    const notFoundText = page.getByText(/Page Not Found|404/i);
    await expect(notFoundText.first()).toBeVisible();
  });
});
