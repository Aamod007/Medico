"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  Users,
  FileCheck,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("http://localhost:5000/api/admin/stats");
        const data = await res.json();
        if (data.success && data.data) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return (
          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
            Delivered
          </span>
        );
      case "SHIPPED":
        return (
          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
            Shipped
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-bold">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-4 border-[#0B4A3A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading admin analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1720px] 2xl:max-w-[1800px] mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B4A3A]">Operations Dashboard</h1>
        <p className="text-xs text-gray-500 mt-1">
          Real-time pharmacy sales, pending prescription review queue, and inventory alerts.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-[#10B981] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">
            ₹{Number(stats?.totalRevenue || 0).toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Settled Razorpay orders
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats?.totalOrders || 0}</div>
          <p className="text-xs text-gray-500 font-medium mt-1">Dispatched & processing</p>
        </div>

        {/* Pending Prescriptions */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Pending Prescriptions
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">
            {stats?.pendingPrescriptionsCount || 0}
          </div>
          <Link
            href="/admin/prescriptions"
            className="text-xs text-[#0B4A3A] font-bold hover:underline mt-1 inline-flex items-center gap-1"
          >
            Review Queue &rarr;
          </Link>
        </div>

        {/* Total Active SKUs */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Active Medicines
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats?.totalProducts || 66}</div>
          <p className="text-xs text-gray-500 font-medium mt-1">Catalog items active</p>
        </div>
      </div>

      {/* Two Columns: Recent Orders & Inventory Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders (col 7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#0B4A3A] text-base">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#10B981] hover:underline"
            >
              View All Orders &rarr;
            </Link>
          </div>

          {!stats?.recentOrders || stats.recentOrders.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">No orders recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase">
                    <th className="pb-3 font-semibold">Order ID</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recentOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 font-bold text-[#0B4A3A]">{ord.orderNumber}</td>
                      <td className="py-3 text-gray-700">{ord.user?.name || "Customer"}</td>
                      <td className="py-3 font-semibold text-gray-900">
                        ₹{Number(ord.totalAmount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3">{getStatusBadge(ord.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Batches (col 5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#0B4A3A] text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Alerts
            </h2>
            <Link
              href="/admin/inventory"
              className="text-xs font-bold text-[#10B981] hover:underline"
            >
              Inventory &rarr;
            </Link>
          </div>

          {!stats?.lowStockBatches || stats.lowStockBatches.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500">All inventory batches adequately stocked!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.lowStockBatches.map((b: any) => (
                <div
                  key={b.id}
                  className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      {b.variant?.product?.name || "Medicine"}
                    </p>
                    <p className="text-[11px] text-gray-500">Batch: {b.batchNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold text-xs rounded-full">
                      {b.quantity} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
