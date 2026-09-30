# 💊 Pharmico / Medico - Production Medical E-Commerce Platform

A production-grade online pharmacy, telehealth, and diagnostics e-commerce platform built to replicate the reference design language of **Pharmico & Medicart**.

---

## 🎨 Visual Design Language & Tokens

- **Primary Dark Green**: `#0B4A3A` (Headers, hero, navigation, footer)
- **Accent Emerald**: `#10B981` (Primary CTAs, "Order Medicines", "Shop Now", success states)
- **Warm Yellow**: `#F5C043` (Secondary badges, rating stars, accents)
- **Cream / Tint Backgrounds**: `#FFFFFF` (White), `#F4F6F5` (Page tint), `#FAF3EA` (Warm cream cards)
- **Typography**: Plus Jakarta Sans, rounded pill buttons (`rounded-full`), currency in Indian Rupee format (`₹` / `en-IN`).

---

## 🏗️ Architecture & Monorepo Structure

```
Medico/
├── apps/
│   ├── api/                 # Express + TypeScript + Prisma ORM + Redis fallback
│   │   ├── prisma/          # Schema (26 models) + Seed script (66 products, batches, doctors)
│   │   └── src/
│   │       ├── modules/     # Auth, Catalog, Cart, Orders, Prescriptions, Labs, Consultations, Admin
│   │       ├── jobs/        # Automated stock release & expired batch background cron
│   │       └── lib/         # Prisma client, JWT, Redis cache, Razorpay, PDFKit GST generator
│   └── web/                 # Next.js App Router + Tailwind CSS + Lucide Icons
│       ├── middleware.ts    # Clerk authentication middleware
│       └── src/
│           ├── app/         # Storefront, Catalog, Detail, Cart, Checkout, Tracking, Admin Portal
│           ├── components/  # Header, PillNav, CartDrawer, Footer
│           └── lib/         # API fetch client & Zustand cart state
├── packages/
│   └── shared/              # Shared Zod validation schemas, domain enums, currency formatters
├── scripts/                 # Automated smoke tests and unit test suites
└── docker-compose.yml       # PostgreSQL and Redis services
```

---

## 🚀 Running on Localhost

Both frontend and backend are preconfigured and running locally:

### 1. Backend API (`http://localhost:5000`)
- **Health check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Products Catalog**: [http://localhost:5000/api/catalog/products](http://localhost:5000/api/catalog/products)
- **Diagnostic Labs**: [http://localhost:5000/api/labs](http://localhost:5000/api/labs)
- **Doctors Telehealth**: [http://localhost:5000/api/consultations/doctors](http://localhost:5000/api/consultations/doctors)
- **Admin Stats**: [http://localhost:5000/api/admin/stats](http://localhost:5000/api/admin/stats)

```bash
npm run dev:api
```

### 2. Storefront Web App (`http://localhost:3000`)
- **Homepage**: [http://localhost:3000](http://localhost:3000)
- **Medicines Catalog**: [http://localhost:3000/products](http://localhost:3000/products)
- **Prescription Upload**: [http://localhost:3000/prescription/upload](http://localhost:3000/prescription/upload)
- **Customer Orders**: [http://localhost:3000/orders](http://localhost:3000/orders)
- **Lab Tests Booking**: [http://localhost:3000/lab-tests](http://localhost:3000/lab-tests)
- **Doctor Video Consultations**: [http://localhost:3000/consultations](http://localhost:3000/consultations)
- **About & FAQ**: [http://localhost:3000/about](http://localhost:3000/about) & [http://localhost:3000/faqs](http://localhost:3000/faqs)
- **Admin Portal**: [http://localhost:3000/admin](http://localhost:3000/admin)
  - Prescriptions Queue: [http://localhost:3000/admin/prescriptions](http://localhost:3000/admin/prescriptions)
  - Orders Manager: [http://localhost:3000/admin/orders](http://localhost:3000/admin/orders)
  - FEFO Inventory: [http://localhost:3000/admin/inventory](http://localhost:3000/admin/inventory)

```bash
npm run dev:web
```

---

## 🔑 Seed User Accounts

All seed users are verified with hashed credentials in the local PostgreSQL database (`medico_db`):

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@medico.com` | `Admin@123456` |
| **Pharmacist** | `pharmacist@medico.com` | `Pharma@123456` |
| **Customer** | `customer@medico.com` | `Customer@123456` |

---

## 🧪 Automated Testing

### 1. Core Logic Unit Tests
```bash
node scripts/unit-tests.js
```
- Validates Indian Rupee `formatINR` formatter.
- Validates coupon discount rules and max discount capping.
- Validates FEFO (First-Expiry First-Out) batch sorting comparator.
- Validates Intra-State GST breakdown (50% CGST + 50% SGST).

### 2. End-to-End Localhost Smoke Test
```bash
node scripts/smoke-test.js
```
- Tests API health.
- Queries product catalog.
- Authenticates customer.
- Validates coupon `WELCOME50`.
- Adds product to cart.
- Executes full transaction with FEFO inventory batch allocation.
- Streams and validates downloadable PDF GST Tax Invoice.
- Verifies admin dashboard statistics.
- Validates Next.js HTTP 200 storefront status.
