import { test, expect } from "@playwright/test";

test.describe("J1: Guest Browsing Journey", () => {
  test("home loads with no console errors and all core UI components render", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Load Homepage
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // Wait for hydration
    await page.waitForLoadState("domcontentloaded");

    // 2. Promo bar & Header
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // 3. Category Circles / Dropdown in PillNav
    const pillNav = page.locator("nav, .flex.items-center");
    await expect(pillNav.first()).toBeVisible();

    // 4. Hero section CTAs
    const heroHeadline = page.getByRole("heading", { level: 1 });
    await expect(heroHeadline).toBeVisible();
    await expect(heroHeadline).toContainText(/Pharmacy|Delivered|Health/i);

    // 5. "Select a product" quick shop bar
    const quickBar = page.getByText("Select a product", { exact: false });
    await expect(quickBar).toBeVisible();

    // 6. Featured & Best Sellers sections
    const featuredHeading = page.getByText(/Featured This Month/i);
    await expect(featuredHeading).toBeVisible();

    const bestSellersHeading = page.getByText(/Best Seller/i);
    await expect(bestSellersHeading).toBeVisible();

    // 7. Trust marquee / benefits
    const trustElements = page.getByText(/100% Genuine/i);
    await expect(trustElements.first()).toBeVisible();

    // 8. FAQ Accordion functionality
    const faqItem = page.getByText("How long does Pharmico deliver medicines?", { exact: false });
    await expect(faqItem).toBeVisible();
    await faqItem.click();

    // 9. Licensed Pharmacy statutory disclosures in footer
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("KA-BLR-2024-00129"); // Drug license
    await expect(footer).toContainText("29AAAAA0000A1Z5"); // GSTIN
    await expect(footer).toContainText("Pooja Verma"); // Pharmacist

    // 10. Verify critical footer links resolve with 200 (no 404s)
    const links = [
      "/products",
      "/about",
      "/contact",
      "/faqs",
      "/terms",
      "/privacy",
      "/refund",
      "/shipping",
      "/shipping-returns",
    ];

    for (const link of links) {
      const linkRes = await page.request.get(link);
      expect(linkRes.status(), `Link ${link} failed with status ${linkRes.status()}`).toBe(200);
    }

    // Filter out expected 3rd party warnings (e.g. clerk missing keys in demo, external CDNs)
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("clerk") &&
        !err.includes("favicon") &&
        !err.includes("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") &&
        !err.includes("Razorpay") &&
        !err.includes("Failed to load resource")
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
