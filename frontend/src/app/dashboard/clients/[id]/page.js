"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Edit, Mail, Phone, MapPin, Building2,
  User, Hash, Box, Zap, Calendar, Loader2, StickyNote
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { get } from "@/lib/api";

const STATUS_COLORS = {
  ACTIVE:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  NEW:       "bg-amber-50 text-amber-700 border-amber-200",
  CONTACTED: "bg-blue-50 text-blue-700 border-blue-200",
  INACTIVE:  "bg-slate-100 text-slate-500 border-slate-200",
};

const TYPE_COLORS = {
  CLIENT: "bg-blue-50 text-blue-700 border-blue-200",
  LEAD:   "bg-amber-50 text-amber-700 border-amber-200",
};

function Field({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`text-sm text-slate-900 font-medium ${mono ? "font-mono" : ""}`}>
        {value || <span className="text-slate-300 italic font-normal">—</span>}
      </p>
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get(`/clients/${id}`)
      .then(res => { if (res.success) setClient(res.data); })
      .catch(() => toast.error("Failed to load client"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
    </div>
  );

  if (!client) return null;

  const createdAt = client.createdAt
    ? new Date(client.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/clients" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">{client.name}</h1>
              {client.companyName && <p className="text-xs text-slate-400">{client.companyName}</p>}
            </div>
          </div>
          <Link
            href={`/dashboard/clients/${id}/edit`}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" /> Edit
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Identity strip */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl font-black flex-shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-base truncate">{client.name}</p>
            <p className="text-xs text-slate-500 truncate">{client.companyName || "No company"}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${TYPE_COLORS[client.type] || TYPE_COLORS.LEAD}`}>
              {client.type}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${STATUS_COLORS[client.status] || STATUS_COLORS.NEW}`}>
              {client.status}
            </span>
            {createdAt && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <Calendar className="w-3 h-3" />{createdAt}
              </span>
            )}
          </div>
        </div>

        {/* Main info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Contact */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
            <div className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <a href={`mailto:${client.email}`} className="text-sm text-blue-600 hover:underline truncate">{client.email}</a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{client.phone}</span>
                </div>
              )}
              {client.mobile && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{client.mobile}</span>
                </div>
              )}
              {client.contactPerson && (
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{client.contactPerson}</span>
                </div>
              )}
              {!client.email && !client.phone && !client.mobile && (
                <p className="text-xs text-slate-300 italic">No contact info</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
            <div className="space-y-3">
              {(client.city || client.state || client.country) && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    {[client.city, client.state, client.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 leading-relaxed">{client.address}</span>
                </div>
              )}
              {!client.city && !client.state && !client.address && (
                <p className="text-xs text-slate-300 italic">No location info</p>
              )}
            </div>
          </div>

          {/* Business */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business</p>
            <div className="space-y-3">
              <Field label="GST / Tax ID" value={client.gstNumber} mono />
              <Field label="Industry" value={client.industry} />
              {client.source && <Field label="Source" value={client.source} />}
              {client.rating && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Rating</p>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className={`w-4 h-4 rounded-sm ${n <= client.rating ? "bg-amber-400" : "bg-slate-100"}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
