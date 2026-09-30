"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Headphones,
} from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-[1720px] 2xl:max-w-[1800px] mx-auto w-full px-4 sm:px-8 xl:px-12 py-10">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-[#0B4A3A] rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Headphones className="w-3.5 h-3.5 text-[#10B981]" /> We&apos;re Here to Help
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0B4A3A] mb-3">Get in Touch</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Have questions about your prescription or order? Our licensed pharmacists and support
            team are ready to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Contact Information & Channels */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0B4A3A] text-white rounded-3xl p-8 shadow-md">
              <h2 className="text-xl font-bold mb-4">Contact Information</h2>
              <p className="text-xs text-gray-300 mb-8 leading-relaxed">
                Connect with our customer operations or clinical team through any of the channels
                below.
              </p>

              <div className="space-y-6 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-[#10B981]">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Customer Support & Helpline</p>
                    <p className="text-xs text-gray-300 mt-0.5">1800-890-4422 (Toll Free)</p>
                    <p className="text-xs text-emerald-400 font-bold mt-1">24x7 Emergency Assistance</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-[#10B981]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Email Inquiries</p>
                    <p className="text-xs text-gray-300 mt-0.5">support@pharmico.com</p>
                    <p className="text-xs text-gray-300">prescriptions@pharmico.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-[#10B981]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Fulfillment Hub & Head Office</p>
                    <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                      Pharmico Life Sciences Ltd., Tech Park 4, Bandra Kurla Complex, Mumbai,
                      Maharashtra 400051
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Regulatory Credentials */}
            <div className="bg-[#FAF3EA] rounded-3xl p-6 border border-amber-200 text-xs text-gray-700">
              <h3 className="font-bold text-[#0B4A3A] text-sm mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" /> Pharmacy License Details
              </h3>
              <p className="leading-relaxed">
                <strong>Retail Drug License:</strong> MH-MZ2-2024-4901 &bull; Form 20B & 21B
              </p>
              <p className="leading-relaxed mt-1">
                <strong>Registered Pharmacist on Duty:</strong> Reg No. 194821 / Maharashtra State
                Pharmacy Council
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#10B981]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-[#0B4A3A] mb-2">Message Received!</h3>
                <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
                  Thank you for reaching out. A dedicated care representative will reply to your
                  inquiry within 2 business hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setName("");
                    setEmail("");
                    setPhone("");
                    setSubject("");
                    setMessage("");
                  }}
                  className="px-6 py-2.5 bg-[#0B4A3A] text-white font-bold rounded-full text-xs transition"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-[#0B4A3A] mb-2">Send Us a Message</h2>
                <p className="text-xs text-gray-500 mb-6">
                  Fill out the form below and we will respond promptly.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Question regarding Order or Medicine Availability"
                      className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-[#10B981] text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#10B981] hover:bg-emerald-600 text-white font-bold rounded-full transition shadow-md flex items-center justify-center gap-2 text-sm"
                  >
                    <Send className="w-4 h-4" /> Send Message
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
