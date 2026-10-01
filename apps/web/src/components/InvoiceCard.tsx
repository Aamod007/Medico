"use client";

import React from "react";
import { Printer, Download, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface InvoiceItem {
  id?: string;
  productName: string;
  packSize?: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  subtotal?: number;
  totalPrice?: number;
}

interface InvoiceAddress {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface InvoiceOrder {
  id: string;
  orderNumber: string;
  createdAt: string | Date;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  subtotal?: number;
  taxAmount?: number;
  gstAmount?: number;
  discountAmount?: number;
  deliveryFee?: number;
  totalAmount: number;
  items?: InvoiceItem[];
  address?: InvoiceAddress;
  shippingAddress?: InvoiceAddress;
}

interface InvoiceCardProps {
  order: InvoiceOrder;
  showActions?: boolean;
}

export default function InvoiceCard({ order, showActions = true }: InvoiceCardProps) {
  const address = order.address || order.shippingAddress;
  const items = order.items || [];

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "June 24, 2025";

  // Calculate financial breakdown
  const subtotal =
    order.subtotal ??
    items.reduce((sum, item) => sum + (item.subtotal || item.totalPrice || item.quantity * (item.unitPrice || item.price || 0)), 0);

  const tax = order.taxAmount ?? order.gstAmount ?? Math.round(subtotal * 0.1);
  const discount = order.discountAmount ?? 0;
  const delivery = order.deliveryFee ?? 0;
  const total = order.totalAmount ?? subtotal + tax + delivery - discount;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownloadPDF = () => {
    const invoiceUrl = `/api/orders/${order.id}/invoice`;
    // Open PDF in new tab for viewing (inline mode)
    window.open(`${invoiceUrl}?mode=inline`, "_blank");
    // Also trigger actual file download via hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = invoiceUrl; // default mode = attachment (download)
    document.body.appendChild(iframe);
    setTimeout(() => iframe.remove(), 10000);
  };

  return (
    <div className="w-full">
      {/* Action buttons (hidden when printing) */}
      {showActions && (
        <div className="no-print max-w-2xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4A3A] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Order Tracking
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
            </button>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-xs font-bold transition shadow-sm border border-neutral-200"
            >
              <Download className="w-3.5 h-3.5" /> Official PDF
            </button>
          </div>
        </div>
      )}

      {/* Modern Invoice Card matching reference design */}
      <div className="print-invoice-container bg-white rounded-[32px] border border-neutral-200/90 shadow-xl shadow-neutral-100 p-8 sm:p-12 max-w-2xl mx-auto font-sans text-neutral-900 transition-all">
        {/* Header: Title and Invoice Number */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950">
              Invoice
            </h1>
            <div className="text-xs sm:text-sm text-neutral-400 font-medium mt-2 flex items-center gap-2">
              <span>Invoice Number</span>
              <span className="font-bold text-neutral-900">
                #{order.orderNumber?.startsWith("#") ? order.orderNumber.slice(1) : order.orderNumber || "TSN-904824"}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Info Grid: Billed By vs Billed To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10">
          {/* Left Column: Billed by */}
          <div>
            <p className="text-xs text-neutral-400 font-medium">Billed by:</p>
            <h4 className="text-sm font-bold text-neutral-900 mt-1">Medico</h4>
            <p className="text-xs text-neutral-500 mt-0.5">hello@medico.in</p>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              8526 Daisy Drive, Bellandur,<br />
              Bangalore, Karnataka, India. 560103
            </p>

            <div className="mt-6">
              <p className="text-xs text-neutral-400 font-medium">Date Issued:</p>
              <p className="text-xs sm:text-sm font-semibold text-neutral-900 mt-1">
                {formattedDate}
              </p>
            </div>
          </div>

          {/* Right Column: Billed to */}
          <div>
            <p className="text-xs text-neutral-400 font-medium">Billed to:</p>
            <h4 className="text-sm font-bold text-neutral-900 mt-1">
              {address?.fullName || "Jacob Jones"}
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              {address?.phone ? `+91 ${address.phone}` : "hello@fleurish.com"}
            </p>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              {address?.addressLine1 || "1234 Elm Street"},<br />
              {address?.city || "Bangalore"}, {address?.state || "Karnataka"}, India. {address?.pincode || "560103"}
            </p>

            <div className="mt-6">
              <p className="text-xs text-neutral-400 font-medium">Payment Status:</p>
              <p className="text-xs sm:text-sm font-semibold text-neutral-900 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>
                  {order.paymentStatus === "PAID" || order.paymentMethod === "RAZORPAY"
                    ? `Paid via ${order.paymentMethod || "Online"}`
                    : order.paymentMethod === "COD"
                    ? "Cash on Delivery"
                    : "Paid in Full"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-10">
          <div className="flex items-center justify-between pb-3 text-xs font-medium text-neutral-400">
            <span className="flex-1">Items</span>
            <span className="w-16 text-center">QTY</span>
            <span className="w-24 text-right">Rate</span>
            <span className="w-24 text-right">Total</span>
          </div>

          <div className="divide-y divide-neutral-100">
            {items.length > 0 ? (
              items.map((item, index) => {
                const qty = item.quantity || 1;
                const unitPrice = item.unitPrice ?? item.price ?? 0;
                const itemTotal = item.subtotal ?? item.totalPrice ?? qty * unitPrice;

                return (
                  <div
                    key={item.id || index}
                    className="py-4 flex items-center justify-between text-xs sm:text-sm"
                  >
                    <div className="flex-1 pr-4">
                      <div className="font-semibold text-neutral-900">
                        {item.productName}
                      </div>
                      {item.packSize && (
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          {item.packSize}
                        </div>
                      )}
                    </div>
                    <div className="w-16 text-center font-normal text-neutral-800">
                      {qty}
                    </div>
                    <div className="w-24 text-right font-bold text-neutral-900">
                      ₹{Number(unitPrice).toLocaleString("en-IN")}
                    </div>
                    <div className="w-24 text-right font-bold text-neutral-900">
                      ₹{Number(itemTotal).toLocaleString("en-IN")}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-xs text-neutral-400">
                No items recorded for this invoice.
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="mt-6 flex flex-col items-end">
          <div className="w-full sm:w-64 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-neutral-500 font-medium">
              <span>Subtotal</span>
              <span className="font-bold text-neutral-900">
                ₹{Number(subtotal).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between text-neutral-500 font-medium">
              <span>Tax</span>
              <span className="font-bold text-neutral-900">
                10% (₹{Number(tax).toLocaleString("en-IN")})
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount</span>
                <span className="font-bold">-₹{Number(discount).toLocaleString("en-IN")}</span>
              </div>
            )}

            {delivery > 0 ? (
              <div className="flex justify-between text-neutral-500 font-medium">
                <span>Delivery</span>
                <span className="font-bold text-neutral-900">
                  ₹{Number(delivery).toLocaleString("en-IN")}
                </span>
              </div>
            ) : null}

            <div className="border-t border-neutral-200/90 pt-3 mt-3 flex justify-between items-baseline">
              <span className="text-sm font-bold text-neutral-900">Total</span>
              <span className="text-xl font-black text-neutral-950">
                ₹{Number(total).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Notes Container */}
        <div className="mt-10 bg-neutral-50/80 rounded-2xl p-4 sm:p-5 border border-neutral-100 text-xs text-neutral-500 leading-relaxed">
          <strong className="block font-semibold text-neutral-800 mb-1">Notes:</strong>
          Thank you for your business. For any questions regarding this invoice or your medicine delivery, please reach out to <span className="font-medium text-neutral-800">hello@medico.in</span>. All products are verified and dispensed by licensed pharmacists.
        </div>
      </div>
    </div>
  );
}
