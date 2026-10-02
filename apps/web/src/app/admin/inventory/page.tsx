"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Boxes, AlertTriangle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";

interface BatchItem {
  id: string;
  batchNumber: string;
  variantId: string;
  quantity: number;
  costPrice: number;
  expiryDate: string;
  mfgDate: string;
  isBlocked: boolean;
  variant?: {
    sku: string;
    name: string;
    product?: { name: string; prescriptionRequired: boolean };
  };
}

export default function AdminInventoryPage() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [filter, setFilter] = useState<"ALL" | "EXPIRING" | "LOW_STOCK" | "BLOCKED">("ALL");

  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await fetch("http://localhost:5000/api/admin/inventory");
        if (res.ok) {
          const json = await res.json();
          if (json.data) setBatches(json.data);
        }
      } catch (e) {
        console.warn("Could not load inventory batches", e);
      }
    }
    loadBatches();
  }, []);

  const now = new Date();
  const filtered = batches.filter((b) => {
    const exp = new Date(b.expiryDate);
    if (filter === "EXPIRING") return exp <= now;
    if (filter === "LOW_STOCK") return b.quantity > 0 && b.quantity <= 10;
    if (filter === "BLOCKED") return b.isBlocked;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F4F6F5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-[#0B4A3A] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#0F2A22]">FEFO Inventory & Batch Tracking</h1>
            <p className="text-xs text-[#5B6B65] mt-0.5">
              Strict First-Expiry First-Out chronological allocation with automated quarantine of expired or blocked lots.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-full border border-[#D7DEDB]">
            {(["ALL", "EXPIRING", "LOW_STOCK", "BLOCKED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  filter === tab ? "bg-[#0B4A3A] text-white" : "text-[#5B6B65] hover:text-[#0B4A3A]"
                }`}
              >
                {tab === "EXPIRING" ? "Expired / Near Expiry" : tab === "LOW_STOCK" ? "Low Stock (≤10)" : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Batches Table Card */}
        <div className="bg-white rounded-2xl border border-[#D7DEDB] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6F5] border-b border-[#D7DEDB] text-[#5B6B65] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Batch Lot #</th>
                  <th className="py-3 px-4">Product Formulation & SKU</th>
                  <th className="py-3 px-4">Available Units</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7DEDB]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#5B6B65]">
                      No batches found matching filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => {
                    const isExpired = new Date(b.expiryDate) <= now;
                    return (
                      <tr key={b.id} className="hover:bg-[#F4F6F5]/50 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0B4A3A]">{b.batchNumber}</td>
                        <td className="py-3.5 px-4 font-semibold text-[#0F2A22]">
                          {b.variant?.product?.name || "Paracetamol formulation"}
                          <div className="text-[11px] text-[#5B6B65] font-mono">{b.variant?.sku}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#0F2A22]">
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              b.quantity === 0
                                ? "bg-gray-100 text-gray-700"
                                : b.quantity <= 10
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {b.quantity} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={isExpired ? "text-red-600 font-bold" : "text-[#0F2A22]"}>
                            {new Date(b.expiryDate).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {b.isBlocked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                              <ShieldAlert className="w-3 h-3" /> Blocked / Quarantined
                            </span>
                          ) : isExpired ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" /> Expired (Unsellable)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Active (Sellable)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
