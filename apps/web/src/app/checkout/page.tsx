"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { api } from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, totalAmount, clearCart } = useCartStore();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // New Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "Jacob Jones",
    phone: "9876543212",
    addressLine1: "Flat 402, Green Glen Layout, Bellandur",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560103",
    type: "HOME",
  });

  useEffect(() => {
    // Check localStorage for saved location from Header
    if (typeof window !== "undefined") {
      const savedPin = localStorage.getItem("medico_pincode");
      const savedCity = localStorage.getItem("medico_city");
      if (savedPin || savedCity) {
        setNewAddress((prev) => ({
          ...prev,
          pincode: savedPin || prev.pincode,
          city: savedCity || prev.city,
        }));
      }
    }

    // Load Razorpay checkout script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    async function loadUserData() {
      const addrRes = await api.get("/users/addresses");

      if (addrRes.success && addrRes.data && addrRes.data.length > 0) {
        setAddresses(addrRes.data);
        const def = addrRes.data.find((a: any) => a.isDefault) || addrRes.data[0];
        setSelectedAddressId(def.id);
      } else {
        setShowAddressForm(true);
      }
    }

    loadUserData();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const res = await api.post("/coupons/apply", {
      code: couponCode.trim(),
      cartSubtotal: subtotal,
    });
    if (res.success && res.data) {
      setAppliedDiscount(res.data.discountAmount);
      setCouponMessage(`Coupon applied: -₹${res.data.discountAmount}`);
    } else {
      setAppliedDiscount(0);
      setCouponMessage(res.message || "Failed to apply coupon");
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post("/users/addresses", newAddress);
    if (res.success && res.data) {
      setAddresses([...addresses, res.data]);
      setSelectedAddressId(res.data.id);
      setShowAddressForm(false);
    } else {
      alert(res.message || "Could not save address");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert("Please select or add a delivery address");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create order on backend
      const orderRes = await api.post("/orders", {
        addressId: selectedAddressId,
        paymentMethod,
        couponCode: couponCode || undefined,
      });

      if (!orderRes.success || !orderRes.data) {
        alert(orderRes.message || "Failed to create order");
        setIsProcessing(false);
        return;
      }

      const order = orderRes.data;

      // 2. Handle Payment Flow
      if (paymentMethod === "COD") {
        await clearCart();
        router.push(`/orders/${order.id}`);
        return;
      }

      // Online payment via Razorpay
      const payRes = await api.post("/payments/create-order", {
        orderId: order.id,
      });

      if (!payRes.success || !payRes.data) {
        alert(payRes.message || "Could not initialize payment gateway");
        setIsProcessing(false);
        return;
      }

      const { razorpayOrderId, amount, currency, keyId } = payRes.data;

      // If mock test mode
      if (razorpayOrderId.startsWith("order_mock_") || !window.Razorpay) {
        const verifyRes = await api.post("/payments/verify", {
          orderId: order.id,
          razorpayOrderId,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: "mock_signature_valid",
        });

        if (verifyRes.success) {
          await clearCart();
          router.push(`/orders/${order.id}`);
        } else {
          alert("Payment verification failed");
          setIsProcessing(false);
        }
        return;
      }

      const selectedAddress = addresses.find((a: any) => a.id === selectedAddressId);

      // Open Razorpay Modal
      const options = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TiWDGQAMVvys6R",
        amount,
        currency: currency || "INR",
        name: "Pharmico Healthcare",
        description: `Order #${order.orderNumber}`,
        order_id: razorpayOrderId,
        prefill: {
          name: selectedAddress?.fullName || "",
          contact: selectedAddress?.phone || "",
        },
        theme: {
          color: "#0B4A3A",
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await api.post("/payments/verify", {
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              await clearCart();
              router.push(`/orders/${order.id}`);
            } else {
              alert(verifyRes.message || "Payment signature verification failed");
              setIsProcessing(false);
            }
          } catch (verErr: any) {
            alert(verErr.message || "Payment verification error");
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (failResponse: any) {
        console.error("Razorpay payment failed:", failResponse.error);
        alert(`Payment Failed: ${failResponse.error?.description || failResponse.error?.reason || "Transaction was declined"}`);
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Checkout error:", err);
      alert(err.message || "An error occurred during checkout");
      setIsProcessing(false);
    }
  };

  const finalTotal = Math.max(0, totalAmount - appliedDiscount);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-[#0F2A22]">Your Cart is Empty</h2>
        <p className="text-xs text-[#5B6B65] mt-1">Add medicines to your cart before proceeding to checkout</p>
        <Link href="/products" className="mt-4 inline-block px-6 py-2.5 rounded-full bg-[#0B4A3A] text-white text-xs font-bold">
          Shop Medicines
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12 py-8">
      <h1 className="text-2xl sm:text-3xl font-black text-[#0F2A22] mb-6">
        Secure Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Delivery Address, Rx, Payment Method */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Delivery Address */}
          <div className="bg-white rounded-3xl border border-[#D7DEDB] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F2A22] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0B4A3A]" />
                1. Delivery Address
              </h3>
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="text-xs font-bold text-[#10B981] hover:underline"
              >
                {showAddressForm ? "Cancel" : "+ Add New Address"}
              </button>
            </div>

            {/* Address List */}
            {!showAddressForm && (
              <div className="space-y-3">
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAddressId(a.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${selectedAddressId === a.id ? "bg-[#FAF3EA] border-[#0B4A3A] ring-1 ring-[#0B4A3A]" : "border-[#D7DEDB] hover:border-gray-400"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#0F2A22]">
                        {a.fullName} ({a.type})
                      </span>
                      {selectedAddressId === a.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#0B4A3A]" />
                      )}
                    </div>
                    <p className="text-xs text-[#5B6B65] mt-1">
                      {a.addressLine1}, {a.city}, {a.state} - {a.pincode}
                    </p>
                    <p className="text-xs text-[#5B6B65] mt-0.5">Phone: {a.phone}</p>
                  </div>
                ))}
              </div>
            )}

            {/* New Address Form */}
            {showAddressForm && (
              <form onSubmit={handleSaveAddress} className="space-y-3 bg-[#F4F6F5] p-4 rounded-2xl border border-[#D7DEDB]">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    required
                    className="p-2.5 rounded-xl border text-xs bg-white"
                  />
                  <input
                    type="text"
                    placeholder="10-digit Phone"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    required
                    className="p-2.5 rounded-xl border text-xs bg-white"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Flat/House No., Building, Street"
                  value={newAddress.addressLine1}
                  onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                  required
                  className="w-full p-2.5 rounded-xl border text-xs bg-white"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    required
                    className="p-2.5 rounded-xl border text-xs bg-white"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    required
                    className="p-2.5 rounded-xl border text-xs bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Pincode (6 digits)"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                    required
                    className="p-2.5 rounded-xl border text-xs bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#0B4A3A] text-white text-xs font-bold"
                >
                  Save Address
                </button>
              </form>
            )}
          </div>

          {/* 2. Payment Method */}
          <div className="bg-white rounded-3xl border border-[#D7DEDB] p-6 space-y-4">
            <h3 className="text-base font-bold text-[#0F2A22] flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#0B4A3A]" />
              2. Payment Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setPaymentMethod("RAZORPAY")}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center gap-3 transition ${paymentMethod === "RAZORPAY" ? "bg-[#FAF3EA] border-[#0B4A3A] ring-1 ring-[#0B4A3A]" : "border-[#D7DEDB]"}`}
              >
                <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#0B4A3A]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F2A22]">Pay Online (Razorpay)</div>
                  <div className="text-[10px] text-[#5B6B65]">UPI, Cards, Netbanking, Wallets</div>
                </div>
              </div>

              <div
                onClick={() => setPaymentMethod("COD")}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center gap-3 transition ${paymentMethod === "COD" ? "bg-[#FAF3EA] border-[#0B4A3A] ring-1 ring-[#0B4A3A]" : "border-[#D7DEDB]"}`}
              >
                <div className="w-10 h-10 rounded-full bg-[#F5C043]/30 flex items-center justify-center text-[#0F2A22]">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F2A22]">Cash on Delivery (COD)</div>
                  <div className="text-[10px] text-[#5B6B65]">Pay at doorstep upon delivery</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Pay Button */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-[#D7DEDB] p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-[#0F2A22]">Order Summary</h3>

            {/* Item list snippet */}
            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-1">
              {items.map((it) => (
                <div key={it.id} className="py-2 flex justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#0F2A22]">{it.quantity}x </span>
                    <span className="text-[#0F2A22]">{it.productName}</span>
                  </div>
                  <span className="font-bold text-[#0B4A3A]">₹{it.subtotal}</span>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            <div className="pt-2 border-t border-gray-100 space-y-1.5">
              <label className="text-xs font-bold text-[#0F2A22] flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#10B981]" /> Apply Coupon:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. WELCOME50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-[#F4F6F5] border border-[#D7DEDB] rounded-full px-3 py-1.5 text-xs uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-1.5 rounded-full bg-[#0B4A3A] text-white text-xs font-bold"
                >
                  Apply
                </button>
              </div>
              {couponMessage && (
                <p className="text-[11px] font-semibold text-[#0B4A3A]">{couponMessage}</p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs text-[#5B6B65]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-[#10B981] font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{appliedDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between text-base font-black text-[#0F2A22] pt-2 border-t border-gray-100">
                <span>Total Payable</span>
                <span className="text-[#0B4A3A]">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-full bg-[#10B981] hover:bg-[#0ea372] disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 mt-4"
            >
              <span>{isProcessing ? "Processing Order..." : `Place Order (₹${finalTotal.toFixed(2)})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
