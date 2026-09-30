"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Video,
  Star,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Globe2,
  X,
  Search,
  ExternalLink,
} from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  slug: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  avatar: string | null;
  bio: string;
  languages: string[];
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
}

export default function ConsultationsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<{ name: string; count: number }[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Booking Modal
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("26");
  const [patientGender, setPatientGender] = useState("MALE");
  const [timeSlot, setTimeSlot] = useState("10:00 AM - 10:30 AM");
  const [notes, setNotes] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch("http://localhost:5000/api/consultations/doctors");
        const data = await res.json();
        if (data.success && data.data) {
          setDoctors(data.data.doctors || []);
          setSpecializations(data.data.specializations || []);
        }
      } catch (err) {
        console.error("Failed to load doctors:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpec =
      selectedSpec === "ALL" ||
      doc.specialization.toLowerCase().includes(selectedSpec.toLowerCase());
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.qualification.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpec && matchesSearch;
  });

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setIsSubmitting(true);
    setBookingError(null);

    try {
      const res = await fetch("http://localhost:5000/api/consultations/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          patientName: patientName || "Patient",
          patientAge: Number(patientAge),
          patientGender,
          timeSlot,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to schedule consultation");
      }

      setBookingSuccess(data.data);
    } catch (err: any) {
      setBookingError(err.message || "Consultation booking failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto w-full px-4 sm:px-8 xl:px-12 py-8">
        {/* Banner */}
        <div className="bg-[#0B4A3A] rounded-3xl p-8 sm:p-12 text-white mb-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-500/20 text-[#10B981] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/30">
              <Stethoscope className="w-3.5 h-3.5" /> Verified Medical Practitioners
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Consult Top Doctors Online
            </h1>
            <p className="text-gray-200 text-sm sm:text-base mb-6 leading-relaxed">
              Connect with India&apos;s leading doctors via encrypted HD video calls. Get verified
              digital prescriptions, follow-up advice, and medicine recommendations in minutes.
            </p>
            <div className="flex flex-wrap gap-4 text-xs sm:text-sm font-semibold text-emerald-200">
              <span className="flex items-center gap-1.5">
                <Video className="w-4 h-4 text-[#F5C043]" /> Encrypted Video Consults
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#F5C043]" /> MD & Super-specialists
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#F5C043]" /> Available within 15 mins
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 mb-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search doctors by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedSpec("ALL")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                selectedSpec === "ALL"
                  ? "bg-[#0B4A3A] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Specialties ({doctors.length})
            </button>
            {specializations.map((s) => (
              <button
                key={s.name}
                onClick={() => setSelectedSpec(s.name)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                  selectedSpec === s.name
                    ? "bg-[#0B4A3A] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Doctors Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-[#0B4A3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Loading doctors roster...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto">
            <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="font-bold text-[#0B4A3A]">No doctors found</p>
            <p className="text-xs text-gray-500 mt-1">Try another specialty or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                      {doc.avatar ? (
                        <Image
                          src={doc.avatar}
                          alt={doc.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#FAF3EA] text-[#0B4A3A] font-bold">
                          {doc.name[4] || "Dr"}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{doc.name}</h3>
                      <p className="text-xs text-[#10B981] font-semibold">{doc.specialization}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs font-bold text-gray-800">
                          <Star className="w-3.5 h-3.5 fill-[#F5C043] text-[#F5C043]" />
                          {doc.rating}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          ({doc.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-1 font-medium">{doc.qualification}</p>
                  <p className="text-xs text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                    {doc.bio}
                  </p>

                  <div className="space-y-1.5 mb-6 text-xs text-gray-600 bg-gray-50 rounded-2xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Experience:</span>
                      <strong className="text-gray-800">{doc.experienceYears}+ Years</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Languages:</span>
                      <strong className="text-gray-800">
                        {Array.isArray(doc.languages) ? doc.languages.join(", ") : "English, Hindi"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 block">Consultation Fee</span>
                    <span className="text-xl font-black text-[#0B4A3A]">
                      ₹{Number(doc.consultationFee).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDoctor(doc);
                      setBookingSuccess(null);
                      setBookingError(null);
                    }}
                    className="px-5 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-full text-xs transition shadow-sm inline-flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" /> Consult Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Doctor Booking Modal */}
        {selectedDoctor && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedDoctor(null)}
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
                    Consultation Booked Successfully!
                  </h3>
                  <p className="text-gray-600 text-sm mb-6">
                    Your appointment with {selectedDoctor.name} has been confirmed.
                  </p>

                  <div className="bg-[#FAF3EA] rounded-2xl p-4 text-left border border-amber-200 mb-6 text-xs space-y-1.5">
                    <div>
                      <strong>Appointment ID:</strong> {bookingSuccess.appointmentNumber}
                    </div>
                    <div>
                      <strong>Doctor:</strong> {selectedDoctor.name}
                    </div>
                    <div>
                      <strong>Time Slot:</strong> {bookingSuccess.timeSlot}
                    </div>
                    <div>
                      <strong>Fee:</strong> ₹{Number(selectedDoctor.consultationFee).toLocaleString("en-IN")}
                    </div>
                  </div>

                  {bookingSuccess.videoRoomUrl && (
                    <a
                      href={bookingSuccess.videoRoomUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 bg-[#0B4A3A] hover:bg-[#07362a] text-white font-bold rounded-full transition shadow-md flex items-center justify-center gap-2 mb-3 text-sm"
                    >
                      <Video className="w-4 h-4 text-[#10B981]" /> Join Video Room Now
                    </a>
                  )}

                  <button
                    onClick={() => setSelectedDoctor(null)}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition text-sm"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-bold text-[#0B4A3A] mb-1">
                    Book Video Consultation
                  </h3>
                  <p className="text-xs text-gray-500 mb-6">
                    {selectedDoctor.name} &bull; {selectedDoctor.specialization} &bull; ₹
                    {Number(selectedDoctor.consultationFee).toLocaleString("en-IN")}
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
                        placeholder="e.g. Rahul Gupta"
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
                        Select Slot Today *
                      </label>
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm"
                      >
                        <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                        <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                        <option value="02:30 PM - 03:00 PM">02:30 PM - 03:00 PM</option>
                        <option value="04:30 PM - 05:00 PM">04:30 PM - 05:00 PM</option>
                        <option value="06:00 PM - 06:30 PM">06:00 PM - 06:30 PM</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Symptoms or Medical History
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Briefly describe what you'd like to consult the doctor for..."
                        className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-[#10B981] hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-full transition shadow-md mt-4 text-sm flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? "Connecting..." : "Confirm & Pay Later"}
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
