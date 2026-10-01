import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, Database, ArrowLeft, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Pharmico Healthcare",
  description: "Pharmico Healthcare Privacy Policy detailing how we collect, protect, and process health information under DPDP Act 2023.",
};

export default function PrivacyPage() {
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
          <ShieldCheck className="w-8 h-8 text-[#A3E635]" />
          <span className="text-xs uppercase tracking-wider font-bold text-[#A3E635] bg-white/10 px-3 py-1 rounded-full">
            Data Protection & Privacy
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="text-white/80 mt-2 text-sm sm:text-base max-w-2xl">
          Compliant with Digital Personal Data Protection (DPDP) Act 2023 &bull; Last Updated: October 2026
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5EBE8] shadow-sm space-y-8 text-[#2D3F39] text-sm sm:text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-[#0F2A22] mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#0B4A3A]" /> 1. Commitment to Health Data Privacy
          </h2>
          <p>
            Pharmico is committed to safeguarding your personal and protected health information (PHI). We adhere strictly to applicable data protection legislations, including the Digital Personal Data Protection Act, 2023 (DPDP Act) and healthcare confidentiality standards.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#0F2A22] mb-3 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#0B4A3A]" /> 2. Data We Collect
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-[#5B6B65]">
            <li>
              <strong>Account & Profile Data:</strong> Name, verified mobile phone number, email address, and delivery addresses.
            </li>
            <li>
              <strong>Health & Prescription Records:</strong> Uploaded digital prescription documents, treating doctor details, medication history, and dosage instructions.
            </li>
            <li>
              <strong>Transaction & Payment Metadata:</strong> Order identifiers and payment status (we do not store raw credit card numbers or UPI PINs; all payments are processed through PCI-DSS compliant gateways like Razorpay).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#0F2A22] mb-3 flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#0B4A3A]" /> 3. How We Use and Protect Your Data
          </h2>
          <p className="mb-3">
            Your medical records and uploaded prescriptions are encrypted at rest using industry-standard AES-256 encryption and accessed solely by authorized licensed pharmacists strictly for verifying orders.
          </p>
          <p className="text-[#5B6B65]">
            We never sell, rent, or trade your personal medical records to third-party advertisers or insurance brokers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#0F2A22] mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#0B4A3A]" /> 4. Your Rights under DPDP Act 2023
          </h2>
          <p className="mb-2">As a data principal, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-1 text-[#5B6B65]">
            <li>Request a full export of your personal and medical records.</li>
            <li>Request correction or rectification of outdated contact information.</li>
            <li>Request account deletion and anonymization of non-statutory records.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#0F2A22] mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0B4A3A]" /> 5. Data Protection Officer (DPO)
          </h2>
          <p>
            If you have questions or wish to exercise your data principal rights, contact our Data Protection Officer at: <strong className="text-[#0B4A3A]">privacy@pharmico.health</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
