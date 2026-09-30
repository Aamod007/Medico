import { Request, Response } from "express";
import prisma from "../../lib/prisma";
import { AddToCartInput, UpdateCartItemInput, CURRENCY_CONFIG } from "@medico/shared";

// Helper to find or create cart for user or guest session
async function getOrCreateCart(userId?: string, sessionId?: string) {
  if (userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                batches: {
                  where: {
                    quantity: { gt: 0 },
                    expiryDate: { gt: new Date() },
                    isBlocked: false,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true, batches: true },
              },
            },
          },
        },
      });
    }
    return cart;
  }

  if (sessionId) {
    let cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                batches: {
                  where: {
                    quantity: { gt: 0 },
                    expiryDate: { gt: new Date() },
                    isBlocked: false,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true, batches: true },
              },
            },
          },
        },
      });
    }
    return cart;
  }

  throw new Error("Either userId or sessionId must be provided");
}

function calculateCartTotals(items: any[]) {
  let subtotal = 0;
  let mrpTotal = 0;
  let hasPrescriptionItems = false;
  let totalGst = 0;

  const formattedItems = items.map((item) => {
    const itemPrice = Number(item.variant.price);
    const itemMrp = Number(item.variant.mrp);
    const gstRate = Number(item.variant.product.gstRate) || 12;
    const itemTotal = itemPrice * item.quantity;
    const itemMrpTotal = itemMrp * item.quantity;

    // GST inclusive calculation: base = total / (1 + rate/100)
    const baseAmount = itemTotal / (1 + gstRate / 100);
    const itemGst = itemTotal - baseAmount;

    subtotal += itemTotal;
    mrpTotal += itemMrpTotal;
    totalGst += itemGst;

    if (item.variant.product.prescriptionRequired) {
      hasPrescriptionItems = true;
    }

    const availableStock = item.variant.batches.reduce(
      (acc: number, b: any) => acc + b.quantity,
      0
    );

    return {
      id: item.id,
      variantId: item.variantId,
      productId: item.variant.productId,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
      image: item.variant.product.images[0] || null,
      packSize: item.variant.packSize,
      sku: item.variant.sku,
      price: itemPrice,
      mrp: itemMrp,
      quantity: item.quantity,
      subtotal: itemTotal,
      availableStock,
      isOutOfStock: availableStock < item.quantity,
      prescriptionRequired: item.variant.product.prescriptionRequired,
    };
  });

  const discount = Math.max(0, mrpTotal - subtotal);
  const deliveryFee =
    subtotal === 0 || subtotal >= CURRENCY_CONFIG.freeShippingThreshold
      ? 0
      : CURRENCY_CONFIG.defaultDeliveryFee;
  const totalAmount = subtotal + deliveryFee;

  return {
    items: formattedItems,
    itemCount: items.reduce((acc, it) => acc + it.quantity, 0),
    mrpTotal: Math.round(mrpTotal * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    estimatedGst: Math.round(totalGst * 100) / 100,
    deliveryFee,
    totalAmount: Math.round(totalAmount * 100) / 100,
    freeDeliveryEligible: subtotal >= CURRENCY_CONFIG.freeShippingThreshold,
    amountNeededForFreeDelivery: Math.max(
      0,
      CURRENCY_CONFIG.freeShippingThreshold - subtotal
    ),
    hasPrescriptionItems,
  };
}

export async function getCart(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const sessionId = (req.headers["x-session-id"] as string) || req.cookies?.cartSessionId;

  if (!userId && !sessionId) {
    res.json({
      success: true,
      data: {
        items: [],
        itemCount: 0,
        subtotal: 0,
        mrpTotal: 0,
        discount: 0,
        estimatedGst: 0,
        deliveryFee: 0,
        totalAmount: 0,
        hasPrescriptionItems: false,
      },
    });
    return;
  }

  const cart = await getOrCreateCart(userId, sessionId);
  const totals = calculateCartTotals(cart.items);

  res.json({ success: true, data: { cartId: cart.id, ...totals } });
}

export async function addToCart(req: Request<{}, {}, AddToCartInput>, res: Response): Promise<void> {
  const userId = req.user?.userId;
  let sessionId = (req.headers["x-session-id"] as string) || req.cookies?.cartSessionId;

  if (!userId && !sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    res.cookie("cartSessionId", sessionId, { maxAge: 30 * 24 * 60 * 60 * 1000 });
  }

  const { variantId, quantity } = req.body;

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId, isActive: true },
    include: {
      batches: {
        where: {
          quantity: { gt: 0 },
          expiryDate: { gt: new Date() },
          isBlocked: false,
        },
      },
    },
  });

  if (!variant) {
    res.status(404).json({ success: false, message: "Product variant not found" });
    return;
  }

  const availableStock = variant.batches.reduce((acc, b) => acc + b.quantity, 0);
  if (availableStock < quantity) {
    res.status(400).json({
      success: false,
      message: `Only ${availableStock} units available in stock`,
    });
    return;
  }

  const cart = await getOrCreateCart(userId, sessionId);

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (availableStock < newQty) {
      res.status(400).json({
        success: false,
        message: `Cannot add more. Total in cart would exceed stock (${availableStock})`,
      });
      return;
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQty },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, variantId, quantity },
    });
  }

  const refreshedCart = await getOrCreateCart(userId, sessionId);
  const totals = calculateCartTotals(refreshedCart.items);

  res.json({
    success: true,
    message: "Item added to cart",
    data: { cartId: cart.id, sessionId, ...totals },
  });
}

export async function updateCartItem(
  req: Request<{ itemId: string }, {}, UpdateCartItemInput>,
  res: Response
): Promise<void> {
  const { itemId } = req.params;
  const { quantity } = req.body;

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      variant: {
        include: {
          batches: {
            where: {
              quantity: { gt: 0 },
              expiryDate: { gt: new Date() },
              isBlocked: false,
            },
          },
        },
      },
    },
  });

  if (!item) {
    res.status(404).json({ success: false, message: "Cart item not found" });
    return;
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    const availableStock = item.variant.batches.reduce((acc, b) => acc + b.quantity, 0);
    if (availableStock < quantity) {
      res.status(400).json({
        success: false,
        message: `Only ${availableStock} units available in stock`,
      });
      return;
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  res.json({ success: true, message: "Cart updated" });
}

export async function removeCartItem(req: Request<{ itemId: string }>, res: Response): Promise<void> {
  const { itemId } = req.params;
  await prisma.cartItem.deleteMany({ where: { id: itemId } });
  res.json({ success: true, message: "Item removed from cart" });
}

export async function clearCart(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const sessionId = (req.headers["x-session-id"] as string) || req.cookies?.cartSessionId;

  if (userId) {
    await prisma.cart.deleteMany({ where: { userId } });
  } else if (sessionId) {
    await prisma.cart.deleteMany({ where: { sessionId } });
  }

  res.json({ success: true, message: "Cart cleared" });
}
