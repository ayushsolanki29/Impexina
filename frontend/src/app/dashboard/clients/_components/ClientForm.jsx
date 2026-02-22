"use client";
import React, { useState } from "react";
import { 
  Save, ArrowLeft, Loader2, User, Building2, Mail, Phone, 
  CheckCircle2, HelpCircle, MapPin, Globe, Briefcase, 
  Tag, Activity, Zap, MessageSquare, PlusCircle, ShieldAlert,
  StickyNote, Hash, Box
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { post, put } from "@/lib/api";

export default function ClientForm({ initialData, mode = "create" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    contactPerson: initialData?.contactPerson || "",
    companyName: initialData?.companyName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    mobile: initialData?.mobile || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    country: initialData?.country || "India",
    gstNumber: initialData?.gstNumber || "",
    industry: initialData?.industry || "",
    status: initialData?.status || "NEW",
    type: initialData?.type || "LEAD",
    notes: initialData?.notes || "",
  });

  const [emailValid, setEmailValid] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailValid(emailRegex.test(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Client name is absolutely required");
      return;
    }

    try {
      setLoading(true);
      if (mode === "create") {
        await post("/clients", formData);
        toast.success("New relationship established successfully!");
      } else {
        await put(`/clients/${initialData.id}`, formData);
        toast.success("Client profile updated perfectly.");
      }
      router.push("/dashboard/clients");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to save client data.");
    } finally {
      setLoading(false);
    }
  };

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
                  <span className={`w-2.5 h-2.5 rounded-full ${mode === 'create' ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`}></span>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {mode === "create" ? "Add New Portfolio" : `Edit: ${formData.name}`}
                  </h1>
                </div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                  {mode === "create" ? "Initialize new client profile" : "Modify existing client records"}
                </p>
              </div>
            </div>
            
            <button
              type="submit"
              form="client-form"
              disabled={loading}
              className="relative overflow-hidden group flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {mode === "create" ? "Create Profile" : "Sync Changes"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form id="client-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Core Data */}
          <div className="lg:col-span-8 space-y-8">
            {/* Primary Identity Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Primary Identity</h2>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Essential Profile Details</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Client Name <span className="text-rose-500">*</span></label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe / Global Exports"
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Company Name</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <input
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g. Acme Corporation Pvt Ltd"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Email Connection</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. contact@business.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900"
                    />
                    {formData.email && emailValid && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-emerald-100 p-1 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Primary Phone</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Geographical Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
               <div className="px-8 py-6 border-b border-slate-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Globe className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Reach & Location</h2>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Physical Address Details</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">City</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="e.g. Mumbai"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-900"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">State / Province</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Activity className="w-5 h-5" />
                      </div>
                      <input
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="e.g. Maharashtra"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-900"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Detailed Physical Address</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-4 text-slate-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g. 123, Business Park, Phase-1, Andheri East"
                      rows={3}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-900 resize-none shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Notes */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
               <div className="px-8 py-6 border-b border-slate-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <StickyNote className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Strategic Remarks</h2>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Internal Knowledge Base</p>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Intelligence about the client, preferences, historical context, or specific operational notes..."
                  rows={4}
                  className="w-full px-6 py-4 bg-slate-50/50 border border-slate-200 rounded-3xl focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-slate-900 resize-none shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Classification & Meta */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Quick Stats/Badge Board */}
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldAlert className="w-5 h-5 text-blue-400" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-400">Classifications</span>
                </div>
                
                <div className="space-y-8">
                  {/* Type Board */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">Client Category</label>
                      {formData.type === 'CLIENT' ? <Briefcase className="w-4 h-4 text-blue-400" /> : <User className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "LEAD", label: "Lead", icon: PlusCircle, activeClass: "bg-amber-100 text-amber-700 ring-4 ring-amber-500/30" },
                        { id: "CLIENT", label: "Client", icon: Zap, activeClass: "bg-blue-100 text-blue-700 ring-4 ring-blue-500/30" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type: t.id }))}
                          className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                            formData.type === t.id
                              ? t.activeClass
                              : "bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700 hover:text-white"
                          }`}
                        >
                          <t.icon className="w-3.5 h-3.5" />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status Board */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">Active Status</label>
                      <Activity className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "NEW", label: "New", color: "amber", icon: PlusCircle },
                        { id: "CONTACTED", label: "Contacted", color: "blue", icon: MessageSquare },
                        { id: "ACTIVE", label: "Active", color: "emerald", icon: Zap },
                        { id: "INACTIVE", label: "Inactive", color: "slate", icon: ShieldAlert },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, status: s.id }))}
                          className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            formData.status === s.id
                              ? s.color === "emerald" ? "bg-emerald-100 text-emerald-700 ring-4 ring-emerald-500/30" :
                                s.color === "amber" ? "bg-amber-100 text-amber-700 ring-4 ring-amber-500/30" :
                                s.color === "blue" ? "bg-blue-100 text-blue-700 ring-4 ring-blue-500/30" :
                                "bg-slate-500 text-white ring-4 ring-slate-500/30"
                              : "bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700 hover:text-white"
                          }`}
                        >
                          <s.icon className="w-3.5 h-3.5" />
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Regulatory & Business */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-bold text-slate-900">Regulatory Info</h3>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Tax ID / GSTIN</label>
                  <div className="relative group">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      placeholder="e.g. 24AAAAA0000A1Z5"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Industry Vertical</label>
                  <div className="relative group">
                    <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      placeholder="e.g. Textile / Solar"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Live Profile Preview */}
            <div className="bg-blue-700 rounded-3xl shadow-2xl shadow-blue-700/30 overflow-hidden border border-blue-600">
              <div className="p-8 relative overflow-hidden">
                {/* Background orbs */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600 rounded-full blur-3xl"></div>
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-blue-800/50 rounded-full blur-2xl"></div>

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-200" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-200">Client Profile</span>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-blue-100 text-[9px] font-bold rounded-full uppercase tracking-widest border border-blue-500 animate-pulse">
                    ● Live
                  </span>
                </div>

                {/* Avatar + Type */}
                <div className="relative z-10 flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-blue-600 border-2 border-blue-500 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl uppercase">
                    {formData.name ? formData.name.charAt(0) : "?"}
                  </div>
                  <span className={`mt-1 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                    formData.type === 'CLIENT'
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-amber-400/20 text-amber-200 border-amber-300/30'
                  }`}>
                    {formData.type}
                  </span>
                </div>

                {/* Name & Company */}
                <div className="relative z-10 mb-6">
                  <h4 className="text-xl font-extrabold text-white leading-tight truncate">
                    {formData.name || <span className="text-blue-300/50 italic font-medium text-base">Client Name</span>}
                  </h4>
                  <p className="text-sm font-semibold text-blue-200 flex items-center gap-1.5 truncate mt-1">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    {formData.companyName || <span className="text-blue-300/40 italic font-normal">Company details</span>}
                  </p>
                </div>

                {/* Contact Details */}
                <div className="relative z-10 space-y-2.5 border-t border-blue-600 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-3 h-3 text-blue-200" />
                    </div>
                    <span className="text-xs font-semibold text-blue-100 truncate">
                      {formData.email || <span className="text-blue-300/40 italic">email@example.com</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-3 h-3 text-blue-200" />
                    </div>
                    <span className="text-xs font-semibold text-blue-100">
                      {formData.phone || <span className="text-blue-300/40 italic">+91 00000 00000</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-3 h-3 text-blue-200" />
                    </div>
                    <span className="text-xs font-semibold text-blue-100 truncate">
                      {formData.city
                        ? `${formData.city}${formData.state ? `, ${formData.state}` : ''}`
                        : <span className="text-blue-300/40 italic">City, Region</span>}
                    </span>
                  </div>
                </div>

                {/* Status Footer */}
                <div className="relative z-10 mt-6 pt-4 border-t border-blue-600 flex items-center justify-between">
                  <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${
                    formData.status === 'ACTIVE'   ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30' :
                    formData.status === 'NEW'       ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30' :
                    formData.status === 'CONTACTED' ? 'bg-sky-400/20 text-sky-200 border border-sky-400/30' :
                                                     'bg-blue-800/60 text-blue-300 border border-blue-600'
                  }`}>
                    <Zap className="w-3 h-3" />
                    {formData.status}
                  </div>
                  <span className="text-[9px] font-bold text-blue-400/50 uppercase tracking-widest">ID: AUTO-GEN</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

