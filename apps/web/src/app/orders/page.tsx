"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { useUser, SignInButton } from "@clerk/nextjs";

interface OrderItem {
  id: string;
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
  shippingAddress?: {
    fullName: string;
    city: string;
    pincode: string;
  };
}

export default function OrdersHistoryPage() {
  const { isLoaded: authLoaded, isSignedIn, user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
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
      fetchOrders();
    }
  }, [authLoaded, isSignedIn, user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delivered
          </span>
        );
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-blue-600" /> In Transit
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto w-full px-4 sm:px-8 xl:px-12 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B4A3A]">My Orders</h1>
          <p className="text-gray-500 text-sm mt-1">
            View your verified medicine orders, real-time live tracking, and digital tax invoices.
          </p>
        </div>
        <Link
          href="/products"
          className="self-start sm:self-auto px-5 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white font-semibold rounded-full text-sm transition shadow-sm inline-flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" /> Order Medicines
        </Link>
      </div>

      {!authLoaded || loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#0B4A3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your orders...</p>
        </div>
      ) : !isSignedIn && orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 bg-[#FAF3EA] rounded-full flex items-center justify-center mx-auto mb-4 text-[#0B4A3A]">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#0B4A3A] mb-2">Sign In to View Your Orders</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Please log in with your verified Medico account to view your past purchases, live delivery tracking, and pharmacy invoices.
          </p>
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-[#0B4A3A] hover:bg-[#07362a] text-white font-semibold rounded-full text-sm transition inline-flex items-center gap-2 shadow-sm cursor-pointer">
              Sign In / Register <ArrowRight className="w-4 h-4" />
            </button>
          </SignInButton>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto">
          <div className="w-16 h-16 bg-[#FAF3EA] rounded-full flex items-center justify-center mx-auto mb-4 text-[#0B4A3A]">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#0B4A3A] mb-2">No Orders Placed Yet</h3>
          <p className="text-gray-500 text-sm mb-6">
            You haven&apos;t placed any orders yet. Discover our genuine cold-chain medicines and healthcare essentials.
          </p>
          <Link
            href="/products"
            className="px-6 py-3 bg-[#10B981] hover:bg-emerald-600 text-white font-semibold rounded-full text-sm transition inline-flex items-center gap-2 shadow-sm"
          >
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-[#0B4A3A] text-lg">
                      {order.orderNumber}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-black text-gray-900">
                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                  </span>
                  <Link
                    href={`/orders/${order.id}/invoice`}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-full text-xs transition inline-flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Invoice
                  </Link>
                  <Link
                    href={`/orders/${order.id}`}
                    className="px-4 py-2 bg-[#0B4A3A] hover:bg-[#07362a] text-white font-semibold rounded-full text-xs transition inline-flex items-center gap-1.5"
                  >
                    Track Order <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="pt-4 space-y-2">
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
                      className="flex items-center justify-between text-sm py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#10B981] flex-shrink-0" />
                        <span className="font-medium text-gray-800">{item.productName}</span>
                        {(item.packSize || item.variantName) && (
                          <span className="text-xs text-gray-400">
                            ({item.packSize || item.variantName})
                          </span>
                        )}
                        <span className="text-xs text-gray-500 font-semibold">
                          × {item.quantity}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-700">
                        ₹{itemTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
