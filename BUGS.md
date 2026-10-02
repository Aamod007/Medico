# Medico Bug Tracker & Remediation Log

| Bug ID | Severity | Area | Summary | Root Cause (file:line) | Status | Commit / Fix Ref |
|---|---|---|---|---|---|---|
| BUG-001 | P1 | Catalog API | Catalog sort by price sorted by variant count instead of actual price | `apps/api/src/modules/catalog/catalog.controller.ts:100` | FIXED | `f2dc711` |
| BUG-002 | P0 | Security / RBAC | Admin endpoints (`/api/admin/*`) completely unauthenticated | `apps/api/src/modules/admin/admin.routes.ts:15-20` | FIXED | `529a3ef` |
| BUG-003 | P2 | Catalog / Compliance | Missing substitute medicine endpoint for generic salt matching | `apps/api/src/modules/catalog/catalog.routes.ts` | FIXED | `00f037a` |
| BUG-004 | P2 | Storefront UX | Missing static policy pages for Refund (`/refund`) and Shipping (`/shipping`) | `apps/web/src/app` missing policy routes | FIXED | `deabff3` |
| BUG-005 | P2 | Pharmacy Compliance | Storefront footer missing statutory disclosures (Drug License, GSTIN) | `apps/web/src/components/Footer.tsx` | FIXED | `deabff3` |
| BUG-006 | P1 | Admin Portal | Admin frontend routes (`/admin`, `/admin/orders`, `/admin/inventory`) missing | `apps/web/src/app/admin` directory absent | FIXED | `deabff3` |
| BUG-007 | P0 | Orders / Core API | Prisma interactive transaction 5s default timeout crashed API server | `apps/api/src/modules/orders/orders.controller.ts:147` | FIXED | `e77b4ed` |
| BUG-008 | P2 | Payments / Webhook | Razorpay webhook test called non-existent path `/webhooks/razorpay` | Route mounted at `/payments/webhook` in `payments.routes.ts` | FIXED | `1078812` |
| BUG-009 | P0 | Inventory / Concurrency | Read-modify-write race condition allowed potential oversell | `apps/api/src/modules/inventory/inventory.service.ts` | FIXED | `b008a0f` |
| BUG-010 | P1 | Latency / Localhost | Sydney DB latency (~300ms) and Clerk middleware caused localhost loading hang | `apps/web/middleware.ts` & `catalog.controller.ts` | FIXED | `b008a0f` |
| BUG-011 | P0 | Vercel Deployment | Storefront failed to load catalog sections dynamically on deployed Vercel URL | `apps/web/src/lib/api.ts` defaulted to `localhost:5000` | FIXED | `2067ffa` |
| BUG-012 | P0 | Invariants / Tax | C3 Indian GST retail double-taxation mismatch in database orders | `apps/api/prisma/seed.ts` & `scripts/seed-extensions.mjs` | FIXED | Baseline fix |
| BUG-013 | P1 | Invariants / Ledger | C4 Missing captured payment ledger records for delivered/shipped orders | Database payments table lacked captured records | FIXED | Baseline fix |
| BUG-014 | P2 | Invariants / History | C5 Prisma nested order status history identical millisecond timestamps caused non-deterministic ordering | `OrderStatusHistory` creation lacked timestamp spacing | FIXED | Baseline fix |
| BUG-015 | P1 | Invariants / Coupons | C8 Coupon usage count desynchronization with historical completed orders | `Coupon.usedCount` mismatched actual order usages | FIXED | Baseline fix |
| BUG-019 | P1 | Invariants / Seed | Invariant C4, C5, C8 and Prescription schema desynchronization in seed-extensions | `scripts/seed-extensions.mjs` and `scripts/migrate-phase1-regulatory.mjs` | FIXED | Baseline fix |

---

## Detailed Active & Fixed Bug Entries

### BUG-019: Invariant C4, C5, C8 and Prescription schema desynchronization in seed-extensions
- **Severity**: P1
- **Area**: Database / Invariants / QA Fixtures
- **Steps to reproduce**: Run `npm run test:consistency`.
- **Expected**: 15/15 invariants pass with 0 violations.
- **Actual**:
  1. C8 failed on `MAXUSED` (`usedCount: 5`, actual orders: 0) and `WELCOME50`.
  2. C5 failed on 9 orders where status history rows had identical timestamps.
  3. C4 failed on Orders 3 and 4 which were marked PAID without captured payment records.
  4. `seed-extensions.mjs` failed with `Null constraint violation on fileUrl` and missing `PrescriptionStatus` import due to Phase 1 schema changes.
- **Root Cause**:
  - `seed-extensions.mjs` used legacy prescription fields and did not populate payments for Orders 3 & 4.
  - `OrderStatusHistory` lacked sequential timestamps.
  - `MAXUSED` coupon lacked 5 order relations.
- **Fix**:
  - Updated `scripts/migrate-phase1-regulatory.mjs` to make legacy prescription columns nullable.
  - Added `PrescriptionStatus` import and aligned prescription creation to `schema.prisma`.
  - Added captured payment rows for Orders 3 and 4.
  - Added sequential 1-minute timestamp increments to all `statusHistory` entries.
  - Created 5 historical completed orders linked to `MAXUSED` and synced `WELCOME50.usedCount`.
- **Status**: FIXED
