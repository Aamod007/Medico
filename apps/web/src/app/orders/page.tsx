"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  FileText,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  Search,
  RotateCcw,
  MapPin,
  CreditCard,
  Banknote,
  Download,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useCartStore } from "@/lib/cart-store";

interface OrderItem {
  id: string;
  variantId?: string;
  productName: string;
  packSize?: string;
  variantName?: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
  subtotal?: number;
  totalPrice?: number;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  items: OrderItem[];
  address?: {
    fullName?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };
}

export default function OrdersHistoryPage() {
  const { isLoaded: authLoaded, isSignedIn, user } = useUser();
  const { addItem, openDrawer } = useCartStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "DELIVERED" | "CANCELLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [reorderSuccess, setReorderSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/orders", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (data.success && data.data) {
          const list = Array.isArray(data.data) ? data.data : data.data.orders || [];
          setOrders(list);
        } else {
          setOrders([]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }

    if (authLoaded) {
      if (isSignedIn) {
        fetchOrders();
      } else {
        setOrders([]);
        setLoading(false);
      }
    }
  }, [authLoaded, isSignedIn, user?.id]);

  const counts = useMemo(() => {
    const active = orders.filter((o) =>
      ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY"].includes(o.status)
    ).length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
    return { all: orders.length, active, delivered, cancelled };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab === "ACTIVE") {
        if (!["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY"].includes(order.status)) {
          return false;
        }
      } else if (activeTab === "DELIVERED") {
        if (order.status !== "DELIVERED") return false;
      } else if (activeTab === "CANCELLED") {
        if (order.status !== "CANCELLED") return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = order.orderNumber.toLowerCase().includes(q);
        const matchesItem = order.items?.some((it) => it.productName.toLowerCase().includes(q));
        const matchesCity = order.address?.city?.toLowerCase().includes(q);
        if (!matchesNumber && !matchesItem && !matchesCity) return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const handleBuyAgain = async (order: Order) => {
    if (!order.items || order.items.length === 0) return;
    setReorderingId(order.id);
    try {
      for (const item of order.items) {
        if (item.variantId) {
          await addItem(item.variantId, item.quantity || 1, {
            productName: item.productName,
            packSize: item.packSize,
            price: item.price || 0,
            subtotal: (item.price || 0) * (item.quantity || 1),
          });
        }
      }
      setReorderSuccess(order.id);
      setTimeout(() => setReorderSuccess(null), 3000);
      openDrawer();
    } catch (e) {
      console.error("Failed to reorder items:", e);
    } finally {
      setReorderingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return (
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delivered
          </span>
        );
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return (
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <Truck className="w-3.5 h-3.5 text-blue-600 animate-pulse" /> Out for Delivery
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Confirmed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Placed
          </span>
        );
    }
  };

  const getPaymentBadge = (order: Order) => {
    if (order.paymentMethod === "RAZORPAY") {
      if (order.paymentStatus === "PAID") {
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-semibold inline-flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-emerald-600" /> Paid (Razorpay Online)
          </span>
        );
      }
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-semibold inline-flex items-center gap-1">
          <CreditCard className="w-3 h-3 text-amber-600" /> Payment Pending (Online)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-100 text-[11px] font-semibold inline-flex items-center gap-1">
        <Banknote className="w-3 h-3 text-amber-700" /> Cash on Delivery (COD)
      </span>
    );
  };

  return (
    <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto w-full px-4 sm:px-8 xl:px-12 py-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0B4A3A] text-white flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B4A3A]">Order History</h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                Track your active medicine deliveries, past orders, and download verified tax invoices.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="px-5 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white font-semibold rounded-full text-xs sm:text-sm transition shadow-sm inline-flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" /> Order Medicines
          </Link>
        </div>
      </div>

      {/* Account Verification & Privacy Banner */}
      {isSignedIn && user && (
        <div className="mb-6 p-3.5 rounded-2xl bg-[#FAF3EA] border border-[#FDE6D3] flex flex-wrap items-center justify-between gap-2 text-xs text-[#0B4A3A]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
            <span className="font-bold">
              Account: {user.primaryEmailAddress?.emailAddress || user.username || "Verified Customer"}
            </span>
            <span className="text-gray-500 hidden sm:inline">•</span>
            <span className="text-gray-600 hidden sm:inline">
              Orders are securely scoped exclusively to your signed-in account.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
            {counts.all} Total {counts.all === 1 ? "Order" : "Orders"}
          </span>
        </div>
      )}

      {/* Unauthenticated State */}
      {!authLoaded || loading ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-xs">
          <div className="w-10 h-10 border-4 border-[#0B4A3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold text-sm">Loading your orders...</p>
          <p className="text-gray-400 text-xs mt-1">Retrieving verified order records from your account</p>
        </div>
      ) : !isSignedIn ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-gray-100 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 bg-[#FAF3EA] rounded-3xl flex items-center justify-center mx-auto mb-5 text-[#0B4A3A] shadow-inner">
            <Package className="w-8 h-8 text-[#0B4A3A]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0B4A3A] mb-2">Sign In to View Your Orders</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            Your orders and tax invoices are securely stored in your personal account. Please log in to view your order history.
          </p>
          <SignInButton mode="modal">
            <button className="px-7 py-3.5 bg-[#0B4A3A] hover:bg-[#07362a] text-white font-bold rounded-full text-sm transition inline-flex items-center gap-2 shadow-md cursor-pointer">
              Sign In to My Account <ArrowRight className="w-4 h-4 text-[#10B981]" />
            </button>
          </SignInButton>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-gray-100 shadow-sm max-w-md mx-auto">
          <div className="w-16 h-16 bg-[#FAF3EA] rounded-3xl flex items-center justify-center mx-auto mb-4 text-[#0B4A3A]">
            <Package className="w-8 h-8 text-[#0B4A3A]" />
          </div>
          <h2 className="text-xl font-bold text-[#0B4A3A] mb-2">No Orders in This Account</h2>
          <p className="text-gray-500 text-xs sm:text-sm mb-6 leading-relaxed">
            You haven&apos;t placed any medicine orders on this account yet. When you complete checkout, your order and tax invoice will appear here.
          </p>
          <Link
            href="/products"
            className="px-6 py-3 bg-[#0B4A3A] hover:bg-[#07362a] text-white font-bold rounded-full text-xs sm:text-sm transition inline-flex items-center gap-2 shadow-sm"
          >
            Start Shopping <ArrowRight className="w-4 h-4 text-[#10B981]" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls: Filter Tabs + Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === "ALL"
                    ? "bg-[#0B4A3A] text-white shadow-xs"
                    : "bg-[#F4F6F5] text-gray-600 hover:text-black"
                }`}
              >
                All Orders ({counts.all})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ACTIVE")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === "ACTIVE"
                    ? "bg-[#0B4A3A] text-white shadow-xs"
                    : "bg-[#F4F6F5] text-gray-600 hover:text-black"
                }`}
              >
                In Progress ({counts.active})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("DELIVERED")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === "DELIVERED"
                    ? "bg-[#0B4A3A] text-white shadow-xs"
                    : "bg-[#F4F6F5] text-gray-600 hover:text-black"
                }`}
              >
                Delivered ({counts.delivered})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("CANCELLED")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === "CANCELLED"
                    ? "bg-[#0B4A3A] text-white shadow-xs"
                    : "bg-[#F4F6F5] text-gray-600 hover:text-black"
                }`}
              >
                Cancelled ({counts.cancelled})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Order # or Medicine name..."
                className="w-full bg-[#F4F6F5] focus:bg-white border border-transparent focus:border-[#0B4A3A] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-black font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-gray-800">No Orders Match Your Search</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                No orders were found matching your current filter criteria.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("ALL");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 rounded-full bg-[#0B4A3A] text-white text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isReordering = reorderingId === order.id;
                const isJustReordered = reorderSuccess === order.id;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs hover:shadow-md transition overflow-hidden"
                  >
                    {/* Top Row: Order Details & Badges */}
                    <div className="p-5 sm:p-6 bg-[#FAF3EA]/30 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-black text-[#0B4A3A] text-lg hover:underline flex items-center gap-1.5"
                          >
                            <span>#{order.orderNumber}</span>
                          </Link>
                          {getStatusBadge(order.status)}
                          {getPaymentBadge(order)}
                        </div>

                        <p className="text-xs text-gray-500 mt-1.5 flex flex-wrap items-center gap-2">
                          <span>
                            Placed on{" "}
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {order.address?.city && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 text-gray-600 font-medium">
                                <MapPin className="w-3 h-3 text-[#0B4A3A]" />
                                Deliver to {order.address.fullName || "Customer"} ({order.address.city}, {order.address.pincode})
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Total Amount & Primary Action */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                            Total Payable
                          </div>
                          <div className="text-xl font-black text-[#0F2A22]">
                            ₹{Number(order.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                        </div>

                        <Link
                          href={`/orders/${order.id}`}
                          className="px-5 py-2.5 bg-[#0B4A3A] hover:bg-[#07362a] text-white font-bold rounded-full text-xs transition inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <span>Track Order</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Middle Row: Items List */}
                    <div className="p-5 sm:p-6 divide-y divide-gray-50">
                      {order.items?.map((item) => {
                        const itemTotal =
                          item.subtotal != null
                            ? Number(item.subtotal)
                            : item.totalPrice != null
                            ? Number(item.totalPrice)
                            : Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1);

                        return (
                          <div
                            key={item.id}
                            className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs sm:text-sm"
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-4">
                              <span className="w-2 h-2 rounded-full bg-[#10B981] flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="font-bold text-[#0F2A22]">{item.productName}</span>
                                {(item.packSize || item.variantName) && (
                                  <span className="text-xs text-gray-500 ml-1.5">
                                    • {item.packSize || item.variantName}
                                  </span>
                                )}
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold text-xs flex-shrink-0">
                                × {item.quantity}
                              </span>
                            </div>
                            <span className="font-extrabold text-[#0B4A3A] flex-shrink-0">
                              ₹{itemTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="px-5 sm:px-6 py-3.5 bg-gray-50/70 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="text-gray-500 text-[11px] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                        <span>Verified authentic batch & GST compliant pharmacy invoice.</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/api/orders/${order.id}/invoice`}
                          className="px-3.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-full transition inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-gray-600" />
                          <span>PDF Invoice</span>
                        </Link>
                        <Link
                          href={`/orders/${order.id}/invoice`}
                          className="px-3.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-full transition inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-gray-600" />
                          <span>View Invoice</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleBuyAgain(order)}
                          disabled={isReordering}
                          className="px-3.5 py-1.5 bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#0B4A3A] font-bold rounded-full transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isJustReordered ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Added to Cart!</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className={`w-3.5 h-3.5 ${isReordering ? "animate-spin" : ""}`} />
                              <span>Buy Again</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
