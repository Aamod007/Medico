import React from "react";
import Link from "next/link";
import { Pill, Home, Search, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "404 - Page Not Found | Pharmico",
  description: "The page or medication you are looking for could not be found.",
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#F4F6F5] px-4 py-16">
      <div className="max-w-md w-full text-center bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-[#D7DEDB]">
        <div className="w-16 h-16 rounded-full bg-[#E6F4B8] text-[#0B4A3A] flex items-center justify-center mx-auto mb-6">
          <Pill className="w-8 h-8 text-[#0B4A3A]" />
        </div>

        <h1 className="text-4xl font-black text-[#0F2A22] mb-2">404</h1>
        <h2 className="text-xl font-bold text-[#0F2A22] mb-3">Page or Medicine Not Found</h2>
        <p className="text-xs text-[#5B6B65] leading-relaxed mb-8">
          The requested page, formulation, or health service might have been moved, renamed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0B4A3A] text-white text-xs font-bold hover:bg-[#10B981] transition shadow-sm"
          >
            <Home className="w-4 h-4" /> Return to Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#F4F6F5] text-[#0B4A3A] text-xs font-bold hover:bg-[#E6F4B8] transition border border-[#D7DEDB]"
          >
            <Search className="w-4 h-4" /> Browse Medicines
          </Link>
        </div>
      </div>
    </div>
  );
}
