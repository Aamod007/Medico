import { test, expect } from "@playwright/test";

test.describe("J17: Cross-Browser & Responsive Layouts", () => {
  const viewports = [
    { name: "Desktop (1440x900)", width: 1440, height: 900 },
    { name: "Tablet (820x1180)", width: 820, height: 1180 },
    { name: "Mobile (390x844)", width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    test(`renders home layout cleanly at ${vp.name} without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");

      // Check header is visible
      const header = page.locator("header");
      await expect(header).toBeVisible();

      // Check for horizontal overflow (document width should not exceed window viewport)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll, `Horizontal overflow detected at ${vp.name}!`).toBe(false);
    });

    test(`renders product listing at ${vp.name} with responsive grid`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/products");
      await page.waitForLoadState("domcontentloaded");

      const productsContainer = page.locator("main");
      await expect(productsContainer.first()).toBeVisible();

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll, `Horizontal overflow on /products at ${vp.name}!`).toBe(false);
    });
  }
});
