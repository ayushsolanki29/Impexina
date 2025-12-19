"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Toaster, toast } from "sonner";

export default function NewPettyCashEntry() {
  const router = useRouter();
  const [type, setType] = useState("DEBIT"); // 'DEBIT' (Expense) or 'CREDIT' (Income)
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    contCode: "",
    particular: "",
    amount: "",
    mode: "Cash"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.particular || !formData.amount) {
        return toast.error("Please fill required fields");
    }

    const saved = JSON.parse(localStorage.getItem("igpl_exp_ahmedabad") || "[]");
    
    const newEntry = {
        id: Date.now(),
        date: formData.date,
        contCode: formData.contCode.toUpperCase(),
        particular: formData.particular,
        mode: formData.mode,
        credit: type === 'CREDIT' ? parseFloat(formData.amount) : 0,
        debit: type === 'DEBIT' ? parseFloat(formData.amount) : 0
    };

    const updated = [newEntry, ...saved];
    localStorage.setItem("igpl_exp_ahmedabad", JSON.stringify(updated));
    
    toast.success("Transaction Added");
    setTimeout(() => router.push("/dashboard/expenses/ahmedabad"), 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center items-start pt-10">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Add Transaction</h1>
        </div>

        {/* Type Toggle */}
        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex mb-6">
          <button
            onClick={() => setType("DEBIT")}
            className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              type === "DEBIT"
                ? "bg-red-50 text-red-700 shadow-sm border border-red-100"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> Expense (Out)
          </button>
          <button
            onClick={() => setType("CREDIT")}
            className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              type === "CREDIT"
                ? "bg-green-50 text-green-700 shadow-sm border border-green-100"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" /> Deposit (In)
          </button>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
            
            {/* Amount */}
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                    Amount (₹)
                </label>
                <div className="relative">
                    <input 
                        type="number"
                        autoFocus
                        placeholder="0.00"
                        className={`w-full pl-4 pr-4 py-3 border rounded-lg outline-none text-xl font-mono font-bold transition-all ${
                            type === 'DEBIT' 
                                ? 'border-red-200 focus:border-red-500 text-red-700' 
                                : 'border-green-200 focus:border-green-500 text-green-700'
                        }`}
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                </div>
            </div>

            {/* Particular */}
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                    Description / Particular
                </label>
                <input 
                    type="text"
                    placeholder="e.g. Tea & Snacks"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 text-slate-900"
                    value={formData.particular}
                    onChange={e => setFormData({...formData, particular: e.target.value})}
                />
            </div>

            {/* Container Code & Date */}
            <div className="grid grid-cols-1 gap-4">
              
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                        Date
                    </label>
                    <input 
                        type="date"
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 text-slate-600"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                </div>
            </div>

            {/* Mode */}
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                    Payment Mode
                </label>
                <select 
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-slate-400 bg-white text-slate-900"
                    value={formData.mode}
                    onChange={e => setFormData({...formData, mode: e.target.value})}
                >
                    <option>Cash</option>
                    <option>Online / UPI</option>
                    <option>Cheque</option>
                    <option>Self</option>
                </select>
            </div>

            <div className="pt-4">
                <button 
                    type="submit"
                    className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${
                        type === 'DEBIT' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    <Save className="w-5 h-5" /> Save Transaction
                </button>
            </div>

        </form>
      </div>
    </div>
  );
}