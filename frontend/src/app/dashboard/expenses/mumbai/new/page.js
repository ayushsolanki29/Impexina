"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Truck, Wallet } from "lucide-react";
import { Toaster, toast } from "sonner";

export default function NewEntryPage() {
  const router = useRouter();
  const [entryType, setEntryType] = useState("EXPENSE"); // 'EXPENSE' or 'ADVANCE'
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    code: "", // For expense
    advanceNote: "Office Advance", // For advance
    advanceAmount: "", // For advance
    items: [{ label: "UNLOADING", amount: 5500 }], // For expense
  });

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { label: "", amount: "" }],
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const handleSave = () => {
    if (entryType === "EXPENSE" && !formData.code) {
      return toast.error("Please enter a container code");
    }
    if (entryType === "ADVANCE" && !formData.advanceAmount) {
      return toast.error("Please enter an amount");
    }

    const saved = JSON.parse(localStorage.getItem("igpl_mumbai_ledger") || "[]");
    
    const newEntry = {
      id: Date.now(),
      type: entryType,
      date: formData.date,
      ...(entryType === "EXPENSE"
        ? {
            code: formData.code.toUpperCase(),
            items: formData.items.filter(i => i.label || i.amount),
            total: calculateTotal(),
          }
        : {
            note: formData.advanceNote,
            total: parseFloat(formData.advanceAmount),
          }),
    };

    const updated = [newEntry, ...saved];
    localStorage.setItem("igpl_mumbai_ledger", JSON.stringify(updated));
    
    toast.success("Entry Saved Successfully");
    setTimeout(() => router.push("/dashboard/expenses/mumbai"), 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Create New Entry</h1>
        </div>

        {/* Toggle Type */}
        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex mb-6">
          <button
            onClick={() => setEntryType("EXPENSE")}
            className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              entryType === "EXPENSE"
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Truck className="w-4 h-4" /> Container Expense
          </button>
          <button
            onClick={() => setEntryType("ADVANCE")}
            className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              entryType === "ADVANCE"
                ? "bg-emerald-50 text-emerald-700 shadow-sm"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Wallet className="w-4 h-4" /> Office Advance
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">
            
            {/* Date Field (Common) */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Date</label>
              <input 
                type="date"
                className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 transition-colors"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>

            {/* --- ADVANCE FORM --- */}
            {entryType === "ADVANCE" && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Amount (₹)</label>
                  <input 
                    type="number"
                    placeholder="0.00"
                    className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 transition-colors text-lg font-mono"
                    value={formData.advanceAmount}
                    onChange={(e) => setFormData({...formData, advanceAmount: e.target.value})}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description / Note</label>
                  <input 
                    type="text"
                    placeholder="e.g. Cash Deposit"
                    className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 transition-colors"
                    value={formData.advanceNote}
                    onChange={(e) => setFormData({...formData, advanceNote: e.target.value})}
                  />
                </div>
              </>
            )}

            {/* --- EXPENSE FORM --- */}
            {entryType === "EXPENSE" && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Container Code</label>
                  <input 
                    type="text"
                    placeholder="e.g. PSCT-72"
                    className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 transition-colors font-bold uppercase"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    autoFocus
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-slate-500 uppercase">Expense Items</label>
                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      Total: ₹{calculateTotal().toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3">
                        <input 
                          className="flex-1 p-2 text-sm border border-slate-300 rounded outline-none uppercase placeholder:normal-case"
                          placeholder="Particular (e.g. Tea)"
                          value={item.label}
                          onChange={(e) => handleItemChange(idx, 'label', e.target.value)}
                        />
                        <input 
                          type="number"
                          className="w-24 p-2 text-sm border border-slate-300 rounded outline-none text-right font-mono"
                          placeholder="0"
                          value={item.amount}
                          onChange={(e) => handleItemChange(idx, 'amount', e.target.value)}
                        />
                        <button 
                          onClick={() => removeItem(idx)}
                          className="text-slate-400 hover:text-red-500 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={addItem}
                    className="w-full mt-4 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-white transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Item Row
                  </button>
                </div>
              </>
            )}

          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button 
              onClick={handleSave}
              className={`px-8 py-3 rounded-lg text-white font-bold shadow-md transition-transform active:scale-95 flex items-center gap-2 ${
                entryType === 'ADVANCE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              <Save className="w-4 h-4" /> Save Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}