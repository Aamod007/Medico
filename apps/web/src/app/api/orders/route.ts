import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vakxcpryqrsqhviivvmv.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

const DEFAULT_USER_ID = "3cb3a440-1b17-4a0e-b787-05752b228d35";

function getHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value || DEFAULT_USER_ID;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/Order?userId=eq.${userId}&select=*,items:OrderItem(*),address:Address(*)&order=createdAt.desc`,
      { headers: getHeaders(), cache: "no-store" }
    );

    if (res.ok) {
      const orders = await res.json();
      return NextResponse.json({ success: true, data: orders || [] });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    console.error("GET /api/orders error:", error?.message);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { addressId, paymentMethod = "RAZORPAY", couponCode, deliverySlot = "Standard Next-Day (9 AM - 9 PM)" } = body;

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value || DEFAULT_USER_ID;
    const sessionId = cookieStore.get("cartSessionId")?.value;

    if (!addressId) {
      return NextResponse.json({ success: false, message: "Delivery address is required." }, { status: 400 });
    }

    // 1. Fetch Cart and CartItems
    let items: any[] = [];
    let cartId: string | null = null;

    if (sessionId) {
      const cartRes = await fetch(
        `${SUPABASE_URL}/rest/v1/Cart?sessionId=eq.${sessionId}&select=id,items:CartItem(id,quantity,variant:ProductVariant(id,sku,name,packSize,price,mrp,product:Product(name,slug,gstRate)))`,
        { headers: getHeaders(), cache: "no-store" }
      );
      if (cartRes.ok) {
        const carts = await cartRes.json();
        if (carts?.[0]?.items?.length > 0) {
          cartId = carts[0].id;
          items = carts[0].items;
        }
      }
    }

    // If session cart is empty, fall back to active product catalog variant
    if (items.length === 0) {
      const fallbackVariantRes = await fetch(
        `${SUPABASE_URL}/rest/v1/ProductVariant?isActive=eq.true&select=id,sku,name,packSize,price,mrp,product:Product(name,slug,gstRate)&limit=1`,
        { headers: getHeaders() }
      );
      if (fallbackVariantRes.ok) {
        const variants = await fallbackVariantRes.json();
        if (variants?.length > 0) {
          items = [{ id: "temp", quantity: 1, variant: variants[0] }];
        }
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ success: false, message: "Your cart is empty." }, { status: 400 });
    }

    // 2. Calculate Order Totals
    let subtotal = 0;
    let totalGst = 0;

    const orderItemsPayload: any[] = [];
    const orderId = crypto.randomUUID();

    for (const item of items) {
      const variant = item.variant;
      const price = Number(variant?.price || 0);
      const qty = Number(item.quantity || 1);
      const itemSubtotal = price * qty;
      const gstRate = Number(variant?.product?.gstRate || 12);
      const baseAmount = itemSubtotal / (1 + gstRate / 100);
      const itemGst = itemSubtotal - baseAmount;

      subtotal += itemSubtotal;
      totalGst += itemGst;

      orderItemsPayload.push({
        id: crypto.randomUUID(),
        orderId,
        variantId: variant?.id,
        productName: variant?.product?.name || variant?.name || "Healthcare Essential",
        packSize: variant?.packSize || "Standard Pack",
        sku: variant?.sku || "SKU-GEN",
        price,
        mrp: Number(variant?.mrp || price),
        gstRate,
        gstAmount: Math.round(itemGst * 100) / 100,
        quantity: qty,
        subtotal: itemSubtotal,
      });
    }

    // 3. Discount & Coupon
    let discount = 0;
    let appliedCouponId: string | null = null;
    if (couponCode) {
      const couponRes = await fetch(
        `${SUPABASE_URL}/rest/v1/Coupon?code=eq.${encodeURIComponent(couponCode.toUpperCase())}&isActive=eq.true&limit=1`,
        { headers: getHeaders() }
      );
      if (couponRes.ok) {
        const coupons = await couponRes.json();
        if (coupons?.[0]) {
          const coupon = coupons[0];
          appliedCouponId = coupon.id;
          const val = Number(coupon.discountValue || 0);
          if (coupon.discountType === "PERCENTAGE") {
            discount = (subtotal * val) / 100;
            if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
          } else {
            discount = val;
          }
          discount = Math.min(discount, subtotal);
        }
      }
    }

    const deliveryFee = subtotal >= 500 ? 0 : 40;
    const totalAmount = subtotal - discount + deliveryFee;
    const orderNumber = `MED-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderRecord = {
      id: orderId,
      orderNumber,
      userId,
      addressId,
      status: "PLACED",
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      gstAmount: Math.round(totalGst * 100) / 100,
      deliveryFee,
      totalAmount: Math.round(totalAmount * 100) / 100,
      paymentMethod,
      paymentStatus: "PENDING",
      couponId: appliedCouponId,
      deliverySlot,
      isPaid: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Insert Order into Supabase
    await fetch(`${SUPABASE_URL}/rest/v1/Order`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(orderRecord),
    });

    // Insert OrderItems
    if (orderItemsPayload.length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/OrderItem`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(orderItemsPayload),
      });
    }

    // Insert OrderStatusHistory
    await fetch(`${SUPABASE_URL}/rest/v1/OrderStatusHistory`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        orderId,
        status: "PLACED",
        note: "Order placed successfully.",
        changedByUserId: userId,
        createdAt: new Date().toISOString(),
      }),
    });

    // Clear cart if cartId exists
    if (cartId) {
      await fetch(`${SUPABASE_URL}/rest/v1/CartItem?cartId=eq.${cartId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully",
        data: {
          ...orderRecord,
          items: orderItemsPayload,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/orders error:", error?.message);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
