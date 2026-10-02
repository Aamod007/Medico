# Medico - Architecture & Technology Discovery Notes

## 1. Overview
Medico (branded as "Pharmico" in storefront UI) is an online pharmacy, telehealth, and diagnostic lab booking platform implemented as an npm monorepo with Next.js storefront and an Express/Prisma API backend.

## 2. Actual Stack vs Expected Stack
- **Monorepo**: npm workspaces (`apps/*`, `packages/*`).
  - `apps/web`: Frontend storefront.
  - `apps/api`: Backend REST API service.
  - `packages/shared`: Shared TypeScript types, schemas, and utils.
- **Frontend**: Next.js **14.2.15** (App Router, React 18.3, Tailwind CSS 3.4, Lucide Icons, Zustand 4.5, TanStack Query 5.56, Clerk Auth 7.9, Recharts). *Note: Expected Next.js 15, actual is Next.js 14.2.*
- **Backend**: Node.js + Express 4.19 + TypeScript 5.5 + Prisma ORM 5.19.
- **Database**: PostgreSQL 16 (via Docker Compose container `medico-postgres` on port 5432 or Supabase pooler configured in `.env`).
- **Cache**: Redis 7 (via Docker Compose container `medico-redis` on port 6379, with in-memory fallback in code).
- **Payments**: Razorpay Node SDK 2.9 (Test mode only with test keys).
- **Storage**: Local filesystem (`./uploads`), configurable for Cloudinary/S3.
- **Email/SMS**: Nodemailer with SMTP fallback; SMS mock adapter configured.
- **Invoicing**: PDFKit 0.15 for Indian GST Tax Invoice generation.

## 3. Ports & URLs
- **Backend API**: `http://localhost:5000` (Health check at `/health` and `/api/health`)
- **Frontend Storefront**: `http://localhost:3000`
- **Database (PostgreSQL)**: `localhost:5432` (database: `medico_db`, user: `medico_user`)
- **Cache (Redis)**: `localhost:6379`

## 4. Prisma Schema (26 Models)
- **Identity & Access**: `User` (Customer, Pharmacist, Admin), `Address`.
- **Catalog & Inventory**: `Category`, `Brand`, `Product`, `ProductVariant`, `InventoryBatch` (supports FEFO batch sorting and tracking).
- **Cart & Wishlist**: `Cart`, `CartItem`, `Wishlist`.
- **Checkout & Fulfillment**: `Coupon`, `Order`, `OrderItem`, `OrderStatusHistory`.
- **Payments**: `Payment` (Razorpay integration), `Refund`.
- **Compliance & Clinical**: `Prescription` (Schedule H/H1/X gating, pharmacist review status), `Review`.
- **Telehealth & Diagnostics**: `Doctor`, `Appointment`, `LabTest`, `LabBooking`.
- **System**: `Notification`, `AuditLog`, `Banner`, `Faq`, `Setting`.

## 5. Key Observation & Discrepancies
1. **Frontend Version**: Running Next.js 14.2.15 (not 15).
2. **Admin Portal**: `apps/web/middleware.ts` guards `/admin`, and `apps/api` has comprehensive `/api/admin` routes (`/stats`, `/orders`, `/prescriptions`, `/inventory`, etc.), but `apps/web/src/app/admin` pages are absent from the Next.js app router.
3. **Clerk vs Local Auth**: `apps/web/middleware.ts` uses Clerk middleware, while `apps/api` contains custom JWT auth (`/api/auth/login`, `/api/auth/register`, `/api/auth/otp`).
4. **Security Notice in Smoke Test**: Smoke test hits `/api/admin/stats` without auth headers; route authorization must be verified and enforced.
