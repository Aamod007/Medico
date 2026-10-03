import { test, expect } from "@playwright/test";

test.describe("Location Section Redesign & Account Autofill", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to test clean state
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
  });

  test("location dropdown has NO current location option and NO saved addresses", async ({ page }) => {
    const trigger = page.locator('[data-testid="location-dropdown-trigger"]');
    await expect(trigger).toBeVisible();

    // Click trigger to open dropdown
    await trigger.click();

    // Verify Dropdown Menu is visible
    const dropdown = page.locator("header").getByText("Delivery Location");
    await expect(dropdown).toBeVisible();

    // Verify "Use Current Location" or "GPS" is NOT present
    await expect(page.getByText("Use Current Location", { exact: false })).toHaveCount(0);
    await expect(page.getByText("GPS / IP", { exact: false })).toHaveCount(0);

    // Verify "Your Saved Addresses" is NOT present
    await expect(page.getByText("Your Saved Addresses", { exact: false })).toHaveCount(0);

    // Verify City section is present
    await expect(page.getByText("Select City", { exact: false })).toBeVisible();

    // Verify Cities list has popular cities
    await expect(page.locator('[data-city-option="Bangalore"]')).toBeVisible();
    await expect(page.locator('[data-city-option="Mumbai"]')).toBeVisible();
    await expect(page.locator('[data-city-option="Delhi NCR"]')).toBeVisible();

    // Verify Pincode input is present
    const pinInput = page.getByPlaceholder("e.g. 560001");
    await expect(pinInput).toBeVisible();
  });

  test("selecting a city sets location, saves to storage, and auto-fills on reload", async ({ page }) => {
    const trigger = page.locator('[data-testid="location-dropdown-trigger"]');
    await trigger.click();

    // Select Mumbai
    const mumbaiBtn = page.locator('[data-city-option="Mumbai"]');
    await mumbaiBtn.click();

    // Verify header updates to Mumbai (400001)
    await expect(trigger).toContainText("Mumbai");
    await expect(trigger).toContainText("400001");

    // Verify localStorage has saved location
    const storedCity = await page.evaluate(() => localStorage.getItem("medico_city"));
    const storedPin = await page.evaluate(() => localStorage.getItem("medico_pincode"));
    expect(storedCity).toBe("Mumbai");
    expect(storedPin).toBe("400001");

    // Simulate "when next time he comes auto fill that location" by reloading
    await page.reload();
    await expect(trigger).toContainText("Mumbai");
    await expect(trigger).toContainText("400001");
  });

  test("entering a pincode resolves city, saves, and auto-fills on return", async ({ page }) => {
    const trigger = page.locator('[data-testid="location-dropdown-trigger"]');
    await trigger.click();

    const pinInput = page.getByPlaceholder("e.g. 560001");
    await pinInput.fill("110001");

    // Live preview resolves 110001 to Delhi NCR
    await expect(page.getByText("Delhi NCR", { exact: false }).first()).toBeVisible();

    // Click Save
    const saveBtn = page.getByRole("button", { name: "Save" });
    await saveBtn.click();

    // Header updates to Delhi NCR (110001)
    await expect(trigger).toContainText("Delhi NCR");
    await expect(trigger).toContainText("110001");

    // Verify next time user comes (new page load)
    await page.reload();
    await expect(trigger).toContainText("Delhi NCR");
    await expect(trigger).toContainText("110001");
  });
});
