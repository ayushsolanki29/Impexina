"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Edit, Mail, Phone, MapPin, Building2,
  User, Globe, StickyNote, ShieldAlert, Hash, Box,
  Zap, PlusCircle, MessageSquare, Briefcase, Activity,
  Calendar, Loader2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { get } from "@/lib/api";

function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-slate-50 last:border-0">
      <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`text-sm font-semibold text-slate-900 break-words ${mono ? "font-mono" : ""}`}>
          {value || <span className="text-slate-300 italic font-normal">Not provided</span>}
        </p>
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const res = await get(`/clients/${id}`);
      if (res.success) setClient(res.data);
    } catch (error) {
      toast.error("Failed to fetch client details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!client) return null;

  const statusConfig = {
    ACTIVE: { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Zap },
    NEW: { label: "New", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: PlusCircle },
    CONTACTED: { label: "Contacted", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: MessageSquare },
    INACTIVE: { label: "Inactive", cls: "bg-slate-100 text-slate-600 border-slate-200", icon: ShieldAlert },
  };
  const typeConfig = {
    CLIENT: { label: "Client", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: Briefcase },
    LEAD: { label: "Lead", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: PlusCircle },
  };

  const statusCfg = statusConfig[client.status] || statusConfig.NEW;
  const typeCfg = typeConfig[client.type] || typeConfig.LEAD;
  const StatusIcon = statusCfg.icon;
  const TypeIcon = typeCfg.icon;

  const createdAt = client.createdAt
    ? new Date(client.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Premium Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <Link
                href="/dashboard/clients"
                className="group p-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl transition-all hover:shadow-md"
              >
                <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-900" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{client.name}</h1>
                </div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                  Client Profile · {client.companyName || "Independent"}
                </p>
              </div>
            </div>

            <Link
              href={`/dashboard/clients/${id}/edit`}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: Main Info */}
          <div className="lg:col-span-8 space-y-8">

            {/* Primary Identity */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Primary Identity</h2>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Essential Profile Details</p>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12">
                <InfoRow icon={User} label="Full Name" value={client.name} />
                <InfoRow icon={Building2} label="Company Name" value={client.companyName} />
                <InfoRow icon={Mail} label="Email Address" value={client.email} />
                <InfoRow icon={Phone} label="Primary Phone" value={client.phone} />
                {client.mobile && <InfoRow icon={Phone} label="Mobile" value={client.mobile} />}
                {client.contactPerson && <InfoRow icon={User} label="Contact Person" value={client.contactPerson} />}
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Reach & Location</h2>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Physical Address Details</p>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12">
                <InfoRow icon={MapPin} label="City" value={client.city} />
                <InfoRow icon={Activity} label="State" value={client.state} />
                <InfoRow icon={Globe} label="Country" value={client.country} />
                {client.address && (
                  <div className="col-span-2">
                    <InfoRow icon={MapPin} label="Full Address" value={client.address} />
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {client.notes && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <StickyNote className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Strategic Remarks</h2>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Internal Knowledge Base</p>
                  </div>
                </div>
                <div className="p-8">
                  <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/50 rounded-3xl px-6 py-4 border border-slate-100">
                    {client.notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="lg:col-span-4 space-y-8">

            {/* Profile Card (same blue-700 as create form) */}
            <div className="bg-blue-700 rounded-3xl shadow-2xl shadow-blue-700/30 overflow-hidden border border-blue-600">
              <div className="p-8 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600 rounded-full blur-3xl"></div>
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-blue-800/50 rounded-full blur-2xl"></div>

                <div className="relative z-10 flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-200" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-200">Client Profile</span>
                  </div>
                  {createdAt && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-blue-100 text-[9px] font-bold rounded-full uppercase tracking-widest border border-blue-500">
                      <Calendar className="w-3 h-3" /> {createdAt}
                    </span>
                  )}
                </div>

                <div className="relative z-10 flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-blue-600 border-2 border-blue-500 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl uppercase">
                    {client.name.charAt(0)}
                  </div>
                  <span className={`mt-1 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${client.type === 'CLIENT' ? 'bg-white/20 text-white border-white/30' : 'bg-amber-400/20 text-amber-200 border-amber-300/30'
                    }`}>
                    {client.type}
                  </span>
                </div>

                <div className="relative z-10 mb-6">
                  <h4 className="text-xl font-extrabold text-white leading-tight truncate">{client.name}</h4>
                  <p className="text-sm font-semibold text-blue-200 flex items-center gap-1.5 truncate mt-1">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    {client.companyName || <span className="text-blue-300/40 italic font-normal">No company</span>}
                  </p>
                </div>

                <div className="relative z-10 space-y-2.5 border-t border-blue-600 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-3 h-3 text-blue-200" />
                    </div>
                    <span className="text-xs font-semibold text-blue-100 truncate">
                      {client.email || <span className="text-blue-300/40 italic">No email</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-3 h-3 text-blue-200" />
                    </div>
                    <span className="text-xs font-semibold text-blue-100">
                      {client.phone || <span className="text-blue-300/40 italic">No phone</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-3 h-3 text-blue-200" />
                    </div>
                    <span className="text-xs font-semibold text-blue-100 truncate">
                      {client.city ? `${client.city}${client.state ? `, ${client.state}` : ''}` : <span className="text-blue-300/40 italic">No location</span>}
                    </span>
                  </div>
                </div>

                <div className="relative z-10 mt-6 pt-4 border-t border-blue-600 flex items-center justify-between">
                  <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${client.status === 'ACTIVE' ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30' :
                      client.status === 'NEW' ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30' :
                        client.status === 'CONTACTED' ? 'bg-sky-400/20 text-sky-200 border border-sky-400/30' :
                          'bg-blue-800/60 text-blue-300 border border-blue-600'
                    }`}>
                    <Zap className="w-3 h-3" />
                    {client.status}
                  </div>
                  <span className="text-[9px] font-bold text-blue-400/50 uppercase tracking-widest">#{id?.toString().slice(-6)}</span>
                </div>
              </div>
            </div>

            {/* Classifications */}
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldAlert className="w-5 h-5 text-blue-400" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-400">Classifications</span>
                </div>

                {/* Type */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Client Category</label>
                    <TypeIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest ${client.type === 'CLIENT'
                      ? 'bg-blue-100 text-blue-700 ring-4 ring-blue-500/30'
                      : 'bg-amber-100 text-amber-700 ring-4 ring-amber-500/30'
                    }`}>
                    <TypeIcon className="w-3.5 h-3.5" />
                    {typeCfg.label}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Status</label>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest ${statusCfg.cls}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusCfg.label}
                  </div>
                </div>
              </div>
            </div>

            {/* Regulatory */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-bold text-slate-900">Regulatory Info</h3>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax ID / GSTIN</label>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                    <Hash className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-bold text-slate-900 font-mono tracking-wider">
                      {client.gstNumber || <span className="text-slate-300 font-normal italic font-sans">Not provided</span>}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Industry Vertical</label>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                    <Box className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-bold text-slate-900">
                      {client.industry || <span className="text-slate-300 font-normal italic">Not provided</span>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
