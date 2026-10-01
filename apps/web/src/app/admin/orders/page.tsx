"use client";

import React, { useEffect, useState } from "react";
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  Truck,
  Clock,
  AlertCircle,
  FileText,
  ExternalLink,
  X,
} from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  trackingNumber: string | null;
  courierPartner: string | null;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress?: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  address?: any;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status update state
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierPartner, setCourierPartner] = useState("Blue Dart Express");
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrders(data.data.orders || []);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);
    setUpdateMsg(null);

    try {
      const res = await fetch(
        `/api/admin/orders/${selectedOrder.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus || selectedOrder.status,
            trackingNumber: trackingNumber || undefined,
            courierPartner: courierPartner || undefined,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update order status");
      }

      setUpdateMsg("Order status updated successfully!");
      setTimeout(() => {
        setSelectedOrder(null);
        setUpdateMsg(null);
        fetchOrders();
      }, 1000);
    } catch (err: any) {
      alert(err.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1720px] 2xl:max-w-[1800px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B4A3A]">Orders Manager</h1>
          <p className="text-xs text-gray-500 mt-1">
            Dispatch, track shipments, update fulfillment statuses, and access official tax invoices.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Order # or Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-xs bg-white shadow-sm"
          />
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          "ALL",
          "PLACED",
          "CONFIRMED",
          "PACKED",
          "SHIPPED",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "CANCELLED",
        ].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
              statusFilter === st
                ? "bg-[#0B4A3A] text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-[#0B4A3A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-xs">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-[#0B4A3A]">No orders found</p>
            <p className="text-xs text-gray-400 mt-1">Try another filter or search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF3EA]/60 text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Order Number</th>
                  <th className="py-3.5 px-6 font-semibold">Customer</th>
                  <th className="py-3.5 px-6 font-semibold">Date</th>
                  <th className="py-3.5 px-6 font-semibold">Total Amount</th>
                  <th className="py-3.5 px-6 font-semibold">Payment</th>
                  <th className="py-3.5 px-6 font-semibold">Fulfillment Status</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-6 font-black text-[#0B4A3A]">{ord.orderNumber}</td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-900">{ord.user?.name || "Customer"}</p>
                      <p className="text-[11px] text-gray-400">{ord.user?.phone || ord.user?.email}</p>
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-6 font-black text-gray-900">
                      ₹{Number(ord.totalAmount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800">
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-amber-100 text-amber-800">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <a
                        href={`/api/orders/${ord.id}/invoice`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-semibold transition text-xs inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" /> Invoice
                      </a>
                      <button
                        onClick={() => {
                          setSelectedOrder(ord);
                          setNewStatus(ord.status);
                          setTrackingNumber(ord.trackingNumber || "");
                          setCourierPartner(ord.courierPartner || "Blue Dart Express");
                        }}
                        className="px-3 py-1.5 bg-[#0B4A3A] hover:bg-[#07362a] text-white rounded-full font-bold transition text-xs"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Status & Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-[#0B4A3A] mb-1">
              Order Details: {selectedOrder.orderNumber}
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Placed on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
            </p>

            {updateMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center">
                {updateMsg}
              </div>
            )}

            {/* Items summary */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2 text-xs">
              <span className="font-bold text-gray-700 block mb-1">Order Items:</span>
              {selectedOrder.items?.map((it) => (
                <div key={it.id} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                  <span>
                    {it.productName} {it.variantName && `(${it.variantName})`} &times; {it.quantity}
                  </span>
                  <span className="font-bold">₹{Number(it.totalPrice).toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-between font-black text-sm text-[#0B4A3A]">
                <span>Total Amount:</span>
                <span>₹{Number(selectedOrder.totalAmount).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Address */}
            {(selectedOrder.address || selectedOrder.shippingAddress) && (
              <div className="mb-6 p-4 rounded-2xl bg-[#FAF3EA] border border-amber-200 text-xs space-y-1">
                <span className="font-bold text-gray-800 block mb-1">Delivery Address:</span>
                <p>
                  {(selectedOrder.address || selectedOrder.shippingAddress)?.fullName} &bull;{" "}
                  {(selectedOrder.address || selectedOrder.shippingAddress)?.phone}
                </p>
                <p>
                  {(selectedOrder.address as any)?.addressLine1 || (selectedOrder.shippingAddress as any)?.street},{" "}
                  {(selectedOrder.address || selectedOrder.shippingAddress)?.city},{" "}
                  {(selectedOrder.address || selectedOrder.shippingAddress)?.pincode}
                </p>
              </div>
            )}

            {/* Update Status Form */}
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Change Fulfillment Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-xs"
                >
                  <option value="PLACED">PLACED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PACKED">PACKED</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Courier Partner
                  </label>
                  <input
                    type="text"
                    value={courierPartner}
                    onChange={(e) => setCourierPartner(e.target.value)}
                    placeholder="e.g. Blue Dart / Delhivery"
                    className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tracking Number (AWB)
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. BD-89021482"
                    className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <a
                  href={`/api/orders/${selectedOrder.id}/invoice`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition text-xs inline-flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" /> Download GST Invoice
                </a>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-3 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-full transition text-xs shadow-sm"
                >
                  {updating ? "Saving..." : "Save Status & Tracking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
