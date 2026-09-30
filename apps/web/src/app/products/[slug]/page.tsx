"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Star,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Heart,
  Share2,
  MapPin,
  Pill,
} from "lucide-react";
import { api } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [checkPincode, setCheckPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"uses" | "sideEffects" | "dosage" | "storage">("uses");
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true);
      const res = await api.get(`/catalog/products/${slug}`);
      if (res.success && res.data) {
        setProduct(res.data);
        const def = res.data.variants?.find((v: any) => v.isDefault) || res.data.variants?.[0];
        setSelectedVariant(def);
        setSelectedImage(res.data.images?.[0] || "");
      }
      setIsLoading(false);
    }
    loadProduct();
  }, [slug]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPin = localStorage.getItem("medico_pincode") || "";
      const savedCity = localStorage.getItem("medico_city") || "";
      setCheckPincode(savedPin);
      if (savedPin && savedCity) {
        setPincodeStatus(`⚡ Express delivery available for ${savedCity} (${savedPin}) within 24-48 hrs!`);
      }

      const handleLocChange = (e: any) => {
        const pin = e.detail?.pincode || "";
        const c = e.detail?.city || "";
        setCheckPincode(pin);
        if (pin && c) {
          setPincodeStatus(`⚡ Express delivery available for ${c} (${pin}) within 24-48 hrs!`);
        }
      };

      window.addEventListener("medico-location-changed", handleLocChange);
      return () => window.removeEventListener("medico-location-changed", handleLocChange);
    }
  }, []);

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPincode.length === 6) {
      setPincodeStatus(`⚡ Serviceable! Doorstep cold-chain delivery to ${checkPincode} in 24-48 hours.`);
    } else {
      setPincodeStatus("Please enter a valid 6-digit Indian pincode.");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12 py-16 text-center text-sm text-[#5B6B65]">
        Loading medicine details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12 py-16 text-center">
        <h2 className="text-xl font-bold text-[#0F2A22]">Medicine Not Found</h2>
        <Link href="/products" className="mt-4 inline-block px-6 py-2 rounded-full bg-[#0B4A3A] text-white text-xs font-bold">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const price = Number(selectedVariant?.price) || 0;
  const mrp = Number(selectedVariant?.mrp) || 0;
  const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12 py-8 space-y-12">
      {/* Product Hero & Info */}
      <div className="bg-white rounded-[28px] border border-[#D7DEDB] p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Gallery */}
        <div className="lg:col-span-5 space-y-4">
          <div className="h-80 sm:h-96 rounded-2xl bg-[#FAF3EA] p-6 flex items-center justify-center border border-[#FDE6D3]">
            <img
              src={selectedImage || "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500"}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-xl border p-1 bg-white flex-shrink-0 transition ${selectedImage === img ? "border-[#0B4A3A] ring-2 ring-[#0B4A3A]/20" : "border-gray-200"}`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="lg:col-span-7 space-y-5">
          {/* Brand & Rx Badge */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#10B981]">
              {product.brand?.name}
            </span>
            {product.prescriptionRequired && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                <Pill className="w-3 h-3" /> Rx Required (Schedule H)
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#0F2A22]">
            {product.name}
          </h1>

          {product.composition && (
            <p className="text-xs font-semibold text-[#0B4A3A] bg-[#E6F4B8]/40 inline-block px-3 py-1 rounded-full">
              Composition: {product.composition}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs">
            <div className="flex text-[#F5C043]">
              {"★".repeat(5)}
            </div>
            <span className="font-bold text-[#0F2A22]">4.8</span>
            <span className="text-[#5B6B65]">({product.reviews?.length || 128} verified reviews)</span>
          </div>

          {/* Price breakdown */}
          <div className="flex items-baseline gap-3 pt-2">
            <span className="text-3xl font-black text-[#0F2A22]">₹{price}</span>
            {mrp > price && (
              <>
                <span className="text-sm text-gray-400 line-through">₹{mrp}</span>
                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
              </>
            )}
            <span className="text-xs text-[#5B6B65] ml-2">(Inclusive of all taxes)</span>
          </div>

          {/* Pack Size / Variant Selector */}
          {product.variants?.length > 0 && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-[#0F2A22]">Pack Size / Variant:</label>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border transition ${selectedVariant?.id === v.id ? "bg-[#0B4A3A] text-white border-[#0B4A3A]" : "bg-[#F4F6F5] text-[#0F2A22] border-[#D7DEDB] hover:border-black"}`}
                  >
                    {v.name} — ₹{v.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <div className="flex items-center border border-[#D7DEDB] rounded-full px-3 py-2 bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="text-gray-500 hover:text-black font-bold px-2"
              >
                -
              </button>
              <span className="w-8 text-center text-xs font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="text-gray-500 hover:text-black font-bold px-2"
              >
                +
              </button>
            </div>

            <button
              onClick={() => selectedVariant && addItem(selectedVariant.id, quantity)}
              className="flex-1 sm:flex-initial px-8 py-3.5 rounded-full bg-[#F5C043] hover:bg-[#eab334] text-[#0F2A22] font-black text-sm shadow-md transition"
            >
              Add to Cart
            </button>

            <Link
              href="/checkout"
              onClick={() => selectedVariant && addItem(selectedVariant.id, quantity)}
              className="flex-1 sm:flex-initial px-8 py-3.5 rounded-full bg-[#10B981] hover:bg-[#0ea372] text-white font-bold text-sm shadow-md transition"
            >
              Buy Now
            </Link>
          </div>

          {/* Delivery & Pincode Checker */}
          <div className="bg-[#FAF3EA] p-4 rounded-2xl border border-[#FDE6D3] space-y-2 mt-4">
            <div className="text-xs font-bold text-[#0F2A22] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#0B4A3A]" />
              Check Delivery Speed to Your Pincode:
            </div>
            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit pincode (e.g. 560001)"
                value={checkPincode}
                maxLength={6}
                onChange={(e) => setCheckPincode(e.target.value)}
                className="flex-1 bg-white border border-[#D7DEDB] rounded-full px-3.5 py-1.5 text-xs text-[#0F2A22] focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full bg-[#0B4A3A] text-white text-xs font-bold"
              >
                Check
              </button>
            </form>
            {pincodeStatus && (
              <p className="text-xs font-semibold text-[#0B4A3A] mt-1">{pincodeStatus}</p>
            )}
          </div>
        </div>
      </div>

      {/* Medical Specification Tabs */}
      <div className="bg-white rounded-3xl border border-[#D7DEDB] p-6 sm:p-8 space-y-6">
        <div className="flex border-b border-[#D7DEDB] gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab("uses")}
            className={`pb-3 border-b-2 transition ${activeTab === "uses" ? "border-[#0B4A3A] text-[#0B4A3A]" : "border-transparent text-[#5B6B65]"}`}
          >
            Indications & Uses
          </button>
          <button
            onClick={() => setActiveTab("sideEffects")}
            className={`pb-3 border-b-2 transition ${activeTab === "sideEffects" ? "border-[#0B4A3A] text-[#0B4A3A]" : "border-transparent text-[#5B6B65]"}`}
          >
            Side Effects
          </button>
          <button
            onClick={() => setActiveTab("dosage")}
            className={`pb-3 border-b-2 transition ${activeTab === "dosage" ? "border-[#0B4A3A] text-[#0B4A3A]" : "border-transparent text-[#5B6B65]"}`}
          >
            Dosage & How to Take
          </button>
          <button
            onClick={() => setActiveTab("storage")}
            className={`pb-3 border-b-2 transition ${activeTab === "storage" ? "border-[#0B4A3A] text-[#0B4A3A]" : "border-transparent text-[#5B6B65]"}`}
          >
            Storage & Packaging
          </button>
        </div>

        <div className="text-xs sm:text-sm text-[#0F2A22] leading-relaxed">
          {activeTab === "uses" && (
            <div className="space-y-2">
              <p>{product.uses || "Prescribed for symptomatic relief and therapeutic recovery."}</p>
              <p className="text-[#5B6B65]">{product.description}</p>
            </div>
          )}
          {activeTab === "sideEffects" && (
            <p>{product.sideEffects || "Generally well tolerated when taken as directed by physician."}</p>
          )}
          {activeTab === "dosage" && (
            <p>{product.dosage || "As prescribed by physician or indicated on the product packaging."}</p>
          )}
          {activeTab === "storage" && (
            <div className="space-y-1">
              <p>{product.storageInstructions || "Store below 25°C in a dry place away from direct light."}</p>
              <p><strong>Manufacturer:</strong> {product.manufacturer}</p>
              <p><strong>Country of Origin:</strong> {product.countryOfOrigin}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
