import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";
import { getAuthenticatedUser, ensureUserExistsInDb } from "@/lib/server-auth";
import { cookies } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const { url: SUPABASE_URL } = getSupabaseConfig();

function getHeaders() {
  return getSupabaseHeaders();
}

export async function GET(req: NextRequest) {
  try {
    const userCtx = await getAuthenticatedUser(req);
    const { userId, placedOrderIds } = userCtx;

    // Strict privacy guarantee: if unauthenticated and has no placed session orders, return empty list
    if (!userId && placedOrderIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const orderMap = new Map<string, any>();

    // 1. Fetch orders belonging directly to this authenticated user
    if (userId) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/Order?userId=eq.${encodeURIComponent(userId)}&select=*,items:OrderItem(*),address:Address(*)&order=createdAt.desc`,
        { headers: getHeaders(), cache: "no-store" }
      );

      if (res.ok) {
        const userOrders = await res.json();
        if (Array.isArray(userOrders)) {
          for (const order of userOrders) {
            orderMap.set(order.id, order);
          }
        }
      }
    }

    // 2. Fetch any session-placed orders (only those verified in user's browser cookie)
    if (placedOrderIds.length > 0) {
      const validUuids = placedOrderIds.filter((id) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      );

      if (validUuids.length > 0) {
        const inFilter = `(${validUuids.map((id) => `"${id}"`).join(",")})`;
        const placedRes = await fetch(
          `${SUPABASE_URL}/rest/v1/Order?id=in.${inFilter}&select=*,items:OrderItem(*),address:Address(*)&order=createdAt.desc`,
          { headers: getHeaders(), cache: "no-store" }
        );

        if (placedRes.ok) {
          const placedOrders = await placedRes.json();
          if (Array.isArray(placedOrders)) {
            for (const order of placedOrders) {
              orderMap.set(order.id, order);
            }
          }
        }
      }
    }

    const finalOrders = Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ success: true, data: finalOrders });
  } catch (error: any) {
    console.error("GET /api/orders error:", error?.message);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userCtx = await getAuthenticatedUser(req);
    const { userId, email, name, phone, placedOrderIds } = userCtx;

    // Require authentication: user must be signed in to place an order
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please sign in to place your order." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      addressId,
      paymentMethod = "RAZORPAY",
      couponCode,
      deliverySlot = "Standard Next-Day (9 AM - 9 PM)",
    } = body;

    const cookieStore = await cookies();
    const sessionId = cookieStore.get("cartSessionId")?.value;

    if (!addressId) {
      return NextResponse.json(
        { success: false, message: "Delivery address is required." },
        { status: 400 }
      );
    }

    // Ensure the User record exists in PostgreSQL to satisfy Order_userId_fkey
    await ensureUserExistsInDb(userId, email, name, phone);

    // Verify Address exists to satisfy Order_addressId_fkey
    let finalAddressId = addressId;
    const addrCheck = await fetch(
      `${SUPABASE_URL}/rest/v1/Address?id=eq.${encodeURIComponent(addressId)}&select=id`,
      { headers: getHeaders(), cache: "no-store" }
    );
    const existingAddrs = addrCheck.ok ? await addrCheck.json() : [];

    if (!existingAddrs || existingAddrs.length === 0) {
      // Look up any existing address for this user
      const userAddrCheck = await fetch(
        `${SUPABASE_URL}/rest/v1/Address?userId=eq.${encodeURIComponent(userId)}&order=isDefault.desc,createdAt.desc&limit=1`,
        { headers: getHeaders(), cache: "no-store" }
      );
      const userAddrs = userAddrCheck.ok ? await userAddrCheck.json() : [];
      if (userAddrs?.[0]?.id) {
        finalAddressId = userAddrs[0].id;
      } else if (body.newAddress?.fullName && body.newAddress?.addressLine1) {
        // Auto-create address record from body
        const newAddrId = crypto.randomUUID();
        const createAddrRes = await fetch(`${SUPABASE_URL}/rest/v1/Address`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            id: newAddrId,
            userId,
            fullName: String(body.newAddress.fullName).trim(),
            phone: String(body.newAddress.phone || phone || "9999999999").trim(),
            addressLine1: String(body.newAddress.addressLine1).trim(),
            city: String(body.newAddress.city || "Sitapur").trim(),
            state: String(body.newAddress.state || "Punjab").trim(),
            pincode: String(body.newAddress.pincode || "261001").trim(),
            type: body.newAddress.type || "HOME",
            isDefault: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
        if (createAddrRes.ok) {
          finalAddressId = newAddrId;
        }
      }
    }

    // 1. Fetch Cart and CartItems
    let items: any[] = [];
    let cartId: string | null = null;

    // A. Use client items payload if provided
    if (Array.isArray(body.items) && body.items.length > 0) {
      for (const clientItem of body.items) {
        if (!clientItem?.variantId) continue;
        const vRes = await fetch(
          `${SUPABASE_URL}/rest/v1/ProductVariant?id=eq.${encodeURIComponent(clientItem.variantId)}&select=id,sku,name,packSize,price,mrp,product:Product(name,slug,gstRate)&limit=1`,
          { headers: getHeaders() }
        );
        if (vRes.ok) {
          const variants = await vRes.json();
          if (variants?.[0]) {
            items.push({
              id: clientItem.id || crypto.randomUUID(),
              quantity: Math.max(1, Number(clientItem.quantity) || 1),
              variant: variants[0],
            });
          }
        }
      }
    }

    // B. Check session cart in Supabase
    if (items.length === 0 && sessionId) {
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

    // C. Fall back to active product catalog variant if still empty
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
      addressId: finalAddressId,
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
    const orderInsertRes = await fetch(`${SUPABASE_URL}/rest/v1/Order`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(orderRecord),
    });

    if (!orderInsertRes.ok) {
      const errText = await orderInsertRes.text();
      console.error("Order insertion failed:", errText);
      let errMsg = "Failed to persist order in database.";
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.message || parsed.details || errMsg;
      } catch {}
      return NextResponse.json(
        { success: false, message: errMsg },
        { status: 500 }
      );
    }

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

    // Update session placed orders
    const updatedPlacedIds = Array.from(new Set([...placedOrderIds, orderId, orderNumber]));

    const response = NextResponse.json(
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

    // Save placed order id to cookie for secure browser continuity
    response.cookies.set("medico_placed_order_ids", JSON.stringify(updatedPlacedIds), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/orders error:", error?.message);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
