import { PrismaClient, OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Fixing timestamp spacing in OrderStatusHistory and orders for MAXUSED coupon...");

  // 1. Space out OrderStatusHistory timestamps so each subsequent status is realistically later
  const orders = await prisma.order.findMany({
    include: {
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const statusRank = {
    PLACED: 1,
    CONFIRMED: 2,
    PACKED: 3,
    SHIPPED: 4,
    OUT_FOR_DELIVERY: 5,
    DELIVERED: 6,
    CANCELLED: 7,
    RETURN_REQUESTED: 8,
    RETURNED: 9,
  };

  for (const o of orders) {
    if (o.statusHistory.length > 1) {
      // Sort in lifecycle order
      const sorted = [...o.statusHistory].sort((a, b) => {
        return (statusRank[a.status] || 0) - (statusRank[b.status] || 0);
      });

      const baseTime = o.createdAt.getTime();
      for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];
        // Add 5 minutes per step
        const newTime = new Date(baseTime + i * 5 * 60 * 1000);
        await prisma.orderStatusHistory.update({
          where: { id: item.id },
          data: { createdAt: newTime },
        });
      }
      console.log(`Updated history timeline for ${o.orderNumber}`);
    }
  }

  // 2. Fix MAXUSED coupon: Create 5 past orders using MAXUSED coupon so usedCount = actual orders
  const maxCoupon = await prisma.coupon.findUnique({
    where: { code: "MAXUSED" },
  });

  if (maxCoupon) {
    const customer = await prisma.user.findFirst({
      where: { role: "CUSTOMER" },
      include: { addresses: true },
    });
    const variant = await prisma.productVariant.findFirst({
      include: { product: true },
    });

    if (customer && customer.addresses[0] && variant) {
      const currentOrders = await prisma.order.count({
        where: { couponId: maxCoupon.id },
      });

      const needed = 5 - currentOrders;
      for (let i = 1; i <= needed; i++) {
        const orderNum = `MED-PAST-MAX-${i}`;
        const existing = await prisma.order.findUnique({ where: { orderNumber: orderNum } });
        if (!existing) {
          const subtotal = 100;
          const discount = 20;
          const deliveryFee = 40;
          const totalAmount = subtotal - discount + deliveryFee;

          const created = await prisma.order.create({
            data: {
              orderNumber: orderNum,
              userId: customer.id,
              addressId: customer.addresses[0].id,
              status: OrderStatus.DELIVERED,
              subtotal,
              discount,
              gstAmount: 10.71,
              deliveryFee,
              totalAmount,
              paymentMethod: PaymentMethod.COD,
              paymentStatus: PaymentStatus.PAID,
              isPaid: true,
              couponId: maxCoupon.id,
              items: {
                create: [
                  {
                    variantId: variant.id,
                    productName: variant.product.name,
                    packSize: variant.packSize,
                    sku: variant.sku,
                    price: variant.price,
                    mrp: variant.mrp,
                    gstRate: variant.product.gstRate,
                    gstAmount: 10.71,
                    quantity: 1,
                    subtotal: 100,
                  },
                ],
              },
              statusHistory: {
                create: [
                  { status: OrderStatus.PLACED, note: "Order placed" },
                  { status: OrderStatus.DELIVERED, note: "Order delivered" },
                ],
              },
            },
          });

          // Space the status history timestamps for this past order
          const histories = await prisma.orderStatusHistory.findMany({
            where: { orderId: created.id },
            orderBy: { createdAt: "asc" },
          });
          if (histories.length === 2) {
            await prisma.orderStatusHistory.update({
              where: { id: histories[1].id },
              data: { createdAt: new Date(Date.now() + 10000) },
            });
          }
          console.log(`Created past order ${orderNum} for MAXUSED coupon`);
        }
      }
    }
  }

  console.log("✨ Invariant fixes complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
