# Medico Bug Tracker & Remediation Log

| Bug ID | Severity | Area | Summary | Root Cause (file:line) | Status | Commit / Fix Ref |
|---|---|---|---|---|---|---|
| BUG-000 | P2 | Build/Lint | `npm run lint` failed due to missing ESLint config & packages in `apps/web` | `apps/web/.eslintrc.json` missing, causing interactive CLI prompt hang | FIXED | `fed7e2a` |
| BUG-001 | P1 | Catalog API | Catalog sort by price (`price_asc`/`price_desc`) sorts by variant count instead of price | `apps/api/src/modules/catalog/catalog.controller.ts:100` | OPEN | Scheduled in Phase 3 |
| BUG-002 | P0 | Security / RBAC | Admin endpoints (`/api/admin/*`) completely unauthenticated and accessible to any public user | `apps/api/src/modules/admin/admin.routes.ts:15-20` | OPEN | Scheduled in Phase 3 |
| BUG-003 | P2 | Catalog / Compliance | Missing substitute medicine endpoint `/api/catalog/products/:slug/substitutes` for generic/salt matching | `apps/api/src/modules/catalog/catalog.routes.ts` missing substitute route | OPEN | Scheduled in Phase 3 |
| BUG-004 | P2 | Storefront UX | Missing static policy pages for Refund Policy (`/refund`) and Shipping Policy (`/shipping`) | `apps/web/src/app` missing policy routes | OPEN | Scheduled in Phase 2 |
| BUG-005 | P2 | Pharmacy Compliance | Storefront footer missing mandatory pharmacy disclosures: Drug License Number, GSTIN, and Licensed Pharmacist details | `apps/web/src/components/Footer.tsx` | OPEN | Scheduled in Phase 2 |
| BUG-006 | P1 | Admin Portal | Admin frontend routes (`/admin`, `/admin/prescriptions`, `/admin/orders`, `/admin/inventory`) missing from Next.js web application | `apps/web/src/app/admin` directory absent | OPEN | Scheduled in Phase 2 |
| BUG-007 | P0 | Orders / Core API | Prisma interactive transaction 5s default timeout crashed API server with unhandled error on order placement | `apps/api/src/modules/orders/orders.controller.ts:147` | FIXED | `fix(orders): BUG-007 transaction timeout & error handling` |

---

## Detailed Bug Reports

### BUG-000: Missing ESLint in apps/web causes interactive prompt hang during `npm run lint`
- **Severity**: P2
- **Area**: Build & Tooling
- **Steps to reproduce**: Run `npm run lint` across monorepo.
- **Expected**: Automated non-interactive linting completes with code 0 or lint error reports.
- **Actual**: `apps/web` prompted interactively: `How would you like to configure ESLint?`, failing CI/build pipelines.
- **Root Cause**: `apps/web/package.json` lacked `eslint` and `eslint-config-next`, and no `.eslintrc.json` was present.
- **Fix**: Installed `eslint` and `eslint-config-next` in `apps/web` and created `apps/web/.eslintrc.json` extending `next/core-web-vitals`.
- **Status**: FIXED (`fed7e2a`)

### BUG-001: Catalog Sort by Price Orders by Variant Count
- **Severity**: P1
- **Area**: Catalog API
- **Steps to reproduce**: Query `GET /api/catalog/products?sort=price_asc`.
- **Expected**: Products ordered by lowest price variant ascending.
- **Actual**: In `catalog.controller.ts:100`, `orderBy = { variants: { _count: "asc" } }`, which sorts by how many variants a product has rather than its price.
- **Root Cause**: `catalog.controller.ts:100` uses `_count` on variants.
- **Fix**: Order products by minimum variant price or sort resulting dataset by effective default variant price.
- **Status**: OPEN

### BUG-002: Insecure Admin Endpoints without Authentication or Role Checks
- **Severity**: P0
- **Area**: Security / Authorization
- **Steps to reproduce**: `curl http://localhost:5000/api/admin/orders` or `PATCH http://localhost:5000/api/admin/prescriptions/123/review` without any headers.
- **Expected**: HTTP 401 Unauthorized / HTTP 403 Forbidden.
- **Actual**: Routes executed openly without auth check, leaking all patient orders, addresses, and prescription documents, and allowing unauthorized prescription approvals.
- **Root Cause**: `apps/api/src/modules/admin/admin.routes.ts` imports `authenticate, requireRole` but never mounts them on routes.
- **Fix**: Mount `authenticate, requireRole(Role.ADMIN, Role.PHARMACIST)` middleware on all admin routes.
- **Status**: OPEN

### BUG-003: Missing Generic / Salt Substitutes API Endpoint
- **Severity**: P2
- **Area**: Catalog / Compliance
- **Steps to reproduce**: Query `GET /api/catalog/products/:slug/substitutes`.
- **Expected**: Returns alternative brands with the same active pharmaceutical ingredient / salt composition.
- **Actual**: Returns HTTP 404 endpoint not found.
- **Root Cause**: Endpoint not defined in `catalog.routes.ts` or `catalog.controller.ts`.
- **Fix**: Implement `getSubstitutes` query matching `composition` and mount on `/api/catalog/products/:slug/substitutes`.
- **Status**: OPEN

### BUG-004: Missing Legal Storefront Pages (/refund and /shipping)
- **Severity**: P2
- **Area**: Storefront Pages / Compliance
- **Steps to reproduce**: Navigate to `/refund` or `/shipping`.
- **Expected**: Clear cancellation, refund, cold-chain medicine shipping policies.
- **Actual**: HTTP 404 Not Found.
- **Root Cause**: Next.js route pages absent from `apps/web/src/app`.
- **Fix**: Create `/refund` and `/shipping` pages with detailed pharmacy policies.
- **Status**: OPEN

### BUG-005: Missing Regulatory Disclosures in Storefront Footer
- **Severity**: P2
- **Area**: Pharmacy Compliance
- **Steps to reproduce**: Inspect footer on any storefront page.
- **Expected**: Visible display of Retail Drug License Number, GSTIN, Registered Pharmacist info, and Schedule drug disclaimers.
- **Actual**: Footer displays generic company info without mandatory statutory pharmacy credentials.
- **Root Cause**: `apps/web/src/components/Footer.tsx` lacks statutory pharmacy disclosure section.
- **Fix**: Add licensed pharmacy credentials and statutory medical disclaimers to footer.
- **Status**: OPEN

### BUG-006: Missing Admin & Pharmacist Review Portal Frontend
- **Severity**: P1
- **Area**: Storefront / Admin
- **Steps to reproduce**: Navigate to `http://localhost:3000/admin` or `http://localhost:3000/admin/prescriptions`.
- **Expected**: Operational dashboard for pharmacists to review prescriptions, inspect FEFO inventory, and manage order fulfillment.
- **Actual**: HTTP 404 Not Found.
- **Root Cause**: `apps/web/src/app/admin` pages never created in Next.js app directory.
- **Fix**: Implement responsive admin portal pages (`/admin`, `/admin/prescriptions`, `/admin/orders`, `/admin/inventory`).
- **Status**: OPEN

### BUG-007: Prisma Transaction 5s Timeout and Unhandled Async Rejection Crashed Server on Checkout
- **Severity**: P0
- **Area**: Orders / Core API
- **Steps to reproduce**: Execute checkout transaction with remote database connection.
- **Expected**: Order created within configured timeout, errors handled gracefully without process termination.
- **Actual**: Default 5000ms interactive transaction expired, and unhandled rejection terminated the Node.js API server with code 1.
- **Root Cause**: `orders.controller.ts:147` called `prisma.$transaction(async (tx) => ...)` with default 5000ms timeout and no `try/catch` with `next(error)`.
- **Fix**: Configured `{ maxWait: 15000, timeout: 30000 }` on `prisma.$transaction`, wrapped handlers in `try/catch` passing errors to Express error handler, and added `asyncHandler` middleware.
- **Status**: FIXED

