"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, ArrowLeft, Trash2, Search, Ship, Container, 
  Landmark, CheckCircle2, AlertCircle, FileText
} from "lucide-react";
import { Toaster, toast } from "sonner";

export default function ComprehensiveShippingSheet() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  
  const emptyForm = {
    containerCode: "",
    loadingFrom: "YIWU / GUANGZHOU / FULL",
    ctn: "",
    loadingDate: "2025-11-25",
    deliveryDate: "2025-12-25",
    freightUSD: "1200",
    freightINR: "109200",
    cha: "90000",
    fobTerms: "0",
    cfsDoYard: "0",
    scanning: "15000",
    simsPims: "0",
    duty: "150867",
    penalty: "0",
    trucking: "12000",
    loadingUnloading: "8000"
  };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const saved = localStorage.getItem("igpl_shipping_final");
    if (saved) setRows(JSON.parse(saved));
  }, []);

  const save = (data) => {
    setRows(data);
    localStorage.setItem("igpl_shipping_final", JSON.stringify(data));
  };

  const calculateGrandTotal = (f) => {
    return (Number(f.freightINR) || 0) + 
           (Number(f.cha) || 0) + 
           (Number(f.fobTerms) || 0) +
           (Number(f.cfsDoYard) || 0) +
           (Number(f.scanning) || 0) +
           (Number(f.simsPims) || 0) +
           (Number(f.duty) || 0) +
           (Number(f.penalty) || 0) +
           (Number(f.trucking) || 0) +
           (Number(f.loadingUnloading) || 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.containerCode) return toast.error("Container Code is required");

    const totalINR = calculateGrandTotal(formData);
    const newRecord = { ...formData, id: Date.now(), totalINR };
    save([newRecord, ...rows]);
    setFormData(emptyForm);
    toast.success("Entry Saved Successfully");
  };

  const deleteRow = (id) => {
    if(confirm("Confirm deletion of this shipping record?")) {
      save(rows.filter(r => r.id !== id));
      toast.error("Entry Removed");
    }
  };
// --- ADD THIS FILTER LOGIC HERE ---
  const filteredRows = rows.filter(r => 
    (r.containerCode || "").toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 lg:p-8">
      <Toaster position="top-center" richColors />
      
      <div className="max-w-[1600px] mx-auto">
        <header className="flex items-center justify-between mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard/accounts')} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Logistics & Shipping Ledger</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Full Container Tracking</p>
            </div>
          </div>
          <div className="flex gap-8">
            <SummaryStat label="Active Containers" value={rows.length} color="blue" />
            <SummaryStat label="Total Volume (INR)" value={`₹${rows.reduce((a,b)=>a+b.totalINR, 0).toLocaleString()}`} color="indigo" />
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* --- LEFT: COMPREHENSIVE FORM --- */}
          <div className="xl:col-span-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden sticky top-8">
              <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2 italic"><FileText className="w-5 h-5"/> New Shipment Entry</h2>
                <Ship className="w-6 h-6 opacity-50" />
              </div>
              
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Section 1: Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="Loading From" value={formData.loadingFrom} onChange={v => setFormData({...formData, loadingFrom: v})} />
                  <FormInput label="Container Code" value={formData.containerCode} onChange={v => setFormData({...formData, containerCode: v})} />
                  <FormInput label="CTN Count" type="number" value={formData.ctn} onChange={v => setFormData({...formData, ctn: v})} />
                  <FormInput label="Loading Date" type="date" value={formData.loadingDate} onChange={v => setFormData({...formData, loadingDate: v})} />
                </div>

                {/* Section 2: Freight */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-blue-500 uppercase mb-3 tracking-widest">Freight & FOB Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput label="Freight USD/RMB" type="number" value={formData.freightUSD} onChange={v => setFormData({...formData, freightUSD: v})} />
                    <FormInput label="Freight INR" type="number" value={formData.freightINR} onChange={v => setFormData({...formData, freightINR: v})} />
                    <FormInput label="FOB Terms" type="number" value={formData.fobTerms} onChange={v => setFormData({...formData, fobTerms: v})} />
                    <FormInput label="Delivery Date" type="date" value={formData.deliveryDate} onChange={v => setFormData({...formData, deliveryDate: v})} />
                  </div>
                </div>

                {/* Section 3: Local Charges (Matches Your List) */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-emerald-500 uppercase mb-3 tracking-widest">India Local Charges</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput label="CHA" type="number" value={formData.cha} onChange={v => setFormData({...formData, cha: v})} />
                    <FormInput label="CFS, DO, YARD" type="number" value={formData.cfsDoYard} onChange={v => setFormData({...formData, cfsDoYard: v})} />
                    <FormInput label="Scanning" type="number" value={formData.scanning} onChange={v => setFormData({...formData, scanning: v})} />
                    <FormInput label="SIMS & PIMS" type="number" value={formData.simsPims} onChange={v => setFormData({...formData, simsPims: v})} />
                    <FormInput label="Duty Approx" type="number" value={formData.duty} onChange={v => setFormData({...formData, duty: v})} />
                    <FormInput label="Penalty" type="number" value={formData.penalty} onChange={v => setFormData({...formData, penalty: v})} />
                  </div>
                </div>

                {/* Section 4: Final Add-ons */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-orange-500 uppercase mb-3 tracking-widest underline">Add: Transportation</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput label="Trucking" type="number" value={formData.trucking} onChange={v => setFormData({...formData, trucking: v})} />
                    <FormInput label="Unloading" type="number" value={formData.loadingUnloading} onChange={v => setFormData({...formData, loadingUnloading: v})} />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200">
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3">
                  Commit To Ledger <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* --- RIGHT: SUMMARY TABLE --- */}
          <div className="xl:col-span-8 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="relative w-80">
                  <Search className="absolute left-4 top-3 w-4 h-4 text-slate-300" />
                  <input className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Filter by Container Code..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                      <th className="px-8 py-5 text-left">Shipment Detail</th>
                      <th className="px-6 py-5 text-right">Freight (INR)</th>
                      <th className="px-6 py-5 text-right">Local Exp.</th>
                      <th className="px-6 py-5 text-right">Grand Total</th>
                      <th className="px-6 py-5 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((row) => (
                      <tr key={row.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                              <Container className="w-6 h-6"/>
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-base leading-none mb-1 uppercase">{row.containerCode}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{row.loadingFrom} • {row.ctn} CTNS</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right font-mono font-bold text-slate-600">
                          ₹{Number(row.freightINR).toLocaleString()}
                        </td>
                        <td className="px-6 py-6 text-right">
                          <p className="font-mono text-slate-400">₹{(row.totalINR - row.freightINR).toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <span className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-black text-lg">
                            ₹{row.totalINR.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <button onClick={() => deleteRow(row.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// UI Components
function SummaryStat({ label, value, color }) {
  const themes = {
    blue: "text-blue-600 bg-blue-50",
    indigo: "text-indigo-600 bg-indigo-50"
  };
  return (
    <div className="text-right">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`text-xl font-black ${themes[color]} px-4 py-1 rounded-xl inline-block mt-1`}>{value}</p>
    </div>
  );
}

function FormInput({ label, type = "text", value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">{label}</label>
      <input 
        type={type}
        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm font-bold"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}