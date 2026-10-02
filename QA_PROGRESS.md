# Medico QA Progress & Journey Tracking

## Step 0: Baseline Health & Environment
- **Monorepo Workspaces**: `apps/api`, `apps/web`, `packages/shared`
- **Dependencies**: Installed & verified (`node >= 20`, `npm >= 10`)
- **Database Migrations & Regulatory Schema**: Phase 1 migration applied (`scripts/migrate-phase1-regulatory.mjs`). Trigger `enforce_rx_gate`, enums, `Prescription` and `FamilyMember` models verified.
- **Master Seed & Test Fixtures**: `npm run db:seed` & `scripts/seed-extensions.mjs` applied.
- **Typecheck (`npm run typecheck`)**: PASS (0 errors across monorepo)
- **Lint (`npm run lint`)**: PASS (0 errors across monorepo)
- **Build (`npm run build`)**: PASS (API built via `tsc`, Web built via `next build` 20/20 static/dynamic routes)
- **Database Invariant Consistency Audit (`npm run test:consistency`)**: PASS (15/15 invariants satisfied, 0 violations)
- **API Contract, IDOR & Concurrency Suite (`npm run test:api`)**: PASS (3 test suites passed, 8/8 tests passed including 50-thread FEFO 0-oversell race test)
- **Dev Servers**:
  - API Server: `http://localhost:5000` (PID active, Healthcheck `http://localhost:5000/api/health` OK)
  - Web Server: `http://localhost:3000` (Next.js 14 App Router dev server active & ready)

---

## Step 1: Customer Journey Matrix (J1 - J17)

| Journey | Description | Status | Pass/Fail/Fixed Details |
|---|---|---|---|
| **J1: Home Page** | Loads with 0 console errors; header, navigation, hero, categories, carousels, FAQs, footer links valid | PENDING | To test in browser |
| **J2: Search** | Product, typo, salt/composition, brand, SKU, gibberish, empty, long text, XSS `<script>alert(1)</script>` | PENDING | To test in browser |
| **J3: Product Listing** | Filters, combined filters, sort, pagination, Back/Forward & reload URL sync, count matches | PENDING | To test in browser |
| **J4: Product Details (PDP)** | Gallery, pack/variant switch, price/stock/SKU update, discount math, Rx badge, OOS behavior, pincode checker | PENDING | To test in browser |
| **J5: Authentication** | Register, OTP, login, logout, password reset, session persistence, guest cart merge | PENDING | To test in browser |
| **J6: Cart & Pricing** | Add, increase, decrease, remove, stock cap, save for later, tab persistence, coupons, totals math & GST | PENDING | To test in browser |
| **J7: Checkout Flow** | Address add/edit/delete/default, pincode & phone validation, non-serviceable block, slot selection, summary | PENDING | To test in browser |
| **J8: Razorpay Payments** | Test card, UPI success, failure@razorpay retry, modal close, double-click prevention, back/refresh handling | PENDING | To test in browser |
| **J9: COD Payment** | Cash on Delivery limits and Rx compliance validation | PENDING | To test in browser |
| **J10: Prescriptions** | Valid JPG/PDF, oversized/wrong type/empty, pharmacist approval flow, rejection and re-upload | PENDING | To test in browser |
| **J11: Order Management** | Confirmation page, history, detail, status timeline, PDF invoice math, cancel rules, reorder | PENDING | To test in browser |
| **J12: Account & Wishlist** | Profile, address book, saved prescriptions, wishlist, notifications persistence | PENDING | To test in browser |
| **J13: Lab Tests** | Lab tests catalog, booking, payment, history, double-booking prevention, cancellation | PENDING | To test in browser |
| **J14: Consultations** | Doctor consultation booking, slot reservation, double-booking prevention, cancellation | PENDING | To test in browser |
| **J15: Reviews & Ratings** | Buyer-only verified reviews, duplicate prevention, rating average and review count sync | PENDING | To test in browser |
| **J16: Static & Compliance** | About, Contact, policy pages, 404/500, statutory disclosures (GSTIN, DL, medical disclaimer) | PENDING | To test in browser |
| **J17: Responsive & A11y** | Mobile (390px) & Tablet (820px) layouts, sticky header, drawer overflow, keyboard nav & ARIA | PENDING | To test in browser |

---

## Step 2: Tri-Sync Status Summary
- **UI ↔ API ↔ DB**: Monitored on every journey modifying state.
- **Inventory & FEFO Batches**: 0 oversell verified.
- **Database Consistency Audit**: 0 violations maintained across passes.
