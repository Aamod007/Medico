# Medico Multi-Layer Quality Assurance & Tri-Sync Test Suite

This directory contains the automated end-to-end (E2E), API contract, accessibility, database integrity, and race-condition regression test suites for the Medico pharmacy platform.

---

## 1. The Tri-Sync Testing Framework (`assertTriSync`)

The core methodology of this repository is the **Tri-Sync Framework** implemented in `tests/helpers/tri-sync.ts`. For every key customer action, `assertTriSync(page, action, expectations)` simultaneously asserts multi-layer agreement in strict order:

1. **Layer 1: UI State**
   - Visible elements, toast notifications, badges (cart/wishlist), disabled states, and URL parameters.
2. **Layer 2: Network & API**
   - Intercepts requests, validates response status codes, payload shapes, and parses bodies against shared `@medico/shared` Zod schemas. Ensures zero unhandled console errors.
3. **Layer 3: Direct Database Verification**
   - Directly queries the PostgreSQL database via Prisma client (bypassing application routes) to verify row counts, column values, timestamps, and foreign keys.
4. **Layer 4: Derived & Cached Data**
   - Recomputes denormalized counters from source tables (cart count, total prices, rating averages) and asserts synchronization with cache/store states.
5. **Layer 5: Side Effects & External Gateways**
   - Confirms audit logs (`OrderStatusHistory`, `AuditLog`), tax invoice generation, and Razorpay test mode state.

### Example Tri-Sync Test Pattern

```ts
import { test, expect } from "@playwright/test";
import { assertTriSync } from "../helpers/tri-sync";
import { prisma } from "../helpers/db-snapshot";

test("Customer adds medicine to cart with multi-layer sync", async ({ page }) => {
  await page.goto("/products/paracetamol-500mg-tablet");

  const result = await assertTriSync(
    page,
    async () => {
      await page.click('[data-testid="add-to-cart-btn"]');
    },
    {
      ui: {
        visibleElements: ['text=Added to Cart'],
        cartBadgeCount: 1,
      },
      network: {
        endpointPattern: /\/api\/cart/,
        expectedStatus: 200,
      },
      database: {
        query: async () => prisma.cartItem.findFirst({
          where: { variant: { product: { slug: "paracetamol-500mg-tablet" } } },
        }),
        expected: { quantity: 1 },
      },
    }
  );

  expect(result.passed).toBe(true);
});
```

---

## 2. Global Consistency Invariants Audit (C1 - C13)

Global database invariants are verified before and after test suites using `scripts/consistency-audit.sql` and the runner `scripts/run-consistency-audit.mjs`:

- **C1: Stock Integrity**: No negative inventory batch quantities; zero sales from expired batches.
- **C2: Cart Integrity**: Cart item quantities strictly positive (> 0) and mapped to active variants.
- **C3: Order Mathematics**: Total Amount = Subtotal - Discount + Delivery Fee (tax-inclusive pricing). Order items subtotal equals Order subtotal.
- **C4: Payment Capture**: Every PAID order has at least one captured payment; zero orphan payment rows.
- **C5: Status History State Machine**: Order status matches the latest sequential entry in `OrderStatusHistory`.
- **C7: Rating Bounds**: Product ratings strictly between 1 and 5 stars.
- **C8: Coupon Utilization**: `Coupon.usedCount` strictly matches the count of orders utilizing the code.
- **C9: Referential Integrity**: Zero orphan cart items or wishlist entries.
- **C11: Address Defaults**: At most one default delivery address per user.
- **C12: Order Number Uniqueness**: Zero duplicate order numbers across the entire platform.
- **C13: Foreign Key Integrity**: Zero orphan order items or inventory batches.

Run the consistency audit at any time with:
```bash
node scripts/run-consistency-audit.mjs
```

---

## 3. Directory Layout

- `tests/e2e/`: Playwright end-to-end customer journeys (`j1` through `j17`).
- `tests/api/`: Security, IDOR prevention, Razorpay webhook signature verification, and FEFO oversell race condition tests.
- `tests/a11y/`: Automated WCAG 2.1 AA accessibility checks via `@axe-core/playwright`.
- `tests/helpers/`:
  - `tri-sync.ts`: Multi-layer verification helper.
  - `db-snapshot.ts`: Test isolation, snapshot capture, and state reset utilities.

---

## 4. Running the Tests

Execute all verification suites:
```bash
npm run test:all
```

Run specific test suites:
```bash
# Playwright End-to-End Journeys
npx playwright test

# API Contract, Security & Concurrency Tests
npx vitest run

# Global Database Invariants Audit
node scripts/run-consistency-audit.mjs
```
