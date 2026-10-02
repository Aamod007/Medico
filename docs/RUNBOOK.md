# Operations Runbook

This operational runbook provides production support procedures, troubleshooting steps, and administrative workflows for system engineers and technical operators managing Medico.

---

## 1. User & Access Administration

### 1.1 Creating an Admin or Pharmacist User
Staff accounts (Admin, Pharmacist) possess privileged access to prescriptions, orders, and batch inventory. To provision a staff user securely:

1. Connect to the production database environment or run a secure script:
   ```bash
   node -e '
   const bcrypt = require("bcryptjs");
   const { PrismaClient } = require("@prisma/client");
   const prisma = new PrismaClient();

   async function createStaff(name, email, plainPassword, role) {
     const passwordHash = await bcrypt.hash(plainPassword, 10);
     const user = await prisma.user.create({
       data: { name, email, phone: "9876500001", passwordHash, role }
     });
     console.log("Created staff user:", user.email, "with role:", user.role);
   }

   createStaff("Dr. Sharma", "pharmacist.lead@pharmico.health", "StrongTempPass!2026", "PHARMACIST");
   '
   ```
2. Verify the role in the `User` table:
   ```sql
   SELECT id, name, email, role, "createdAt" FROM "User" WHERE email = 'pharmacist.lead@pharmico.health';
   ```

### 1.2 Deactivating a Compromised or Departing Staff Member
```sql
UPDATE "User"
SET "isActive" = false
WHERE email = 'departing.user@pharmico.health';
```

---

## 2. Database Maintenance & Backups

### 2.1 Performing an On-Demand Full Database Backup
Run `pg_dump` with custom compressed archive format:
```bash
pg_dump "$DATABASE_URL" \
  --format=custom \
  --blobs \
  --verbose \
  --file="medico_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### 2.2 Restoring from a Backup Archive
```bash
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname="$DATABASE_URL" \
  medico_backup_20261002_120000.dump
```

### 2.3 Resolving a Stuck Prisma Migration
If a migration fails during deployment (e.g. timeout or lock conflict), Prisma marks it as `failed` in `_prisma_migrations`:
1. Inspect the migration status:
   ```bash
   npx prisma migrate status --schema=apps/api/prisma/schema.prisma
   ```
2. Rollback or resolve the migration state:
   ```bash
   # Mark the migration as rolled back so it can be re-executed
   npx prisma migrate resolve --rolled-back "20260901120000_migration_name" --schema=apps/api/prisma/schema.prisma
   ```
3. Fix the underlying lock or data constraint conflict, then redeploy:
   ```bash
   npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
   ```

---

## 3. Data Integrity & Consistency Audits

The platform includes an automated SQL consistency verification engine that checks 15 regulatory invariants (no negative batch stock, accurate GST math, FEFO chronological alignment, cart quantity validity).

Run the audit on demand:
```bash
npm run test:consistency
```
**Expected Output**:
```
🔍 Running Medico Global Consistency Invariants Audit (C1-C15)...
...
✅ Global Invariants Audit PASSED: 0 violations detected across all tables.
```

If violations are reported:
1. Examine the JSON details payload emitted in the output log.
2. Cross-reference the invariant code with `scripts/consistency-audit.sql`.
3. Quarantine the affected order or product batch before pharmacist dispatch.

---

## 4. Payment & Razorpay Incident Management

### 4.1 Payment Captured in Razorpay but Order Remains "PENDING"
This indicates that the webhook delivery from Razorpay was delayed or failed (e.g., firewall timeout):
1. Locate the Razorpay Payment ID (`pay_xxx`) from the customer receipt or Razorpay Dashboard.
2. In Razorpay Dashboard, check **Webhooks > Event Logs** for delivery status.
3. If delivery failed, click **Retry Webhook** in the Razorpay Dashboard.
4. Alternatively, manually reconcile the order via the admin API or database:
   ```sql
   UPDATE "Order"
   SET "paymentStatus" = 'PAID', "status" = 'CONFIRMED', "updatedAt" = NOW()
   WHERE "razorpayOrderId" = 'order_xxx' AND "paymentStatus" = 'PENDING';
   ```

---

## 5. Redis Inspection & Cache Invalidation

### 5.1 Checking Redis Connection & Live Pub/Sub Channels
```bash
redis-cli -u "$REDIS_URL" ping
# Response: PONG

# Monitor real-time order broadcast events
redis-cli -u "$REDIS_URL" psubscribe "store:*"
```

### 5.2 Flushing Stale Catalog Cache
If product listings or prices are updated directly in the database without triggering API invalidation hooks:
```bash
redis-cli -u "$REDIS_URL" keys "catalog:*" | xargs redis-cli -u "$REDIS_URL" del
```
