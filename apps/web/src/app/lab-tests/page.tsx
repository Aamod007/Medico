"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TestTube2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Home,
  Calendar,
  Sparkles,
  ShieldCheck,
  X,
  Search,
} from "lucide-react";

interface LabTest {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  mrp: number;
  sampleType: string;
  fastingRequired: boolean;
  reportTimeHours: number;
  testParameters: string[];
}

export default function LabTestsPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Booking Modal
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("28");
  const [patientGender, setPatientGender] = useState("MALE");
  const [sampleDate, setSampleDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("07:00 AM - 08:00 AM");
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLabTests() {
      try {
        const res = await fetch("/api/labs");
        const data = await res.json();
        if (data.success && data.data) {
          setTests(data.data.tests || []);
          setCategories(data.data.categories || []);
        }
      } catch (err) {
        console.error("Failed to load lab tests:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLabTests();
  }, []);

  const filteredTests = tests.filter((t) => {
    const matchesCategory =
      selectedCategory === "ALL" || t.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;
    setIsSubmitting(true);
    setBookingError(null);

    try {
      const res = await fetch("/api/labs/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labTestId: selectedTest.id,
          patientName: patientName || "Self",
          patientAge: Number(patientAge),
          patientGender,
          sampleCollectionDate: sampleDate || new Date().toISOString(),
          timeSlot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to schedule sample collection");
      }

      setBookingSuccess(data.data);
    } catch (err: any) {
      setBookingError(err.message || "Booking failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto w-full px-4 sm:px-8 xl:px-12 py-8">
        {/* Banner Section */}
        <div className="bg-[#0B4A3A] rounded-3xl p-8 sm:p-12 text-white mb-10 relative overflow-hidden shadow-lg">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-500/20 text-[#10B981] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" /> NABL & ICMR Certified Labs
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Diagnostic Health Tests at Home
            </h1>
            <p className="text-gray-200 text-sm sm:text-base mb-6 leading-relaxed">
              Certified phlebotomists collect samples from your doorstep with 100% sterile vacuum
              tubes. Smart digital reports delivered on your phone within 24 hours.
            </p>
            <div className="flex flex-wrap gap-4 text-xs sm:text-sm font-semibold text-emerald-200">
              <span className="flex items-center gap-1.5">
                <Home className="w-4 h-4 text-[#F5C043]" /> Free Doorstep Collection
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#F5C043]" /> 100% Accurate Results
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#F5C043]" /> Reports in 12-24 Hours
              </span>
            </div>
          </div>
          {/* Subtle graphic accent */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-radial pointer-events-none" />
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 mb-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tests (e.g. Thyroid, CBC, Lipid)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm"
            />
          </div>

          {/* Categories Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === "ALL"
                  ? "bg-[#0B4A3A] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Packages ({tests.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedCategory(c.name)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === c.name
                    ? "bg-[#0B4A3A] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {c.name} ({c.count})
              </button>
            ))}
          </div>
        </div>

        {/* Tests Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-[#0B4A3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Loading diagnostic packages...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto">
            <TestTube2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="font-bold text-[#0B4A3A]">No tests found</p>
            <p className="text-xs text-gray-500 mt-1">Try searching with a different term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredTests.map((test) => (
              <div
                key={test.id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-3 py-1 bg-emerald-50 text-[#0B4A3A] rounded-full text-xs font-bold">
                      {test.category}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400" /> {test.reportTimeHours}h report
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">{test.name}</h3>
                  <p className="text-xs text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                    {test.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <TestTube2 className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Sample: </span>
                      <strong className="text-gray-800">{test.sampleType}</strong>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Fasting: </span>
                      <strong className="text-gray-800">
                        {test.fastingRequired ? "Required (10-12 hrs)" : "Not Required"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-[#0B4A3A]">
                        ₹{Number(test.price).toLocaleString("en-IN")}
                      </span>
                      {Number(test.mrp) > Number(test.price) && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{Number(test.mrp).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    {Number(test.mrp) > Number(test.price) && (
                      <span className="text-[11px] font-bold text-[#10B981]">
                        Save{" "}
                        {Math.round(
                          ((Number(test.mrp) - Number(test.price)) / Number(test.mrp)) * 100
                        )}
                        %
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTest(test);
                      setBookingSuccess(null);
                      setBookingError(null);
                    }}
                    className="px-5 py-2.5 bg-[#F5C043] hover:bg-[#eab335] text-gray-950 font-bold rounded-full text-xs transition shadow-sm"
                  >
                    Book Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {selectedTest && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedTest(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              {bookingSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#10B981]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#0B4A3A] mb-2">
                    Sample Collection Scheduled!
                  </h3>
                  <p className="text-gray-600 text-sm mb-6">
                    Our phlebotomist will arrive at your address with a sterile collection kit.
                  </p>
                  <div className="bg-[#FAF3EA] rounded-2xl p-4 text-left border border-amber-200 mb-6 text-xs space-y-1">
                    <div>
                      <strong>Booking ID:</strong> {bookingSuccess.bookingNumber}
                    </div>
                    <div>
                      <strong>Test:</strong> {selectedTest.name}
                    </div>
                    <div>
                      <strong>Patient:</strong> {bookingSuccess.patientName}
                    </div>
                    <div>
                      <strong>Total Amount:</strong> ₹{Number(selectedTest.price).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTest(null)}
                    className="w-full py-3 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-full transition"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-bold text-[#0B4A3A] mb-1">Schedule Home Test</h3>
                  <p className="text-xs text-gray-500 mb-6">
                    {selectedTest.name} &bull; ₹{Number(selectedTest.price).toLocaleString("en-IN")}
                  </p>

                  {bookingError && (
                    <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  <form onSubmit={handleBookSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Patient Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="e.g. Aditi Sharma"
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Age *
                        </label>
                        <input
                          type="number"
                          required
                          value={patientAge}
                          onChange={(e) => setPatientAge(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Gender *
                        </label>
                        <select
                          value={patientGender}
                          onChange={(e) => setPatientGender(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Collection Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={sampleDate}
                        onChange={(e) => setSampleDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Preferred Time Slot *
                      </label>
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm"
                      >
                        <option value="07:00 AM - 08:00 AM">07:00 AM - 08:00 AM (Recommended for Fasting)</option>
                        <option value="08:00 AM - 09:00 AM">08:00 AM - 09:00 AM</option>
                        <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                        <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                        <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-[#10B981] hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-full transition shadow-md mt-4 text-sm"
                    >
                      {isSubmitting ? "Confirming Slot..." : "Confirm & Schedule Collection"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
