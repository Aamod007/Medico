# Environment Variables & Configuration Guide

This document provides a comprehensive inventory of all environment variables utilized across the Medico platform, categorized by workspace, security sensitivity level, and rotation procedure.

---

## 1. Security Sensitivity Classifications

- **PUBLIC**: Safe to expose in client-side bundles (prefixed with `NEXT_PUBLIC_`).
- **CONFIG**: Non-secret configuration values (ports, URLs, hostnames).
- **SECRET**: Confidential operational keys (database passwords, Redis credentials, SMTP passwords).
- **CRITICAL**: Cryptographic signing secrets and payment secrets (JWT secrets, Razorpay Key Secret, Webhook Secret). Must never be committed or logged.

---

## 2. Storefront Web Workspace (`apps/web/.env`)

| Variable | Type | Default / Example | Required | Purpose |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | CONFIG | `http://localhost:5000/api` | Yes | Target base URL for the Express REST API |
| `NEXT_PUBLIC_STORE_NAME` | PUBLIC | `Pharmico` | No | Display brand name in header and document title |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | PUBLIC | `pk_test_...` | Yes | Clerk client-side authentication key |
| `CLERK_SECRET_KEY` | CRITICAL | `sk_test_...` | Yes | Clerk server-side secret key for middleware authentication |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | PUBLIC | `rzp_test_...` | Yes | Public Razorpay key ID for launching checkout popup |
| `NEXT_PUBLIC_SUPABASE_URL` | PUBLIC | `https://xyz.supabase.co` | No | Supabase project URL for direct REST/storage endpoints |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | PUBLIC | `eyJhbGci...` | No | Supabase anonymous public client key |
| `SUPABASE_SERVICE_ROLE_KEY` | CRITICAL | `eyJhbGci...` | No | Supabase elevated admin service key (server-side only) |
| `NODE_ENV` | CONFIG | `development` / `production` | Yes | Node runtime execution mode |
| `PORT` | CONFIG | `3000` | No | HTTP listening port for Next.js web server |

---

## 3. Backend REST API Workspace (`apps/api/.env`)

| Variable | Type | Default / Example | Required | Purpose |
|---|---|---|---|---|
| `PORT` | CONFIG | `5000` | No | HTTP listening port for Express API server |
| `NODE_ENV` | CONFIG | `development` / `production` | Yes | Execution environment mode |
| `DATABASE_URL` | SECRET | `postgresql://user:pass@host:5432/medico_db` | Yes | PostgreSQL connection string for Prisma ORM |
| `DIRECT_URL` | SECRET | `postgresql://user:pass@host:5432/medico_db` | No | Direct database connection for Prisma migrations (bypassing pooler) |
| `REDIS_URL` | SECRET | `redis://localhost:6379` | No | Redis connection URL for caching and order pub/sub events |
| `FRONTEND_URL` | CONFIG | `http://localhost:3000` | Yes | Storefront URL for CORS allowlisting and email order links |
| `JWT_ACCESS_SECRET` | CRITICAL | 32+ character random string | Yes | HMAC secret for signing and verifying customer/admin JWTs |
| `JWT_REFRESH_SECRET` | CRITICAL | 32+ character random string | Yes | HMAC secret for issuing long-lived session refresh tokens |
| `RAZORPAY_KEY_ID` | SECRET | `rzp_live_...` / `rzp_test_...` | Yes | Razorpay API identification key for creating payment orders |
| `RAZORPAY_KEY_SECRET` | CRITICAL | 20+ character random string | Yes | Razorpay secret key for server API authentication |
| `RAZORPAY_WEBHOOK_SECRET` | CRITICAL | Secret configured in Razorpay | Yes | Secret used to verify cryptographic HMAC signature of incoming webhooks |
| `SMTP_HOST` | CONFIG | `smtp.mailgun.org` / `smtp.postmarkapp.com` | No | Outbound SMTP email server hostname |
| `SMTP_PORT` | CONFIG | `587` / `465` / `2525` | No | Outbound SMTP email port |
| `SMTP_USER` | SECRET | `apikey` / `smtp_username` | No | SMTP authentication username |
| `SMTP_PASS` | SECRET | `smtp_password` | No | SMTP authentication password |
| `SMTP_FROM` | CONFIG | `Pharmico <orders@pharmico.health>` | No | Default sender email address on transactional notifications |

---

## 4. Secret Rotation Procedures

### 4.1 JWT Signing Secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)
- **Impact**: Invalidation of all currently active customer and staff sessions.
- **Rotation Steps**:
  1. Generate two high-entropy random strings:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
  2. Update `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in the production environment settings (Vercel / Railway / Docker).
  3. Redeploy the API. Users will be required to re-authenticate.

### 4.2 Razorpay API & Webhook Credentials
- **Impact**: Temporary payment disruption if keys mismatch between storefront and Razorpay dashboard.
- **Rotation Steps**:
  1. Log in to the [Razorpay Merchant Dashboard](https://dashboard.razorpay.com).
  2. Under **Settings > API Keys**, generate a new Key ID and Key Secret. Razorpay allows a 24-hour grace window during which both the old and new keys remain valid.
  3. Under **Settings > Webhooks**, update the Webhook Secret.
  4. Update `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in both the web and API production environment configurations.
  5. Test an end-to-end checkout transaction in production.
  6. Return to Razorpay Dashboard and revoke the old API key.

### 4.3 Database Password (`DATABASE_URL`)
- **Impact**: Database connection failure if pooler credentials are not synchronized.
- **Rotation Steps**:
  1. In Supabase / AWS RDS, create a secondary database user with read/write permissions or update the primary password.
  2. Update `DATABASE_URL` (and `DIRECT_URL`) in the API hosting provider environment variables.
  3. Trigger an immediate rolling restart of the API containers.
  4. Verify connectivity via `/api/health`.
