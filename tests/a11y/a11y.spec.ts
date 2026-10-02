import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Phase 4: WCAG 2.1 AA Accessibility Audits", () => {
  const pagesToAudit = [
    { name: "Home Page", path: "/" },
    { name: "Products Catalog", path: "/products" },
    { name: "Product Detail Page", path: "/products/paracetamol-500mg-tablet" },
    { name: "Checkout Page", path: "/checkout" },
  ];

  for (const { name, path } of pagesToAudit) {
    test(`A11y Audit for ${name} (${path})`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const criticalOrSerious = accessibilityScanResults.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );

      if (criticalOrSerious.length > 0) {
        console.warn(
          `[A11y] ${name} has ${criticalOrSerious.length} critical/serious violations:`,
          criticalOrSerious.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length,
          }))
        );
      }

      // Invariant: Zero critical violations
      const critical = accessibilityScanResults.violations.filter((v) => v.impact === "critical");
      expect(critical).toHaveLength(0);
    });
  }
});
