"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";

export default function PrescriptionUploadPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to catalog since prescription upload is not required
    const timer = setTimeout(() => {
      router.replace("/products");
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-[#E6F4B8] text-[#0B4A3A] flex items-center justify-center mx-auto shadow-sm">
        <ShoppingBag className="w-8 h-8" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-[#0F2A22]">
        Direct Ordering Enabled
      </h1>
      <p className="text-sm text-[#5B6B65] max-w-md mx-auto leading-relaxed">
        Prescription upload is not required. You can add any medicines, healthcare essentials, and wellness products directly to your cart and checkout with home delivery.
      </p>
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0B4A3A] hover:bg-[#07362a] text-white text-xs font-bold transition shadow-md"
        >
          Explore All Medicines <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
