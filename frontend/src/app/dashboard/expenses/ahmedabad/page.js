"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Search,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Calendar
} from "lucide-react";
import { Toaster, toast } from "sonner";

export default function AhmedabadDashboard() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openingBalance, setOpeningBalance] = useState(1930);

  // Load Data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      const saved = localStorage.getItem("igpl_exp_ahmedabad");
      if (saved) {
        setEntries(JSON.parse(saved));
      } else {
        // Seed
        setEntries([
          {
            id: 1,
            date: "2024-12-01",
            particular: "OPENING BALANCE",
            contCode: "01-03-25",
            credit: 1930,
            debit: 0,
            mode: "Cash"
          }
        ]);
      }
      setLoading(false);
    }, 300);
  };

  const deleteEntry = (id) => {
    if (confirm("Delete this entry?")) {
      const updated = entries.filter((e) => e.id !== id);
      setEntries(updated);
      localStorage.setItem("igpl_exp_ahmedabad", JSON.stringify(updated));
      toast.success("Entry deleted");
    }
  };

  // Calculations
  const totalCredit = entries.reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0);
  const totalDebit = entries.reduce((sum, e) => sum + (parseFloat(e.debit) || 0), 0);
  const currentBalance = parseFloat(openingBalance) + totalCredit - totalDebit;

  const filteredEntries = entries.filter((e) =>
    e.particular?.toLowerCase().includes(search.toLowerCase()) ||
    e.contCode?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <Toaster position="top-right" />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/expenses")}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Ahmedabad Petty Cash</h1>
              <p className="text-slate-500 text-sm">Track daily office expenses and cash flow.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 border bg-white rounded-lg hover:bg-slate-50 text-slate-600 text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={() => router.push("/dashboard/expenses/ahmedabad/new")}
              className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> New Entry
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Current Balance */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Current Balance
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ₹{currentBalance.toLocaleString()}
              </div>
            </div>
            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          {/* Total In (Credit) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                Total Credit (In)
              </div>
              <div className="text-2xl font-bold text-emerald-700">
                +₹{totalCredit.toLocaleString()}
              </div>
            </div>
            <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>

          {/* Total Out (Debit) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
                Total Debit (Out)
              </div>
              <div className="text-2xl font-bold text-red-700">
                -₹{totalDebit.toLocaleString()}
              </div>
            </div>
            <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center text-red-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm transition-all"
              placeholder="Search by description or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Ledger List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading ledger...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No transactions found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Left: Date & Info */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center min-w-[60px] p-2 bg-slate-100 rounded-lg text-slate-600 text-xs font-bold">
                        <span>{new Date(entry.date).getDate()}</span>
                        <span className="uppercase">{new Date(entry.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm md:text-base">
                            {entry.particular}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            {entry.contCode && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
                                    {entry.contCode}
                                </span>
                            )}
                            <span className="text-xs text-slate-500">{entry.mode || 'Cash'}</span>
                        </div>
                    </div>
                  </div>

                  {/* Right: Amounts & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                     <div className="text-right">
                        {parseFloat(entry.credit) > 0 ? (
                            <span className="font-mono font-bold text-emerald-600 block">
                                +₹{parseFloat(entry.credit).toLocaleString()}
                            </span>
                        ) : (
                            <span className="font-mono font-bold text-red-600 block">
                                -₹{parseFloat(entry.debit).toLocaleString()}
                            </span>
                        )}
                     </div>
                     <button 
                        onClick={() => deleteEntry(entry.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}