"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Boxes,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Users,
} from "lucide-react";

interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  lowStockBatches: number;
  totalCustomers: number;
  totalProducts: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalOrders: 6,
    totalRevenue: 3420,
    lowStockBatches: 2,
    totalCustomers: 4,
    totalProducts: 68,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("http://localhost:5000/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setStats(data.data);
          }
        }
      } catch (e) {
        console.warn("Could not fetch live admin stats, using initial data", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F6F5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="bg-[#0B4A3A] rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#10B981] mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Licensed Pharmacy Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">Pharmacist & Admin Command Portal</h1>
            <p className="text-xs text-white/70 mt-1 max-w-xl">
              Real-time oversight of catalog products, FEFO batch allocations, order fulfillment, and compliance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="px-4 py-2.5 rounded-full bg-[#10B981] text-white text-xs font-bold hover:bg-[#0ea372] transition shadow-sm flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Manage Orders ({stats.totalOrders})
            </Link>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-[#D7DEDB] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5B6B65]">Total Orders</span>
              <div className="w-10 h-10 rounded-full bg-[#E6F4B8] text-[#0B4A3A] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#0B4A3A]" />
              </div>
            </div>
            <div className="text-3xl font-black text-[#0F2A22]">{stats.totalOrders}</div>
            <p className="text-[11px] text-[#5B6B65] mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-bold">100%</span> verified via FEFO
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#D7DEDB] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5B6B65]">Gross Revenue</span>
              <div className="w-10 h-10 rounded-full bg-[#DCEBFA] text-[#0B4A3A] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#0B4A3A]" />
              </div>
            </div>
            <div className="text-3xl font-black text-[#0F2A22]">₹{stats.totalRevenue.toLocaleString("en-IN")}</div>
            <p className="text-[11px] text-[#5B6B65] mt-1 text-emerald-600 font-medium">Prepaid + COD Settled</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#D7DEDB] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5B6B65]">Active Customers</span>
              <div className="w-10 h-10 rounded-full bg-[#FAF3EA] text-[#0B4A3A] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#0B4A3A]" />
              </div>
            </div>
            <div className="text-3xl font-black text-[#0F2A22]">{stats.totalCustomers}</div>
            <p className="text-[11px] text-[#5B6B65] mt-1 font-medium">Registered customer accounts</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#D7DEDB] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5B6B65]">Low / Expired Batches</span>
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="text-3xl font-black text-red-600">{stats.lowStockBatches}</div>
            <p className="text-[11px] text-red-700 font-medium mt-1">FEFO automatic quarantine active</p>
          </div>
        </div>

        {/* Operational Modules Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/orders"
            className="group bg-white p-8 rounded-2xl border border-[#D7DEDB] hover:border-[#0B4A3A] transition shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#DCEBFA] text-[#0B4A3A] flex items-center justify-center mb-5">
                <ShoppingBag className="w-7 h-7 text-[#0B4A3A]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F2A22] group-hover:text-[#0B4A3A] transition">
                Orders &amp; Fulfillment Manager
              </h3>
              <p className="text-sm text-[#5B6B65] mt-2 leading-relaxed">
                Track full lifecycle order states: Placed, Confirmed, Packed, Shipped, and Delivered with courier partner tracking details and streaming tax invoice PDFs.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-[#0B4A3A] group-hover:translate-x-1 transition">
              Manage Orders <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/admin/inventory"
            className="group bg-white p-8 rounded-2xl border border-[#D7DEDB] hover:border-[#0B4A3A] transition shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#FAF3EA] text-[#0B4A3A] flex items-center justify-center mb-5">
                <Boxes className="w-7 h-7 text-[#0B4A3A]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F2A22] group-hover:text-[#0B4A3A] transition">
                FEFO Inventory &amp; Batch Tracking
              </h3>
              <p className="text-sm text-[#5B6B65] mt-2 leading-relaxed">
                Audit batches by First-Expiry First-Out chronology, inspect stock levels, quarantined batches, expiry thresholds, and active manufacturer batches.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-[#0B4A3A] group-hover:translate-x-1 transition">
              Inspect Inventory <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
