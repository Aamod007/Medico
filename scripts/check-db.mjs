import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking DB counts...");
  const users = await prisma.user.count();
  const addresses = await prisma.address.count();
  const products = await prisma.product.count();
  const rxProducts = await prisma.product.count({ where: { prescriptionRequired: true } });
  const variants = await prisma.productVariant.count();
  const batches = await prisma.inventoryBatch.count();
  const expiredBatches = await prisma.inventoryBatch.count({ where: { expiryDate: { lt: new Date() } } });
  const blockedBatches = await prisma.inventoryBatch.count({ where: { isBlocked: true } });
  const categories = await prisma.category.count();
  const brands = await prisma.brand.count();
  const coupons = await prisma.coupon.count();
  const doctors = await prisma.doctor.count();
  const labTests = await prisma.labTest.count();
  const prescriptions = await prisma.prescription.count();
  const orders = await prisma.order.count();
  const settings = await prisma.setting.count();

  console.log({
    users,
    addresses,
    products,
    rxProducts,
    variants,
    batches,
    expiredBatches,
    blockedBatches,
    categories,
    brands,
    coupons,
    doctors,
    labTests,
    prescriptions,
    orders,
    settings,
  });
}

main()
  .catch((e) => console.error("Error connecting to DB:", e))
  .finally(() => prisma.$disconnect());
