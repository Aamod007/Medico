import assert from "node:assert";

console.log("🧪 Running Medico Core Logic Unit Tests...\n");

// 1. Test Indian Rupee Currency Formatter
function formatINR(amount, showDecimals = false) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

const formatted1 = formatINR(1499);
const formatted2 = formatINR(1499.5, true);
console.log(`✅ 1. formatINR: 1499 => "${formatted1}", 1499.50 => "${formatted2}"`);
assert(formatted1.includes("1,499"));
assert(formatted2.includes("1,499.50"));

// 2. Test Coupon Calculation Logic
function calculateCouponDiscount(coupon, subtotal) {
  if (subtotal < coupon.minOrderAmount) {
    return { valid: false, discountAmount: 0, reason: `Minimum order amount of ₹${coupon.minOrderAmount} required` };
  }
  let discount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  } else if (coupon.discountType === "FLAT") {
    discount = coupon.discountValue;
  }
  discount = Math.min(discount, subtotal);
  return { valid: true, discountAmount: Math.round(discount) };
}

const percentageCoupon = {
  code: "HEALTH20",
  discountType: "PERCENTAGE",
  discountValue: 20,
  maxDiscountAmount: 150,
  minOrderAmount: 500,
};

const calc1 = calculateCouponDiscount(percentageCoupon, 400);
assert.strictEqual(calc1.valid, false, "Should reject when subtotal < minOrderAmount");

const calc2 = calculateCouponDiscount(percentageCoupon, 1000);
assert.strictEqual(calc2.valid, true);
assert.strictEqual(calc2.discountAmount, 150, "Should cap discount at maxDiscountAmount");

const calc3 = calculateCouponDiscount(percentageCoupon, 600);
assert.strictEqual(calc3.discountAmount, 120, "20% of 600 should be 120");
console.log("✅ 2. Coupon Validation & Max Cap Discount Rules: PASSED");

// 3. Test FEFO (First-Expiry First-Out) Sorting Logic
const batches = [
  { batchNumber: "B3", expiryDate: new Date("2027-08-01"), quantity: 50 },
  { batchNumber: "B1", expiryDate: new Date("2026-11-15"), quantity: 30 },
  { batchNumber: "B2", expiryDate: new Date("2027-01-20"), quantity: 100 },
];

const sortedFEFO = [...batches].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
assert.strictEqual(sortedFEFO[0].batchNumber, "B1", "Earliest expiring batch must be first");
assert.strictEqual(sortedFEFO[1].batchNumber, "B2");
assert.strictEqual(sortedFEFO[2].batchNumber, "B3");
console.log("✅ 3. FEFO Expiry Sorting Algorithm: PASSED");

// 4. Test GST Tax Breakdown (HSN & CGST/SGST splits)
function calculateGSTBreakdown(subtotal, gstRatePercent = 12) {
  const taxableAmount = subtotal / (1 + gstRatePercent / 100);
  const totalGst = subtotal - taxableAmount;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;
  return {
    taxableAmount: Number(taxableAmount.toFixed(2)),
    totalGst: Number(totalGst.toFixed(2)),
    cgst: Number(cgst.toFixed(2)),
    sgst: Number(sgst.toFixed(2)),
  };
}

const gstBreakdown = calculateGSTBreakdown(1120, 12);
assert.strictEqual(gstBreakdown.taxableAmount, 1000);
assert.strictEqual(gstBreakdown.totalGst, 120);
assert.strictEqual(gstBreakdown.cgst, 60);
assert.strictEqual(gstBreakdown.sgst, 60);
console.log("✅ 4. Intra-State GST Breakdown (CGST 6% + SGST 6%): PASSED");

console.log("\n🎯 ALL 4 UNIT TEST SUITES PASSED VERIFIED!\n");
