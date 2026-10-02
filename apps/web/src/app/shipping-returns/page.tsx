import React from "react";
import Link from "next/link";
import { Truck, RotateCcw, ShieldCheck, ThermometerSnowflake, AlertTriangle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Shipping & Returns Policy | Pharmico Online Pharmacy",
  description: "Learn about Pharmico's cold-chain pharmaceutical shipping protocols, delivery timelines, and medicine return policy.",
};

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-[#D7DEDB]">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B4A3A] hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-black text-[#0F2A22] mb-4">
          Shipping & Returns Policy
        </h1>
        <p className="text-sm text-[#5B6B65] mb-8 pb-6 border-b border-[#D7DEDB]">
          Last updated: October 2026 • Compliant with Drugs and Cosmetics Act & Consumer Protection E-Commerce Rules
        </p>

        {/* Quick Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="p-4 rounded-2xl bg-[#E6F4B8]/40 border border-[#E6F4B8] flex items-center gap-3">
            <Truck className="w-6 h-6 text-[#0B4A3A]" />
            <div>
              <p className="text-xs font-bold text-[#0F2A22]">Free Delivery</p>
              <p className="text-[11px] text-[#5B6B65]">On all orders above ₹500</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#DCEBFA]/40 border border-[#DCEBFA] flex items-center gap-3">
            <ThermometerSnowflake className="w-6 h-6 text-[#0B4A3A]" />
            <div>
              <p className="text-xs font-bold text-[#0F2A22]">Cold-Chain Packaging</p>
              <p className="text-[11px] text-[#5B6B65]">2°C - 8°C temperature preserved</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#FDE6D3]/40 border border-[#FDE6D3] flex items-center gap-3">
            <RotateCcw className="w-6 h-6 text-[#0B4A3A]" />
            <div>
              <p className="text-xs font-bold text-[#0F2A22]">48-Hour Return Window</p>
              <p className="text-[11px] text-[#5B6B65]">For damaged or wrong items</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 text-sm text-[#3E4D47] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[#0F2A22] mb-3 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#10B981]" /> 1. Shipping Timelines & Charges
            </h2>
            <p className="mb-2">
              Pharmico delivers medicines, wellness essentials, and medical diagnostic equipment across verified Indian postal codes.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#5B6B65]">
              <li><strong>Metro Express Delivery:</strong> 24 to 48 hours for standard prescriptions and everyday essentials.</li>
              <li><strong>Rest of India:</strong> 2 to 4 business days via registered logistics partners (BlueDart, Delhivery).</li>
              <li><strong>Delivery Fee:</strong> Flat ₹40 for orders below ₹500. Orders of ₹500 or more qualify for <strong>FREE Delivery</strong>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0F2A22] mb-3 flex items-center gap-2">
              <ThermometerSnowflake className="w-5 h-5 text-[#10B981]" /> 2. Cold-Chain Medicine Integrity
            </h2>
            <p className="text-xs text-[#5B6B65]">
              Temperature-sensitive pharmaceutical products (such as insulin, eye drops, biologicals, and select vaccines) are shipped in multi-layer insulated thermal packaging with calibrated gel ice packs, ensuring constant temperature maintenance between 2°C and 8°C until doorstep handover.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0F2A22] mb-3 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#10B981]" /> 3. Pharmaceutical Return & Cancellation Policy
            </h2>
            <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] mb-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-normal">
                <strong>Patient Safety Advisory:</strong> In accordance with the Drugs and Cosmetics Rules, opened or used pharmaceutical formulations, injectables, and cold-chain drugs cannot be returned or resold once delivered.
              </p>
            </div>
            <p className="mb-2">You are entitled to a full replacement or refund in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#5B6B65]">
              <li>The delivered medication is past its labeled expiry date or batch validity.</li>
              <li>The outer security seal or bottle/strip packaging is visibly tampered or damaged upon delivery.</li>
              <li>The delivered product or dosage differs from your approved doctor prescription or placed order.</li>
            </ul>
            <p className="mt-3 text-xs text-[#5B6B65]">
              To initiate a return, notify our licensed pharmacy support team within <strong>48 hours of delivery</strong> through the Orders portal or via email at <strong className="text-[#0B4A3A]">support@pharmico.health</strong> with clear photos of the outer shipping label and product batch number.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0F2A22] mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#10B981]" /> 4. Refund Processing
            </h2>
            <p className="text-xs text-[#5B6B65]">
              Once an eligible return is verified by our registered pharmacist, refunds are processed within 24 business hours. For prepaid online transactions (Razorpay UPI, Credit/Debit Cards, Netbanking), the amount reflects in your source account within 5-7 banking days. For Cash on Delivery (COD) orders, refunds are credited directly to your verified bank account via IMPS/NEFT.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
