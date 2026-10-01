"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  ArrowRight,
  FileCheck,
  X,
} from "lucide-react";

export default function PrescriptionUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit.");
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit.");
        return;
      }
      setFile(dropped);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select or drop a valid prescription file.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("prescription", file);
      if (patientName) formData.append("patientName", patientName);
      if (doctorName) formData.append("doctorName", doctorName);
      if (notes) formData.append("notes", notes);

      const res = await fetch("/api/prescriptions/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to upload prescription");
      }

      setSubmittedData(data.data || { patientName, doctorName, status: "PENDING" });
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto w-full px-4 sm:px-8 xl:px-12 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-[#0B4A3A]">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#0B4A3A] font-semibold">Upload Prescription</span>
        </div>

        {submittedData ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-emerald-100 max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-[#10B981]">
              <FileCheck className="w-10 h-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B4A3A] mb-3">
              Prescription Uploaded Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Our registered licensed pharmacists are reviewing your prescription. Once verified,
              we will prepare your cart and notify you via SMS/WhatsApp.
            </p>

            <div className="bg-[#FAF3EA] rounded-2xl p-4 text-left mb-8 border border-amber-200">
              <div className="text-xs uppercase font-bold text-gray-400 mb-2">Review Status</div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">
                  {file?.name || "Uploaded File"}
                </span>
                <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-bold uppercase tracking-wider">
                  Pending Verification
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Average review turnaround time: ~15
                minutes
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/products"
                className="px-6 py-3 bg-[#10B981] hover:bg-emerald-600 text-white font-semibold rounded-full transition shadow-md inline-flex items-center justify-center gap-2"
              >
                Browse Medicines <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => {
                  setSubmittedData(null);
                  setFile(null);
                  setPatientName("");
                  setDoctorName("");
                  setNotes("");
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-full transition"
              >
                Upload Another
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B4A3A]">
                  Upload Prescription
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Upload a photo or scanned copy of your valid doctor&apos;s prescription. Our
                  registered pharmacists will dispense your medicines accurately.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Drag Drop Area */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prescription Document / Photo *
                  </label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
                      file
                        ? "border-[#10B981] bg-emerald-50/40"
                        : "border-gray-300 hover:border-[#10B981] bg-[#F4F6F5]"
                    }`}
                  >
                    {file ? (
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-[#10B981] mb-3">
                          <FileText className="w-7 h-7" />
                        </div>
                        <p className="font-semibold text-gray-900 text-sm max-w-xs truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="mt-3 text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Remove & Choose Another
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#0B4A3A] shadow-sm mb-3">
                          <UploadCloud className="w-7 h-7" />
                        </div>
                        <p className="text-sm font-semibold text-gray-800">
                          Drag and drop your prescription here
                        </p>
                        <p className="text-xs text-gray-500 mt-1">or browse from your device</p>
                        <label className="mt-4 px-5 py-2.5 bg-white border border-gray-300 hover:border-[#10B981] text-[#0B4A3A] font-semibold text-sm rounded-full cursor-pointer transition shadow-sm">
                          Browse Files
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[11px] text-gray-400 mt-3">
                          Supports JPG, PNG, WEBP, PDF up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Patient Full Name
                    </label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Doctor Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Sharma"
                      className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Special Instructions / Medicine Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Please deliver 30 days dosage of Tab Telmisartan 40mg and 1 bottle syrup..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !file}
                  className="w-full py-3.5 bg-[#10B981] hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-full transition shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Submit Prescription for Review <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Guide & Security Assurances */}
            <div className="lg:col-span-5 space-y-6">
              {/* Guidelines Card */}
              <div className="bg-[#FAF3EA] rounded-3xl p-6 border border-amber-200">
                <h2 className="font-bold text-[#0B4A3A] text-lg mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" /> Valid Prescription Checklist
                </h2>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Doctor&apos;s name and clinic/hospital details clearly printed</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Patient name, age, and consultation date clearly legible</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Doctor&apos;s registration number and signature / digital stamp</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Prescription issued within the last 6 months</span>
                  </li>
                </ul>
              </div>

              {/* What Happens Next Card */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-[#0B4A3A] text-base mb-4">How It Works</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#0B4A3A] font-bold text-xs flex items-center justify-center flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">You Upload Prescription</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Take a clean photo or PDF and upload through this secure form.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#0B4A3A] font-bold text-xs flex items-center justify-center flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Pharmacist Verification</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Our registered pharmacists verify the medicines, strength, and dosage.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#0B4A3A] font-bold text-xs flex items-center justify-center flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Cart Created & Delivery</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Confirm order with 1-click and get doorstep delivery in 24 hours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
