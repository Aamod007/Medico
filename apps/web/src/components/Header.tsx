"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Heart,
  ShoppingBasket,
  User,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Navigation,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Pill,
  Sparkles,
  Activity,
  HeartPulse,
  Leaf,
  Smile,
  Baby,
  LayoutGrid,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { api } from "@/lib/api";
import { resolvePincode, detectUserLocation } from "@/lib/location";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";

export default function Header() {
  const router = useRouter();
  const { itemCount, openDrawer, fetchCart } = useCartStore();
  const { wishlistIds, getCount } = useWishlistStore();
  const wishlistCount = wishlistIds.size;

  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [isDeliveryDropdownOpen, setIsDeliveryDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Category dropdown inside search pill
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState("All Categories");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("");
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const deliveryDropdownRef = useRef<HTMLDivElement>(null);

  // Delivery location management
  const [modalPincode, setModalPincode] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const popularCities = [
    { name: "Bangalore", pin: "560103", state: "Karnataka" },
    { name: "Mumbai", pin: "400001", state: "Maharashtra" },
    { name: "Delhi NCR", pin: "110001", state: "Delhi" },
    { name: "Hyderabad", pin: "500001", state: "Telangana" },
    { name: "Chennai", pin: "600001", state: "Tamil Nadu" },
    { name: "Pune", pin: "411001", state: "Maharashtra" },
    { name: "Kolkata", pin: "700001", state: "West Bengal" },
    { name: "Ahmedabad", pin: "380001", state: "Gujarat" },
  ];

  const categories = [
    {
      name: "All Categories",
      slug: "",
      icon: LayoutGrid,
      subtitle: "Browse complete pharmacy catalog",
    },
    {
      name: "Everyday Essentials",
      slug: "everyday-essentials",
      icon: Pill,
      subtitle: "Pain relief, fever, cold & flu",
    },
    {
      name: "Vitamins & Supplements",
      slug: "vitamins-and-supplements",
      icon: Sparkles,
      subtitle: "Multivitamins, omega-3, calcium",
    },
    {
      name: "Diabetes Care",
      slug: "diabetes-care",
      icon: Activity,
      subtitle: "Glucometers, test strips, lancets",
    },
    {
      name: "First Aid & Trauma",
      slug: "first-aid",
      icon: ShieldCheck,
      subtitle: "Bandages, antiseptics, cotton",
    },
    {
      name: "Digestive Health",
      slug: "digestive-gut-health",
      icon: HeartPulse,
      subtitle: "Antacids, probiotics, laxatives",
    },
    {
      name: "Ayurveda & Herbs",
      slug: "ayurveda",
      icon: Leaf,
      subtitle: "Ashwagandha, neem, herbal tonics",
    },
    {
      name: "Personal Care",
      slug: "personal-care",
      icon: Smile,
      subtitle: "Skin wellness, derma gels, washes",
    },
    {
      name: "Mother & Baby",
      slug: "baby-care",
      icon: Baby,
      subtitle: "Pediatric drops, rash cream, diapers",
    },
  ];

  // Initialize location from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPin = localStorage.getItem("medico_pincode");
      const savedCity = localStorage.getItem("medico_city");
      if (savedPin) {
        setPincode(savedPin);
        setModalPincode(savedPin);
      }
      if (savedCity) setCity(savedCity);
    }
  }, []);

  const handleSelectCity = (c: { name: string; pin: string }) => {
    setCity(c.name);
    setPincode(c.pin);
    setModalPincode(c.pin);
    setPincodeError("");
    if (typeof window !== "undefined") {
      localStorage.setItem("medico_pincode", c.pin);
      localStorage.setItem("medico_city", c.name);
      window.dispatchEvent(
        new CustomEvent("medico-location-changed", { detail: { pincode: c.pin, city: c.name } })
      );
    }
    setIsDeliveryDropdownOpen(false);
  };

  const handleApplyPincode = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const info = resolvePincode(modalPincode);
    if (info.valid && info.city) {
      setPincodeError("");
      setCity(info.city);
      setPincode(modalPincode);
      if (typeof window !== "undefined") {
        localStorage.setItem("medico_pincode", modalPincode);
        localStorage.setItem("medico_city", info.city);
        window.dispatchEvent(
          new CustomEvent("medico-location-changed", { detail: { pincode: modalPincode, city: info.city } })
        );
      }
      setIsDeliveryDropdownOpen(false);
    } else {
      setPincodeError(info.error || "Please enter a valid 6-digit Indian PIN code");
    }
  };

  const [detectStatus, setDetectStatus] = useState<"idle" | "requesting" | "detecting" | "done">("idle");

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setDetectStatus("requesting");
    setPincodeError("");
    try {
      // Short delay so the "Requesting…" label is visible to the user
      await new Promise((r) => setTimeout(r, 300));
      setDetectStatus("detecting");

      const res = await detectUserLocation();

      if (res.city && res.pincode) {
        setCity(res.city);
        setPincode(res.pincode);
        setModalPincode(res.pincode);
        if (typeof window !== "undefined") {
          localStorage.setItem("medico_pincode", res.pincode);
          localStorage.setItem("medico_city", res.city);
          window.dispatchEvent(
            new CustomEvent("medico-location-changed", { detail: { pincode: res.pincode, city: res.city } })
          );
        }
        setDetectStatus("done");
        setTimeout(() => setIsDeliveryDropdownOpen(false), 400);
      } else {
        setPincodeError(
          res.error ||
            "Could not detect your location. Please enter your PIN code or select a city below."
        );
      }
    } catch {
      setPincodeError("Detection failed. Please enter your PIN code manually.");
    } finally {
      setIsDetectingLocation(false);
      setTimeout(() => setDetectStatus("idle"), 2000);
    }
  };

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (deliveryDropdownRef.current && !deliveryDropdownRef.current.contains(e.target as Node)) {
        setIsDeliveryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length >= 2) {
      const res = await api.get(`/catalog/search/autocomplete?q=${encodeURIComponent(query)}`);
      if (res.success && res.data) {
        setSuggestions(res.data.products || []);
        setShowSuggestions(true);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }
    if (selectedCategorySlug) {
      params.set("category", selectedCategorySlug);
    }
    const queryString = params.toString();
    router.push(`/products${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F4F6F5]">
      {/* Dark Green Brand Navbar Container with Rounded Bottom */}
      <div className="bg-[#0B4A3A] text-white rounded-b-[24px] lg:rounded-b-[28px] shadow-sm pb-4 pt-1 px-4 sm:px-8 xl:px-12">
        {/* Top Centered Free Delivery Announcement */}
        <div className="text-center text-[12px] sm:text-xs py-1.5 text-white/90 font-medium tracking-wide">
          Get Free Delivery over <span className="font-bold text-white">₹500</span>
        </div>

        {/* Main Content Bar */}
        <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto flex items-center justify-between gap-3 sm:gap-6 pt-1">
          {/* Left: Brand Logo & Normal Location Dropdown */}
          <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white group-hover:opacity-95 transition">
                Pharmico
              </span>
            </Link>

            {/* Normal Deliver Dropdown Button */}
            <div ref={deliveryDropdownRef} className="relative">
              <button
                type="button"
                data-testid="location-dropdown-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeliveryDropdownOpen((prev) => !prev);
                  setIsCategoryDropdownOpen(false);
                }}
                className={`flex items-center gap-2.5 text-left group transition flex-shrink-0 cursor-pointer p-1.5 rounded-2xl ${
                  isDeliveryDropdownOpen ? "bg-white/10" : "hover:bg-white/5"
                }`}
                title="Select delivery location"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/25 flex items-center justify-center text-white group-hover:border-white transition flex-shrink-0">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[11px] text-white/75 leading-tight font-normal">Deliver to</span>
                  <span className={`text-xs sm:text-sm font-bold flex items-center gap-1 leading-tight whitespace-nowrap ${
                    city ? "text-white" : "text-white/60"
                  }`}>
                    <span>{city ? `${city} (${pincode})` : "Select Location"}</span>
                    {isDeliveryDropdownOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-white flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-white/80 flex-shrink-0" />
                    )}
                  </span>
                </div>
              </button>

              {/* Normal Location Dropdown Menu */}
              {isDeliveryDropdownOpen && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute top-[calc(100%+10px)] left-0 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-[#D7DEDB] z-50 p-4 text-[#0F2A22] animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#0B4A3A]" />
                      <span className="text-xs font-bold text-[#0F2A22]">Delivery Location</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDeliveryDropdownOpen(false)}
                      className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pincode Search / Input */}
                  <form onSubmit={handleApplyPincode} className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        maxLength={6}
                        value={modalPincode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setModalPincode(val);
                          setPincodeError("");
                        }}
                        placeholder="Enter 6-digit Pincode"
                        className="flex-1 bg-[#F4F6F5] border border-[#D7DEDB] focus:border-[#0B4A3A] rounded-xl px-3 py-2 text-xs font-bold text-[#0F2A22] focus:outline-none tracking-wider"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-xl bg-[#0B4A3A] hover:bg-[#07362a] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {pincodeError && <p className="text-[10px] font-semibold text-red-600 mt-1 pl-1">{pincodeError}</p>}
                  </form>

                  {/* Detect Location Button */}
                  <button
                    type="button"
                    data-testid="detect-location-btn"
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className={`w-full mb-2 py-2 px-3 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-70 ${
                      detectStatus === "done"
                        ? "border-[#10B981] bg-[#10B981]/10 text-[#0B4A3A]"
                        : "border-[#10B981] bg-[#10B981]/5 hover:bg-[#10B981]/10 text-[#0B4A3A]"
                    }`}
                  >
                    <Navigation
                      className={`w-3.5 h-3.5 text-[#10B981] flex-shrink-0 ${
                        isDetectingLocation ? "animate-pulse" : ""
                      }`}
                    />
                    <span>
                      {detectStatus === "requesting"
                        ? "Allow location access…"
                        : detectStatus === "detecting"
                        ? "Detecting your location…"
                        : detectStatus === "done"
                        ? "✓ Location detected!"
                        : "Detect My Location"}
                    </span>
                  </button>

                  <div className="border-t border-gray-100 my-1" />

                  {/* City List Header */}
                  <div className="text-[10px] font-bold text-[#5B6B65] uppercase tracking-wider py-1.5 px-1">
                    Select City / Metro Hub
                  </div>

                  {/* Clean List of Cities */}
                  <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                    {popularCities.map((c) => {
                      const isSelected = pincode === c.pin;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          data-city-option={c.name}
                          onClick={() => handleSelectCity(c)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? "bg-[#FAF3EA] text-[#0B4A3A] font-bold border border-[#0B4A3A]/20"
                              : "text-gray-700 hover:bg-[#F4F6F5]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <MapPin className={`w-3.5 h-3.5 ${isSelected ? "text-[#0B4A3A]" : "text-gray-400"}`} />
                            <div>
                              <span className="font-semibold">{c.name}</span>
                              <span className="text-[11px] text-[#5B6B65] ml-1.5 font-normal">({c.pin})</span>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Search Bar Pill with Active Complimentary Categories Dropdown */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-2xl xl:max-w-3xl 2xl:max-w-4xl relative mx-2 lg:mx-4">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center w-full bg-white rounded-full px-4 py-2 sm:py-2.5 shadow-sm text-sm border border-transparent focus-within:ring-2 focus-within:ring-[#10B981] transition"
            >
              {/* Active Complimentary Category Dropdown */}
              <div ref={categoryDropdownRef} className="relative">
                <button
                  type="button"
                  data-testid="header-category-trigger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCategoryDropdownOpen((prev) => !prev);
                    setIsDeliveryDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#0B4A3A] whitespace-nowrap focus:outline-none cursor-pointer py-1 px-2 rounded-xl transition ${
                    isCategoryDropdownOpen ? "bg-[#FAF3EA] text-[#0B4A3A]" : ""
                  }`}
                >
                  <span>{selectedCategoryName}</span>
                  {isCategoryDropdownOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#0B4A3A] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Complimentary Categories Dropdown Menu Card */}
                {isCategoryDropdownOpen && (
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute top-[calc(100%+14px)] left-0 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-[#D7DEDB] py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-[#0F2A22]"
                  >
                    <div className="px-5 py-2 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#5B6B65]">
                        Medicine Specialties
                      </span>
                      <span className="text-[10px] font-bold text-[#0B4A3A] bg-[#FAF3EA] px-2.5 py-0.5 rounded-full border border-[#D7DEDB]/60">
                        8 Specialties
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 py-1">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategoryName === cat.name;
                        return (
                          <button
                            key={cat.slug}
                            type="button"
                            onClick={() => {
                              setSelectedCategoryName(cat.name);
                              setSelectedCategorySlug(cat.slug);
                              setIsCategoryDropdownOpen(false);
                              if (cat.slug) {
                                router.push(`/products?category=${cat.slug}`);
                              } else {
                                router.push("/products");
                              }
                            }}
                            className={`w-full text-left px-5 py-2.5 transition flex items-center justify-between group cursor-pointer ${
                              isSelected
                                ? "bg-[#FAF3EA] text-[#0B4A3A] font-bold"
                                : "hover:bg-[#FAF3EA]/60 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition flex-shrink-0 ${
                                  isSelected
                                    ? "bg-[#0B4A3A] text-[#10B981]"
                                    : "bg-[#F4F6F5] text-[#0B4A3A] group-hover:bg-[#0B4A3A] group-hover:text-[#10B981]"
                                }`}
                              >
                                {Icon && <Icon className="w-4 h-4" />}
                              </div>
                              <div>
                                <div className="text-xs font-bold leading-tight group-hover:text-[#0B4A3A] transition">
                                  {cat.name}
                                </div>
                                <div className="text-[10px] text-[#5B6B65] leading-tight mt-0.5">
                                  {cat.subtitle}
                                </div>
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Vertical Divider */}
              <div className="h-5 w-px bg-gray-200 mx-2 sm:mx-3 flex-shrink-0" />

              {/* Text Input */}
              <input
                type="text"
                placeholder="Search for medicines, health products..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                className="flex-1 bg-transparent text-sm text-[#0F2A22] placeholder-gray-400 focus:outline-none min-w-0"
              />

              {/* Magnifying Glass Search Icon */}
              <button
                type="submit"
                className="p-1 text-gray-500 hover:text-[#0B4A3A] transition flex-shrink-0 cursor-pointer"
                title="Search medicines"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </button>
            </form>

            {/* Autocomplete Dropdown with Verified Packaging Images */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="p-2.5 text-xs font-bold text-[#5B6B65] border-b border-gray-100 bg-[#FAF3EA]/40">
                  Matching Medicines in Catalog
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {suggestions.map((item) => (
                    <Link
                      key={item.id}
                      href={`/products/${item.slug}`}
                      onClick={() => setShowSuggestions(false)}
                      className="flex items-center justify-between p-3 hover:bg-[#FAF3EA] transition"
                    >
                      <div className="flex items-center gap-3">
                        {item.images?.[0] && (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-10 h-10 object-contain rounded-lg border bg-white flex-shrink-0"
                          />
                        )}
                        <div>
                          <div className="text-sm font-bold text-[#0F2A22]">
                            {item.name}
                          </div>
                          {item.composition && (
                            <div className="text-xs text-[#5B6B65]">
                              {item.composition}
                            </div>
                          )}
                        </div>
                      </div>
                      {item.variants?.[0] && (
                        <div className="text-right flex-shrink-0 pl-3">
                          <span className="text-sm font-extrabold text-[#0B4A3A]">
                            ₹{item.variants[0].price}
                          </span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: 3 Round Outlined Icon Buttons (User Profile, Heart Wishlist, Shopping Basket) */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            {/* 1. User Profile Icon Button */}
            <div className="relative flex items-center justify-center">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/25 flex items-center justify-center text-white hover:bg-white/10 hover:border-white transition cursor-pointer"
                    title="Sign In / Account"
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/25 flex items-center justify-center overflow-hidden hover:border-white transition">
                  <UserButton />
                </div>
              </Show>
            </div>

            {/* 2. Wishlist / Heart Icon Button */}
            <Link
              href="/wishlist"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/25 flex items-center justify-center text-white hover:bg-white/10 hover:border-white transition cursor-pointer relative"
              title="Saved Medicines"
            >
              <Heart
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${
                  wishlistCount > 0 ? "text-red-400 fill-red-400" : "text-white"
                }`}
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0B4A3A] shadow-sm">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* 3. Shopping Basket Icon Button */}
            <button
              type="button"
              onClick={openDrawer}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/25 flex items-center justify-center text-white hover:bg-white/10 hover:border-white transition relative cursor-pointer"
              title="Shopping Basket"
            >
              <ShoppingBasket className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#F5C043] text-[#0B4A3A] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0B4A3A] shadow-sm">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/90 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar inside header if small screen */}
        <div className="mt-3 md:hidden">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center w-full bg-white rounded-full px-4 py-2 shadow-sm text-sm"
          >
            <input
              type="text"
              placeholder="Search for medicines, health products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="flex-1 bg-transparent text-sm text-[#0F2A22] placeholder-gray-400 focus:outline-none"
            />
            <button type="submit" className="p-1 text-gray-500">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#D7DEDB] px-4 py-4 space-y-3">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF3EA] text-xs font-bold text-[#0B4A3A]">
            <MapPin className="w-4 h-4 text-[#0B4A3A]" />
            <span>Delivering to {city} ({pincode})</span>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsDeliveryDropdownOpen(true);
              }}
              className="ml-auto underline text-[11px]"
            >
              Change
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-1">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-[#F4F6F5] text-[#0F2A22] font-semibold"
            >
              Order Medicines
            </Link>
            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-[#F4F6F5] text-[#0F2A22] font-semibold"
            >
              My Orders
            </Link>
            <Link
              href="/products?category=vitamins-and-supplements"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-[#F4F6F5] text-[#0F2A22]"
            >
              Vitamins & Supplements
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-[#0B4A3A] text-white text-center font-bold"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
