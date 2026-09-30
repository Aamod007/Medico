"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  Search,
  ExternalLink,
  X,
} from "lucide-react";

interface Prescription {
  id: string;
  fileUrl: string;
  patientName: string | null;
  doctorName: string | null;
  status: string;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    phone: string;
  };
  order?: {
    orderNumber: string;
    totalAmount: number;
  };
}

export default function AdminPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const url =
        statusFilter === "ALL"
          ? "http://localhost:5000/api/admin/prescriptions"
          : `http://localhost:5000/api/admin/prescriptions?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setPrescriptions(data.data);
      }
    } catch (err) {
      console.error("Failed to load prescriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [statusFilter]);

  const handleReviewAction = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedRx) return;
    setActionLoading(true);
    setActionMsg(null);

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/prescriptions/${selectedRx.id}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            notes: reviewNotes || "Verified by Registered Pharmacist",
            rejectionReason: status === "REJECTED" ? rejectionReason || "Illegible or missing doctor stamp" : null,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update review status");
      }

      setActionMsg(`Prescription marked as ${status}`);
      setTimeout(() => {
        setSelectedRx(null);
        setActionMsg(null);
        fetchPrescriptions();
      }, 1200);
    } catch (err: any) {
      alert(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1720px] 2xl:max-w-[1800px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B4A3A]">
            Prescriptions Review Queue
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Registered Pharmacist audit queue to verify doctor credentials and prescribe Schedule H
            drugs.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                statusFilter === st
                  ? "bg-[#0B4A3A] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-[#0B4A3A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-xs">Loading prescriptions...</p>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="py-20 text-center">
            <FileCheck2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-[#0B4A3A]">No prescriptions in this queue</p>
            <p className="text-xs text-gray-400 mt-1">All uploaded items have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF3EA]/60 text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Patient / User</th>
                  <th className="py-3.5 px-6 font-semibold">Doctor Name</th>
                  <th className="py-3.5 px-6 font-semibold">Upload Date</th>
                  <th className="py-3.5 px-6 font-semibold">Document</th>
                  <th className="py-3.5 px-6 font-semibold">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-900">{rx.patientName || "Customer"}</p>
                      <p className="text-[11px] text-gray-400">{rx.user?.phone || rx.user?.email || "Direct"}</p>
                    </td>
                    <td className="py-4 px-6 text-gray-700">
                      {rx.doctorName || <span className="text-gray-400 italic">Not specified</span>}
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      {new Date(rx.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <a
                        href={
                          rx.fileUrl.startsWith("http")
                            ? rx.fileUrl
                            : `http://localhost:5000/${rx.fileUrl}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#0B4A3A] font-semibold hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" /> View File
                      </a>
                    </td>
                    <td className="py-4 px-6">
                      {rx.status === "APPROVED" && (
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                          Approved
                        </span>
                      )}
                      {rx.status === "PENDING" && (
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">
                          Pending Review
                        </span>
                      )}
                      {rx.status === "REJECTED" && (
                        <span className="px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full font-bold">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedRx(rx);
                          setReviewNotes("");
                          setRejectionReason("");
                        }}
                        className="px-3.5 py-1.5 bg-[#0B4A3A] hover:bg-[#07362a] text-white rounded-full font-bold transition text-xs"
                      >
                        Audit & Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRx(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-[#0B4A3A] mb-1">
              Pharmacist Audit: Prescription #{selectedRx.id.slice(0, 8)}
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Verify doctor registration, clinic stamp, patient name, and dosage details.
            </p>

            {actionMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center">
                {actionMsg}
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Patient:</span>
                <strong className="text-gray-900">{selectedRx.patientName || "N/A"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Doctor Stated:</span>
                <strong className="text-gray-900">{selectedRx.doctorName || "N/A"}</strong>
              </div>
              {selectedRx.notes && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-500 block mb-0.5">Patient Notes:</span>
                  <p className="text-gray-700 italic">{selectedRx.notes}</p>
                </div>
              )}
              <div className="pt-2">
                <a
                  href={
                    selectedRx.fileUrl.startsWith("http")
                      ? selectedRx.fileUrl
                      : `http://localhost:5000/${selectedRx.fileUrl}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-full font-bold text-[#0B4A3A] hover:bg-gray-50 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Prescription Document in New Tab
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pharmacist Clinical Notes
                </label>
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Verified valid registration. Approved 30-day course."
                  className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Rejection Reason (Required if Rejecting)
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Expired Rx / Missing Doctor Signature / Illegible text"
                  className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-red-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReviewAction("REJECTED")}
                  className="py-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-full transition text-xs flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Reject Prescription
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReviewAction("APPROVED")}
                  className="py-3 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-full transition text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Prescription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
