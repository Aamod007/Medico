"use client";

import React, { useEffect } from "react";
import { SignInButton } from "@clerk/nextjs";
import { X, ShoppingCart, Heart, ShieldCheck, Sparkles, Truck } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: "cart" | "wishlist";
}

export default function AuthModal({ isOpen, onClose, reason = "cart" }: AuthModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const isCart = reason === "cart";

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative bg-white w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-250">
        {/* Top Accent Strip */}
        <div className="h-1 bg-gradient-to-r from-[#10B981] via-[#0B4A3A] to-[#F5C043]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-black transition cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#FAF3EA] border border-[#FDE6D3] flex items-center justify-center mx-auto mb-5">
            {isCart ? (
              <ShoppingCart className="w-8 h-8 text-[#0B4A3A]" />
            ) : (
              <Heart className="w-8 h-8 text-red-500 fill-red-100" />
            )}
          </div>

          {/* Headline */}
          <h2 className="text-xl sm:text-2xl font-black text-[#0F2A22] text-center leading-tight">
            {isCart ? "Sign in to Add to Cart" : "Sign in to Save Medicines"}
          </h2>
          <p className="text-sm text-[#5B6B65] text-center mt-2 leading-relaxed">
            {isCart
              ? "Create a free account to add medicines to your cart and get doorstep delivery."
              : "Create a free account to save medicines to your wishlist and access them anytime."}
          </p>

          {/* Benefits */}
          <div className="mt-5 space-y-2.5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F4F6F5]">
              <ShieldCheck className="w-4 h-4 text-[#10B981] flex-shrink-0" />
              <span className="text-xs font-semibold text-[#0F2A22]">100% genuine medicines, FEFO verified</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F4F6F5]">
              <Truck className="w-4 h-4 text-[#F5C043] flex-shrink-0" />
              <span className="text-xs font-semibold text-[#0F2A22]">Free delivery on orders above ₹500</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F4F6F5]">
              <Sparkles className="w-4 h-4 text-[#0B4A3A] flex-shrink-0" />
              <span className="text-xs font-semibold text-[#0F2A22]">Track orders & health essentials</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-6 space-y-3">
            <SignInButton mode="modal" forceRedirectUrl={typeof window !== "undefined" ? window.location.pathname : "/"}>
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-full bg-[#0B4A3A] hover:bg-[#07362a] text-white font-bold text-sm transition shadow-lg cursor-pointer"
              >
                Sign In to Continue
              </button>
            </SignInButton>

            <SignInButton mode="modal" forceRedirectUrl={typeof window !== "undefined" ? window.location.pathname : "/"}>
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-full border-2 border-[#0B4A3A] text-[#0B4A3A] hover:bg-[#FAF3EA] font-bold text-sm transition cursor-pointer"
              >
                Create Free Account
              </button>
            </SignInButton>

            <button
              onClick={onClose}
              className="w-full text-center text-xs text-[#5B6B65] hover:text-[#0F2A22] py-1 transition"
            >
              Continue browsing as guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
