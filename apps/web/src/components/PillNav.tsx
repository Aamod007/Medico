"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  LayoutGrid,
  Pill,
  ShieldCheck,
  Activity,
  HeartPulse,
  Heart,
  Smile,
  Baby,
  Tag,
} from "lucide-react";
import { api } from "@/lib/api";

// Icon mapping from category slug to Lucide component
const ICON_MAP: Record<string, any> = {
  "everyday-essentials": Pill,
  "vitamins-and-supplements": Sparkles,
  "diabetes-care": Activity,
  "first-aid": ShieldCheck,
  "first-aid-and-trauma-care": ShieldCheck,
  "digestive-gut-health": HeartPulse,
  "digestive-and-gut-health": HeartPulse,
  "womens-health": Heart,
  "personal-care": Smile,
  "baby-care": Baby,
};

function getIconForCategory(slug: string): any {
  return ICON_MAP[slug] || Tag;
}

interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  isActive: boolean;
  _count?: { products: number };
}

export default function PillNav() {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);

  // Fetch categories from API on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get("/catalog/categories");
        if (res.success && Array.isArray(res.data)) {
          setDbCategories(res.data);
        }
      } catch (e) {
        console.error("Failed to load categories for PillNav:", e);
      }
    }
    loadCategories();
  }, []);

  // Build dynamic categories list for dropdown
  const categories = [
    { name: "All Categories", href: "/products", icon: LayoutGrid, count: "All Medicines" },
    ...dbCategories.map((c) => ({
      name: c.name,
      href: `/products?category=${c.slug}`,
      icon: getIconForCategory(c.slug),
      count: c._count ? `${c._count.products} products` : (c.description || ""),
    })),
  ];

  // Static filter pills
  const staticPills = [
    { label: "Under 1000", href: "/products?maxPrice=1000", badgeType: null },
    { label: "Best Selling", href: "/products?sort=featured", badgeType: "verified" },
    { label: "New Arrivals", href: "/products?sort=newest", badgeType: "sparkle" },
    { label: "New Offer", href: "/products?discount=true", badgeType: "discount" },
  ];

  // Dynamic category pills from database
  const categoryPills = dbCategories.slice(0, 4).map((c) => ({
    label: c.name,
    href: `/products?category=${c.slug}`,
    badgeType: null,
  }));

  const pills = [...staticPills, ...categoryPills];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-[#F4F6F5] py-2 sm:py-3 relative z-30 border-b border-[#E8EDE9]">
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12 flex items-center justify-between gap-3 relative">
        {/* Shop by Categories Dropdown Pill (Outside scroll container so dropdown is never clipped) */}
        <div ref={dropdownRef} className="relative flex-shrink-0 z-40">
          <button
            type="button"
            onClick={() => setCategoryOpen(!categoryOpen)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap border transition-all cursor-pointer shadow-xs ${
              categoryOpen
                ? "bg-[#0B4A3A] text-white border-[#0B4A3A] shadow-md"
                : "bg-[#EEF2F0] hover:bg-white text-[#0F2A22] border-transparent hover:border-[#D7DEDB]"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span><span className="hidden sm:inline">Shop by </span>Categories</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                categoryOpen ? "rotate-180 text-white" : "text-gray-500"
              }`}
            />
          </button>

          {/* Floating Categories Dropdown Menu */}
          {categoryOpen && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-72 sm:w-80 max-w-[calc(100vw-32px)] bg-white rounded-3xl shadow-2xl border border-[#D7DEDB] py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-5 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 flex items-center justify-between">
                <span>Select Category</span>
                <span className="text-[9px] bg-emerald-50 text-[#0B4A3A] px-2 py-0.5 rounded-full font-bold">
                  {dbCategories.length > 0 ? `${dbCategories.length} Specialties` : "All Specialties"}
                </span>
              </div>
              <div className="py-1 max-h-84 overflow-y-auto divide-y divide-gray-50">
                {categories.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <Link
                      key={i}
                      href={c.href}
                      onClick={() => setCategoryOpen(false)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-700 hover:text-[#0B4A3A] hover:bg-[#FAF3EA] transition group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#F4F6F5] group-hover:bg-[#0B4A3A] text-[#0B4A3A] group-hover:text-[#10B981] flex items-center justify-center transition flex-shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-[#0F2A22] group-hover:text-[#0B4A3A]">
                            {c.name}
                          </div>
                          {c.count && (
                            <div className="text-[10px] text-gray-400 group-hover:text-[#0B4A3A]/70">
                              {c.count}
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#0B4A3A] group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Horizontal Category Pills with hidden scrollbar slider */}
        <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-1 flex-1 min-w-0">
          {pills.map((pill, idx) => (
            <Link
              key={idx}
              href={pill.href}
              className="flex items-center gap-2 px-5 py-2 sm:py-2.5 rounded-full bg-[#EEF2F0] hover:bg-white text-[#0F2A22] text-xs sm:text-sm font-semibold whitespace-nowrap border border-transparent hover:border-[#D7DEDB] hover:shadow-sm transition-all flex-shrink-0"
            >
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

              {pill.badgeType === "sparkle" && (
                <Sparkles className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
              )}

              {pill.badgeType === "discount" && (
                <span className="w-4 h-4 rounded-full bg-[#FED7AA] text-[#EA580C] text-[10px] font-black flex items-center justify-center flex-shrink-0">
                  %
                </span>
              )}

              <span>{pill.label}</span>
            </Link>
          ))}
        </div>

        {/* Dark Green Circular Arrow Button */}
        <Link
          href="/products"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0B4A3A] hover:bg-[#07362a] text-white flex items-center justify-center transition shadow-sm flex-shrink-0 ml-1 sm:ml-2"
          title="Browse All Categories & Products"
        >
          <ArrowRight className="w-4 h-4 text-white" />
        </Link>
      </div>
    </div>
  );
}
