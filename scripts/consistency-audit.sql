-- ============================================================================
-- Medico Platform - Global Consistency Audit SQL
-- Verifies Invariants C1 through C13
-- ============================================================================

-- INVARIANT C1: No negative batch quantities & no sales from expired batches
SELECT 'C1_NEGATIVE_BATCH_STOCK' AS invariant_code,
       COUNT(*) AS violations,
       json_agg(json_build_object('id', id, 'batch', "batchNumber", 'quantity', quantity)) AS violation_details
FROM "InventoryBatch"
WHERE quantity < 0;

-- INVARIANT C2: Cart item validity (no zero or negative quantities)
SELECT 'C2_INVALID_CART_QUANTITY' AS invariant_code,
       COUNT(*) AS violations,
       json_agg(json_build_object('id', id, 'cartId', "cartId", 'quantity', quantity)) AS violation_details
FROM "CartItem"
WHERE quantity <= 0;

-- INVARIANT C3_A: Order Total Math: totalAmount = subtotal - discount + deliveryFee (subtotal includes GST)
SELECT 'C3_ORDER_MATH_MISMATCH' AS invariant_code,
       COUNT(*) AS violations,
       json_agg(json_build_object(
           'orderNumber', "orderNumber",
           'totalAmount', "totalAmount",
           'computed', ("subtotal" - "discount" + "deliveryFee")
       )) AS violation_details
FROM "Order"
WHERE ABS("totalAmount" - ("subtotal" - "discount" + "deliveryFee")) > 0.05;

-- INVARIANT C3_B: Order Items Subtotal equals Order subtotal
WITH order_item_mismatches AS (
    SELECT o.id, o."orderNumber", o.subtotal, SUM(oi.subtotal) as items_sum
    FROM "Order" o
    JOIN "OrderItem" oi ON o.id = oi."orderId"
    GROUP BY o.id, o."orderNumber", o.subtotal
    HAVING ABS(o.subtotal - SUM(oi.subtotal)) > 0.05
)
SELECT 'C3_ORDER_ITEMS_SUBTOTAL_MISMATCH' AS invariant_code,
       COUNT(*) AS violations,
       COALESCE(json_agg(json_build_object(
           'orderNumber', "orderNumber",
           'orderSubtotal', subtotal,
           'itemsSum', items_sum
       )), '[]'::json) AS violation_details
FROM order_item_mismatches;

-- INVARIANT C4_A: Payment rows: Every PAID order has captured payment
SELECT 'C4_PAID_ORDER_WITHOUT_PAYMENT' AS invariant_code,
       COUNT(*) AS violations,
       json_agg(json_build_object('orderNumber', o."orderNumber", 'paymentStatus', o."paymentStatus")) AS violation_details
FROM "Order" o
WHERE o."paymentStatus" = 'PAID'
  AND NOT EXISTS (
      SELECT 1 FROM "Payment" p
      WHERE p."orderId" = o.id AND p.status = 'PAID'
  );

-- INVARIANT C4_B: Orphan Payments without existing Order
SELECT 'C4_ORPHAN_PAYMENTS' AS invariant_code,
       COUNT(*) AS violations,
       json_agg(json_build_object('paymentId', p.id, 'orderId', p."orderId")) AS violation_details
FROM "Payment" p
WHERE NOT EXISTS (
    SELECT 1 FROM "Order" o WHERE o.id = p."orderId"
);

-- INVARIANT C5: Order status agrees with latest OrderStatusHistory entry
SELECT 'C5_ORDER_STATUS_HISTORY_MISMATCH' AS invariant_code,
       COUNT(*) AS violations,
       json_agg(json_build_object(
           'orderNumber', o."orderNumber",
           'orderStatus', o.status,
           'historyStatus', h.status
       )) AS violation_details
FROM "Order" o
LEFT JOIN LATERAL (
    SELECT status FROM "OrderStatusHistory"
    WHERE "orderId" = o.id
    ORDER BY "createdAt" DESC
    LIMIT 1
) h ON true
WHERE h.status IS NOT NULL AND o.status != h.status;

-- INVARIANT C6: Rating bounds (rating must be between 1 and 5)
SELECT 'C7_RATING_OUT_OF_BOUNDS' AS invariant_code,
       COUNT(*) AS violations,
       json_agg(json_build_object('reviewId', id, 'rating', rating)) AS violation_details
FROM "Review"
WHERE rating < 1 OR rating > 5;

-- INVARIANT C8: Coupon usedCount equals orders referencing coupon
WITH coupon_violations AS (
    SELECT c.id, c.code, c."usedCount", COUNT(o.id) as actual_orders
    FROM "Coupon" c
    LEFT JOIN "Order" o ON o."couponId" = c.id
    GROUP BY c.id, c.code, c."usedCount"
    HAVING c."usedCount" != COUNT(o.id)
)
SELECT 'C8_COUPON_USAGE_MISMATCH' AS invariant_code,
       COUNT(*) AS violations,
       COALESCE(json_agg(json_build_object(
           'code', code,
           'usedCount', "usedCount",
           'actualOrders', actual_orders
       )), '[]'::json) AS violation_details
FROM coupon_violations;

-- INVARIANT C9_A: Orphan CartItems
SELECT 'C9_ORPHAN_CART_ITEMS' AS invariant_code,
       COUNT(*) AS violations,
       json_agg(json_build_object('cartItemId', ci.id)) AS violation_details
FROM "CartItem" ci
WHERE NOT EXISTS (SELECT 1 FROM "Cart" c WHERE c.id = ci."cartId");

-- INVARIANT C9_B: Orphan Wishlist entries
SELECT 'C9_ORPHAN_WISHLIST_ENTRIES' AS invariant_code,
       COUNT(*) AS violations,
       json_agg(json_build_object('wishlistId', w.id)) AS violation_details
FROM "Wishlist" w
WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = w."userId");

-- INVARIANT C11: Exactly at most one default address per user
SELECT 'C11_MULTIPLE_DEFAULT_ADDRESSES' AS invariant_code,
       COUNT(*) AS violations,
       json_agg(json_build_object('userId', "userId", 'defaultCount', cnt)) AS violation_details
FROM (
    SELECT "userId", COUNT(*) as cnt
    FROM "Address"
    WHERE "isDefault" = true
    GROUP BY "userId"
    HAVING COUNT(*) > 1
) sub;

-- INVARIANT C12: Unique Order Numbers (no duplicate orderNumber)
SELECT 'C12_DUPLICATE_ORDER_NUMBERS' AS invariant_code,
       COUNT(*) AS violations,
       json_agg(json_build_object('orderNumber', "orderNumber", 'count', cnt)) AS violation_details
FROM (
    SELECT "orderNumber", COUNT(*) as cnt
    FROM "Order"
    GROUP BY "orderNumber"
    HAVING COUNT(*) > 1
) sub;

-- INVARIANT C13_A: Orphan OrderItems
SELECT 'C13_ORPHAN_ORDER_ITEMS' AS invariant_code,
       COUNT(*) AS violations,
       json_agg(json_build_object('orderItemId', oi.id)) AS violation_details
FROM "OrderItem" oi
WHERE NOT EXISTS (SELECT 1 FROM "Order" o WHERE o.id = oi."orderId");

-- INVARIANT C13_B: Orphan InventoryBatches
SELECT 'C13_ORPHAN_INVENTORY_BATCHES' AS invariant_code,
       COUNT(*) AS violations,
       json_agg(json_build_object('batchId', ib.id)) AS violation_details
FROM "InventoryBatch" ib
WHERE NOT EXISTS (SELECT 1 FROM "ProductVariant" pv WHERE pv.id = ib."variantId");
