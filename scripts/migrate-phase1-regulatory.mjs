/**
 * Script: migrate-phase1-regulatory.mjs
 * Purpose: Applies Phase 1 of the Medico Database Architecture specification:
 *          - Prescription & FamilyMember models
 *          - RxSchedule & PrescriptionStatus enums
 *          - Order Rx gate trigger (enforce_rx_gate)
 *          - Review rating constraint
 *          - Default address partial unique index
 *          - pg_trgm GIN search index
 * Safety: 100% idempotent and non-destructive. Preserves all existing data.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function exec(statement, desc) {
  try {
    await prisma.$executeRawUnsafe(statement);
    if (desc) console.log(`✅ ${desc}`);
  } catch (err) {
    console.error(`❌ Failed: ${desc || statement}`, err.message);
    throw err;
  }
}

async function main() {
  console.log("🚀 Applying Medico Database Architecture - Phase 1 Migration...\n");

  // 1. Create Enums if they don't exist
  await exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PrescriptionStatus') THEN
        CREATE TYPE "PrescriptionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
      END IF;
    END $$;
  `, "Enum PrescriptionStatus verified");

  await exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RxSchedule') THEN
        CREATE TYPE "RxSchedule" AS ENUM ('OTC', 'H', 'H1', 'X');
      END IF;
    END $$;
  `, "Enum RxSchedule verified");

  // Add enum values to existing enums if missing
  await exec(`
    DO $$
    BEGIN
      ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `, "OrderStatus PENDING_PAYMENT added");

  await exec(`
    DO $$
    BEGIN
      ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_RX';
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `, "OrderStatus PENDING_RX added");

  await exec(`
    DO $$
    BEGIN
      ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PRESCRIPTION';
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `, "NotificationType PRESCRIPTION added");

  // 2. Add columns to Product and Address
  await exec(`
    ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "prescriptionRequired" BOOLEAN NOT NULL DEFAULT false;
  `, "Product.prescriptionRequired column verified");

  await exec(`
    ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rxSchedule" "RxSchedule" NOT NULL DEFAULT 'OTC';
  `, "Product.rxSchedule column verified");

  await exec(`
    CREATE INDEX IF NOT EXISTS "Product_prescriptionRequired_idx" ON "Product"("prescriptionRequired");
  `, "Product_prescriptionRequired_idx index verified");

  await exec(`
    ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
  `, "Address.deletedAt column verified");

  // 3. Create FamilyMember table
  await exec(`
    CREATE TABLE IF NOT EXISTS "FamilyMember" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "relation" TEXT NOT NULL,
      "dob" TIMESTAMP(3),
      "gender" "Gender",
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "FamilyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `, "FamilyMember table verified");

  await exec(`
    CREATE INDEX IF NOT EXISTS "FamilyMember_userId_idx" ON "FamilyMember"("userId");
  `, "FamilyMember_userId_idx index verified");

  // 4. Create Prescription table
  await exec(`
    CREATE TABLE IF NOT EXISTS "Prescription" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "familyMemberId" TEXT,
      "fileKey" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
      "status" "PrescriptionStatus" NOT NULL DEFAULT 'PENDING',
      "rejectionReason" TEXT,
      "reviewedBy" TEXT,
      "reviewedAt" TIMESTAMP(3),
      "validUntil" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Prescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Prescription_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
  `, "Prescription table verified");

  await exec(`ALTER TABLE "Prescription" ADD COLUMN IF NOT EXISTS "familyMemberId" TEXT;`, "Prescription.familyMemberId column verified");
  await exec(`ALTER TABLE "Prescription" ADD COLUMN IF NOT EXISTS "fileKey" TEXT;`, "Prescription.fileKey column verified");
  await exec(`ALTER TABLE "Prescription" ADD COLUMN IF NOT EXISTS "mimeType" TEXT DEFAULT 'application/pdf';`, "Prescription.mimeType column verified");
  await exec(`ALTER TABLE "Prescription" ADD COLUMN IF NOT EXISTS "status" "PrescriptionStatus" DEFAULT 'PENDING';`, "Prescription.status column verified");
  await exec(`ALTER TABLE "Prescription" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;`, "Prescription.rejectionReason column verified");
  await exec(`ALTER TABLE "Prescription" ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT;`, "Prescription.reviewedBy column verified");
  await exec(`ALTER TABLE "Prescription" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);`, "Prescription.reviewedAt column verified");
  await exec(`ALTER TABLE "Prescription" ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP(3);`, "Prescription.validUntil column verified");
  
  await exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Prescription_familyMemberId_fkey') THEN
        ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_familyMemberId_fkey" 
          FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;
  `, "Prescription_familyMemberId_fkey verified");

  await exec(`
    CREATE INDEX IF NOT EXISTS "Prescription_userId_idx" ON "Prescription"("userId");
  `, "Prescription_userId_idx verified");

  await exec(`
    CREATE INDEX IF NOT EXISTS "Prescription_status_idx" ON "Prescription"("status");
  `, "Prescription_status_idx verified");

  await exec(`
    CREATE INDEX IF NOT EXISTS "Prescription_familyMemberId_idx" ON "Prescription"("familyMemberId");
  `, "Prescription_familyMemberId_idx verified");

  // 5. Link Order to Prescription
  await exec(`
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "prescriptionId" TEXT;
  `, "Order.prescriptionId column verified");

  await exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_prescriptionId_fkey') THEN
        ALTER TABLE "Order" ADD CONSTRAINT "Order_prescriptionId_fkey" 
          FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;
  `, "Order_prescriptionId_fkey foreign key verified");

  await exec(`
    CREATE INDEX IF NOT EXISTS "Order_prescriptionId_idx" ON "Order"("prescriptionId");
  `, "Order_prescriptionId_idx verified");

  // 6. Database Backstop Trigger: enforce_rx_gate
  await exec(`
    CREATE OR REPLACE FUNCTION enforce_rx_gate() RETURNS trigger AS $$
    BEGIN
      IF NEW.status IN ('CONFIRMED','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED')
         AND EXISTS (
           SELECT 1 FROM "OrderItem" oi
           JOIN "ProductVariant" v ON v.id = oi."variantId"
           JOIN "Product" p ON p.id = v."productId"
           WHERE oi."orderId" = NEW.id AND p."prescriptionRequired")
         AND NOT EXISTS (
           SELECT 1 FROM "Prescription" rx
           WHERE rx.id = NEW."prescriptionId"
             AND rx.status = 'APPROVED'
             AND (rx."validUntil" IS NULL OR rx."validUntil" >= CURRENT_DATE))
      THEN
        RAISE EXCEPTION 'Approved prescription required for order %', NEW.id;
      END IF;
      RETURN NEW;
    END $$ LANGUAGE plpgsql;
  `, "enforce_rx_gate function created");

  await exec(`
    DROP TRIGGER IF EXISTS orders_rx_gate ON "Order";
  `, "orders_rx_gate old trigger dropped");

  await exec(`
    CREATE TRIGGER orders_rx_gate
      BEFORE UPDATE OF status ON "Order"
      FOR EACH ROW EXECUTE FUNCTION enforce_rx_gate();
  `, "orders_rx_gate trigger installed on Order");

  // 7. Hard Constraints & Partial Indexes
  await exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'review_rating_range') THEN
        ALTER TABLE "Review" ADD CONSTRAINT review_rating_range CHECK (rating BETWEEN 1 AND 5);
      END IF;
    END $$;
  `, "review_rating_range constraint verified");

  await exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'batch_qty_valid') THEN
        ALTER TABLE "InventoryBatch" ADD CONSTRAINT batch_qty_valid CHECK (quantity >= 0);
      END IF;
    END $$;
  `, "batch_qty_valid constraint verified");

  await exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS one_default_address
      ON "Address" ("userId") WHERE "isDefault" = true AND "deletedAt" IS NULL;
  `, "one_default_address partial index verified");

  // 8. Trigram Search Extension & GIN Index
  try {
    await exec(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`, "pg_trgm extension verified");
    await exec(`
      CREATE INDEX IF NOT EXISTS product_search_trgm ON "Product"
        USING gin (("name" || ' ' || coalesce("composition", '') || ' ' || coalesce("manufacturer", '')) gin_trgm_ops);
    `, "product_search_trgm GIN index verified");
  } catch (err) {
    console.warn("⚠️ Note on pg_trgm:", err.message);
  }

  console.log("\n🎉 Phase 1 Database Migration executed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
