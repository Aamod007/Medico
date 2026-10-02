import { z } from "zod";

// ============================================================================
// CONFIGURATION & LOCALE CONSTANTS
// ============================================================================

export const CURRENCY_CONFIG = {
  code: "INR",
  symbol: "₹",
  locale: "en-IN",
  freeShippingThreshold: 500,
  defaultDeliveryFee: 40,
} as const;

/**
 * Formats a monetary number in Indian Rupee format (e.g., ₹1,299.00 or ₹1,299)
 */
export function formatINR(amount: number, showDecimals: boolean = false): string {
  return new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    style: "currency",
    currency: CURRENCY_CONFIG.code,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ============================================================================
// DOMAIN ENUMS
// ============================================================================

export const RoleEnum = {
  CUSTOMER: "CUSTOMER",
  PHARMACIST: "PHARMACIST",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof RoleEnum)[keyof typeof RoleEnum];

export const OrderStatusEnum = {
  PLACED: "PLACED",
  CONFIRMED: "CONFIRMED",
  PACKED: "PACKED",
  SHIPPED: "SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  RETURN_REQUESTED: "RETURN_REQUESTED",
  RETURNED: "RETURNED",
} as const;
export type OrderStatus = (typeof OrderStatusEnum)[keyof typeof OrderStatusEnum];

export const PaymentStatusEnum = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatusEnum)[keyof typeof PaymentStatusEnum];

export const PaymentMethodEnum = {
  RAZORPAY: "RAZORPAY",
  COD: "COD",
} as const;
export type PaymentMethod = (typeof PaymentMethodEnum)[keyof typeof PaymentMethodEnum];


export const DiscountTypeEnum = {
  PERCENTAGE: "PERCENTAGE",
  FLAT: "FLAT",
} as const;
export type DiscountType = (typeof DiscountTypeEnum)[keyof typeof DiscountTypeEnum];

export const AddressTypeEnum = {
  HOME: "HOME",
  WORK: "WORK",
  OTHER: "OTHER",
} as const;
export type AddressType = (typeof AddressTypeEnum)[keyof typeof AddressTypeEnum];

export const GenderEnum = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const;
export type Gender = (typeof GenderEnum)[keyof typeof GenderEnum];

// ============================================================================
// ZOD SCHEMAS & TYPES: AUTH
// ============================================================================

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginWithPasswordSchema = z.object({
  identifier: z.string().min(3, "Enter email or phone number"),
  password: z.string().min(1, "Password is required"),
});
export type LoginWithPasswordInput = z.infer<typeof loginWithPasswordSchema>;

export const requestOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian phone number"),
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian phone number"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  name: z.string().optional(),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

// ============================================================================
// ZOD SCHEMAS & TYPES: ADDRESS
// ============================================================================

export const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit phone required"),
  addressLine1: z.string().min(5, "Flat/House No. and Street is required"),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  type: z.enum(["HOME", "WORK", "OTHER"]).default("HOME"),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof addressSchema>;

// ============================================================================
// ZOD SCHEMAS & TYPES: CART & COUPONS
// ============================================================================

export const addToCartSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(20, "Maximum 20 units per order"),
});
export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, "Quantity cannot be negative").max(20),
});
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export const applyCouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  cartSubtotal: z.number().min(0),
});
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;

// ============================================================================
// ZOD SCHEMAS & TYPES: CHECKOUT & ORDERS
// ============================================================================

export const createOrderSchema = z.object({
  addressId: z.string().uuid("Valid delivery address is required"),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  prescriptionId: z.string().uuid().optional(),
  couponCode: z.string().optional(),
  deliverySlot: z.string().optional(),
  notes: z.string().max(250).optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const verifyPaymentSchema = z.object({
  orderId: z.string().uuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().min(5, "Please provide a reason for cancellation").max(300),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

export const returnOrderSchema = z.object({
  reason: z.string().min(10, "Please describe the reason for return/refund").max(500),
});
export type ReturnOrderInput = z.infer<typeof returnOrderSchema>;


// ============================================================================
// ZOD SCHEMAS & TYPES: CATALOG SEARCH & REVIEWS
// ============================================================================

export const productQuerySchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  prescriptionRequired: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
  sort: z.enum(["featured", "price_asc", "price_desc", "rating", "newest"]).default("featured"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ProductQueryInput = z.infer<typeof productQuerySchema>;

export const createReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().min(5).max(1000),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
