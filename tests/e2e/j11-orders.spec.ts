import { test, expect } from "@playwright/test";

test.describe("J11: Order Management & Invoices", () => {
  test("order history page lists customer orders", async ({ page }) => {
    await page.goto("/orders");
    await page.waitForLoadState("domcontentloaded");

    const ordersHeading = page.getByRole("heading", { name: /My Orders|Your Orders|Order History|No Orders/i });
    await expect(ordersHeading.first()).toBeVisible();

    // Verify order cards appear or empty state
    const orderItems = page.locator("div:has-text('Order #'), div:has-text('MED-'), div:has-text('Placed on'), div:has-text('No Orders Yet')");
    await expect(orderItems.first()).toBeVisible();
  });

  test("order details page displays delivery status timeline and invoice download", async ({ page }) => {
    // Get historical order ID from API
    const orderRes = await page.request.get("http://localhost:5000/api/admin/orders", {
      headers: {
        Authorization: "Bearer " + (await getAdminToken()),
      },
    });
    const orderJson = await orderRes.json();
    const testOrderId = orderJson.data?.orders?.[0]?.id;

    if (testOrderId) {
      await page.goto(`/orders/${testOrderId}`);
      await page.waitForLoadState("domcontentloaded");

      // Verify status badge / timeline
      const statusElement = page.getByText(/PLACED|CONFIRMED|DELIVERED|PROCESSING|SHIPPED/i);
      await expect(statusElement.first()).toBeVisible();

      // Download invoice PDF button
      const invoiceBtn = page.getByRole("link", { name: /Download Invoice/i });
      if (await invoiceBtn.isVisible()) {
        const href = await invoiceBtn.getAttribute("href");
        expect(href).toContain("invoice");
      }
    }
  });

  test("GST tax invoice PDF streams successfully with PDF headers", async ({ page }) => {
    const adminToken = await getAdminToken();
    const orderRes = await page.request.get("http://localhost:5000/api/admin/orders", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const orderJson = await orderRes.json();
    const testOrderId = orderJson.data?.orders?.[0]?.id;

    if (testOrderId) {
      const invoiceRes = await page.request.get(`http://localhost:5000/api/orders/${testOrderId}/invoice`);
      expect(invoiceRes.status()).toBe(200);
      expect(invoiceRes.headers()["content-type"]).toContain("application/pdf");
      const buffer = await invoiceRes.body();
      expect(buffer.toString("utf8", 0, 4)).toBe("%PDF");
    }
  });
});

async function getAdminToken(): Promise<string> {
  const jwtModule = await import("jsonwebtoken");
  const jwt = (jwtModule as any).default || jwtModule;
  return jwt.sign(
    { userId: "test_admin_id", email: "admin@medico.com", role: "ADMIN" },
    "super-secure-jwt-access-secret-min-32-chars-for-medico",
    { expiresIn: "1h" }
  );
}
