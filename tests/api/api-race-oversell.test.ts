import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "../../apps/api/src/lib/prisma";
import { InventoryService } from "../../apps/api/src/modules/inventory/inventory.service";

describe("Phase 3: Inventory Race Conditions & Concurrency (FEFO + 0 Oversell)", () => {
  let testProductId: string;
  let testVariantId: string;
  let testBatchId: string;
  const initialStock = 5;
  const concurrencyCount = 50;

  beforeAll(async () => {
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: { name: "Concurrency Testing", slug: "concurrency-testing" },
      });
    }

    let brand = await prisma.brand.findFirst();
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: "Race Brand", slug: "race-brand" },
      });
    }

    // Clean up previous runs if any
    const oldProduct = await prisma.product.findUnique({
      where: { slug: "race-test-limited-stock-product" },
      include: { variants: true },
    });

    if (oldProduct) {
      for (const v of oldProduct.variants) {
        await prisma.inventoryBatch.deleteMany({ where: { variantId: v.id } });
        await prisma.cartItem.deleteMany({ where: { variantId: v.id } });
        await prisma.orderItem.deleteMany({ where: { variantId: v.id } });
      }
      await prisma.productVariant.deleteMany({ where: { productId: oldProduct.id } });
      await prisma.product.delete({ where: { id: oldProduct.id } });
    }

    const runId = Date.now();
    const product = await prisma.product.create({
      data: {
        name: "Race Test Limited Stock Paracetamol",
        slug: `race-test-limited-stock-${runId}`,
        description: "5 units available under concurrent checkout test",
        manufacturer: "Cipla Ltd",
        categoryId: category.id,
        brandId: brand.id,
        isActive: true,
        variants: {
          create: {
            sku: `RACE-TEST-SKU-${runId}`,
            name: "Strip of 10 Tablets",
            packSize: "Strip of 10",
            price: 50,
            mrp: 60,
            isDefault: true,
          },
        },
      },
      include: { variants: true },
    });

    testProductId = product.id;
    testVariantId = product.variants[0].id;

    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    const batch = await prisma.inventoryBatch.create({
      data: {
        variantId: testVariantId,
        batchNumber: `RACE-BATCH-${Date.now()}`,
        quantity: initialStock,
        costPrice: 20,
        expiryDate: expiry,
        mfgDate: new Date(),
        isBlocked: false,
      },
    });

    testBatchId = batch.id;
  });

  afterAll(async () => {
    if (testVariantId) {
      await prisma.inventoryBatch.deleteMany({ where: { variantId: testVariantId } });
      await prisma.cartItem.deleteMany({ where: { variantId: testVariantId } });
      await prisma.orderItem.deleteMany({ where: { variantId: testVariantId } });
      await prisma.productVariant.deleteMany({ where: { productId: testProductId } });
      await prisma.product.delete({ where: { id: testProductId } }).catch(() => {});
    }
  });

  it("50 concurrent transactions competing for 5 units results in exactly 5 successes, 45 failures, and 0 oversell", async () => {
    // Launch 50 simultaneous transactions competing for stock
    const attempts = Array.from({ length: concurrencyCount }, async (_, i) => {
      try {
        await prisma.$transaction(async (tx) => {
          await InventoryService.deductStockFEFO(tx, testVariantId, 1);
        }, {
          maxWait: 15000,
          timeout: 30000,
        });
        return { success: true, index: i };
      } catch (err: any) {
        return { success: false, error: err.message, index: i };
      }
    });

    const results = await Promise.all(attempts);

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log(`\n⚡ Concurrency Deduction Results:`);
    console.log(`   Total attempts: ${concurrencyCount}`);
    console.log(`   Successful: ${successful.length}`);
    console.log(`   Failed (insufficient stock): ${failed.length}`);

    // Verify invariant: Exactly 5 units were allocated
    expect(successful.length).toBe(initialStock);
    expect(failed.length).toBe(concurrencyCount - initialStock);

    // Verify remaining inventory in DB is strictly 0 and NOT negative
    const finalBatch = await prisma.inventoryBatch.findUnique({
      where: { id: testBatchId },
    });

    expect(finalBatch?.quantity).toBe(0);
    expect(finalBatch?.quantity).toBeGreaterThanOrEqual(0);
  }, 60000);
});
