"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import {
  Save,
  Plus,
  Trash2,
  ChevronLeft,
  Calendar,
  Info
} from "lucide-react";

const CONTAINER_SUMMARY_KEY = "igpl_container_summary_v1";

// --- Utility Functions ---

const generateUniqueId = () => {
  return `summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const EMPTY_CONTAINER = {
  no: 1,
  containerCode: "",
  ctn: 0,
  loadingDate: new Date().toISOString().split('T')[0], // Default to today
  eta: "",
  dollar: 0,
  dollarRate: 89.7,
  inr: 0,
  duty: 0,
  total: 0,
  gst: 0,
  totalDuty: 0,
  doCharge: 58000,
  cfs: 21830,
  finalAmount: 0,
  shippingLine: "",
  bl: "",
  containerNo: "",
  sims: "",
  status: "Loaded"
};

export default function CreateContainerSummary() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Initial State for a NEW summary
  const [formData, setFormData] = useState({
    id: generateUniqueId(),
    month: "",
    status: "draft",
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    totals: {
      totalContainers: 0,
      totalCTN: 0,
      totalDollar: 0,
      totalINR: 0,
      totalFinalAmount: 0
    }
  });

  const [containers, setContainers] = useState([]);

  // --- Initialization ---
  useEffect(() => {
    // Set default month (e.g., "December 2024")
    const now = new Date();
    const monthStr = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    setFormData(prev => ({ ...prev, month: monthStr }));
    setContainers([{ ...EMPTY_CONTAINER, no: 1 }]);
    setLoading(false);
  }, []);

  // --- Calculations ---
  useEffect(() => {
    const totals = containers.reduce((acc, container) => ({
      totalContainers: containers.length,
      totalCTN: acc.totalCTN + (Number(container.ctn) || 0),
      totalDollar: acc.totalDollar + (Number(container.dollar) || 0),
      totalINR: acc.totalINR + (Number(container.inr) || 0),
      totalFinalAmount: acc.totalFinalAmount + (Number(container.finalAmount) || 0)
    }), {
      totalContainers: 0, totalCTN: 0, totalDollar: 0, totalINR: 0, totalFinalAmount: 0
    });
    
    setFormData(prev => ({ ...prev, totals }));
  }, [containers]);

  const calculateContainerFields = (container) => {
    const ctn = Number(container.ctn) || 0;
    const dollar = Number(container.dollar) || 0;
    const dollarRate = Number(container.dollarRate) || 89.7;
    
    // Financial Logic
    const inr = dollar * dollarRate;
    const duty = inr * 0.165; // 16.5% Duty
    const total = inr + duty;
    const gst = total * 0.18; // 18% GST
    const totalDuty = duty + gst;
    
    const doCharge = Number(container.doCharge) || 58000;
    const cfs = Number(container.cfs) || 21830;
    const finalAmount = totalDuty + doCharge + cfs;
    
    return {
      ...container,
      inr: parseFloat(inr.toFixed(2)),
      duty: parseFloat(duty.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      gst: parseFloat(gst.toFixed(2)),
      totalDuty: parseFloat(totalDuty.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2))
    };
  };

  // --- Handlers ---
  const handleContainerChange = (index, field, value) => {
    const newContainers = [...containers];
    let processedValue = value;

    // Convert numbers
    if (['dollar', 'dollarRate', 'ctn', 'doCharge', 'cfs'].includes(field)) {
      processedValue = value === '' ? 0 : parseFloat(value) || 0;
    }

    newContainers[index] = { ...newContainers[index], [field]: processedValue };

    // Recalculate if financial fields change
    if (['dollar', 'dollarRate', 'ctn', 'doCharge', 'cfs'].includes(field)) {
      newContainers[index] = calculateContainerFields(newContainers[index]);
    }

    setContainers(newContainers);
  };

  const addContainer = () => {
    setContainers([...containers, { ...EMPTY_CONTAINER, no: containers.length + 1 }]);
  };

  const removeContainer = (index) => {
    if (containers.length <= 1) return toast.error("At least one container is required");
    const newContainers = containers.filter((_, i) => i !== index).map((c, i) => ({ ...c, no: i + 1 }));
    setContainers(newContainers);
  };

  const handleSave = () => {
    if (!formData.month.trim()) return toast.error("Month name is required");
    if (containers.length === 0) return toast.error("Add at least one container");

    const summaries = JSON.parse(localStorage.getItem(CONTAINER_SUMMARY_KEY) || "[]");

    // Check Duplicate Month
    const exists = summaries.find(s => s.month.toLowerCase() === formData.month.trim().toLowerCase());
    if (exists && !confirm(`Summary for "${formData.month}" already exists. Create duplicate?`)) {
      return;
    }

    const newSummary = {
      ...formData,
      containers,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    localStorage.setItem(CONTAINER_SUMMARY_KEY, JSON.stringify([newSummary, ...summaries]));
    toast.success("Summary created successfully!");
    router.push("/dashboard/container-summary");
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Initializing...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-20">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all text-slate-500"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Create New Summary</h1>
              <p className="text-slate-500 text-sm">Add containers and calculate duties for the month.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
               onClick={handleSave}
               className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95"
            >
               <Save className="w-5 h-5" /> Save Summary
            </button>
          </div>
        </div>

        {/* Month & Meta Data */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Month Name</label>
                 <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={formData.month}
                      onChange={e => setFormData({...formData, month: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. December 2024"
                    />
                 </div>
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                 <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                 >
                    <option value="draft">Draft (Work in Progress)</option>
                    <option value="active">Active (Finalized)</option>
                 </select>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
                 <div>
                    <div className="text-blue-600 text-xs font-bold uppercase">Total Final Amount</div>
                    <div className="text-2xl font-bold text-blue-900">₹{formData.totals.totalFinalAmount.toLocaleString()}</div>
                 </div>
                 <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Info className="w-5 h-5" />
                 </div>
              </div>
           </div>
        </div>

        {/* Container Cards Loop */}
        <div className="space-y-6">
           {containers.map((container, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group">
                 {/* Card Header */}
                 <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                          {container.no}
                       </span>
                       <span className="font-bold text-slate-700">Container Details</span>
                    </div>
                    {containers.length > 1 && (
                       <button onClick={() => removeContainer(index)} className="text-slate-400 hover:text-red-500 transition-colors p-2">
                          <Trash2 className="w-5 h-5" />
                       </button>
                    )}
                 </div>

                 <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    
                    {/* Identification */}
                    <div className="space-y-4">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Identification</h4>
                       <div>
                          <label className="text-xs font-medium text-slate-600">Container Code</label>
                          <input 
                             type="text" 
                             value={container.containerCode}
                             onChange={e => handleContainerChange(index, 'containerCode', e.target.value)}
                             className="w-full mt-1 p-2 border rounded-md text-sm focus:border-blue-500 outline-none" 
                             placeholder="IMPAK-10"
                          />
                       </div>
                       <div>
                          <label className="text-xs font-medium text-slate-600">CTN (Cartons)</label>
                          <input 
                             type="number" 
                             value={container.ctn}
                             onChange={e => handleContainerChange(index, 'ctn', e.target.value)}
                             className="w-full mt-1 p-2 border rounded-md text-sm focus:border-blue-500 outline-none" 
                          />
                       </div>
                       <div>
                           <label className="text-xs font-medium text-slate-600">Status</label>
                           <select 
                              value={container.status}
                              onChange={e => handleContainerChange(index, 'status', e.target.value)}
                              className="w-full mt-1 p-2 border rounded-md text-sm bg-white outline-none"
                           >
                              <option>Loaded</option>
                              <option>Insea</option>
                              <option>Delivered</option>
                           </select>
                       </div>
                    </div>

                    {/* Dates & Shipping */}
                    <div className="space-y-4">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Logistics</h4>
                       <div>
                          <label className="text-xs font-medium text-slate-600">Loading Date</label>
                          <input 
                             type="date" 
                             value={container.loadingDate}
                             onChange={e => handleContainerChange(index, 'loadingDate', e.target.value)}
                             className="w-full mt-1 p-2 border rounded-md text-sm focus:border-blue-500 outline-none" 
                          />
                       </div>
                       <div>
                          <label className="text-xs font-medium text-slate-600">Shipping Line</label>
                          <input 
                             type="text" 
                             value={container.shippingLine}
                             onChange={e => handleContainerChange(index, 'shippingLine', e.target.value)}
                             className="w-full mt-1 p-2 border rounded-md text-sm focus:border-blue-500 outline-none" 
                             placeholder="e.g. KMTC"
                          />
                       </div>
                       <div>
                          <label className="text-xs font-medium text-slate-600">Container No.</label>
                          <input 
                             type="text" 
                             value={container.containerNo}
                             onChange={e => handleContainerChange(index, 'containerNo', e.target.value)}
                             className="w-full mt-1 p-2 border rounded-md text-sm focus:border-blue-500 outline-none" 
                             placeholder="ABCD1234567"
                          />
                       </div>
                    </div>

                    {/* Financial Inputs */}
                    <div className="space-y-4">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Costs (Input)</h4>
                       <div className="grid grid-cols-2 gap-3">
                          <div>
                             <label className="text-xs font-medium text-slate-600">Dollar ($)</label>
                             <input 
                                type="number" 
                                value={container.dollar}
                                onChange={e => handleContainerChange(index, 'dollar', e.target.value)}
                                className="w-full mt-1 p-2 border rounded-md text-sm focus:border-blue-500 outline-none" 
                             />
                          </div>
                          <div>
                             <label className="text-xs font-medium text-slate-600">Rate (₹)</label>
                             <input 
                                type="number" 
                                value={container.dollarRate}
                                onChange={e => handleContainerChange(index, 'dollarRate', e.target.value)}
                                className="w-full mt-1 p-2 border rounded-md text-sm focus:border-blue-500 outline-none" 
                             />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <div>
                             <label className="text-xs font-medium text-slate-600">DO Charge</label>
                             <input 
                                type="number" 
                                value={container.doCharge}
                                onChange={e => handleContainerChange(index, 'doCharge', e.target.value)}
                                className="w-full mt-1 p-2 border rounded-md text-sm focus:border-blue-500 outline-none" 
                             />
                          </div>
                          <div>
                             <label className="text-xs font-medium text-slate-600">CFS</label>
                             <input 
                                type="number" 
                                value={container.cfs}
                                onChange={e => handleContainerChange(index, 'cfs', e.target.value)}
                                className="w-full mt-1 p-2 border rounded-md text-sm focus:border-blue-500 outline-none" 
                             />
                          </div>
                       </div>
                    </div>

                    {/* Calculated Results */}
                    <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Calculations</h4>
                       
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-500">INR Value:</span>
                          <span className="font-semibold">₹{container.inr.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Duty (16.5%):</span>
                          <span className="font-semibold">₹{container.duty.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-500">GST (18%):</span>
                          <span className="font-semibold">₹{container.gst.toLocaleString()}</span>
                       </div>
                       <div className="pt-2 border-t border-slate-200 mt-2">
                          <div className="flex justify-between text-sm font-bold text-blue-700">
                             <span>Final Amount:</span>
                             <span>₹{container.finalAmount.toLocaleString()}</span>
                          </div>
                       </div>
                    </div>

                 </div>
              </div>
           ))}
        </div>

        <button 
           onClick={addContainer}
           className="w-full mt-6 py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
        >
           <Plus className="w-5 h-5" /> Add Another Container
        </button>

      </div>
    </div>
  );
}