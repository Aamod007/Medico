"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Filter,
  Grid,
  List,
  Heart,
  ChevronDown,
  ShoppingBag,
  SlidersHorizontal,
  X,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";

function ProductListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { toggle: toggleWishlist, isWishlisted } = useWishlistStore();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Custom Sort Dropdown State
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions = [
    { label: "Featured First", value: "featured" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
    { label: "New Arrivals", value: "newest" },
  ];

  useEffect(() => {
    const handleSortClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleSortClickOutside);
    return () => document.removeEventListener("mousedown", handleSortClickOutside);
  }, []);

  // Filters
  const currentCategory = searchParams.get("category") || "";
  const currentBrand = searchParams.get("brand") || "";
  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "featured";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";

  // Client-side sort helper — applied after API fetch as a reliable fallback
  const applySortToProducts = (prods: any[], sort: string) => {
    const list = [...prods];
    switch (sort) {
      case "price_asc":
        return list.sort((a, b) => {
          const aPrice = a.defaultVariant?.price ?? a.variants?.[0]?.price ?? 0;
          const bPrice = b.defaultVariant?.price ?? b.variants?.[0]?.price ?? 0;
          return aPrice - bPrice;
        });
      case "price_desc":
        return list.sort((a, b) => {
          const aPrice = a.defaultVariant?.price ?? a.variants?.[0]?.price ?? 0;
          const bPrice = b.defaultVariant?.price ?? b.variants?.[0]?.price ?? 0;
          return bPrice - aPrice;
        });
      case "newest":
        return list.sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      case "featured":
      default:
        return list.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }
  };

  useEffect(() => {
    async function fetchCatalog() {
      setIsLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has("limit")) params.set("limit", "40");

      const [pRes, cRes, bRes] = await Promise.all([
        api.get(`/catalog/products?${params.toString()}`),
        api.get("/catalog/categories"),
        api.get("/catalog/brands"),
      ]);

      if (pRes.success) {
        const sorted = applySortToProducts(pRes.data || [], currentSort);
        setProducts(sorted);
      }
      if (cRes.success) setCategories(cRes.data || []);
      if (bRes.success) setBrands(bRes.data || []);
      setIsLoading(false);
    }

    fetchCatalog();
  }, [searchParams]);

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12 py-8">
      {/* Top Header & Sort Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D7DEDB]">
        <div>
          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black text-[#0F2A22]">
            {currentCategory
              ? categories.find((c) => c.slug === currentCategory)?.name || "Medicines"
              : "All Healthcare & Medicines"}
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6B65] mt-1">
            Showing {products.length} genuine pharmaceuticals & wellness products
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D7DEDB] bg-white text-xs font-bold text-[#0F2A22]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          {/* Custom Sort Dropdown */}
          <div ref={sortDropdownRef} className="relative flex items-center gap-2 text-xs font-medium">
            <span className="text-[#5B6B65] hidden sm:inline">Sort by:</span>
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className={`bg-white border rounded-full px-4 py-2 text-xs font-bold text-[#0F2A22] shadow-sm flex items-center gap-2 cursor-pointer transition ${
                sortDropdownOpen
                  ? "border-[#0B4A3A] ring-2 ring-[#0B4A3A]/20"
                  : "border-[#D7DEDB] hover:border-[#10B981]"
              }`}
            >
              <span>{sortOptions.find((o) => o.value === currentSort)?.label || "Featured First"}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#0B4A3A] transition-transform duration-200 ${
                  sortDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {sortDropdownOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 w-52 bg-white rounded-2xl shadow-2xl border border-[#D7DEDB] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      updateFilter("sort", opt.value);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                      currentSort === opt.value
                        ? "bg-[#FAF3EA] text-[#0B4A3A] font-bold"
                        : "text-gray-700 hover:bg-[#FAF3EA]/50"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {currentSort === opt.value && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="hidden sm:flex items-center bg-white border border-[#D7DEDB] rounded-full p-1 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-full transition ${viewMode === "grid" ? "bg-[#0B4A3A] text-white" : "text-[#5B6B65]"}`}
              aria-label="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-full transition ${viewMode === "list" ? "bg-[#0B4A3A] text-white" : "text-[#5B6B65]"}`}
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 xl:col-span-2 space-y-6">
          {/* Categories Filter */}
          <div className="bg-white p-5 rounded-2xl border border-[#D7DEDB]">
            <h3 className="font-bold text-sm text-[#0F2A22] mb-3">Categories</h3>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-2">
              <button
                onClick={() => updateFilter("category", null)}
                className={`w-full text-left text-xs py-1 px-2 rounded-lg font-medium transition ${!currentCategory ? "bg-[#FAF3EA] text-[#0B4A3A] font-bold" : "text-[#5B6B65] hover:text-black"}`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateFilter("category", c.slug)}
                  className={`w-full text-left text-xs py-1 px-2 rounded-lg font-medium transition ${currentCategory === c.slug ? "bg-[#FAF3EA] text-[#0B4A3A] font-bold" : "text-[#5B6B65] hover:text-black"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Brands Filter */}
          <div className="bg-white p-5 rounded-2xl border border-[#D7DEDB]">
            <h3 className="font-bold text-sm text-[#0F2A22] mb-3">Brands</h3>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-2">
              <button
                onClick={() => updateFilter("brand", null)}
                className={`w-full text-left text-xs py-1 px-2 rounded-lg font-medium transition ${!currentBrand ? "bg-[#FAF3EA] text-[#0B4A3A] font-bold" : "text-[#5B6B65] hover:text-black"}`}
              >
                All Brands
              </button>
              {brands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => updateFilter("brand", b.slug)}
                  className={`w-full text-left text-xs py-1 px-2 rounded-lg font-medium transition ${currentBrand === b.slug ? "bg-[#FAF3EA] text-[#0B4A3A] font-bold" : "text-[#5B6B65] hover:text-black"}`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid / List */}
        <main className="lg:col-span-9 xl:col-span-10">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 h-72 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#D7DEDB] space-y-3">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-base font-bold text-[#0F2A22]">No medicines found</h3>
              <p className="text-xs text-[#5B6B65]">Try adjusting your search criteria or removing active filters</p>
              <button
                onClick={() => router.push("/products")}
                className="mt-3 px-5 py-2 rounded-full bg-[#0B4A3A] text-white text-xs font-bold"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6" : "space-y-4"}>
              {products.map((p) => {
                const defVariant = p.defaultVariant || p.variants?.[0];
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-[22px] border border-[#D7DEDB] p-4 flex flex-col justify-between hover:shadow-lg transition group relative"
                  >
                    <div>
                      {/* Badges */}
                      <div className="flex items-center justify-between mb-2">
                        {p.isBestSeller ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                            Best Seller
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-[#E6F4B8] text-[#0B4A3A] text-[10px] font-bold">
                            Verified
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.preventDefault(); toggleWishlist(p.id); }}
                          title={isWishlisted(p.id) ? "Remove from wishlist" : "Add to wishlist"}
                          className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                            isWishlisted(p.id)
                              ? "text-red-500 bg-red-50 scale-110"
                              : "text-gray-400 hover:text-red-500 hover:bg-gray-50"
                          }`}
                        >
                          <Heart className={`w-4 h-4 transition-all duration-200 ${isWishlisted(p.id) ? "fill-red-500" : ""}`} />
                        </button>
                      </div>

                      {/* Image */}
                      <Link href={`/products/${p.slug}`} className="block h-44 my-2 relative">
                        <img
                          src={p.images?.[0] || "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300"}
                          alt={p.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                        />
                      </Link>

                      {/* Info */}
                      <div className="space-y-1 pt-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#10B981]">
                          {p.brand?.name || "Genuine Brand"}
                        </div>
                        <Link href={`/products/${p.slug}`}>
                          <h3 className="text-sm font-bold text-[#0F2A22] line-clamp-1 hover:text-[#0B4A3A] transition">
                            {p.name}
                          </h3>
                        </Link>
                        <p className="text-[11px] text-[#5B6B65] line-clamp-1">
                          {p.composition || defVariant?.packSize || "Pharmacist verified"}
                        </p>
                      </div>
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                      <div>
                        <span className="text-base font-black text-[#0F2A22]">
                          ₹{defVariant?.price || 145}
                        </span>
                        {defVariant?.mrp > defVariant?.price && (
                          <span className="text-xs text-gray-400 line-through ml-1.5">
                            ₹{defVariant.mrp}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        data-testid="add-to-cart-btn"
                        onClick={() => defVariant && addItem(defVariant.id)}
                        className="px-4 py-1.5 rounded-full bg-[#F5C043] hover:bg-[#eab334] text-[#0F2A22] text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductListingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FBFBF9] py-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#0F2A22] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-600">Loading catalog...</p>
          </div>
        </div>
      }
    >
      <ProductListingContent />
    </Suspense>
  );
}
