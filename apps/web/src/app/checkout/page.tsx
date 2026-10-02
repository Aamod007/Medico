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
  X,
  Navigation,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { api } from "@/lib/api";
import { resolvePincode, detectUserLocation } from "@/lib/location";
import { BRAND_CONFIG } from "@medico/shared";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpaySDK(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      if ((window as any).Razorpay) return resolve(true);
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

import { useUser, SignInButton } from "@clerk/nextjs";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, totalAmount, clearCart } = useCartStore();
  const { isSignedIn, isLoaded, user } = useUser();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // New Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
    type: "HOME",
  });


  const [isDetectingCheckoutLocation, setIsDetectingCheckoutLocation] = useState(false);
  const [pincodeHelperText, setPincodeHelperText] = useState("");

  const handleDetectCheckoutLocation = async () => {
    setIsDetectingCheckoutLocation(true);
    setPincodeHelperText("");
    try {
      const loc = await detectUserLocation();
      if (loc.success && loc.city && loc.pincode) {
        setNewAddress((prev) => ({
          ...prev,
          pincode: loc.pincode,
          city: loc.city,
          state: loc.state || prev.state,
        }));
        setPincodeHelperText(`✓ Detected: ${loc.city}, ${loc.state || ""} (${loc.pincode})`);
        if (typeof window !== "undefined") {
          localStorage.setItem("medico_pincode", loc.pincode);
          localStorage.setItem("medico_city", loc.city);
          window.dispatchEvent(
            new CustomEvent("medico-location-changed", {
              detail: { pincode: loc.pincode, city: loc.city },
            })
          );
        }
      } else {
        setPincodeHelperText(loc.error || "Could not detect location. Please enter PIN code.");
      }
    } catch {
      setPincodeHelperText("Location detection failed. Please enter PIN code manually.");
    } finally {
      setIsDetectingCheckoutLocation(false);
    }
  };

  useEffect(() => {
    // Check localStorage for saved location from Header
    if (typeof window !== "undefined") {
      const savedPin = localStorage.getItem("medico_pincode");
      const savedCity = localStorage.getItem("medico_city");
      if (savedPin) {
        const resolved = resolvePincode(savedPin);
        setNewAddress((prev) => ({
          ...prev,
          pincode: savedPin,
          city: savedCity || (resolved.valid ? resolved.city : prev.city),
          state: resolved.valid && resolved.state ? resolved.state : prev.state,
        }));
        if (resolved.valid && resolved.city) {
          setPincodeHelperText(`✓ ${resolved.city}, ${resolved.state || ""}`);
        }
      } else if (savedCity) {
        setNewAddress((prev) => ({
          ...prev,
          city: savedCity,
        }));
      }
    }

    // Preload Razorpay checkout script
    loadRazorpaySDK();

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
  }, [user]);

  useEffect(() => {
    if (user) {
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "";
      const ph = user.primaryPhoneNumber?.phoneNumber || "";
      setNewAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || name,
        phone: prev.phone || ph,
      }));
    }
  }, [user]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setErrorMessage(null);
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
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const cleanPhone = newAddress.phone.replace(/\D/g, "").replace(/^0+/, "").slice(-10);
      const payload = {
        ...newAddress,
        phone: cleanPhone || newAddress.phone,
        userId: user?.id,
      };
      const res = await api.post("/users/addresses", payload);
      if (res.success && res.data) {
        setAddresses((prev) => [...prev, res.data]);
        setSelectedAddressId(res.data.id);
        setShowAddressForm(false);
        if (typeof window !== "undefined" && res.data.pincode && res.data.city) {
          localStorage.setItem("medico_pincode", res.data.pincode);
          localStorage.setItem("medico_city", res.data.city);
          window.dispatchEvent(
            new CustomEvent("medico-location-changed", {
              detail: { pincode: res.data.pincode, city: res.data.city },
            })
          );
        }
      } else {
        setErrorMessage(res.message || "Could not save address. Please check all fields.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Could not save address");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    setErrorMessage(null);

    if (isLoaded && !isSignedIn) {
      setErrorMessage("Please sign in with your verified account to complete checkout.");
      return;
    }

    let activeAddressId = selectedAddressId;

    // Auto-save address if user entered details in form without pressing Save
    if (!activeAddressId && showAddressForm) {
      if (
        newAddress.fullName.trim() &&
        newAddress.phone.trim() &&
        newAddress.addressLine1.trim() &&
        newAddress.city.trim() &&
        newAddress.state.trim() &&
        newAddress.pincode.trim()
      ) {
        setIsProcessing(true);
        const cleanPhone = newAddress.phone.replace(/\D/g, "").replace(/^0+/, "").slice(-10);
        const payload = {
          ...newAddress,
          phone: cleanPhone || newAddress.phone,
          userId: user?.id,
        };
        const saveRes = await api.post("/users/addresses", payload);
        if (saveRes.success && saveRes.data?.id) {
          activeAddressId = saveRes.data.id;
          setAddresses((prev) => [...prev, saveRes.data]);
          setSelectedAddressId(saveRes.data.id);
          setShowAddressForm(false);
        } else {
          setIsProcessing(false);
          setErrorMessage(saveRes.message || "Please complete all required address fields.");
          return;
        }
      } else {
        setErrorMessage("Please fill in your delivery address details.");
        return;
      }
    }

    if (!activeAddressId) {
      setErrorMessage("Please select or add a delivery address.");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create order on backend
      const orderRes = await api.post("/orders", {
        addressId: activeAddressId,
        paymentMethod,
        couponCode: couponCode || undefined,
        items: items.map((it) => ({
          id: it.id,
          variantId: it.variantId,
          quantity: it.quantity,
          price: it.price,
          mrp: it.mrp,
          name: it.productName,
          packSize: it.packSize,
          sku: it.sku,
        })),
        newAddress: showAddressForm ? newAddress : undefined,
      });

      if (!orderRes.success || !orderRes.data) {
        setErrorMessage(orderRes.message || "Failed to create order. Please try again.");
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
      const rzpLoaded = await loadRazorpaySDK();
      if (!rzpLoaded || !window.Razorpay) {
        setErrorMessage("Unable to load Razorpay payment gateway SDK. Please check your internet connection or disable ad blockers.");
        setIsProcessing(false);
        return;
      }

      const payRes = await api.post("/payments/create-order", {
        orderId: order.id,
      });

      if (!payRes.success || !payRes.data) {
        setErrorMessage(payRes.message || "Could not initialize payment gateway");
        setIsProcessing(false);
        return;
      }

      const { razorpayOrderId, amount, currency, keyId } = payRes.data;
      const selectedAddress = addresses.find((a: any) => a.id === selectedAddressId);

      // Open Razorpay Modal
      const options: any = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TiWDGQAMVvys6R",
        amount,
        currency: currency || "INR",
        name: BRAND_CONFIG.legalName,
        description: `Order #${order.orderNumber}`,
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
              razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature || "verified",
            });

            if (verifyRes.success) {
              await clearCart();
              router.push(`/orders/${order.id}`);
            } else {
              setErrorMessage(verifyRes.message || "Payment signature verification failed");
              setIsProcessing(false);
            }
          } catch (verErr: any) {
            setErrorMessage(verErr.message || "Payment verification error");
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      if (razorpayOrderId && !razorpayOrderId.startsWith("order_mock_")) {
        options.order_id = razorpayOrderId;
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (failResponse: any) {
        console.error("Razorpay payment failed:", failResponse.error);
        setErrorMessage(`Payment Failed: ${failResponse.error?.description || failResponse.error?.reason || "Transaction was declined"}`);
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Checkout error:", err);
      setErrorMessage(err.message || "An error occurred during checkout");
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

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4 text-rose-900 transition-all">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 p-1 rounded-lg transition"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLoaded && !isSignedIn && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-amber-900">
              Please sign in with your verified account to place your order and track delivery.
            </span>
          </div>
          <SignInButton mode="modal">
            <button className="px-5 py-2 bg-[#0B4A3A] hover:bg-[#07362a] text-white text-xs font-bold rounded-full transition shadow-sm whitespace-nowrap cursor-pointer">
              Sign In Now
            </button>
          </SignInButton>
        </div>
      )}

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
                    onClick={() => {
                      setSelectedAddressId(a.id);
                      if (typeof window !== "undefined" && a.pincode && a.city) {
                        localStorage.setItem("medico_pincode", a.pincode);
                        localStorage.setItem("medico_city", a.city);
                        window.dispatchEvent(
                          new CustomEvent("medico-location-changed", {
                            detail: { pincode: a.pincode, city: a.city },
                          })
                        );
                      }
                    }}
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
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-[#0F2A22]">Enter Delivery Address</span>
                  <button
                    type="button"
                    disabled={isDetectingCheckoutLocation}
                    onClick={handleDetectCheckoutLocation}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-[#0B4A3A] font-bold text-xs border border-[#D7DEDB] transition cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <Navigation className={`w-3.5 h-3.5 text-[#10B981] ${isDetectingCheckoutLocation ? "animate-spin" : ""}`} />
                    <span>{isDetectingCheckoutLocation ? "Detecting..." : "Use Current Location"}</span>
                  </button>
                </div>

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
                    type="tel"
                    placeholder="10-digit Phone"
                    value={newAddress.phone}
                    maxLength={10}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const normalized = val.startsWith("0") ? val.replace(/^0+/, "").slice(0, 10) : val.slice(0, 10);
                      setNewAddress({ ...newAddress, phone: normalized });
                    }}
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Pincode (6 digits)"
                      value={newAddress.pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        if (val.length === 6) {
                          const resolved = resolvePincode(val);
                          if (resolved.valid) {
                            setNewAddress((prev) => ({
                              ...prev,
                              pincode: val,
                              city: resolved.city || prev.city,
                              state: resolved.state || prev.state,
                            }));
                            setPincodeHelperText(`✓ ${resolved.city}, ${resolved.state || ""}`);
                            if (typeof window !== "undefined") {
                              localStorage.setItem("medico_pincode", val);
                              localStorage.setItem("medico_city", resolved.city);
                              window.dispatchEvent(
                                new CustomEvent("medico-location-changed", {
                                  detail: { pincode: val, city: resolved.city },
                                })
                              );
                            }
                          } else {
                            setNewAddress((prev) => ({ ...prev, pincode: val }));
                            setPincodeHelperText(resolved.error || "Invalid PIN code");
                          }
                        } else {
                          setNewAddress((prev) => ({ ...prev, pincode: val }));
                          setPincodeHelperText("");
                        }
                      }}
                      required
                      className="w-full p-2.5 rounded-xl border text-xs bg-white font-bold"
                    />
                    {pincodeHelperText && (
                      <p className="text-[10px] font-semibold text-[#0B4A3A] mt-1 pl-1">
                        {pincodeHelperText}
                      </p>
                    )}
                  </div>
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

            {errorMessage && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-center mt-3">
                {errorMessage}
              </p>
            )}

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
