"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function PillNav() {
  const pills = [
    {
      label: "Shop by Categories",
      href: "/products",
      badgeType: null,
    },
    {
      label: "Under 1000",
      href: "/products?maxPrice=1000",
      badgeType: null,
    },
    {
      label: "Best Selling",
      href: "/products?sort=featured",
      badgeType: "verified",
    },
    {
      label: "New Arrivals",
      href: "/products?sort=newest",
      badgeType: "sparkle",
    },
    {
      label: "New Offer",
      href: "/products?discount=true",
      badgeType: "discount",
    },
    {
      label: "Personal care",
      href: "/products?category=personal-care",
      badgeType: null,
    },
    {
      label: "Vitamins & Supplements",
      href: "/products?category=vitamins-and-supplements",
      badgeType: null,
    },
  ];

  return (
    <div className="bg-[#F4F6F5] py-2 sm:py-3">
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12 flex items-center justify-between gap-3">
        {/* Horizontal Category Pills with hidden scrollbar slider */}
        <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-1 w-full flex-1">
          {pills.map((pill, idx) => (
            <Link
              key={idx}
              href={pill.href}
              className="flex items-center gap-2 px-5 py-2 sm:py-2.5 rounded-full bg-[#EEF2F0] hover:bg-white text-[#0F2A22] text-xs sm:text-sm font-semibold whitespace-nowrap border border-transparent hover:border-[#D7DEDB] hover:shadow-sm transition-all flex-shrink-0"
            >
              {/* Blue verified checkmark icon for Best Selling */}
              {pill.badgeType === "verified" && (
                <span className="w-4 h-4 rounded-full bg-[#2563EB] flex items-center justify-center text-white flex-shrink-0 shadow-xs">
                  <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}

              {/* Green sparkles icon for New Arrivals */}
              {pill.badgeType === "sparkle" && (
                <Sparkles className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
              )}

              {/* Peach / coral percentage badge icon for New Offer */}
              {pill.badgeType === "discount" && (
                <span className="w-4 h-4 rounded-full bg-[#FED7AA] text-[#EA580C] text-[10px] font-black flex items-center justify-center flex-shrink-0">
                  %
                </span>
              )}

              <span>{pill.label}</span>
            </Link>
          ))}
        </div>

        {/* Dark Green Circular Arrow Button (matching reference image) */}
        <Link
          href="/products"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0B4A3A] hover:bg-[#07362a] text-white flex items-center justify-center transition shadow-sm flex-shrink-0 ml-2"
          title="Browse All Categories & Products"
        >
          <ArrowRight className="w-4 h-4 text-white" />
        </Link>
      </div>
    </div>
  );
}
