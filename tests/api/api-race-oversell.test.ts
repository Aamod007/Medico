import { describe, it, expect, beforeAll } from "vitest";
import prisma from "../../apps/api/src/lib/prisma";
import jwt from "jsonwebtoken";

const API_BASE = "http://localhost:5000/api";
const JWT_SECRET = "super-secure-jwt-access-secret-min-32-chars-for-medico";

describe("Phase 3: Inventory Race Conditions & Concurrency (FEFO + 0 Oversell)", () => {
  let testVariantId: string;
  let testBatchId: string;
  let testAddressId: string;
  const initialStock = 5;
  const concurrencyCount = 50;

  beforeAll(async () => {
    // 1. Create or ensure test product with exact 5 units in stock
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

    // Clean up previous test runs if any
    const oldProduct = await prisma.product.findUnique({
      where: { slug: "race-test-limited-stock-product" },
      include: { variants: { include: { batches: true } } },
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

    const product = await prisma.product.create({
      data: {
        name: "Race Test Limited Stock Paracetamol",
        slug: "race-test-limited-stock-product",
        description: "5 units available under concurrent checkout test",
        categoryId: category.id,
        brandId: brand.id,
        isActive: true,
        variants: {
          create: {
            sku: "RACE-TEST-SKU-5",
            packSize: "Strip of 10",
            price: 50,
            mrp: 60,
            isDefault: true,
          },
        },
      },
      include: { variants: true },
    });

    testVariantId = product.variants[0].id;

    // Create a batch with exactly 5 units expiring in 1 year
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

    // Ensure test user has address
    const user = await prisma.user.upsert({
      where: { email: "race_test_customer@medico.com" },
      create: {
        email: "race_test_customer@medico.com",
        name: "Race Tester",
        phone: "9876543299",
      },
      update: {},
    });

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: "Race Tester",
        phone: "9876543299",
        addressLine1: "Concurrency Lane",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560103",
        type: "HOME",
      },
    });

    testAddressId = address.id;
  });

  it("50 concurrent checkouts for 5 units must result in exactly 5 successes, 45 rejections, and 0 oversell", async () => {
    // We launch 50 parallel buyers simultaneously
    const requests = Array.from({ length: concurrencyCount }, async (_, i) => {
      const buyerId = `concurrent_buyer_${i}`;
      const token = jwt.sign(
        { userId: buyerId, email: `${buyerId}@test.com`, role: "CUSTOMER" },
        JWT_SECRET,
        { expiresIn: "10m" }
      );

      // Create a cart with 1 unit of the limited variant
      const cart = await prisma.cart.create({
        data: {
          userId: buyerId,
          items: {
            create: {
              variantId: testVariantId,
              quantity: 1,
            },
          },
        },
      });

      // Submit checkout
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addressId: testAddressId,
          paymentMethod: "COD",
        }),
      });

      return { status: res.status, ok: res.ok };
    });

    // Execute all 50 concurrent requests simultaneously
    const results = await Promise.all(requests);

    const successCount = results.filter((r) => r.status === 201 || r.status === 200).length;
    const rejectedCount = results.filter((r) => r.status === 400 || r.status === 409 || r.status === 422).length;

    console.log(`\n⚡ Concurrency Race Results:`);
    console.log(`   Total requests: ${concurrencyCount}`);
    console.log(`   Successful checkouts: ${successCount}`);
    console.log(`   Rejected checkouts: ${rejectedCount}`);

    // Verify exactly 5 orders were placed
    expect(successCount).toBe(initialStock);
    expect(rejectedCount).toBe(concurrencyCount - initialStock);

    // Verify remaining inventory in DB is exactly 0 and NEVER negative
    const finalBatch = await prisma.inventoryBatch.findUnique({
      where: { id: testBatchId },
    });

    expect(finalBatch?.quantity).toBe(0);
    expect(finalBatch?.quantity).toBeGreaterThanOrEqual(0);
  });
});
