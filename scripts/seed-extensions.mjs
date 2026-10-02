import { PrismaClient, Role, AddressType, DiscountType, OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Running Medico Seed Extensions...");

  // 1. Pharmacist reference
  const pharmacist = await prisma.user.findUnique({
    where: { email: "pharmacist@medico.com" },
  });
  if (!pharmacist) {
    throw new Error("Pharmacist user not found. Run main seed first.");
  }

  // 2. Create customer-with-orders test user
  console.log("Creating customer-with-orders test user...");
  const cwoPassword = await bcrypt.hash("CustomerOrders@123456", 10);
  let customerWithOrders = await prisma.user.findUnique({
    where: { email: "customer-with-orders@medico.com" },
  });

  if (!customerWithOrders) {
    customerWithOrders = await prisma.user.create({
      data: {
        name: "Priya Sharma",
        email: "customer-with-orders@medico.com",
        phone: "9876543213",
        passwordHash: cwoPassword,
        role: Role.CUSTOMER,
        isEmailVerified: true,
        isPhoneVerified: true,
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      },
    });
  }

  // Addresses for customer-with-orders
  const homeAddr = await prisma.address.upsert({
    where: { id: "cwo-home-address" },
    update: {},
    create: {
      id: "cwo-home-address",
      userId: customerWithOrders.id,
      fullName: "Priya Sharma",
      phone: "9876543213",
      addressLine1: "Tower 2, Flat 1104, Prestige Ferns Residency, Harlur",
      addressLine2: "Off Sarjapur Road",
      landmark: "Opposite Kudlu Gate",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560103",
      type: AddressType.HOME,
      isDefault: true,
    },
  });

  const workAddr = await prisma.address.upsert({
    where: { id: "cwo-work-address" },
    update: {},
    create: {
      id: "cwo-work-address",
      userId: customerWithOrders.id,
      fullName: "Priya Sharma (Office)",
      phone: "9876543213",
      addressLine1: "WeWork Galaxy, 43 Residency Road, Shanthala Nagar",
      addressLine2: "Ashok Nagar",
      landmark: "Near Mayo Hall",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560025",
      type: AddressType.WORK,
      isDefault: false,
    },
  });

  // 3. Create Prescriptions for customer-with-orders
  console.log("Seeding customer prescriptions...");
  const approvedRx = await prisma.prescription.upsert({
    where: { id: "rx-cwo-approved" },
    update: {},
    create: {
      id: "rx-cwo-approved",
      userId: customerWithOrders.id,
      fileUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800",
      fileType: "image/jpeg",
      originalName: "dr_sharma_prescription_verified.jpg",
      fileSize: 450000,
      status: PrescriptionStatus.APPROVED,
      reviewedByPharmacistId: pharmacist.id,
      reviewedAt: new Date(),
      notes: "Approved valid prescription for Schedule H antibiotics and analgesics",
    },
  });

  const pendingRx = await prisma.prescription.upsert({
    where: { id: "rx-cwo-pending" },
    update: {},
    create: {
      id: "rx-cwo-pending",
      userId: customerWithOrders.id,
      fileUrl: "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800",
      fileType: "image/jpeg",
      originalName: "prescription_upload_pending.jpg",
      fileSize: 320000,
      status: PrescriptionStatus.PENDING,
      notes: "Uploaded by customer, pending pharmacist review",
    },
  });

  const rejectedRx = await prisma.prescription.upsert({
    where: { id: "rx-cwo-rejected" },
    update: {},
    create: {
      id: "rx-cwo-rejected",
      userId: customerWithOrders.id,
      fileUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800",
      fileType: "image/jpeg",
      originalName: "prescription_old_expired.jpg",
      fileSize: 280000,
      status: PrescriptionStatus.REJECTED,
      reviewedByPharmacistId: pharmacist.id,
      reviewedAt: new Date(),
      rejectionReason: "Prescription date is older than 6 months. Please provide a recent valid prescription.",
    },
  });

  // 4. Update Rx flags on catalog items
  console.log("Updating catalog Rx compliance flags...");
  await prisma.product.updateMany({
    where: {
      slug: {
        in: [
          "omee-20mg-capsules",
          "calcirol-60k-granules",
          "soframycin-skin-cream",
        ],
      },
    },
    data: {
    },
  });

  // Fetch Cipla & Category for adding Augmentin & Atorva Rx medicines
  const ciplaBrand = await prisma.brand.findFirst({ where: { slug: "cipla-health" } });
  const sunBrand = await prisma.brand.findFirst({ where: { slug: "sun-pharma" } });
  const essentialsCat = await prisma.category.findFirst({ where: { slug: "everyday-essentials" } });
  const diabetesCat = await prisma.category.findFirst({ where: { slug: "diabetes-care" } });

  if (ciplaBrand && essentialsCat) {
    const augmentin = await prisma.product.upsert({
      where: { slug: "augmentin-625-duo-tablets" },
      update: { },
      create: {
        name: "Augmentin 625 Duo Antibiotic Tablets",
        slug: "augmentin-625-duo-tablets",
        description: "Amoxicillin and Potassium Clavulanate broad-spectrum antibiotic for bacterial respiratory, urinary, and skin infections.",
        composition: "Amoxicillin Trihydrate 500mg, Potassium Clavulanate 125mg",
        uses: "Bacterial bronchitis, sinusitis, otitis media, skin and soft tissue infections",
        sideEffects: "Nausea, diarrhea, mild candidiasis",
        dosage: "1 tablet twice daily with food as prescribed by physician",
        storageInstructions: "Store below 25°C protected from moisture.",
        manufacturer: "GlaxoSmithKline Pharmaceuticals",
        countryOfOrigin: "India",
        hsnCode: "300410",
        gstRate: 12.0,
        brandId: ciplaBrand.id,
        categoryId: essentialsCat.id,
        images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"],
        isFeatured: true,
        isActive: true,
      },
    });

    const augVariant = await prisma.productVariant.upsert({
      where: { sku: "AUG-625-10T" },
      update: {},
      create: {
        productId: augmentin.id,
        sku: "AUG-625-10T",
        name: "Strip of 10 Tablets",
        packSize: "10 Tablets",
        price: 204,
        mrp: 226,
        discountPercent: 10,
        isDefault: true,
        weightGrams: 40,
        isActive: true,
      },
    });

    await prisma.inventoryBatch.upsert({
      where: { id: "batch-aug-valid" },
      update: {},
      create: {
        id: "batch-aug-valid",
        variantId: augVariant.id,
        batchNumber: "AUG-2025-01",
        mfgDate: new Date("2024-05-01"),
        expiryDate: new Date("2026-10-31"),
        quantity: 100,
        costPrice: 130,
        isBlocked: false,
      },
    });
  }

  // 5. Seed Low-Stock Variant specifically for 50-concurrent oversell testing
  console.log("Seeding low-stock race-test product with exactly 5 units...");
  if (sunBrand && essentialsCat) {
    const raceProduct = await prisma.product.upsert({
      where: { slug: "race-test-limited-paracetamol" },
      update: {},
      create: {
        name: "Race Test Limited Paracetamol 650mg",
        slug: "race-test-limited-paracetamol",
        description: "Special inventory-capped product with strictly 5 units for concurrency and oversell regression testing.",
        composition: "Paracetamol IP 650mg",
        uses: "Fever and acute headache pain",
        sideEffects: "Safe at therapeutic dosage",
        dosage: "1 tablet as needed",
        storageInstructions: "Store below 25°C",
        manufacturer: "Sun Pharma Laboratories",
        countryOfOrigin: "India",
        hsnCode: "300490",
        gstRate: 12.0,
        brandId: sunBrand.id,
        categoryId: essentialsCat.id,
        images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"],
        isActive: true,
      },
    });

    const raceVariant = await prisma.productVariant.upsert({
      where: { sku: "RACE-TEST-SKU-5" },
      update: {},
      create: {
        productId: raceProduct.id,
        sku: "RACE-TEST-SKU-5",
        name: "Strip of 10 Tablets (Limited Edition)",
        packSize: "10 Tablets",
        price: 30,
        mrp: 35,
        discountPercent: 14,
        isDefault: true,
        weightGrams: 30,
        isActive: true,
      },
    });

    // Clean existing batches for this variant to guarantee exactly 5 units
    await prisma.inventoryBatch.deleteMany({
      where: { variantId: raceVariant.id },
    });

    await prisma.inventoryBatch.create({
      data: {
        variantId: raceVariant.id,
        batchNumber: "RACE-5-UNITS-ONLY",
        mfgDate: new Date("2024-06-01"),
        expiryDate: new Date("2027-06-01"),
        quantity: 5, // Exactly 5 units for 50-checkout race test
        costPrice: 18,
        isBlocked: false,
      },
    });
  }

  // 6. Seed Expired Batches (for testing FEFO skips expired items)
  console.log("Seeding expired batches...");
  const paracipVariant = await prisma.productVariant.findFirst({
    where: { sku: "CIP-PARA-10T" },
  });

  if (paracipVariant) {
    await prisma.inventoryBatch.upsert({
      where: { id: "batch-paracip-expired" },
      update: {},
      create: {
        id: "batch-paracip-expired",
        variantId: paracipVariant.id,
        batchNumber: "EXP-2023-PAR01",
        mfgDate: new Date("2022-01-01"),
        expiryDate: new Date("2023-12-31"), // Expired!
        quantity: 50,
        costPrice: 10,
        isBlocked: false,
      },
    });

    // Also add a blocked batch
    await prisma.inventoryBatch.upsert({
      where: { id: "batch-paracip-blocked" },
      update: {},
      create: {
        id: "batch-paracip-blocked",
        variantId: paracipVariant.id,
        batchNumber: "BLK-RECALL-901",
        mfgDate: new Date("2024-01-01"),
        expiryDate: new Date("2027-01-01"),
        quantity: 40,
        costPrice: 10,
        isBlocked: true, // Blocked/recalled!
      },
    });
  }

  // 7. Seed Orders for customer-with-orders across various statuses
  console.log("Seeding realistic historical orders for customer-with-orders...");
  const firstVariant = await prisma.productVariant.findFirst({
    where: { sku: "DET-250ML" },
    include: { product: true },
  });

  if (firstVariant) {
    // Order 1: PLACED (COD)
    await prisma.order.upsert({
      where: { orderNumber: "MED-2026-100001" },
      update: {},
      create: {
        orderNumber: "MED-2026-100001",
        userId: customerWithOrders.id,
        addressId: homeAddr.id,
        status: OrderStatus.PLACED,
        subtotal: 145,
        discount: 0,
        gstAmount: 15.54,
        deliveryFee: 40,
        totalAmount: 185,
        paymentMethod: PaymentMethod.COD,
        paymentStatus: PaymentStatus.PENDING,
        isPaid: false,
        deliverySlot: "Morning (08:00 AM - 12:00 PM)",
        items: {
          create: [
            {
              variantId: firstVariant.id,
              productName: firstVariant.product.name,
              packSize: firstVariant.packSize,
              sku: firstVariant.sku,
              price: firstVariant.price,
              mrp: firstVariant.mrp,
              gstRate: firstVariant.product.gstRate,
              gstAmount: 15.54,
              quantity: 1,
              subtotal: 145,
            },
          ],
        },
        statusHistory: {
          create: [
            { status: OrderStatus.PLACED, note: "Order placed successfully via COD" },
          ],
        },
      },
    });

    // Order 2: CONFIRMED (Razorpay, Paid)
    await prisma.order.upsert({
      where: { orderNumber: "MED-2026-100002" },
      update: {},
      create: {
        orderNumber: "MED-2026-100002",
        userId: customerWithOrders.id,
        addressId: homeAddr.id,
        status: OrderStatus.CONFIRMED,
        subtotal: 290,
        discount: 50,
        gstAmount: 25.71,
        deliveryFee: 40,
        totalAmount: 280,
        paymentMethod: PaymentMethod.RAZORPAY,
        paymentStatus: PaymentStatus.PAID,
        isPaid: true,
        deliverySlot: "Evening (04:00 PM - 08:00 PM)",
        items: {
          create: [
            {
              variantId: firstVariant.id,
              productName: firstVariant.product.name,
              packSize: firstVariant.packSize,
              sku: firstVariant.sku,
              price: firstVariant.price,
              mrp: firstVariant.mrp,
              gstRate: firstVariant.product.gstRate,
              gstAmount: 31.08,
              quantity: 2,
              subtotal: 290,
            },
          ],
        },
        payments: {
          create: [
            {
              razorpayOrderId: "order_test_rzp_100002",
              razorpayPaymentId: "pay_test_rzp_100002",
              razorpaySignature: "sig_test_valid_100002",
              amount: 280,
              currency: "INR",
              status: PaymentStatus.PAID,
              method: "UPI",
            },
          ],
        },
        statusHistory: {
          create: [
            { status: OrderStatus.PLACED, note: "Order placed" },
            { status: OrderStatus.CONFIRMED, note: "Payment verified via Razorpay UPI" },
          ],
        },
      },
    });

    // Order 3: SHIPPED
    await prisma.order.upsert({
      where: { orderNumber: "MED-2026-100003" },
      update: {},
      create: {
        orderNumber: "MED-2026-100003",
        userId: customerWithOrders.id,
        addressId: workAddr.id,
        status: OrderStatus.SHIPPED,
        subtotal: 580,
        discount: 0,
        gstAmount: 62.14,
        deliveryFee: 0, // Free delivery
        totalAmount: 580,
        paymentMethod: PaymentMethod.RAZORPAY,
        paymentStatus: PaymentStatus.PAID,
        isPaid: true,
        deliverySlot: "Standard Next-Day",
        items: {
          create: [
            {
              variantId: firstVariant.id,
              productName: firstVariant.product.name,
              packSize: firstVariant.packSize,
              sku: firstVariant.sku,
              price: firstVariant.price,
              mrp: firstVariant.mrp,
              gstRate: firstVariant.product.gstRate,
              gstAmount: 62.14,
              quantity: 4,
              subtotal: 580,
            },
          ],
        },
        statusHistory: {
          create: [
            { status: OrderStatus.PLACED, note: "Order placed" },
            { status: OrderStatus.CONFIRMED, note: "Confirmed" },
            { status: OrderStatus.PACKED, note: "Packed in cold bag" },
            { status: OrderStatus.SHIPPED, note: "Dispatched via BlueDart AWB #94810294" },
          ],
        },
      },
    });

    // Order 4: DELIVERED
    await prisma.order.upsert({
      where: { orderNumber: "MED-2026-100004" },
      update: {},
      create: {
        orderNumber: "MED-2026-100004",
        userId: customerWithOrders.id,
        addressId: homeAddr.id,
        status: OrderStatus.DELIVERED,
        subtotal: 725,
        discount: 100,
        gstAmount: 66.96,
        deliveryFee: 0,
        totalAmount: 625,
        paymentMethod: PaymentMethod.RAZORPAY,
        paymentStatus: PaymentStatus.PAID,
        isPaid: true,
        deliverySlot: "Morning (08:00 AM - 12:00 PM)",
        items: {
          create: [
            {
              variantId: firstVariant.id,
              productName: firstVariant.product.name,
              packSize: firstVariant.packSize,
              sku: firstVariant.sku,
              price: firstVariant.price,
              mrp: firstVariant.mrp,
              gstRate: firstVariant.product.gstRate,
              gstAmount: 77.68,
              quantity: 5,
              subtotal: 725,
            },
          ],
        },
        statusHistory: {
          create: [
            { status: OrderStatus.PLACED, note: "Order placed" },
            { status: OrderStatus.CONFIRMED, note: "Confirmed" },
            { status: OrderStatus.PACKED, note: "Packed" },
            { status: OrderStatus.SHIPPED, note: "Dispatched" },
            { status: OrderStatus.OUT_FOR_DELIVERY, note: "Out for delivery with Rider Ramesh (+91 98451 00021)" },
            { status: OrderStatus.DELIVERED, note: "Delivered to customer" },
          ],
        },
      },
    });

    // Order 5: CANCELLED
    await prisma.order.upsert({
      where: { orderNumber: "MED-2026-100005" },
      update: {},
      create: {
        orderNumber: "MED-2026-100005",
        userId: customerWithOrders.id,
        addressId: homeAddr.id,
        status: OrderStatus.CANCELLED,
        subtotal: 145,
        discount: 0,
        gstAmount: 15.54,
        deliveryFee: 40,
        totalAmount: 185,
        paymentMethod: PaymentMethod.COD,
        paymentStatus: PaymentStatus.FAILED,
        cancelReason: "Cancelled by customer before dispatch",
        items: {
          create: [
            {
              variantId: firstVariant.id,
              productName: firstVariant.product.name,
              packSize: firstVariant.packSize,
              sku: firstVariant.sku,
              price: firstVariant.price,
              mrp: firstVariant.mrp,
              gstRate: firstVariant.product.gstRate,
              gstAmount: 15.54,
              quantity: 1,
              subtotal: 145,
            },
          ],
        },
        statusHistory: {
          create: [
            { status: OrderStatus.PLACED, note: "Order placed" },
            { status: OrderStatus.CANCELLED, note: "Cancelled before packing" },
          ],
        },
      },
    });
  }

  // 8. Seed Additional Coupons for Testing Edge Cases
  console.log("Seeding coupon edge-cases...");
  const extraCoupons = [
    {
      code: "EXPIRED25",
      description: "Expired coupon: 25% off",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 25,
      minOrderValue: 100,
      usageLimit: 1000,
      startDate: new Date("2023-01-01"),
      endDate: new Date("2023-12-31"), // Expired
      isActive: false,
    },
    {
      code: "MIN1000",
      description: "Flat ₹200 off on high carts above ₹1000",
      discountType: DiscountType.FLAT,
      discountValue: 200,
      minOrderValue: 1000,
      usageLimit: 1000,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2028-12-31"),
      isActive: true,
    },
    {
      code: "MAXUSED",
      description: "Coupon that has exceeded usage limit",
      discountType: DiscountType.FLAT,
      discountValue: 50,
      minOrderValue: 200,
      usageLimit: 5,
      usedCount: 5, // Fully exhausted!
      startDate: new Date("2024-01-01"),
      endDate: new Date("2028-12-31"),
      isActive: true,
    },
    {
      code: "INACTIVE50",
      description: "Inactive promotional coupon",
      discountType: DiscountType.FLAT,
      discountValue: 50,
      minOrderValue: 100,
      usageLimit: 1000,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2028-12-31"),
      isActive: false, // Disabled!
    },
  ];

  for (const c of extraCoupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }

  // 9. Seed Serviceable Pincodes in System Settings
  console.log("Seeding serviceable pincodes...");
  await prisma.setting.upsert({
    where: { key: "SERVICEABLE_PINCODES" },
    update: { value: "560001,560002,560025,560038,560100,560103,110001,400001" },
    create: {
      key: "SERVICEABLE_PINCODES",
      value: "560001,560002,560025,560038,560100,560103,110001,400001",
      description: "Comma-separated list of postal codes where medicine deliveries are active",
    },
  });

  console.log("✅ Seed extensions successfully applied!");
}

main()
  .catch((e) => {
    console.error("❌ Error in seed extensions:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
