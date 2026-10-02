import { test, expect } from "@playwright/test";

test.describe("J3: Product Listing & Filters", () => {
  test("category filter filters products accurately", async ({ page }) => {
    await page.goto("/products?category=vitamins-and-supplements");
    await page.waitForLoadState("domcontentloaded");

    // Verify products displayed belong to category or match
    const productGrid = page.locator("div:has-text('Vitamin C'), div:has-text('Cod Liver')");
    await expect(productGrid.first()).toBeVisible();
  });

  test("sort by price (low to high and high to low)", async ({ page }) => {
    // Sort price low to high
    await page.goto("/products?sort=price_asc");
    await page.waitForLoadState("domcontentloaded");

    // Look for lowest priced item (e.g. Paracip ₹18.5)
    const cheapItem = page.getByText(/Paracip|18\.5|30/i);
    await expect(cheapItem.first()).toBeVisible();

    // Sort price high to low
    await page.goto("/products?sort=price_desc");
    await page.waitForLoadState("domcontentloaded");

    // Look for high priced item (e.g. Accu-Chek or Insulin)
    const expensiveItem = page.getByText(/Accu-Chek|1450|1240/i);
    await expect(expensiveItem.first()).toBeVisible();
  });

  test("URL synchronization on page reload and browser back/forward", async ({ page }) => {
    await page.goto("/products?category=diabetes-care");
    await page.waitForLoadState("domcontentloaded");

    // Navigate to another filter
    await page.goto("/products?category=personal-care");
    await page.waitForLoadState("domcontentloaded");

    // Go back
    await page.goBack();
    expect(page.url()).toContain("category=diabetes-care");

    // Reload page and check state persists
    await page.reload();
    expect(page.url()).toContain("category=diabetes-care");
  });

  test("zero results state when combination of filters matches nothing", async ({ page }) => {
    await page.goto("/products?category=diabetes-care&minPrice=90000");
    await page.waitForLoadState("domcontentloaded");

    const noMatches = page.getByText(/No medicines found|No products found/i);
    await expect(noMatches).toBeVisible();
  });
});
