"use client";

import React, { useEffect, useState } from "react";
import {
  Layers,
  Search,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ShieldAlert,
  ArrowUpDown,
  Filter,
} from "lucide-react";

interface Batch {
  id: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;
  costPrice: number;
  isBlocked: boolean;
  variant: {
    sku: string;
    name: string;
    price: number;
    mrp: number;
    product: {
      id: string;
      name: string;
      slug: string;
      prescriptionRequired: boolean;
      brand: { name: string };
    };
  };
}

export default function AdminInventoryPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (lowStockOnly) params.append("lowStockOnly", "true");

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setBatches(data.data);
      }
    } catch (err) {
      console.error("Failed to load inventory batches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [lowStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBatches();
  };

  const isExpiringSoon = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr).getTime();
    const now = Date.now();
    const daysUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 90;
  };

  return (
    <div className="space-y-6 max-w-[1720px] 2xl:max-w-[1800px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B4A3A]">
            FEFO Inventory & Batch Tracking
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Automated First-Expiry First-Out inventory tracking to comply with Good Pharmacy
            Practices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3.5 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              lowStockOnly
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock (&le;30)</span>
          </button>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Batch # or Medicine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-xs bg-white shadow-sm"
            />
          </form>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-[#0B4A3A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-xs">Loading FEFO batches...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="py-20 text-center">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-[#0B4A3A]">No batches found</p>
            <p className="text-xs text-gray-400 mt-1">Try another search or reset filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF3EA]/60 text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Medicine / SKU</th>
                  <th className="py-3.5 px-6 font-semibold">Batch Number</th>
                  <th className="py-3.5 px-6 font-semibold">Mfg Date</th>
                  <th className="py-3.5 px-6 font-semibold">Expiry Date (FEFO)</th>
                  <th className="py-3.5 px-6 font-semibold">Remaining Units</th>
                  <th className="py-3.5 px-6 font-semibold">Cost Price</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Selling Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {batches.map((b) => {
                  const nearExpiry = isExpiringSoon(b.expiryDate);
                  const isLow = b.quantity <= 30;

                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{b.variant?.product?.name}</p>
                          {b.variant?.product?.prescriptionRequired && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 font-extrabold text-[10px] rounded">
                              Rx
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {b.variant?.product?.brand?.name} &bull; {b.variant?.name} ({b.variant?.sku})
                        </p>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-gray-800">
                        {b.batchNumber}
                      </td>
                      <td className="py-4 px-6 text-gray-500">
                        {new Date(b.mfgDate).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              nearExpiry ? "text-red-600 font-bold" : "text-gray-700"
                            }`}
                          >
                            {new Date(b.expiryDate).toLocaleDateString("en-IN", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {nearExpiry && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
                              Expiring Soon
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                            isLow
                              ? "bg-red-100 text-red-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {b.quantity} units
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-gray-600">
                        ₹{Number(b.costPrice).toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-[#0B4A3A]">
                        ₹{Number(b.variant?.price).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
