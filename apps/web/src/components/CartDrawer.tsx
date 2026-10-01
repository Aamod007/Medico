"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Tag,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Sparkles,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { CURRENCY_CONFIG } from "@medico/shared";
import { api } from "@/lib/api";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: "FLAT" | "PERCENTAGE";
  discountValue: string;
  minOrderValue: string;
  maxDiscount: string | null;
}

export default function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    mrpTotal,
    discount,
    deliveryFee,
    totalAmount,
    hasPrescriptionItems,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
  } = useCartStore();

  // Location info
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

  // Sync location from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCity = localStorage.getItem("medico_city");
      const savedPin = localStorage.getItem("medico_pincode");
      if (savedCity) setCity(savedCity);
      if (savedPin) setPincode(savedPin);

      const handleLocChange = (e: any) => {
        if (e.detail?.city) setCity(e.detail.city);
        if (e.detail?.pincode) setPincode(e.detail.pincode);
      };
      window.addEventListener("medico-location-changed", handleLocChange);
      return () => window.removeEventListener("medico-location-changed", handleLocChange);
    }
  }, []);

  // Fetch active coupons
  useEffect(() => {
    if (isDrawerOpen) {
      api.get("/coupons/active").then((res) => {
        if (res.success && res.data) {
          setAvailableCoupons(res.data);
        }
      });
    }
  }, [isDrawerOpen]);

  // Handle coupon apply
  const handleApplyCoupon = async (codeToApply: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) return;

    setIsApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await api.post("/coupons/apply", {
        code,
        cartSubtotal: subtotal,
      });

      if (res.success && res.data) {
        setAppliedCoupon({
          code: res.data.code,
          discountAmount: res.data.discountAmount,
        });
        setCouponCodeInput("");
      } else {
        setCouponError(res.message || "Invalid coupon code");
      }
    } catch (e: any) {
      setCouponError(e.message || "Failed to apply coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  if (!isDrawerOpen) return null;

  const freeDeliveryThreshold = CURRENCY_CONFIG.freeShippingThreshold || 500;
  const progressPercent = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);
  const remainingForFree = Math.max(0, freeDeliveryThreshold - subtotal);

  const couponDiscountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPayable = Math.max(0, totalAmount - couponDiscountAmount);
  const totalCombinedSavings = discount + couponDiscountAmount + (subtotal >= freeDeliveryThreshold ? 50 : 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-4 sm:px-5 bg-[#FAF3EA] border-b border-[#D7DEDB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#D7DEDB] flex items-center justify-center text-[#0B4A3A]">
                <ShoppingBag className="w-4 h-4 text-[#0B4A3A]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0F2A22]">
                  Your Cart ({itemCount})
                </h2>
                <div className="flex items-center gap-1 text-[11px] text-[#5B6B65]">
                  <MapPin className="w-3 h-3 text-[#0B4A3A]" />
                  <span>
                    {city
                      ? <>Delivering to <strong>{city} ({pincode})</strong></>
                      : <span className="text-[#0B4A3A] font-semibold">Select a delivery location</span>}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={closeDrawer}
              data-testid="close-cart-btn"
              className="p-1.5 rounded-full text-gray-500 hover:bg-white hover:text-black transition cursor-pointer"
              title="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Banner */}
          <div className="bg-[#FAF3EA] px-4 sm:px-5 pb-3">
            <div className="text-xs text-[#0F2A22] font-semibold mb-1.5 flex justify-between items-center">
              {remainingForFree > 0 ? (
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#0B4A3A]" />
                  <span>
                    Add <span className="font-bold text-[#0B4A3A]">₹{remainingForFree.toFixed(0)}</span> more for <strong>FREE Delivery</strong>
                  </span>
                </span>
              ) : (
                <span className="text-[#10B981] font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>You qualify for FREE Delivery!</span>
                </span>
              )}
              <span className="text-[10px] text-[#5B6B65] font-bold">₹500 threshold</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#10B981] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>



          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {items.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="w-16 h-16 rounded-full bg-[#FAF3EA] flex items-center justify-center mx-auto mb-3 text-[#0B4A3A]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-[#0F2A22]">Your cart is currently empty</p>
                <p className="text-xs text-[#5B6B65] mt-1">Explore our range of medicines and healthcare essentials</p>
                <button
                  onClick={closeDrawer}
                  className="mt-5 px-6 py-2.5 rounded-full bg-[#0B4A3A] text-white text-xs font-bold hover:bg-[#07362a] transition shadow-xs cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <>
                {items.map((item) => {
                  const discountPercent =
                    item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 bg-white rounded-2xl border border-[#D7DEDB] shadow-xs relative flex gap-3.5 transition hover:border-[#0B4A3A]/30"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 sm:w-18 sm:h-18 bg-[#F4F6F5] rounded-xl border border-gray-100 p-1 flex items-center justify-center flex-shrink-0 relative">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-[#0B4A3A]/40" />
                        )}
                        {discountPercent > 0 && (
                          <span className="absolute top-1 left-1 bg-[#10B981] text-white text-[8px] font-black px-1 py-0.5 rounded leading-none">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <h3 className="text-xs sm:text-sm font-bold text-[#0F2A22] leading-snug line-clamp-2">
                          {item.productName}
                        </h3>
                        <p className="text-[11px] text-[#5B6B65] mt-0.5 font-medium">{item.packSize}</p>


                        <div className="flex items-center justify-between mt-2.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-extrabold text-[#0B4A3A]">
                              ₹{item.price}
                            </span>
                            {item.mrp > item.price && (
                              <span className="text-[11px] text-gray-400 line-through">
                                ₹{item.mrp}
                              </span>
                            )}
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center gap-1.5 bg-[#F4F6F5] rounded-full border border-[#D7DEDB] px-1.5 py-0.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-5 h-5 rounded-full hover:bg-white text-[#0B4A3A] flex items-center justify-center transition cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-[#0F2A22] w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-5 h-5 rounded-full hover:bg-white text-[#0B4A3A] flex items-center justify-center transition cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 p-1 transition cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {/* Apply Coupon / Promo Code Card */}
                <div className="bg-[#FAF3EA]/70 rounded-2xl border border-[#D7DEDB] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#0B4A3A]" />
                      <span className="text-xs font-bold text-[#0F2A22]">Apply Coupon / Promo Code</span>
                    </div>
                    {appliedCoupon && (
                      <span className="text-[10px] font-bold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Applied
                      </span>
                    )}
                  </div>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-300 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                        <div>
                          <span className="text-xs font-black text-[#0B4A3A] tracking-wide">
                            {appliedCoupon.code}
                          </span>
                          <span className="text-[11px] text-[#10B981] font-semibold ml-2">
                            Saved ₹{appliedCoupon.discountAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-xs font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleApplyCoupon(couponCodeInput);
                        }}
                        className="flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          value={couponCodeInput}
                          onChange={(e) => {
                            setCouponCodeInput(e.target.value.toUpperCase());
                            setCouponError("");
                          }}
                          placeholder="e.g. WELCOME50, MEDICO20"
                          className="flex-1 bg-white border border-[#D7DEDB] focus:border-[#0B4A3A] rounded-xl px-3 py-1.5 text-xs font-bold text-[#0F2A22] uppercase tracking-wider focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!couponCodeInput.trim() || isApplyingCoupon}
                          className="px-3 py-1.5 rounded-xl bg-[#0B4A3A] hover:bg-[#07362a] disabled:opacity-50 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                        >
                          {isApplyingCoupon ? "..." : "Apply"}
                        </button>
                      </form>
                      {couponError && (
                        <p className="text-[10px] font-semibold text-red-600 mt-1 pl-1">
                          {couponError}
                        </p>
                      )}

                      {/* Clickable Recommended Coupon Pills */}
                      {availableCoupons.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-[10px] text-[#5B6B65] font-medium">Offers:</span>
                          {availableCoupons.slice(0, 2).map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => handleApplyCoupon(c.code)}
                              className="text-[10px] font-bold bg-white hover:bg-emerald-50 text-[#0B4A3A] border border-[#0B4A3A]/30 px-2 py-0.5 rounded-md transition cursor-pointer"
                            >
                              %{c.code}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Delivery & Pharmacy Assurance Card */}
                <div className="p-3 bg-[#F4F6F5] rounded-2xl border border-[#D7DEDB]/60 space-y-2 text-xs text-[#5B6B65]">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#0B4A3A] flex-shrink-0" />
                    <span>Delivered in <strong>24–48 hours</strong> with cold-chain care</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                    <span><strong>100% Genuine</strong> medicines verified by licensed pharmacists</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Summary & Checkout CTA */}
          {items.length > 0 && (
            <div className="border-t border-[#D7DEDB] bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
              {/* Bill Details */}
              <div className="px-5 pt-4 pb-3 space-y-2.5">
                <p className="text-[11px] font-black text-[#0F2A22] uppercase tracking-widest mb-3">Bill Details</p>

                {/* Item Total (MRP) */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5B6B65]">Item Total (MRP)</span>
                  <span className="text-gray-700 font-semibold">₹{mrpTotal.toFixed(2)}</span>
                </div>

                {/* Product Discount */}
                {discount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#5B6B65]">Product Discount</span>
                    <span className="font-bold text-[#10B981]">− ₹{discount.toFixed(2)}</span>
                  </div>
                )}

                {/* Coupon Savings */}
                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#5B6B65] flex items-center gap-1">
                      Coupon Savings
                      <span className="bg-emerald-100 text-[#0B4A3A] text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        {appliedCoupon.code}
                      </span>
                    </span>
                    <span className="font-bold text-[#10B981]">− ₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {/* Delivery */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5B6B65]">Delivery Charges</span>
                  <span>
                    {deliveryFee === 0 || subtotal >= freeDeliveryThreshold ? (
                      <span className="flex items-center gap-1.5">
                        <span className="line-through text-gray-300 text-[11px]">₹50</span>
                        <span className="font-extrabold text-[#10B981]">FREE</span>
                      </span>
                    ) : (
                      <span className="text-gray-700 font-semibold">₹{deliveryFee}</span>
                    )}
                  </span>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-200 my-1" />

                {/* To Pay */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[#0F2A22]">To Pay</span>
                  <span className="text-xl font-black text-[#0B4A3A]">₹{finalPayable.toFixed(2)}</span>
                </div>

                {/* Total Savings Banner */}
                {totalCombinedSavings > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-[#0B4A3A] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                      Your total savings
                    </span>
                    <span className="text-sm font-extrabold text-[#10B981]">
                      ₹{totalCombinedSavings.toFixed(2)} 🎉
                    </span>
                  </div>
                )}
              </div>

              {/* Checkout Button */}
              <div className="px-5 pb-5">
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  data-testid="proceed-checkout-btn"
                  className="w-full py-4 px-5 rounded-2xl bg-[#0B4A3A] hover:bg-[#07362a] text-white font-extrabold text-sm flex items-center justify-between shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className="text-left">
                    <div className="text-[10px] text-white/60 uppercase tracking-widest font-semibold">To Pay</div>
                    <div className="text-lg font-black leading-tight">₹{finalPayable.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-2 font-bold group-hover:translate-x-1 transition-transform">
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
