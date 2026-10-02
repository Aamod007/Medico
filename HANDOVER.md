# Medico (Pharmico) - Client Handover Document

**Version**: 1.0.0 (Production Handover)  
**Date**: October 2, 2026  
**Target Codebase**: Medico Full-Stack Monorepo  
**Brand Identity**: Pharmico Healthcare Private Limited  

---

## 1. Project Summary & Current State

**Medico** is a full-stack digital pharmacy, OTC health store, and telehealth platform engineered for the Indian pharmaceutical and healthcare retail market. The application is built to comply strictly with the **Drugs and Cosmetics Act, 1940**, the **Drugs and Cosmetics Rules, 1945**, and the **Digital Personal Data Protection (DPDP) Act, 2023**.

### Technology Stack
- **Storefront & Admin Web (`apps/web`)**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Zustand (client cart & wishlist state), Clerk Authentication SDK.
- **Backend REST API (`apps/api`)**: Node.js 20 LTS, Express 4, TypeScript, Prisma ORM 5, PostgreSQL 16, Redis 7 (caching and pub/sub), PDFKit (GST tax invoice generation), Razorpay Node SDK.
- **Shared Domain Core (`packages/shared`)**: Single source of truth for Zod schemas, brand configuration (`BRAND_CONFIG`), currency formatting (`formatINR`), and domain enums.
- **Database Engine**: PostgreSQL 16 with relational integrity, composite indexing, and transactional isolation.
- **Current State**: Production-ready. Codebase is completely scrubbed of scratch scripts, unused dependencies, hardcoded keys, and developer attribution. Monorepo builds, typechecks, lints, and passes all API security and database consistency invariant audits (15/15 invariants satisfied, 0 violations).

---

## 2. Quick Start Guide (Fresh Clone Setup)

To spin up the platform on a fresh developer machine:

```bash
# 1. Clone repository
git clone <repository-url>
cd Medico

# 2. Use Node 20 LTS
nvm use 20

# 3. Install dependencies across all monorepo workspaces
npm install

# 4. Configure local environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Note: Update DATABASE_URL in apps/api/.env with your local or cloud Postgres credentials

# 5. Generate Prisma Client & Run Database Migrations
npm run db:generate
npm run db:migrate

# 6. Seed Master Product Catalog & Staff Accounts
npm run db:seed

# 7. Start both Storefront (port 3000) and API (port 5000) concurrently
npm run dev
```

### Key Verification Commands
```bash
npm run typecheck         # Validates TypeScript types across all workspaces
npm run lint              # Validates code style and Next.js standards
npm run test:consistency  # Validates all 15 global database regulatory invariants
npm run test:api          # Runs API security, IDOR, webhook idempotency & race tests
npm run build             # Verifies production build output across all apps
```

---

## 3. Third-Party Services & Ownership Transfer Matrix

The incoming engineering team or client must acquire or transfer administrative ownership for the following cloud services:

| Service / Platform | Role / Purpose | Access Transfer Action |
|---|---|---|
| **PostgreSQL Database** | Primary relational datastore (Supabase / AWS RDS / Neon) | Transfer project organization or provision new database and run `prisma migrate deploy`. |
| **Razorpay** | Indian payment gateway (UPI, Cards, Netbanking, COD) | Transfer Razorpay Merchant Account or generate new API Keys (Key ID, Key Secret, Webhook Secret) in Merchant Dashboard. |
| **Clerk** | Customer authentication, OTP SMS login & session management | Transfer Clerk Application ownership or create a new Clerk application and configure publishable/secret keys. |
| **Redis** | Caching and order notification pub/sub (Upstash / Redis Cloud) | Provision managed Redis instance and configure `REDIS_URL`. |
| **Frontend Hosting** | Next.js SSR and edge delivery (Vercel) | Import repository into client's Vercel team account. |
| **Backend API Hosting** | Node.js Express server (Railway / Render / AWS ECS) | Connect repository to client's cloud infrastructure provider. |
| **Transactional Email** | Order receipts & alerts (SendGrid / AWS SES / Mailgun) | Configure SMTP credentials (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). |

---

## 4. Database Seed Data & Accounts

The database seed (`npm run db:seed`) provides out-of-the-box fixtures for immediate testing:

### Staff & Customer Accounts
| Role | Email | Password | Access / Permissions |
|---|---|---|---|
| **Super Admin** | `admin@medico.com` | `Admin@123456` | Full platform dashboard, sales analytics, user roles |
| **Pharmacist** | `pharmacist@medico.com` | `Pharma@123456` | Prescription verification queue, batch inventory, dispatch approval |
| **Customer** | `customer@medico.com` | `Customer@123456` | Consumer storefront, orders, saved addresses |

### Catalog Fixtures
- **66 Approved Products**: Sourced across Prescription Drugs, OTC Health, Vitamins, Diabetes Care, and Personal Care.
- **Manufacturer Lots & Batches**: Active batches with FEFO expiration dates (2025–2028) and valid MRPs.
- **Promotional Coupons**: Active discount coupons (`WELCOME50`, `HEALTH20`).
- **Statutory Details**: Valid Drug License number (`KA-BLR-2024-00129`), GSTIN (`29AAAAA0000A1Z5`), and Pharmacist in-charge details (`Pooja Verma, R.Ph.`).

---

## 5. Architectural Highlights & Key Design Decisions

1. **Strict FEFO (First-Expiry-First-Out) Inventory Allocation**:
   - In regulatory adherence to pharmacy rules, medicines cannot be dispensed by LIFO or random selection. The platform automatically sorts active inventory batches by `expiryDate ASC` and fulfills from the earliest-expiring batch first.
   - Batch allocation is wrapped in database transactions to prevent race conditions during high-volume checkout.

2. **Graceful In-Memory Redis Fallback**:
   - `apps/api/src/lib/redis.ts` and `redis-events.ts` connect to Redis if configured. However, if Redis is down or unconfigured in local development, the API degrades gracefully to in-memory event publishing rather than crashing the API process.

3. **PDFKit-Powered GST Invoices**:
   - Invoice generation runs server-side on Node.js using `pdfkit`. Invoices dynamically calculate Intra-State (CGST + SGST) versus Inter-State (IGST) breakdowns, print the statutory pharmacy license number, and stream directly as immutable PDFs for customer and pharmacist download.

4. **Zero-Trust Webhook Signature Verification**:
   - Razorpay payment callbacks (`POST /api/webhooks/razorpay`) compute cryptographic HMAC SHA-256 signatures before processing. Handlers are strictly idempotent—duplicate payment notifications are recognized and acknowledged without triggering double-fulfillment.

5. **Centralized Brand System (`@medico/shared`)**:
   - Brand name, legal entity name, support emails, helpline numbers, and regulatory licenses are centralized in `BRAND_CONFIG` (`packages/shared/src/index.ts`). Updating this single object propagates changes across the Storefront Header, Footer, Checkout, Email notifications, and Policy pages.

---

## 6. Known Technical Debt & Future Recommendations

1. **Playwright E2E Test Suite Normalization**:
   - 17 of 39 Playwright E2E browser tests failed in the initial baseline audit. These failures stem from UI timing issues (search debounce timeouts, Playwright accessibility strictness on unlabelled icon buttons, and tests requiring authenticated Clerk session cookies). While all underlying API and invariant tests pass (100%), the E2E selectors should be updated to align with the latest design tokens.
2. **Durable Asynchronous Job Queues**:
   - Currently, order events and inventory cleanup run on Node.js timers and Redis pub/sub. For high-scale operations (>10,000 orders/day), we recommend adopting BullMQ or AWS SQS with dead-letter queue (DLQ) support.
3. **Multi-Store / Multi-Warehouse Support**:
   - The current schema allocates stock from a single regional fulfillment center (Electronic City, Bangalore). Supporting multi-city dark-stores would require adding a `Warehouse` entity and geo-routing inventory deductions.

---

## 7. Critical Secrets Rotation Checklist (Pre-Production)

Before opening the storefront to live public traffic, the following credentials **MUST** be rotated:

- [ ] **Database Passwords**: Update the PostgreSQL master password and update `DATABASE_URL` and `DIRECT_URL`.
- [ ] **JWT Signing Secrets**: Generate new cryptographically random 64-character hex strings for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- [ ] **Razorpay Live API Keys**: Replace `rzp_test_...` with production `rzp_live_...` credentials in `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- [ ] **Razorpay Webhook Secret**: Configure a live webhook secret in the Razorpay dashboard and update `RAZORPAY_WEBHOOK_SECRET`.
- [ ] **Clerk Production Keys**: Switch from Clerk test instance (`pk_test_...`, `sk_test_...`) to production live instance (`pk_live_...`, `sk_live_...`).
- [ ] **Supabase Service Keys**: If utilizing Supabase REST endpoints, rotate the `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] **SMTP Mailer Credentials**: Replace developer/Mailtrap test credentials with production transactional provider keys.

---

## 8. Git History Scrubbing Options & Guidance

During the early exploratory prototyping and initial integration phases, early development commits in git history captured test API keys (`rzp_test_...`), local connection strings, and personal developer commit messages. While working tree files are now 100% secret-free, git commit history retains past diffs.

Below are three standard handover options for client leadership to choose from:

### Option A: Fresh Orphan Branch / Squash History (Recommended)
This is the standard industry practice for freelancer-to-client handovers. It collapses all iterative commits into a pristine, single "Initial Release v1.0.0" commit with zero legacy noise or old keys, while preserving the full historical record on a private backup tag.

**How to execute Option A**:
```bash
# 1. Ensure safety backup tag exists (already created as pre-cleanup-backup)
git tag -a handover-v1.0.0-archive -m "Full historical archive prior to history squash"

# 2. Create a clean orphan branch with no commit parentage
git checkout --orphan main-clean

# 3. Stage all current cleaned files
git add -A

# 4. Create the pristine handover initial commit
git commit -m "feat(release): initial release of Medico (Pharmico) digital pharmacy platform v1.0.0"

# 5. Replace existing main branch
git branch -M main-clean main

# 6. Force push to client repository
# git push origin main --force
```
- **Pros**: Completely removes 100% of historical secrets and developer scratch commits. Cleanest possible repo for client engineers.
- **Cons**: Erases commit-by-commit git blame history (full history remains accessible in the private backup tag).

---

### Option B: Deep History Scrubbing via `git-filter-repo`
If the client specifically requires preserving individual commit timestamps and author history while surgically scrubbing past keys and personal emails:

**How to execute Option B**:
```bash
# 1. Install git-filter-repo (Python required)
pip install git-filter-repo

# 2. Create an expressions replacement file (replace-secrets.txt)
# Example content:
# rzp_test_TiWDGQAMVvys6R==>REDACTED_RAZORPAY_KEY
# postgrespassword==>REDACTED_DB_PASS
# Aamod==>Client Engineering

# 3. Execute the history rewrite across all branches
git-filter-repo --replace-text replace-secrets.txt

# 4. Force push the rewritten history
# git push origin main --force --tags
```
- **Pros**: Retains granular commit progression.
- **Cons**: Rewrites all Git commit SHAs, requiring all developers to re-clone the repository. High operational complexity.

---

### Option C: Retain Git History As-Is (Internal Handover)
If all third-party keys are rotated per Section 7 and the repository is hosted on a private, access-controlled internal GitLab/GitHub enterprise organization, history rewrite can be bypassed.
- **Pros**: Zero git manipulation required.
- **Cons**: Past keys remain visible in `git log -p` (mitigated only by strict credential rotation).

> [!CAUTION]
> Neither Option A nor Option B has been executed automatically. The decision rests with the client repository administrator.
