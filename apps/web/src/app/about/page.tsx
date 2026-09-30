import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Award,
  Truck,
  HeartHandshake,
  Users,
  CheckCircle2,
  Building2,
  Sparkles,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto w-full px-4 sm:px-8 xl:px-12 py-10">
        {/* Hero Section */}
        <div className="bg-[#0B4A3A] rounded-3xl p-8 sm:p-14 text-white text-center mb-12 shadow-lg relative overflow-hidden">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-500/20 text-[#10B981] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" /> India&apos;s Trusted Healthcare Partner
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 max-w-3xl mx-auto leading-tight">
            Pioneering Safe, Authentic & Rapid Digital Pharmacy
          </h1>
          <p className="text-gray-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Pharmico was founded with a singular mission: to make genuine prescription medications,
            vital health diagnostics, and top-tier doctor consultations accessible to every Indian
            household at fair prices.
          </p>
        </div>

        {/* Core Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <div className="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-sm">
            <div className="text-3xl sm:text-4xl font-black text-[#0B4A3A] mb-1">100%</div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Genuine Medicines
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-sm">
            <div className="text-3xl sm:text-4xl font-black text-[#10B981] mb-1">5M+</div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Orders Delivered
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-sm">
            <div className="text-3xl sm:text-4xl font-black text-[#F5C043] mb-1">1,200+</div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Pin Codes Served
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-sm">
            <div className="text-3xl sm:text-4xl font-black text-[#0B4A3A] mb-1">4.9 / 5</div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Customer Rating
            </p>
          </div>
        </div>

        {/* Value Pillars */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B4A3A]">
              Why Millions Trust Pharmico
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Engineered with strict clinical protocols and temperature-controlled logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-[#10B981] mb-6">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Direct Manufacturer Sourcing</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                We source directly from licensed pharmaceutical leaders like Sun Pharma, Cipla,
                Dr. Reddy&apos;s, and Abbott. Zero counterfeit risk, guaranteed authentic batch
                numbers.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-[#F5C043] mb-6">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">FEFO & Cold Chain Logistics</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Insulin, biologics, and sensitive vaccines travel in strict 2°C - 8°C cold packs.
                Our automated First-Expiry First-Out system prevents short-dated stock dispensing.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="w-14 h-14 bg-[#FAF3EA] rounded-2xl flex items-center justify-center text-[#0B4A3A] mb-6">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Licensed Pharmacist Verification</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Every prescription order is audited by a registered Pharm.D professional to ensure
                correct dosing, contraindication checks, and patient safety.
              </p>
            </div>
          </div>
        </div>

        {/* Quality Certifications */}
        <div className="bg-[#FAF3EA] rounded-3xl p-8 sm:p-10 border border-amber-200 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-[#0B4A3A] mb-2">
              Government Licensed & Regulated Pharmacy
            </h3>
            <p className="text-xs text-gray-600 max-w-xl">
              Licensed under Form 20B & 21B of the Drugs and Cosmetics Rules, 1945. Compliant with
              CDSCO, Pharmacy Act 1948, and Good Pharmacy Practice (GPP) standards.
            </p>
          </div>
          <Link
            href="/products"
            className="px-6 py-3 bg-[#0B4A3A] hover:bg-[#07362a] text-white font-bold rounded-full text-sm transition shadow-md whitespace-nowrap"
          >
            Explore Catalog
          </Link>
        </div>
    </div>
  );
}
