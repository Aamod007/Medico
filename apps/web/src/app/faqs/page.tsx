"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, HelpCircle, ArrowRight } from "lucide-react";

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQS_DATA: FAQ[] = [
  {
    id: "q1",
    category: "Ordering & Medicines",
    question: "Do I need to upload a prescription to buy medicines?",
    answer:
      "No prescription upload is required! You can browse and order all healthcare products, wellness essentials, daily medicines, and personal care items directly with doorstep delivery.",
  },
  {
    id: "q2",
    category: "Ordering & Medicines",
    question: "Are all medicines on Pharmico genuine and authentic?",
    answer:
      "Yes. Every product is sourced directly from licensed Indian pharmaceutical manufacturers (Cipla, Sun Pharma, Abbott, Dr. Reddy's) and stored in temperature-controlled facilities following strict FEFO quality protocols.",
  },
  {
    id: "q3",
    category: "Delivery & Tracking",
    question: "How fast will my medicine order be delivered?",
    answer:
      "Orders within metro areas (Mumbai, Delhi-NCR, Bengaluru, Chennai, Hyderabad, Pune, Kolkata) are typically delivered within 24 to 48 hours. Express same-day delivery is available for select urgent pin codes when placed before 1:00 PM.",
  },
  {
    id: "q4",
    category: "Delivery & Tracking",
    question: "How do you ensure cold-chain medicine safety during transit?",
    answer:
      "All temperature-sensitive medicines (such as insulin vials, eye drops, and biologic vaccines) are packed inside specialized multi-layer insulated coolers with pharmaceutical-grade phase change ice packs maintaining 2°C to 8°C throughout transit.",
  },
  {
    id: "q5",
    category: "Payments & Refunds",
    question: "What payment methods are supported?",
    answer:
      "We accept all major Indian payment methods powered by Razorpay: UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, Mastercard, RuPay), Netbanking across 50+ banks, and Cash on Delivery (COD) for eligible orders.",
  },
  {
    id: "q6",
    category: "Payments & Refunds",
    question: "Can I return medicines after delivery?",
    answer:
      "Unopened medicines in their original tamper-evident packaging can be returned within 7 days of delivery if the item is damaged, defective, or incorrect. Due to safety regulations, temperature-controlled products and opened bottles cannot be returned.",
  },
  {
    id: "q7",
    category: "Diagnostics & Doctors",
    question: "How does doorstep lab sample collection work?",
    answer:
      "A certified, vaccinated phlebotomist visits your registered address at your scheduled time slot with pre-sterilized vacuum tubes. Blood/urine samples are immediately placed in a portable refrigerated carrier and transferred to our NABL-accredited diagnostic partner.",
  },
  {
    id: "q8",
    category: "Diagnostics & Doctors",
    question: "Are telehealth consultations with doctors secure and confidential?",
    answer:
      "Yes. All video and audio consultations take place over end-to-end encrypted rooms adhering to the Telemedicine Practice Guidelines issued by the Medical Council of India (MCI) and MoHFW.",
  },
];

export default function FaqsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ q1: true });

  const categories = ["ALL", "Ordering & Medicines", "Delivery & Tracking", "Payments & Refunds", "Diagnostics & Doctors"];

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = FAQS_DATA.filter((faq) => {
    const matchesCat = selectedCategory === "ALL" || faq.category === selectedCategory;
    const matchesQuery =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto w-full px-4 sm:px-8 xl:px-12 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-[#0B4A3A] rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-[#10B981]" /> Help & FAQs
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0B4A3A] mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Find answers to commonly asked questions about prescriptions, ordering, shipping, and
            services.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search FAQs by question or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] bg-white shadow-sm text-sm"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none justify-start sm:justify-center">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === c
                  ? "bg-[#0B4A3A] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {c === "ALL" ? "All Questions" : c}
            </button>
          ))}
        </div>

        {/* Accordions */}
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = !!openIds[faq.id];
            return (
              <div
                key={faq.id}
                className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm transition"
              >
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className={`w-full px-6 py-4 flex items-center justify-between text-left transition ${
                    isOpen ? "bg-[#0B4A3A] text-white" : "hover:bg-gray-50 text-gray-900"
                  }`}
                >
                  <span className="font-bold text-sm sm:text-base pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#F5C043]" : "text-gray-400"
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 py-4 bg-[#FAF3EA]/40 text-xs sm:text-sm text-gray-700 leading-relaxed border-t border-gray-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
          <h3 className="font-bold text-[#0B4A3A] text-lg mb-1">Still have questions?</h3>
          <p className="text-gray-500 text-xs mb-4">
            Our clinical support team is here to assist you 24/7.
          </p>
          <Link
            href="/contact"
            className="px-6 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-full text-xs transition inline-flex items-center gap-1.5"
          >
            Contact Customer Support <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
