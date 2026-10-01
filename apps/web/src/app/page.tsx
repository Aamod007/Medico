"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Heart,
  Plus,
  CheckCircle2,
  ChevronUp,
  ShieldCheck,
  Truck,
  Clock,
  Sparkles,
  Stethoscope,
  FlaskConical,
  MessageSquare,
} from "lucide-react";
import { api } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useAuthGuard } from "@/lib/use-auth-guard";

export default function HomePage() {
  const router = useRouter();
  const { addItem: _addItem } = useCartStore();
  const { toggle: _toggleWishlist, isWishlisted } = useWishlistStore();
  const { guardCart, guardWishlist } = useAuthGuard();
  const addItem = guardCart(_addItem);
  const toggleWishlist = guardWishlist(_toggleWishlist);

  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [activeFaq, setActiveFaq] = useState<number>(0);

  // Quick bar state & custom dropdowns
  const [quickCategory, setQuickCategory] = useState("");
  const [quickBrand, setQuickBrand] = useState("");
  const [quickSku, setQuickSku] = useState("");
  const [heroCategoryOpen, setHeroCategoryOpen] = useState(false);
  const [heroBrandOpen, setHeroBrandOpen] = useState(false);
  const heroCatRef = useRef<HTMLDivElement>(null);
  const heroBrandRef = useRef<HTMLDivElement>(null);

  // Spotlight product state & custom dropdown
  const [spotlightVariant, setSpotlightVariant] = useState("100 tablets (Value Pack - ₹195)");
  const [spotlightDropdownOpen, setSpotlightDropdownOpen] = useState(false);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleHeroClickOutside = (e: MouseEvent) => {
      if (heroCatRef.current && !heroCatRef.current.contains(e.target as Node)) {
        setHeroCategoryOpen(false);
      }
      if (heroBrandRef.current && !heroBrandRef.current.contains(e.target as Node)) {
        setHeroBrandOpen(false);
      }
      if (spotlightRef.current && !spotlightRef.current.contains(e.target as Node)) {
        setSpotlightDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleHeroClickOutside);
    return () => document.removeEventListener("mousedown", handleHeroClickOutside);
  }, []);

  useEffect(() => {
    async function loadData() {
      const [catRes, prodRes, brandRes] = await Promise.all([
        api.get("/catalog/categories"),
        api.get("/catalog/products?limit=24"),
        api.get("/catalog/brands"),
      ]);

      if (catRes.success) setCategories(catRes.data || []);
      if (brandRes.success) setBrands(brandRes.data || []);
      if (prodRes.success && prodRes.data) {
        setFeaturedProducts(prodRes.data.slice(0, 12));
        setBestSellers(prodRes.data.slice(6, 18));
      }
    }
    loadData();
  }, []);

  const handleQuickShop = () => {
    const params = new URLSearchParams();
    if (quickCategory) params.set("category", quickCategory);
    if (quickBrand) params.set("brand", quickBrand);
    if (quickSku) params.set("search", quickSku);
    router.push(`/products?${params.toString()}`);
  };

  const faqs = [
    {
      q: "How long does Pharmico deliver medicines?",
      a: "Standard orders are delivered within 24–48 hours across most serviceable pincodes. Temperature-sensitive and cold-chain medicines (stored at 2°C–8°C) are dispatched with insulated packaging and may take slightly longer to ensure integrity. Same-day express delivery is available in select metro cities — check availability by entering your pincode at checkout.",
    },
    {
      q: "What happens if a medicine I need is out of stock?",
      a: "Tap 'Notify Me' on the product page and we'll send you an instant SMS and email alert the moment new stock arrives from our verified distributors. Our inventory is synced daily with licensed pharmaceutical manufacturers including Cipla, Sun Pharma, Abbott, and Dr. Reddy's — so restocks are frequent.",
    },
    {
      q: "Do I need to upload a prescription to buy medicines?",
      a: "No prescription upload is required! You can browse and order all healthcare products, wellness essentials, daily medicines, and personal care items directly with instant home delivery.",
    },
    {
      q: "Can I consult a doctor directly through Pharmico?",
      a: "Yes — Pharmico partners with verified MBBS doctors and specialists across Dermatology, Pediatrics, General Medicine, and more. Book an instant video or audio consultation starting at ₹450. Your digital prescription is generated directly in your Pharmico account and can be used to order medicines immediately — no separate paper needed.",
    },
    {
      q: "How do I know the medicines on Pharmico are genuine?",
      a: "Every product on Pharmico is sourced directly from licensed Indian pharmaceutical manufacturers and authorised distributors. We verify batch numbers, check expiry dates using strict FEFO (First Expiry First Out) protocols, and store temperature-sensitive medicines at 2°C–8°C. Our Drug License (KA-BLR-2024-00129) is publicly listed and all orders are reviewed by our in-house licensed pharmacists before dispatch.",
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      {/* 1. HERO SECTION (Dark Green with Trust Badge, Generous Portrait & Quick Bar) */}
      <section className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 xl:px-10 pt-2 sm:pt-3">
        <div className="relative bg-[#0B4A3A] rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 lg:p-10 xl:p-10 2xl:p-12 text-white shadow-2xl">
          {/* Subtle background glow contained cleanly */}
          <div className="absolute inset-0 rounded-[32px] sm:rounded-[40px] overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] rounded-full bg-[#10B981]/15 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#F5C043]/10 blur-3xl" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-center relative z-10">
            <div className="lg:col-span-7 xl:col-span-7 space-y-4 sm:space-y-5">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 shadow-sm">
                <div className="flex -space-x-2">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80"
                    alt="User"
                    className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80"
                    alt="User"
                    className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=60&auto=format&fit=crop&q=80"
                    alt="User"
                    className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <div className="flex text-[#F5C043] tracking-wider text-xs">
                    {"★".repeat(5)}
                  </div>
                  <span className="font-semibold text-white/95">Trusted by 50,000+ families</span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-black tracking-tight leading-[1.08]">
                Healthcare <br />
                Delivered to Your <br />
                <span className="text-[#10B981]">Doorstep</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-white/85 max-w-xl leading-relaxed">
                Order genuine medicines, consult licensed doctors online, and get doorstep delivery within 24–48 hours with guaranteed cold-chain integrity.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/products"
                  className="px-7 py-3 rounded-full bg-[#10B981] hover:bg-[#0ea372] text-white font-bold text-sm shadow-lg hover:shadow-xl transition flex items-center gap-2"
                >
                  <span>Order Medicines</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>


              {/* Trust Features Bar */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/15 max-w-xl">
                <div className="flex items-center gap-2 text-white/90 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                  <span>100% Genuine</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-xs font-semibold">
                  <Truck className="w-3.5 h-3.5 text-[#F5C043] flex-shrink-0" />
                  <span>Cold-Chain 2-8°C</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                  <span>24-48h Delivery</span>
                </div>
              </div>
            </div>

            {/* Doctor / Caregiver Portrait Visual - Properly sized for viewport */}
            <div className="hidden sm:flex lg:col-span-5 xl:col-span-5 justify-center lg:justify-end relative">
              <div className="relative w-full max-w-[320px] sm:max-w-[360px] xl:max-w-[400px] 2xl:max-w-[440px] h-[300px] sm:h-[340px] lg:h-[360px] xl:h-[380px] rounded-[28px] overflow-hidden border-4 border-white/15 shadow-2xl group">
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80"
                  alt="Doctor & Pharmacist"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B4A3A]/90 via-transparent to-transparent pointer-events-none" />

                {/* Floating Top Badge */}
                <div className="absolute top-4 right-4 bg-[#0B4A3A]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Licensed Pharmacists</span>
                </div>

                {/* Floating Bottom Card */}
                <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md p-4 rounded-2xl text-[#0F2A22] shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#0F2A22]">Cold-Chain Preserved</div>
                      <div className="text-[11px] text-[#5B6B65]">Strict 2°C - 8°C protocols</div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-[#0B4A3A] font-black text-xs rounded-full">
                      FEFO Ready
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating "Select a Product" Quick Bar */}
          <div className="mt-5 xl:mt-6 bg-white rounded-2xl md:rounded-full p-2.5 sm:p-3 shadow-2xl border border-white/50 flex flex-col md:flex-row items-center gap-2.5 text-[#0F2A22]">
            <span className="hidden md:inline-block font-bold text-xs sm:text-sm text-[#0B4A3A] pl-4 pr-2 whitespace-nowrap">
              Select a product
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full flex-1">
              {/* Custom Category Dropdown */}
              <div ref={heroCatRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setHeroCategoryOpen(!heroCategoryOpen);
                    setHeroBrandOpen(false);
                  }}
                  className={`w-full flex items-center justify-between bg-[#F4F6F5] rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold border transition text-left cursor-pointer ${
                    heroCategoryOpen
                      ? "border-[#0B4A3A] bg-white ring-2 ring-[#0B4A3A]/20"
                      : "border-[#D7DEDB] text-[#0F2A22] hover:border-[#10B981]"
                  }`}
                >
                  <span className="truncate">
                    {quickCategory
                      ? categories.find((c) => c.slug === quickCategory)?.name || "All Categories"
                      : "All Categories"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#0B4A3A] transition-transform duration-200 flex-shrink-0 ${
                      heroCategoryOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Floating Category Menu */}
                {heroCategoryOpen && (
                  <div className="absolute top-[calc(100%+8px)] left-0 right-0 sm:w-72 bg-white rounded-2xl shadow-2xl border border-[#D7DEDB] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-64 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCategory("");
                        setHeroCategoryOpen(false);
                        router.push("/products");
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                        !quickCategory ? "bg-[#FAF3EA] text-[#0B4A3A] font-bold" : "text-gray-700 hover:bg-[#FAF3EA]/50"
                      }`}
                    >
                      <span>All Categories</span>
                      {!quickCategory && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setQuickCategory(c.slug);
                          setHeroCategoryOpen(false);
                          router.push(`/products?category=${c.slug}`);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                          quickCategory === c.slug
                            ? "bg-[#FAF3EA] text-[#0B4A3A] font-bold"
                            : "text-gray-700 hover:bg-[#FAF3EA]/50"
                        }`}
                      >
                        <span>{c.name}</span>
                        {quickCategory === c.slug && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Brand Dropdown */}
              <div ref={heroBrandRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setHeroBrandOpen(!heroBrandOpen);
                    setHeroCategoryOpen(false);
                  }}
                  className={`w-full flex items-center justify-between bg-[#F4F6F5] rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold border transition text-left cursor-pointer ${
                    heroBrandOpen
                      ? "border-[#0B4A3A] bg-white ring-2 ring-[#0B4A3A]/20"
                      : "border-[#D7DEDB] text-[#0F2A22] hover:border-[#10B981]"
                  }`}
                >
                  <span className="truncate">
                    {quickBrand
                      ? brands.find((b) => b.slug === quickBrand)?.name || "All Brands"
                      : "All Brands"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#0B4A3A] transition-transform duration-200 flex-shrink-0 ${
                      heroBrandOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Floating Brand Menu */}
                {heroBrandOpen && (
                  <div className="absolute top-[calc(100%+8px)] left-0 right-0 sm:w-72 bg-white rounded-2xl shadow-2xl border border-[#D7DEDB] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-64 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickBrand("");
                        setHeroBrandOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                        !quickBrand ? "bg-[#FAF3EA] text-[#0B4A3A] font-bold" : "text-gray-700 hover:bg-[#FAF3EA]/50"
                      }`}
                    >
                      <span>All Brands</span>
                      {!quickBrand && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
                    </button>
                    {brands.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setQuickBrand(b.slug);
                          setHeroBrandOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                          quickBrand === b.slug
                            ? "bg-[#FAF3EA] text-[#0B4A3A] font-bold"
                            : "text-gray-700 hover:bg-[#FAF3EA]/50"
                        }`}
                      >
                        <span>{b.name}</span>
                        {quickBrand === b.slug && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Enter SKU / Name */}
              <input
                type="text"
                placeholder="or Enter Medicine / SKU"
                value={quickSku}
                onChange={(e) => setQuickSku(e.target.value)}
                className="w-full bg-[#F4F6F5] rounded-full px-4 py-2.5 text-xs sm:text-sm border border-[#D7DEDB] text-[#0F2A22] focus:outline-none focus:border-[#0B4A3A] placeholder-[#5B6B65]"
              />
            </div>

            <button
              onClick={handleQuickShop}
              className="w-full md:w-auto px-8 py-3 rounded-full bg-[#0B4A3A] hover:bg-[#07362a] text-white font-bold text-xs sm:text-sm whitespace-nowrap transition shadow-md cursor-pointer"
            >
              Shop Now
            </button>
          </div>
        </div>
      </section>

      {/* 2. CIRCULAR CATEGORY GRID - Generously spaced on large screens */}
      <section className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F2A22]">Shop by Category</h2>
            <p className="text-xs sm:text-sm text-[#5B6B65] mt-0.5">Explore authentic medications by healthcare specialization</p>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-bold text-[#0B4A3A] hover:underline flex items-center gap-1.5"
          >
            <span>Shop All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 xl:gap-6 2xl:gap-8">
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center text-center space-y-2.5 p-3 rounded-3xl hover:bg-white hover:shadow-lg transition-all duration-300"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 xl:w-32 xl:h-32 rounded-full bg-[#FAF3EA] border-2 border-[#FDE6D3] p-3 flex items-center justify-center overflow-hidden group-hover:scale-105 group-hover:border-[#0B4A3A] shadow-sm transition-all duration-300">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Sparkles className="w-8 h-8 text-[#0B4A3A]" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#0F2A22] leading-snug group-hover:text-[#0B4A3A]">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
      {/* 3. FEATURED THIS MONTH CAROUSEL */}
      <section className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F2A22]">Featured This Month</h2>
            <p className="text-xs sm:text-sm text-[#5B6B65] mt-0.5">Specially curated seasonal essentials and wellness boosters</p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#0B4A3A] text-white whitespace-nowrap">
              Allergy Relief (14)
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#D7DEDB] text-[#5B6B65] hover:border-[#0B4A3A] transition whitespace-nowrap">
              Sun Protection (9)
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#D7DEDB] text-[#5B6B65] hover:border-[#0B4A3A] transition whitespace-nowrap">
              Hydration (11)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6">
          {featuredProducts.slice(0, 12).map((p) => {
            const defVariant = p.defaultVariant || p.variants?.[0];
            return (
              <div
                key={p.id}
                className="bg-white rounded-[18px] sm:rounded-[26px] border border-[#D7DEDB] p-3 sm:p-5 flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative group"
              >
                {/* Badges & Wishlist */}
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  {p.isBestSeller ? (
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[9px] sm:text-[10px] font-bold">
                      -25%
                    </span>
                  ) : (
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-[#E6F4B8] text-[#0B4A3A] text-[9px] sm:text-[10px] font-bold">
                      New!
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); toggleWishlist(p.id); }}
                    title={isWishlisted(p.id) ? "Remove from wishlist" : "Add to wishlist"}
                    className={`p-1 sm:p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                      isWishlisted(p.id)
                        ? "text-red-500 bg-red-50 scale-110"
                        : "text-gray-400 hover:text-red-500 hover:bg-gray-50"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-200 ${isWishlisted(p.id) ? "fill-red-500" : ""}`} />
                  </button>
                </div>

                {/* Product Image */}
                <Link href={`/products/${p.slug}`} className="block h-32 sm:h-48 my-1 sm:my-2 relative">
                  <img
                    src={p.images?.[0] || "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400"}
                    alt={p.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                  />
                </Link>

                {/* Content */}
                <div className="space-y-1 sm:space-y-1.5 pt-1 sm:pt-2">
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#F5C043]">
                    {"★".repeat(5)}
                    <span className="text-gray-400 ml-1">({p.reviewCount || 1234})</span>
                  </div>

                  <Link href={`/products/${p.slug}`} className="block">
                    <h3 className="text-xs sm:text-sm font-bold text-[#0F2A22] line-clamp-2 hover:text-[#0B4A3A] transition leading-tight">
                      {p.name}
                    </h3>
                  </Link>

                  <p className="text-[10px] sm:text-[11px] text-[#5B6B65] line-clamp-1">
                    {p.composition || "Pharmacist recommended formulation"}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 sm:pt-3 border-t border-gray-100 mt-2">
                    <div>
                      <span className="text-sm sm:text-base font-black text-[#0F2A22]">
                        ₹{defVariant?.price || 145}
                      </span>
                      {defVariant?.mrp && (
                        <span className="text-[10px] sm:text-xs text-gray-400 line-through ml-1.5">
                          ₹{defVariant.mrp}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => defVariant && addItem(defVariant.id)}
                      className="w-full sm:w-auto px-3 sm:px-4 py-1.5 rounded-full bg-[#F5C043] hover:bg-[#eab334] text-[#0F2A22] text-[11px] sm:text-xs font-bold transition shadow-sm text-center"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. THREE PASTEL PROMO TILES */}
      <section className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-8">
          {/* Lime Card */}
          <div className="bg-[#E6F4B8] rounded-[28px] p-8 xl:p-10 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition">
            <div>
              <span className="text-xs font-bold text-[#0B4A3A] uppercase tracking-wider">
                Pharmacist Consultations
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#0B4A3A] mt-2 leading-snug">
                Get Personalized Advice on your Medications
              </h3>
              <p className="text-xs sm:text-sm text-[#0B4A3A]/80 mt-2 leading-relaxed">
                Review interactions, dosage, and generic substitutes with our licensed team.
              </p>
            </div>
            <div>
              <Link
                href="/consultations"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0B4A3A] text-white text-xs sm:text-sm font-bold hover:bg-[#07362a] transition shadow-sm"
              >
                <span>Schedule a Call</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Peach Card */}
          <div className="bg-[#FDE6D3] rounded-[28px] p-8 xl:p-10 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition">
            <div>
              <span className="text-xs font-bold text-[#8A4A1C] uppercase tracking-wider">
                Walk-ins / Home Pickup
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#8A4A1C] mt-2 leading-snug">
                Stay Protected All Year — Book Lab Tests
              </h3>
              <p className="text-xs sm:text-sm text-[#8A4A1C]/80 mt-2 leading-relaxed">
                Complete blood work, diabetes profiles & lipid panels with doorstep phlebotomist.
              </p>
            </div>
            <div>
              <Link
                href="/lab-tests"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#8A4A1C] text-white text-xs sm:text-sm font-bold hover:bg-[#6e3914] transition shadow-sm"
              >
                <span>Book Appointment</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Light Blue Card */}
          <div className="bg-[#DCEBFA] rounded-[28px] p-8 xl:p-10 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition">
            <div>
              <span className="text-xs font-bold text-[#1C4D8A] uppercase tracking-wider">
                Available 7 Days a Week
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#1C4D8A] mt-2 leading-snug">
                Talk to a Verified Healthcare Provider
              </h3>
              <p className="text-xs sm:text-sm text-[#1C4D8A]/80 mt-2 leading-relaxed">
                Consult top specialists in Dermatology, Pediatrics, and General Medicine starting ₹450.
              </p>
            </div>
            <div>
              <Link
                href="/consultations"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1C4D8A] text-white text-xs sm:text-sm font-bold hover:bg-[#143967] transition shadow-sm"
              >
                <span>Book Appointment</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRUST MARQUEE */}
      <div className="bg-[#0B4A3A] py-3.5 overflow-hidden text-white font-semibold text-xs tracking-wider uppercase border-y border-white/10">
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap">
          <span>✦ HSA/FSA Eligible</span>
          <span>✦ Free Shipping over ₹500</span>
          <span>✦ Doctor Formulated</span>
          <span>✦ Fast 48hrs Shipping</span>
          <span>✦ 24/7 Customer Support</span>
          <span>✦ 100% Genuine Direct Sourcing</span>
          <span>✦ HSA/FSA Eligible</span>
          <span>✦ Free Shipping over ₹500</span>
          <span>✦ Doctor Formulated</span>
          <span>✦ Fast 48hrs Shipping</span>
          <span>✦ 24/7 Customer Support</span>
        </div>
      </div>

      {/* 6. TRUSTED BRANDS ROW */}
      <section className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12 text-center">
        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#5B6B65] mb-6">
          Trusted Pharmaceutical Partners
        </h4>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8">
          {brands.slice(0, 8).map((b) => (
            <Link
              key={b.id}
              href={`/products?brand=${b.slug}`}
              className="px-6 py-3 rounded-full bg-white border border-[#D7DEDB] text-xs sm:text-sm font-bold text-[#0F2A22] hover:border-[#0B4A3A] hover:bg-[#FAF3EA] transition shadow-sm"
            >
              {b.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 7. FEATURED PRODUCT SPOTLIGHT */}
      <section className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12">
        <div className="bg-white rounded-[28px] sm:rounded-[40px] border border-[#D7DEDB] p-5 sm:p-10 xl:p-16 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 xl:gap-16 items-center shadow-lg">
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[420px] sm:max-w-[480px] h-64 sm:h-[420px] xl:h-[460px] rounded-3xl bg-[#FAF3EA] p-6 sm:p-8 flex items-center justify-center border border-[#FDE6D3]">
              <img
                src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80"
                alt="Spotlight Medicine"
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
              Spotlight Best Seller
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F2A22] leading-tight">
              Extra Strength Pain Relief Tablets
            </h2>

            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="flex text-[#F5C043]">
                {"★".repeat(5)}
              </div>
              <span className="font-bold text-[#0F2A22]">4.8</span>
              <span className="text-[#5B6B65]">(1,234 verified reviews)</span>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-[#5B6B65]">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                <span>Fast-acting relief for headaches, backaches, and acute joint aches</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                <span>Contains 500mg acetaminophen per tablet for effective pain and fever control</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                <span>Easy-to-swallow micro-coated enteric formulation with gentle stomach tolerability</span>
              </li>
            </ul>

            {/* Custom Pack Size Selector Dropdown */}
            <div ref={spotlightRef} className="space-y-2 max-w-md relative">
              <label className="text-xs font-bold text-[#0F2A22]">Select Pack Size:</label>
              <button
                type="button"
                onClick={() => setSpotlightDropdownOpen(!spotlightDropdownOpen)}
                className={`w-full bg-[#F4F6F5] border rounded-full px-5 py-3 text-xs sm:text-sm font-semibold flex items-center justify-between transition cursor-pointer ${
                  spotlightDropdownOpen
                    ? "border-[#0B4A3A] bg-white ring-2 ring-[#0B4A3A]/20"
                    : "border-[#D7DEDB] hover:border-[#10B981]"
                }`}
              >
                <span>{spotlightVariant}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#0B4A3A] transition-transform duration-200 ${
                    spotlightDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {spotlightDropdownOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-[#D7DEDB] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {[
                    { label: "50 tablets (Standard Pack - ₹120)", val: "50 tablets" },
                    { label: "100 tablets (Value Pack - ₹195)", val: "100 tablets" },
                    { label: "200 tablets (Economy Bottle - ₹350)", val: "200 tablets" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setSpotlightVariant(opt.label);
                        setSpotlightDropdownOpen(false);
                      }}
                      className={`w-full text-left px-5 py-2.5 text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                        spotlightVariant.includes(opt.val)
                          ? "bg-[#FAF3EA] text-[#0B4A3A] font-bold"
                          : "text-gray-700 hover:bg-[#FAF3EA]/50"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {spotlightVariant.includes(opt.val) && (
                        <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-5">
              <button
                onClick={() => {
                  if (featuredProducts[0]?.defaultVariant) {
                    addItem(featuredProducts[0].defaultVariant.id);
                  }
                }}
                className="w-full sm:w-auto px-9 py-4 rounded-full bg-[#F5C043] hover:bg-[#eab334] text-[#0F2A22] font-black text-sm shadow-md transition"
              >
                Add to Cart — ₹195.00
              </button>
              <span className="text-xs font-bold text-[#10B981] flex items-center gap-1">
                ✓ Free express delivery over ₹500
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. HOW PHARMICO WORKS (3 Clear Steps) */}
      <section className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12 text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-[#0F2A22]">How Pharmico Works</h2>
        <p className="text-xs sm:text-sm text-[#5B6B65] mt-1 max-w-lg mx-auto">
          Order genuine medicines online in three straightforward steps — no confusion, no guesswork.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-8 mt-10">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl border border-[#D7DEDB] p-6 sm:p-8 text-left space-y-5 shadow-sm hover:shadow-md transition">
            <div className="h-52 sm:h-56 xl:h-64 rounded-2xl overflow-hidden bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80"
                alt="Browse and add medicines to cart"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-full bg-[#0B4A3A] text-white text-xs font-bold inline-flex items-center justify-center flex-shrink-0">
                  1
                </span>
                <h3 className="text-lg font-bold text-[#0F2A22]">Browse & Add to Cart</h3>
              </div>
              <p className="text-xs sm:text-sm text-[#5B6B65] leading-relaxed">
                Search by medicine name, brand, or health condition. Add all your required medicines, vitamins, and healthcare essentials straight to your cart with instant transparent pricing.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl border border-[#D7DEDB] p-6 sm:p-8 text-left space-y-5 shadow-sm hover:shadow-md transition">
            <div className="h-52 sm:h-56 xl:h-64 rounded-2xl overflow-hidden bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80"
                alt="Quality inspection and packing"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-full bg-[#0B4A3A] text-white text-xs font-bold inline-flex items-center justify-center flex-shrink-0">
                  2
                </span>
                <h3 className="text-lg font-bold text-[#0F2A22]">Genuine Quality Check</h3>
              </div>
              <p className="text-xs sm:text-sm text-[#5B6B65] leading-relaxed">
                Every order is carefully inspected, packed, and sealed following strict FEFO (First Expiry First Out) protocols to ensure 100% genuine and safe pharmaceuticals.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl border border-[#D7DEDB] p-6 sm:p-8 text-left space-y-5 shadow-sm hover:shadow-md transition">
            <div className="h-52 sm:h-56 xl:h-64 rounded-2xl overflow-hidden bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80"
                alt="Delivered to your door"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-full bg-[#0B4A3A] text-white text-xs font-bold inline-flex items-center justify-center flex-shrink-0">
                  3
                </span>
                <h3 className="text-lg font-bold text-[#0F2A22]">Delivered to Your Door</h3>
              </div>
              <p className="text-xs sm:text-sm text-[#5B6B65] leading-relaxed">
                Your order is packed tamper-proof and — where needed — in insulated cold-pack boxes maintaining 2°C–8°C. Delivered within 24–48 hours with real-time SMS tracking at every stage. Free delivery on orders above ₹500.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION (Dark Green Active item matching screenshot) */}
      <section className="max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-[#0F2A22]">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-[#5B6B65] mt-1">
            Everything you need to know about ordering on Pharmico — delivery, payments, products, and more.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                onClick={() => setActiveFaq(isOpen ? -1 : idx)}
                className={`rounded-2xl sm:rounded-3xl transition-all duration-200 cursor-pointer overflow-hidden border ${
                  isOpen
                    ? "bg-[#0B4A3A] text-white border-[#0B4A3A] shadow-md"
                    : "bg-white text-[#0F2A22] border-[#D7DEDB] hover:border-[#0B4A3A]/40"
                }`}
              >
                <div className="p-5 sm:p-6 flex items-center justify-between font-bold text-sm sm:text-base">
                  <span>{idx + 1}. {faq.q}</span>
                  <span className="text-xl font-bold">
                    {isOpen ? "−" : "+"}
                  </span>
                </div>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-white/85 leading-relaxed border-t border-white/10 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. TESTIMONIALS (Trusted by 50,000+ families) */}
      <section className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12 text-center">
        <div className="flex items-center justify-center gap-1 text-[#F5C043] mb-2 text-sm">
          {"★".repeat(5)}
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-[#0F2A22]">Trusted by 50,000+ families</h2>
        <p className="text-xs sm:text-sm text-[#5B6B65] mt-1">Read authentic experiences from patients and caregivers across India</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-8 mt-10 text-left">
          <div className="bg-white rounded-3xl p-8 xl:p-10 border border-[#D7DEDB] shadow-sm space-y-4 hover:shadow-md transition">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E6F4B8] text-[#0B4A3A] text-xs font-bold">
              ★ 4.9
            </div>
            <p className="text-xs sm:text-sm text-[#0F2A22] leading-relaxed">
              &quot;Delivered faster than expected, and the packaging keeps everything organized. Simple as it should be for monthly senior medications.&quot;
            </p>
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
                alt="David L."
                className="w-11 h-11 rounded-full object-cover"
              />
              <div>
                <div className="text-sm font-bold text-[#0F2A22]">David L.</div>
                <div className="text-xs text-[#5B6B65]">Bangalore</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 xl:p-10 border border-[#D7DEDB] shadow-sm space-y-4 hover:shadow-md transition">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E6F4B8] text-[#0B4A3A] text-xs font-bold">
              ★ 4.8
            </div>
            <p className="text-xs sm:text-sm text-[#0F2A22] leading-relaxed">
              &quot;The pharmacist called to explain my father&apos;s new hypertension medication and verified all potential drug interactions. That personal touch matters.&quot;
            </p>
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"
                alt="Michael R."
                className="w-11 h-11 rounded-full object-cover"
              />
              <div>
                <div className="text-sm font-bold text-[#0F2A22]">Michael R.</div>
                <div className="text-xs text-[#5B6B65]">Mumbai</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 xl:p-10 border border-[#D7DEDB] shadow-sm space-y-4 hover:shadow-md transition">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E6F4B8] text-[#0B4A3A] text-xs font-bold">
              ★ 5.0
            </div>
            <p className="text-xs sm:text-sm text-[#0F2A22] leading-relaxed">
              &quot;Refills are now automatic. One less thing to remember with everything else going on. Customer support responded within 2 minutes when I needed an invoice.&quot;
            </p>
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100"
                alt="Sarah M."
                className="w-11 h-11 rounded-full object-cover"
              />
              <div>
                <div className="text-sm font-bold text-[#0F2A22]">Sarah M.</div>
                <div className="text-xs text-[#5B6B65]">Hyderabad</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
