"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Truck, CheckCircle2, Clock, Eye, AlertCircle } from "lucide-react";

interface AdminOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  status: "PLACED" | "CONFIRMED" | "PACKED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  address?: { fullName: string; city: string; pincode: string };
  items?: Array<{ productName: string; quantity: number; price: number }>;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("http://localhost:5000/api/admin/orders");
        if (res.ok) {
          const json = await res.json();
          if (json.data) setOrders(json.data);
        }
      } catch (e) {
        console.warn("Could not load admin orders", e);
      }
    }
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, note: `Status updated to ${nextStatus} by pharmacy admin.` }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as any } : o))
        );
      }
    } catch (e) {
      console.error("Failed to update status", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => (filter === "ALL" ? true : o.status === filter));

  return (
    <div className="min-h-screen bg-[#F4F6F5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-[#0B4A3A] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#0F2A22]">Order Fulfillment Manager</h1>
            <p className="text-xs text-[#5B6B65] mt-0.5">
              Advance order states across the regulatory fulfillment pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-full border border-[#D7DEDB] overflow-x-auto max-w-full">
            {["ALL", "PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                  filter === tab ? "bg-[#0B4A3A] text-white" : "text-[#5B6B65] hover:text-[#0B4A3A]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#D7DEDB]">
              <ShoppingBag className="w-10 h-10 text-[#5B6B65] mx-auto mb-3 opacity-40" />
              <h3 className="text-sm font-bold text-[#0F2A22]">No orders found matching status</h3>
            </div>
          ) : (
            filtered.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl p-6 border border-[#D7DEDB] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#0B4A3A] bg-[#E6F4B8] px-2.5 py-0.5 rounded-full">
                      #{ord.orderNumber}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        ord.status === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-800"
                          : ord.status === "SHIPPED"
                          ? "bg-blue-100 text-blue-800"
                          : ord.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#0F2A22]">
                    Customer: {ord.address?.fullName || "Verified Buyer"} • {ord.address?.city} ({ord.address?.pincode})
                  </h4>
                  <p className="text-xs text-[#5B6B65]">
                    Amount: <strong className="text-[#0F2A22]">₹{ord.totalAmount}</strong> ({ord.paymentMethod}) • {ord.items?.length || 1} item(s)
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {ord.status === "PLACED" && (
                    <button
                      disabled={updatingId === ord.id}
                      onClick={() => handleStatusChange(ord.id, "CONFIRMED")}
                      className="px-3.5 py-1.5 rounded-full bg-[#0B4A3A] text-white text-xs font-bold hover:bg-[#10B981] transition shadow-sm"
                    >
                      Confirm Order
                    </button>
                  )}
                  {ord.status === "CONFIRMED" && (
                    <button
                      disabled={updatingId === ord.id}
                      onClick={() => handleStatusChange(ord.id, "PACKED")}
                      className="px-3.5 py-1.5 rounded-full bg-[#0B4A3A] text-white text-xs font-bold hover:bg-[#10B981] transition shadow-sm"
                    >
                      Mark Packed
                    </button>
                  )}
                  {ord.status === "PACKED" && (
                    <button
                      disabled={updatingId === ord.id}
                      onClick={() => handleStatusChange(ord.id, "SHIPPED")}
                      className="px-3.5 py-1.5 rounded-full bg-[#10B981] text-white text-xs font-bold hover:bg-[#0ea372] transition shadow-sm"
                    >
                      Dispatch / Ship
                    </button>
                  )}
                  {ord.status === "SHIPPED" && (
                    <button
                      disabled={updatingId === ord.id}
                      onClick={() => handleStatusChange(ord.id, "DELIVERED")}
                      className="px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
                    >
                      Mark Delivered
                    </button>
                  )}

                  <Link
                    href={`/orders/${ord.id}`}
                    className="px-3.5 py-1.5 rounded-full border border-[#D7DEDB] text-xs font-bold text-[#0B4A3A] hover:bg-[#F4F6F5] transition flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
