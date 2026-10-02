# Medico Pre-Handover Codebase Cleanup Report

**Date**: 2026-10-02  
**Target Branch**: `chore/handover-cleanup`  
**Safety Backup Tag**: `pre-cleanup-backup`  
**Engineer Role**: Senior Pre-Handover Technical Lead  

---

## 1. Baseline Verification Results (Pre-Cleanup Audit)

Before applying any deletions, dependency modifications, or file refactorings, baseline verification commands were executed from the tagged commit `pre-cleanup-backup`.

| Test / Check Suite | Command | Result | Notes / Details |
|---|---|:---:|---|
| **TypeScript Typecheck** | `npm run typecheck` | **PASS** (GREEN) | 0 errors across `@medico/api` and `@medico/shared`. |
| **Code Linting** | `npm run lint` | **PASS** (GREEN) | 0 errors. Next.js emitted 15 warnings regarding unoptimized `<img>` vs `<Image />`. |
| **Production Build** | `npm run build` | **PASS** (GREEN) | All workspaces compiled cleanly. Next.js statically generated 23 routes. |
| **Workspace Unit Tests** | `npm run test` | **PASS** (GREEN) | Exit code 0 across monorepo packages. |
| **Database Consistency Invariants (C1–C13)** | `npm run test:consistency` | **PASS** (GREEN) | All 15 invariant queries satisfied (0 violations for negative stock, orphan carts, math mismatches, etc.). |
| **API & Security Tests (Vitest)** | `npm run test:api` | **PASS** (GREEN) | 3 test suites, 8 tests passed (IDOR checks, 50-thread concurrent oversell race condition, Razorpay webhook idempotency). |
| **End-to-End Test Suite (Playwright)** | `npm run test:e2e` | **FAIL** (RED) | **22 passed, 17 failed** out of 39 tests (baseline debt: a11y button-names, search debounce timing, unauthenticated test contexts). |

---

## 2. Phase 1: Comprehensive Inventory & Scan Results

### A. Static Analysis & Dead Code (`knip` Scan)
- **Unused Source Files**:
  - `apps/api/api/index.ts` (Orphaned Vercel serverless Express wrapper)
  - `apps/api/scripts/update-medicine-catalog.ts` (One-off medicine catalog patching script)
  - `apps/api/src/lib/redis-events.ts` (Dead order event pub/sub)
  - `apps/api/src/middlewares/asyncHandler.ts` (Unreferenced async handler)
  - `apps/api/src/modules/notifications/notifications.service.ts` (Stub notifications service)
  - `apps/api/src/modules/webhooks/replay.routes.ts` (Debug webhook replay endpoint)
  - `.agents/skills/ego-browser/*` (Agent browser automation skill and logs)
- **Unused Dependencies**:
  - Root: `@lhci/cli` (unused Lighthouse CLI; culprit of 17 high-severity npm audit alerts)
  - `apps/api`: `multer`, `nodemailer`, `swagger-ui-express`, `@types/multer`, `@types/nodemailer`, `@types/swagger-ui-express` (residual legacy services)
  - `apps/web`: `@tanstack/react-query`, `react-hook-form`, `recharts`
- **Misplaced Dependencies**:
  - `apps/web`: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `tailwindcss`, `postcss`, `autoprefixer` currently in `dependencies` instead of `devDependencies`.
- **Unused Exports & Types**:
  - `apps/web/src/lib/location.ts`: `detectUserLocation`, `LocationResult` (UI trigger was removed in prior audit)
  - `apps/api/src/jobs/cleanup.ts`: `runInventoryCleanup` (internal helper, only default runner exported)
  - `packages/shared/src/index.ts`: Residual legacy prescription, doctor appointment, and lab test schemas.

### B. Duplicated Code (`jscpd` Scan)
- **Duplication Rate**: 3.80% (634 duplicated lines out of 16,674 lines across 105 files).
- **Key Clones**:
  - Category icon mapping `ICON_MAP` duplicated between `Header.tsx` and `PillNav.tsx`.
  - Next.js fallback HTTP fetch logic duplicated in `apps/web/src/lib/api.ts`.

### C. File & Asset Weight Scan
- **Files > 500 Lines**:
  - `apps/api/prisma/schema.prisma` (553 lines) — *Kept: database schema protected by safety rules*
  - `apps/api/prisma/seed.ts` (2,028 lines) — *Kept: master database seed data*
  - `apps/api/prisma/supabase_schema.sql` (894 lines) — *Kept: SQL schema dump*
  - `apps/api/src/modules/catalog/catalog.controller.ts` (537 lines) — *Active controller*
  - `apps/web/src/app/page.tsx` (956 lines) — *Active homepage*
  - `apps/web/src/app/products/page.tsx` (529 lines) — *Active product listing*
  - `apps/web/src/components/Header.tsx` (749 lines) — *Active header navigation*
  - `scripts/seed-extensions.mjs` (629 lines) — *Kept: auxiliary catalog seed*
  - `package-lock.json` (13,842 lines) — *Lockfile*
- **Assets > 300 KB**:
  - Only test videos in `test-artifacts/playwright-report/data/` (all to be purged in Phase 2).
  - Production public assets are lean and optimized (0 files > 300 KB).

### D. Security, Secrets & Privacy Scan
- **Committed Live Env Files (8 files)**:
  - Root: `.env`, `.env.local`, `.env.test`, `.env.vercel`
  - Apps: `apps/api/.env`, `apps/web/.env.local`, `.vercel/.env.development.local`
  - Real credentials discovered: Clerk secret keys (`sk_test_...`), Supabase secret key (`sb_secret_...`), Razorpay test key ID (`rzp_test_...`), and PostgreSQL Supabase pooler password.
- **Git History Secrets**:
  - Multiple commits contain Razorpay test keys and Supabase credentials.
  - To be catalogued in `HANDOVER.md` under *"Secrets to rotate immediately"* with git history scrubbing options in Phase 9.
- **Freelancer Personal Data**:
  - Personal name "Aamod" in `Footer.tsx` ("Designed by Aamod") and DB password.
  - Personal domain `medico-aamod.vercel.app` referenced in bug reports.
- **Licensing & Commercial Encumbrance**:
  - 100% of production dependencies use permissive licenses (MIT, Apache-2.0, ISC, BSD-2-Clause, MPL-2.0).
  - Zero GPL/AGPL encumbrances. Commercial use is safe.
