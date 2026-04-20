"use client";
import React, { useState } from "react";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { post, put } from "@/lib/api";

const inp = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 bg-white transition-all";
const lbl = "block text-xs font-semibold text-slate-600 mb-1";

function Field({ label, name, value, onChange, type = "text", placeholder, required, rows }) {
  if (rows) return (
    <div>
      <label className={lbl}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        className={`${inp} resize-none`} />
    </div>
  );
  return (
    <div>
      <label className={lbl}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder}
        required={required} className={inp} />
    </div>
  );
}

const TYPE_OPTIONS = [
  { id: "LEAD",   label: "Lead" },
  { id: "CLIENT", label: "Client" },
];
const STATUS_OPTIONS = [
  { id: "NEW",       label: "New",       cls: "border-amber-300 text-amber-700 bg-amber-50" },
  { id: "CONTACTED", label: "Contacted", cls: "border-blue-300 text-blue-700 bg-blue-50" },
  { id: "ACTIVE",    label: "Active",    cls: "border-emerald-300 text-emerald-700 bg-emerald-50" },
  { id: "INACTIVE",  label: "Inactive",  cls: "border-slate-300 text-slate-600 bg-slate-50" },
];

export default function ClientForm({ initialData, mode = "create" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name:          initialData?.name          || "",
    contactPerson: initialData?.contactPerson || "",
    companyName:   initialData?.companyName   || "",
    email:         initialData?.email         || "",
    phone:         initialData?.phone         || "",
    mobile:        initialData?.mobile        || "",
    address:       initialData?.address       || "",
    city:          initialData?.city          || "",
    state:         initialData?.state         || "",
    country:       initialData?.country       || "India",
    gstNumber:     initialData?.gstNumber     || "",
    industry:      initialData?.industry      || "",
    status:        initialData?.status        || "NEW",
    type:          initialData?.type          || "LEAD",
    notes:         initialData?.notes         || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error("Name is required"); return; }
    try {
      setLoading(true);
      if (mode === "create") {
        await post("/clients", formData);
        toast.success("Client created");
      } else {
        await put(`/clients/${initialData.id}`, formData);
        toast.success("Client updated");
      }
      router.push("/dashboard/clients");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/clients" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
            <h1 className="text-base font-bold text-slate-900">
              {mode === "create" ? "New Client" : `Edit — ${formData.name || "Client"}`}
            </h1>
          </div>
          <button type="submit" form="client-form" disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {mode === "create" ? "Create" : "Save"}
          </button>
        </div>
      </div>

      <form id="client-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Type + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={lbl}>Type</p>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map(t => (
                <button key={t.id} type="button"
                  onClick={() => setFormData(p => ({ ...p, type: t.id }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    formData.type === t.id
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className={lbl}>Status</p>
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_OPTIONS.map(s => (
                <button key={s.id} type="button"
                  onClick={() => setFormData(p => ({ ...p, status: s.id }))}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                    formData.status === s.id ? s.cls : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required />
            <Field label="Company" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Acme Pvt Ltd" />
            <Field label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="Contact name" />
            <Field label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" />
            <Field label="Phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
            <Field label="Mobile" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="+91 98765 43210" />
          </div>
        </div>

        {/* Location */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="City" name="city" value={formData.city} onChange={handleChange} placeholder="Mumbai" />
            <Field label="State" name="state" value={formData.state} onChange={handleChange} placeholder="Maharashtra" />
            <Field label="Country" name="country" value={formData.country} onChange={handleChange} placeholder="India" />
          </div>
          <Field label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="Full address..." rows={2} />
        </div>

        {/* Business */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="GST / Tax ID" name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="24AAAAA0000A1Z5" />
            <Field label="Industry" name="industry" value={formData.industry} onChange={handleChange} placeholder="Textile / Solar" />
          </div>
        </div>

        {/* Notes */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</p>
          <Field label="" name="notes" value={formData.notes} onChange={handleChange}
            placeholder="Internal notes, preferences, context..." rows={3} />
        </div>

      </form>
    </div>
  );
}
