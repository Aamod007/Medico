import React from "react";
import Link from "next/link";
import { PackageCheck, Truck, ShieldCheck, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16">
      {/* 3 Value Propositions Banner */}
      <div className="bg-white border-y border-[#D7DEDB] py-8">
        <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F4F6F5]">
            <div className="w-12 h-12 rounded-full bg-[#E6F4B8] flex items-center justify-center text-[#0B4A3A] flex-shrink-0">
              <PackageCheck className="w-6 h-6 text-[#0B4A3A]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0F2A22]">Genuine Sourcing</h4>
              <p className="text-xs text-[#5B6B65] mt-0.5">
                Direct from verified pharma manufacturers with FEFO batch traceability.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F4F6F5]">
            <div className="w-12 h-12 rounded-full bg-[#DCEBFA] flex items-center justify-center text-[#0B4A3A] flex-shrink-0">
              <Truck className="w-6 h-6 text-[#0B4A3A]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0F2A22]">Fast Delivery</h4>
              <p className="text-xs text-[#5B6B65] mt-0.5">
                Doorstep delivery within 24-48 hours. Cold-chain preserved.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F4F6F5]">
            <div className="w-12 h-12 rounded-full bg-[#FDE6D3] flex items-center justify-center text-[#0B4A3A] flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#0B4A3A]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0F2A22]">Secure Payment</h4>
              <p className="text-xs text-[#5B6B65] mt-0.5">
                100% secure payment with Razorpay UPI, Cards, Netbanking & COD.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main 4-Column Dark Green Footer */}
      <div className="bg-[#0B4A3A] text-white pt-16 pb-10">
        <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12 grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#0B4A3A] font-black text-lg">
                ✚
              </div>
              <span className="text-2xl font-black text-white">Pharmico</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Caring for every age with dignity, warmth, and modern pharmaceutical science. Licensed retail online pharmacy.
            </p>
            <div className="flex items-center gap-3 text-xs text-white/80 pt-2">
              <span className="hover:text-[#10B981] cursor-pointer">Facebook</span>
              <span>•</span>
              <span className="hover:text-[#10B981] cursor-pointer">Instagram</span>
              <span>•</span>
              <span className="hover:text-[#10B981] cursor-pointer">Twitter</span>
              <span>•</span>
              <span className="hover:text-[#10B981] cursor-pointer">LinkedIn</span>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h5 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Explore</h5>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li><Link href="/products" className="hover:text-white transition">All Medicines</Link></li>
              <li><Link href="/lab-tests" className="hover:text-white transition">Book Lab Tests</Link></li>
              <li><Link href="/consultations" className="hover:text-white transition">Online Doctor Consult</Link></li>
              <li><Link href="/prescription/upload" className="hover:text-white transition">Upload Prescription</Link></li>
              <li><Link href="/about" className="hover:text-white transition">About Pharmico</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h5 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Support & Help</h5>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li><Link href="/faqs" className="hover:text-white transition">Frequently Asked Questions</Link></li>
              <li><Link href="/shipping-returns" className="hover:text-white transition">Shipping & Returns</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Customer Support</Link></li>
            </ul>
          </div>

          {/* Contact & Pharmacy License */}
          <div>
            <h5 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Contact & License</h5>
            <div className="space-y-2 text-xs text-white/70">
              <p><strong className="text-white">Helpline:</strong> +91 80 4912 3456</p>
              <p><strong className="text-white">Email:</strong> support@pharmico.health</p>
              <p><strong className="text-white">Drug License:</strong> KA-BLR-2024-00129</p>
              <p><strong className="text-white">GSTIN:</strong> 29AAAAA0000A1Z5</p>
              <p className="pt-2 text-[11px] text-white/50">
                Plot 42, Biotech Innovation Zone, Electronic City Phase 1, Bangalore, Karnataka 560100
              </p>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Copyright */}
        <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 xl:px-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Pharmico Healthcare Private Limited. All rights reserved.</p>
          <p className="flex items-center gap-1 text-center">
            Designed by <span className="text-white font-semibold">Aamod</span> <Heart className="w-3.5 h-3.5 text-[#10B981] fill-current" />
          </p>
        </div>
      </div>
    </footer>
  );
}
