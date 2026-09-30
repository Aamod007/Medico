"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  FileText,
  Download,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    async function loadOrder() {
      setIsLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      if (res.success && res.data) {
        setOrder(res.data);
      }
      setIsLoading(false);
    }
    loadOrder();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) return;
    const res = await api.post(`/orders/${orderId}/cancel`, { reason: cancelReason });
    if (res.success) {
      alert("Order cancelled successfully");
      window.location.reload();
    } else {
      alert(res.message || "Failed to cancel order");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-[#5B6B65]">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-[#0F2A22]">Order Not Found</h2>
        <Link href="/products" className="mt-4 inline-block px-6 py-2.5 rounded-full bg-[#0B4A3A] text-white text-xs font-bold">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const steps = [
    { key: "PLACED", label: "Order Placed" },
    { key: "CONFIRMED", label: "Confirmed & Approved" },
    { key: "PACKED", label: "Packed in Warehouse" },
    { key: "SHIPPED", label: "Shipped (Cold-Chain)" },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <Link href="/products" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4A3A] hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Storefront
      </Link>

      {/* Success Notification Banner */}
      <div className="bg-[#FAF3EA] rounded-3xl p-6 sm:p-8 border border-[#FDE6D3] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#10B981] text-white flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0F2A22]">
              Order Confirmed!
            </h1>
            <p className="text-xs text-[#5B6B65] mt-0.5">
              Order #{order.orderNumber} • Placed on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Invoice Download Button */}
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/orders/${order.id}/invoice`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B4A3A] hover:bg-[#07362a] text-white text-xs font-bold transition shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Download GST Invoice</span>
        </a>
      </div>

      {/* Live Order Fulfillment Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D7DEDB] space-y-6">
        <h3 className="text-base font-bold text-[#0F2A22]">Live Tracking Timeline</h3>

        <div className="relative border-l-2 border-gray-200 ml-4 pl-6 space-y-6">
          {steps.map((step, idx) => {
            const isCompleted = currentStepIndex >= idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div key={idx} className="relative">
                <div
                  className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isCompleted
                      ? "bg-[#10B981] text-white ring-4 ring-emerald-50"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${isCurrent ? "text-[#0B4A3A]" : "text-[#0F2A22]"}`}>
                    {step.label}
                  </h4>
                  {isCurrent && (
                    <p className="text-xs text-[#10B981] font-semibold mt-0.5">
                      Current status: {order.status}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items & Shipping Address */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Ordered Items */}
        <div className="md:col-span-8 bg-white rounded-3xl p-6 border border-[#D7DEDB] space-y-4">
          <h3 className="text-base font-bold text-[#0F2A22]">Items in this Order</h3>
          <div className="divide-y divide-gray-100">
            {order.items?.map((item: any) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-[#0F2A22]">{item.productName}</div>
                  <div className="text-[11px] text-[#5B6B65] mt-0.5">
                    {item.packSize} • Qty: {item.quantity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#0B4A3A]">₹{item.subtotal}</div>
                  <div className="text-[10px] text-gray-400">GST: {item.gstRate}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Details */}
        <div className="md:col-span-4 bg-white rounded-3xl p-6 border border-[#D7DEDB] space-y-4">
          <h3 className="text-base font-bold text-[#0F2A22]">Delivery Details</h3>
          <div className="text-xs text-[#5B6B65] space-y-1">
            <p className="font-bold text-[#0F2A22]">{order.address?.fullName}</p>
            <p>{order.address?.addressLine1}</p>
            <p>{order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
            <p className="pt-1">Phone: {order.address?.phone}</p>
          </div>

          <div className="pt-3 border-t border-gray-100 text-xs text-[#5B6B65] space-y-1">
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <strong className="text-[#0F2A22]">{order.paymentMethod}</strong>
            </div>
            <div className="flex justify-between">
              <span>Payment Status:</span>
              <strong className="text-[#10B981]">{order.paymentStatus}</strong>
            </div>
          </div>

          {(order.status === "PLACED" || order.status === "CONFIRMED") && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="w-full mt-4 py-2 rounded-full border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold transition"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-[#0F2A22] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Cancel Order #{order.orderNumber}
            </h3>
            <p className="text-xs text-[#5B6B65]">
              Are you sure? Once cancelled, reserved inventory will be released and any online payment will be refunded.
            </p>
            <textarea
              placeholder="Reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-[#F4F6F5] border border-[#D7DEDB] rounded-2xl p-3 text-xs"
              rows={3}
              required
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-full border text-xs font-bold text-gray-600"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelOrder}
                className="px-5 py-2 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
