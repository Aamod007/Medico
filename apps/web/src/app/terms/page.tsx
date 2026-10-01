import React from "react";
import Link from "next/link";
import { ShieldAlert, FileText, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions | Pharmico Healthcare",
  description: "Terms and Conditions governing the use of Pharmico online pharmacy, prescription fulfillment, and healthcare services.",
};

export default function TermsPage() {
  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-8 py-10">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B4A3A] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>
      </div>

      <div className="bg-[#0B4A3A] rounded-3xl p-8 sm:p-12 text-white mb-10 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-8 h-8 text-[#A3E635]" />
          <span className="text-xs uppercase tracking-wider font-bold text-[#A3E635] bg-white/10 px-3 py-1 rounded-full">
            Legal & Compliance
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Terms and Conditions</h1>
        <p className="text-white/80 mt-2 text-sm sm:text-base max-w-2xl">
          Effective Date: October 1, 2026 &bull; Last Updated: October 2026
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5EBE8] shadow-sm space-y-8 text-[#2D3F39] text-sm sm:text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-[#0F2A22] mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#0B4A3A]" /> 1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using the Pharmico platform (including our website, mobile interface, and administrative control systems), you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, you must discontinue using our services immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#0F2A22] mb-3 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#0B4A3A]" /> 2. Medical Disclaimer & Prescription Dispensing
          </h2>
          <p className="mb-3">
            Pharmico is a licensed pharmaceutical delivery platform adhering to the Drugs and Cosmetics Act, 1940 and Drugs and Cosmetics Rules, 1945.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[#5B6B65]">
            <li>
              <strong>Mandatory Valid Prescription:</strong> Schedule H and H1 medications require a legible, valid prescription issued by a certified registered medical practitioner (RMP).
            </li>
            <li>
              <strong>Pharmacist Verification:</strong> Every prescription is inspected and verified by our licensed registered pharmacists before dispensing.
            </li>
            <li>
              <strong>Emergency Care:</strong> Our platform is not intended for acute emergency situations. In case of a medical emergency, please contact your nearest hospital or local emergency helpline immediately.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#0F2A22] mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#0B4A3A]" /> 3. Pricing, Orders & FEFO Inventory
          </h2>
          <p>
            All product prices are quoted in Indian Rupees (INR) inclusive of applicable GST. We operate strict First-Expiry-First-Out (FEFO) batch management. In the event of pricing errors or unfulfillable inventory batches, Pharmico reserves the right to cancel the order and process a full refund to your original payment method.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#0F2A22] mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#0B4A3A]" /> 4. Cancellation & Returns Policy
          </h2>
          <p>
            Due to strict cold-chain compliance and pharmaceutical hygiene standards, opened or temperature-sensitive medications cannot be returned once delivered, except in cases of damaged, tampered, or incorrectly dispensed packages reported within 48 hours of delivery.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#0F2A22] mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#0B4A3A]" /> 5. Contact & Grievance Officer
          </h2>
          <p>
            For any legal or grievance inquiries regarding these terms, please contact our designated Grievance Officer at: <strong className="text-[#0B4A3A]">grievance@pharmico.health</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
