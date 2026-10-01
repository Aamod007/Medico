"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2,
  Package,
  Layers,
  Store,
  ShieldAlert,
  Bell,
  User,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Orders Manager", href: "/admin/orders", icon: Package },
    { name: "FEFO Inventory", href: "/admin/inventory", icon: Layers },
  ];

  return (
    <div className="min-h-screen flex bg-[#F4F6F5] text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0B4A3A] text-white flex flex-col justify-between flex-shrink-0 hidden md:flex">
        <div>
          {/* Brand */}
          <div className="p-6 border-b border-emerald-900/50 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center font-black text-[#0B4A3A] text-sm">
                +
              </span>
              <span className="text-xl font-extrabold tracking-tight">
                Pharmico <span className="text-[#F5C043] text-xs font-semibold uppercase">Admin</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#10B981] text-white shadow-sm"
                      : "text-emerald-100 hover:bg-emerald-900/40 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Storefront Link */}
        <div className="p-4 border-t border-emerald-900/50">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-semibold text-emerald-200 hover:bg-emerald-900/40 transition"
          >
            <Store className="w-4 h-4" />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <Link href="/admin" className="font-extrabold text-[#0B4A3A]">
                Pharmico Admin
              </Link>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 bg-emerald-50 text-[#0B4A3A] rounded-full text-xs font-bold border border-emerald-100">
              Pharmacist Operations Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-gray-500 hover:text-[#0B4A3A] transition md:hidden"
            >
              Storefront
            </Link>
            <div className="w-8 h-8 rounded-full bg-[#FAF3EA] flex items-center justify-center text-[#0B4A3A] font-bold text-xs">
              AD
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
