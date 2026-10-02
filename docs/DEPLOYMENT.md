# Production Deployment Guide

This guide details the recommended production deployment architecture, step-by-step provisioning instructions, database migration workflows, health check verifications, and rollback procedures for Medico.

---

## 1. Recommended Production Topology

The platform is designed to be cloud-agnostic and can be deployed on standard PaaS providers or container orchestration platforms:

- **Frontend (`apps/web`)**: [Vercel](https://vercel.com) (Edge network, automated Next.js caching, zero-config SSR).
- **Backend API (`apps/api`)**: [Railway](https://railway.app) / [Render](https://render.com) / [AWS App Runner] (Long-running Node.js process).
- **Database**: [Supabase](https://supabase.com) / [AWS RDS PostgreSQL 16] (Connection pooling via pgBouncer/Supavisor).
- **Cache & Event Bus**: [Upstash Redis](https://upstash.com) / [Redis Cloud] (Serverless or dedicated managed Redis).

---

## 2. Step-by-Step Deployment Procedure

### Step 1: Database Provisioning (PostgreSQL)
1. Provision a PostgreSQL 16 instance on your chosen cloud provider (e.g., Supabase, Neon, or AWS RDS).
2. Obtain both the **Pooled Connection URL** (port 6543, used for `DATABASE_URL` during runtime) and the **Direct Connection URL** (port 5432, used for `DIRECT_URL` during migrations).
3. Run migrations from your deployment pipeline or local terminal:
   ```bash
   npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
   ```
4. Seed base catalog and operational tables:
   ```bash
   npm run db:seed
   ```

### Step 2: Backend API Deployment (`apps/api`)
1. Connect your repository to Railway, Render, or deploy via Docker:
   - **Root Directory**: `.` (monorepo root)
   - **Dockerfile Path**: `apps/api/Dockerfile`
   - **Exposed Port**: `5000`
2. Configure required environment variables (see [ENVIRONMENT.md](./ENVIRONMENT.md)):
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   FRONTEND_URL=https://your-storefront-domain.com
   JWT_ACCESS_SECRET=your_32_char_secret
   JWT_REFRESH_SECRET=your_32_char_secret
   RAZORPAY_KEY_ID=rzp_live_...
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```
3. Deploy the service and verify that the health check endpoint responds:
   ```bash
   curl -I https://api.yourdomain.com/api/health
   # Expected: HTTP/1.1 200 OK
   ```

### Step 3: Frontend Storefront Deployment (`apps/web`)
1. Create a new project in Vercel importing the Git repository.
2. Set configuration:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
3. Configure environment variables in Vercel:
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
   NEXT_PUBLIC_STORE_NAME=Pharmico
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
   NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. Trigger the production build and verify the custom domain.

### Step 4: Razorpay Webhook Configuration
1. Log in to the [Razorpay Merchant Dashboard](https://dashboard.razorpay.com).
2. Navigate to **Settings > Webhooks > Add New Webhook**.
3. **Webhook URL**: `https://api.yourdomain.com/api/webhooks/razorpay`
4. **Secret**: Enter the exact string configured in `RAZORPAY_WEBHOOK_SECRET`.
5. **Active Events**:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
   - `refund.processed`

---

## 3. Health Checks & Monitoring

The API exposes automated health monitoring endpoints:

- **Liveness & Readiness**:
  ```http
  GET /api/health
  ```
  Returns status `200 OK` with system uptime, database connection state, and current ISO timestamp:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-02T06:00:00.000Z",
    "uptime": 86400,
    "services": {
      "database": "connected",
      "redis": "connected"
    }
  }
  ```

---

## 4. Rollback Procedures

### Frontend Rollback (Vercel)
1. Navigate to the **Deployments** tab in the Vercel Dashboard.
2. Locate the previous stable production deployment.
3. Click the three dots (`...`) and select **Instant Rollback**.
4. Traffic is routed immediately to the previous immutable deployment artifact within seconds.

### Backend API Rollback (Railway / Render / Docker)
1. If using Docker / Kubernetes: Roll back the container image tag to the previous stable digest:
   ```bash
   docker service update --image registry.yourdomain.com/medico-api:v1.0.0 medico-api
   ```
2. If using Railway / Render: Select the previous successful deployment and click **Redeploy**.

### Database Migration Rollback
Prisma migrations are forward-only by default. If a migration needs to be reversed:
1. Identify the failing migration name from `_prisma_migrations` table.
2. In development, generate a corrective down-migration:
   ```bash
   npx prisma migrate diff \
     --from-schema-datamodel apps/api/prisma/schema.prisma \
     --to-migrations apps/api/prisma/migrations \
     --script > rollback.sql
   ```
3. Apply the corrective migration via `npx prisma migrate deploy`.
