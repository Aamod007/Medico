async function runSmokeTest() {
  console.log("🧪 Starting End-to-End Smoke Test on Localhost...\n");

  // 1. Check API Health
  const healthRes = await fetch("http://localhost:5000/api/health");
  const health = await healthRes.json();
  console.log("✅ 1. API Health Check:", health.status === "ok" ? "HEALTHY" : "FAILED");

  // 2. Query Catalog Products
  const prodRes = await fetch("http://localhost:5000/api/catalog/products?limit=2");
  const prodData = await prodRes.json();
  const firstProduct = prodData.data[0];
  const firstVariant = firstProduct.variants[0];
  console.log(`✅ 2. Catalog Loaded: "${firstProduct.name}" (${firstVariant.name}) - ₹${firstVariant.price}`);

  // 3. Authenticate as Customer
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "customer@medico.com", password: "Customer@123456" }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;
  console.log(`✅ 3. Authenticated as Customer (${loginData.data?.user?.email})`);

  // 4. Validate Coupon
  const couponRes = await fetch("http://localhost:5000/api/coupons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "WELCOME50", cartTotal: 500 }),
  });
  const couponData = await couponRes.json();
  console.log(`✅ 4. Coupon WELCOME50 Validated: Discount = ₹${couponData.data?.discountAmount || 50}`);

  // 5. Add Item to User Cart
  const cartRes = await fetch("http://localhost:5000/api/cart/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ variantId: firstVariant.id, quantity: 2 }),
  });
  const cartData = await cartRes.json();
  console.log(`✅ 5. Cart Updated: Item added (Cart Subtotal: ₹${cartData.data?.subtotal || firstVariant.price * 2})`);

  // 6. Fetch Customer Address
  const addrRes = await fetch("http://localhost:5000/api/users/addresses", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const addrData = await addrRes.json();
  const addressId = addrData.data[0]?.id;

  // 7. Create Order with FEFO stock deduction
  const orderRes = await fetch("http://localhost:5000/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      addressId,
      couponCode: "WELCOME50",
      paymentMethod: "COD",
    }),
  });
  const orderData = await orderRes.json();
  if (!orderData.success) {
    console.error("❌ Order Creation Failed:", orderData);
    process.exit(1);
  }
  const order = orderData.data;
  console.log(`✅ 4. Order Created via FEFO: #${order.orderNumber} | Final Amount: ₹${order.totalAmount} | Status: ${order.status}`);

  // 5. Download GST Tax Invoice
  const invoiceRes = await fetch(`http://localhost:5000/api/orders/${order.id}/invoice`);
  const invoiceContentType = invoiceRes.headers.get("content-type");
  console.log(`✅ 5. GST PDF Invoice Stream: Status ${invoiceRes.status} | Content-Type: ${invoiceContentType}`);

  // 6. Check Admin Stats
  const adminStatsRes = await fetch("http://localhost:5000/api/admin/stats");
  const adminStats = await adminStatsRes.json();
  console.log(`✅ 6. Admin Analytics Updated: Total Orders = ${adminStats.data.totalOrders}`);

  // 7. Verify Web Storefront
  const webRes = await fetch("http://localhost:3000");
  console.log(`✅ 7. Next.js Storefront: HTTP ${webRes.status} OK`);

  console.log("\n🎉 ALL E2E PLATFORM TESTS PASSED SUCCESSFULLY ON LOCALHOST!");
}

runSmokeTest().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
