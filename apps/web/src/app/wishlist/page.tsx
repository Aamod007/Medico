"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  Trash2,
  Plus,
  ArrowRight,
  Sparkles,
  HeartOff,
  Loader2,
} from "lucide-react";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useCartStore } from "@/lib/cart-store";
import { api } from "@/lib/api";

export default function WishlistPage() {
  const { wishlistIds, toggle } = useWishlistStore();
  const { addItem } = useCartStore();

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // hydration guard — Zustand persist is async; wait one tick before trusting the store
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // After mount, localStorage is available and Zustand has rehydrated
    setHydrated(true);
  }, []);

  // Derive a stable primitive key from the Set so React's dep comparison works correctly
  // (React uses Object.is which can't detect internal Set mutations)
  const wishlistKey = Array.from(wishlistIds).sort().join(",");

  useEffect(() => {
    // Don't fetch until the store has hydrated from localStorage
    if (!hydrated) return;

    async function loadWishlistProducts() {
      const ids = Array.from(wishlistIds);

      if (ids.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const query = `?ids=${encodeURIComponent(ids.join(","))}`;
        const res = await api.get(`/wishlist${query}`);
        if (res.success && Array.isArray(res.data)) {
          setProducts(res.data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Failed to load wishlist products:", err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadWishlistProducts();
    // wishlistKey is the stable primitive — changes whenever the Set contents change
  }, [hydrated, wishlistKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemove = (productId: string) => {
    toggle(productId);
  };

  const handleAddToCart = (product: any) => {
    const variant = product.defaultVariant || product.variants?.[0];
    if (variant) addItem(variant.id);
  };

  const handleAddAllToCart = () => {
    products.forEach((p) => {
      const variant = p.defaultVariant || p.variants?.[0];
      if (variant) addItem(variant.id);
    });
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 xl:px-12 py-8 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F2A22]">
              Saved Medicines
            </h1>
          </div>
          <p className="text-sm text-[#5B6B65] ml-14">
            {!hydrated || isLoading
              ? "Loading your saved medicines…"
              : products.length > 0
              ? `${products.length} item${products.length > 1 ? "s" : ""} saved for later`
              : "Your saved medicines will appear here"}
          </p>
        </div>

        {products.length > 0 && (
          <button
            onClick={handleAddAllToCart}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#0B4A3A] hover:bg-[#07362a] text-white text-sm font-bold transition shadow-md cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add All to Cart</span>
          </button>
        )}
      </div>

      {/* Loading State */}
      {(!hydrated || isLoading) ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-[#0B4A3A] animate-spin" />
          <p className="text-sm text-[#5B6B65] font-medium">Loading your saved medicines…</p>
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <HeartOff className="w-12 h-12 text-red-300" />
          </div>
          <h2 className="text-xl font-bold text-[#0F2A22] mb-2">
            No saved medicines yet
          </h2>
          <p className="text-sm text-[#5B6B65] max-w-sm leading-relaxed mb-8">
            Tap the{" "}
            <Heart className="inline w-4 h-4 text-red-400 fill-red-400 mx-0.5" />{" "}
            icon on any medicine card to save it here for quick access later.
          </p>
          <Link
            href="/products"
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#0B4A3A] hover:bg-[#07362a] text-white font-bold text-sm transition shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Browse Medicines</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* Product Grid */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((p) => {
              const defVariant = p.defaultVariant || p.variants?.[0];
              const discountPct =
                defVariant?.mrp &&
                defVariant?.price &&
                defVariant.mrp > defVariant.price
                  ? Math.round(
                      ((defVariant.mrp - defVariant.price) / defVariant.mrp) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-[24px] border border-[#D7DEDB] p-4 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group relative"
                >
                  {/* Discount badge + remove */}
                  <div className="flex items-center justify-between mb-2">
                    {discountPct > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                        -{discountPct}% OFF
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E6F4B8] text-[#0B4A3A] text-[10px] font-bold">
                        Saved ❤️
                      </span>
                    )}
                    <button
                      onClick={() => handleRemove(p.id)}
                      title="Remove from saved"
                      className="p-1.5 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Product Image */}
                  <Link
                    href={`/products/${p.slug}`}
                    className="block h-44 my-2 relative"
                  >
                    <img
                      src={
                        p.images?.[0] ||
                        "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300"
                      }
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
                      <h3 className="text-sm font-bold text-[#0F2A22] line-clamp-2 hover:text-[#0B4A3A] transition leading-snug">
                        {p.name}
                      </h3>
                    </Link>
                    <p className="text-[11px] text-[#5B6B65] line-clamp-1">
                      {p.composition ||
                        defVariant?.packSize ||
                        "Pharmacist verified"}
                    </p>
                  </div>

                  {/* Price + Add to Cart */}
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                    <div>
                      <span className="text-base font-black text-[#0F2A22]">
                        ₹{defVariant?.price || "—"}
                      </span>
                      {defVariant?.mrp > defVariant?.price && (
                        <span className="text-xs text-gray-400 line-through ml-1.5">
                          ₹{defVariant.mrp}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#F5C043] hover:bg-[#eab334] text-[#0F2A22] text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continue Shopping */}
          <div className="mt-12 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0B4A3A] hover:underline"
            >
              <span>Continue browsing medicines</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
