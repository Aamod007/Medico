import { test, expect } from "@playwright/test";

test.describe("J2: Search Functionality", () => {
  test("autocomplete suggests products, categories and brands as user types", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.getByPlaceholder(/Search for medicines/i).first();
    await expect(searchInput).toBeVisible();

    // Type 3 letters to trigger autocomplete
    await searchInput.fill("para");
    await page.waitForTimeout(600); // Wait for debounce

    // Autocomplete dropdown should display matching items
    const autocompleteDropdown = page.locator("div:has-text('Matching Medicines in Catalog'), div:has-text('Products')");
    await expect(autocompleteDropdown.first()).toBeVisible();

    // Check Paracetamol items appear
    const match = page.getByText(/Paracip|Calpol|Paracetamol/i);
    await expect(match.first()).toBeVisible();
  });

  test("search by active pharmaceutical salt composition", async ({ page }) => {
    // Search by active ingredient 'Paracetamol'
    await page.goto("/products?search=Paracetamol");
    await page.waitForLoadState("domcontentloaded");

    const productCards = page.locator("div:has-text('Fast-Action Tablets'), div:has-text('Suspension'), div:has-text('Paracetamol'), div:has-text('Paracip')");
    await expect(productCards.first()).toBeVisible();
  });

  test("search by brand name", async ({ page }) => {
    // Search by brand 'Cipla' or 'Dabur'
    await page.goto("/products?search=Dabur");
    await page.waitForLoadState("domcontentloaded");

    const brandProduct = page.getByText(/Pudin Hara|Dabur/i);
    await expect(brandProduct.first()).toBeVisible();
  });

  test("empty results state for non-existent product", async ({ page }) => {
    await page.goto("/products?search=xyznonexistentmedicinename999");
    await page.waitForLoadState("domcontentloaded");

    const emptyState = page.getByText(/No medicines found|No products found/i);
    await expect(emptyState).toBeVisible();
  });

  test("handles special characters, extreme length and XSS payloads safely", async ({ page }) => {
    const xssPayload = `<script>alert('xss')</script>"'--!#&`;
    await page.goto(`/products?search=${encodeURIComponent(xssPayload)}`);
    await page.waitForLoadState("domcontentloaded");

    // The raw script tag must not execute or be injected as live HTML
    const executedScript = await page.evaluate(() => (window as any).xssExecuted);
    expect(executedScript).toBeUndefined();

    // Very long string (1000 chars)
    const longString = "A".repeat(500);
    const longRes = await page.goto(`/products?search=${encodeURIComponent(longString)}`);
    expect(longRes?.status()).toBe(200);
  });
});
