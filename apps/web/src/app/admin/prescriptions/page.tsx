"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, FileText, Eye, AlertCircle, ShieldAlert } from "lucide-react";

interface PrescriptionItem {
  id: string;
  userId: string;
  user?: { name: string; email: string; phone: string };
  fileUrl: string;
  fileType: string;
  originalName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
}

export default function AdminPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    {
      id: "rx-cwo-pending",
      userId: "user-2",
      user: { name: "Priya Sharma", email: "customer-with-orders@medico.com", phone: "9876543213" },
      fileUrl: "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800",
      fileType: "image/jpeg",
      originalName: "prescription_upload_pending.jpg",
      status: "PENDING",
      notes: "Uploaded for Schedule H1 antibiotic order",
      createdAt: new Date().toISOString(),
    },
    {
      id: "rx-cwo-approved",
      userId: "user-2",
      user: { name: "Priya Sharma", email: "customer-with-orders@medico.com", phone: "9876543213" },
      fileUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800",
      fileType: "image/jpeg",
      originalName: "dr_sharma_prescription_verified.jpg",
      status: "APPROVED",
      notes: "Approved valid prescription for Schedule H antibiotics and analgesics",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRx() {
      try {
        const res = await fetch("http://localhost:5000/api/admin/prescriptions");
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            setPrescriptions(json.data);
          }
        }
      } catch (e) {
        console.warn("Could not fetch live prescriptions queue, using fallback", e);
      }
    }
    fetchRx();
  }, []);

  const handleReview = async (id: string, status: "APPROVED" | "REJECTED", reason?: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/prescriptions/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      if (res.ok) {
        setPrescriptions((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status, rejectionReason: reason } : p))
        );
      }
    } catch (e) {
      console.error("Failed to update prescription review status", e);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = prescriptions.filter((p) => (filter === "ALL" ? true : p.status === filter));

  return (
    <div className="min-h-screen bg-[#F4F6F5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-[#0B4A3A] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#0F2A22]">Prescription Verification Queue</h1>
            <p className="text-xs text-[#5B6B65] mt-0.5">
              Review and certify doctor prescriptions before Schedule H/H1 orders can be packed and dispatched.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-full border border-[#D7DEDB]">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  filter === tab ? "bg-[#0B4A3A] text-white" : "text-[#5B6B65] hover:text-[#0B4A3A]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Prescription List Cards */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#D7DEDB]">
              <FileText className="w-10 h-10 text-[#5B6B65] mx-auto mb-3 opacity-40" />
              <h3 className="text-sm font-bold text-[#0F2A22]">No prescriptions found in this queue</h3>
            </div>
          ) : (
            filtered.map((rx) => (
              <div
                key={rx.id}
                className="bg-white rounded-2xl p-6 border border-[#D7DEDB] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#0B4A3A] bg-[#E6F4B8] px-2.5 py-0.5 rounded-full">
                      #{rx.id.slice(0, 12)}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        rx.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : rx.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {rx.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#0F2A22]">{rx.originalName}</h3>
                  <p className="text-xs text-[#5B6B65]">
                    Customer: <strong>{rx.user?.name || "Verified Customer"}</strong> • {rx.user?.phone || "+91 98765 43213"}
                  </p>
                  {rx.notes && <p className="text-xs text-[#3E4D47] italic">Note: &ldquo;{rx.notes}&rdquo;</p>}
                  {rx.rejectionReason && (
                    <p className="text-xs text-red-600 font-medium">Rejection Reason: {rx.rejectionReason}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <a
                    href={rx.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-full border border-[#D7DEDB] text-xs font-bold text-[#0B4A3A] hover:bg-[#F4F6F5] transition flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Rx
                  </a>

                  {rx.status === "PENDING" && (
                    <>
                      <button
                        disabled={processingId === rx.id}
                        onClick={() => handleReview(rx.id, "APPROVED")}
                        className="px-4 py-2 rounded-full bg-[#10B981] hover:bg-[#0ea372] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        disabled={processingId === rx.id}
                        onClick={() => {
                          const reason = prompt("Enter clinical rejection reason (e.g. illegible doctor stamp/expired):");
                          if (reason) handleReview(rx.id, "REJECTED", reason);
                        }}
                        className="px-3.5 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
