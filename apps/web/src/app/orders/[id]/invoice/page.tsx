"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import InvoiceCard, { InvoiceOrder } from "@/components/InvoiceCard";
import { ArrowLeft } from "lucide-react";

export default function OrderInvoicePage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<InvoiceOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      setIsLoading(true);
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (res.success && res.data) {
          setOrder(res.data);
        } else {
          setError(res.message || "Order not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load order invoice");
      } finally {
        setIsLoading(false);
      }
    }

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-sm text-[#5B6B65]">
        <div className="w-8 h-8 border-4 border-[#0B4A3A] border-t-transparent rounded-full animate-spin mb-3" />
        Loading your tax invoice...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h2 className="text-xl font-bold text-neutral-900">Invoice Unavailable</h2>
        <p className="text-xs text-neutral-500 mt-1">{error || "Could not retrieve order details."}</p>
        <Link
          href="/orders"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B4A3A] text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F5] py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <InvoiceCard order={order} showActions={true} />
    </div>
  );
}
