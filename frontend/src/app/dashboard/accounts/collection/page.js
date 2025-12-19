"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Toaster, toast } from "sonner";

export default function PaymentCollectionDashboard() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Load Data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      const saved = localStorage.getItem("igpl_payment_collection");
      if (saved) {
        setEntries(JSON.parse(saved));
      } else {
        // Seed Data based on your uploaded image
        const seed = [
          {
            id: 1,
            clientName: "Ashok (Padharya)",
            expectedDate: "",
            amount24_25: 0,
            addCompany: 0,
            amount25_26: 4121,
            advance: 0,
            highlight: true // Simulating the yellow highlight
          },
          {
            id: 2,
            clientName: "Abhishek Agrawal",
            expectedDate: "",
            amount24_25: 0,
            addCompany: 0,
            amount25_26: 25200,
            advance: 0,
            highlight: true
          },
          {
            id: 3,
            clientName: "Bhavesh Bhai",
            expectedDate: "",
            amount24_25: 0,
            addCompany: 173000,
            amount25_26: -263000,
            advance: 0,
            highlight: true
          },
          {
            id: 4,
            clientName: "Aditya Agrawal",
            expectedDate: "",
            amount24_25: 0,
            addCompany: 0,
            amount25_26: 452623,
            advance: 0,
            highlight: false
          },
          {
            id: 5,
            clientName: "Kuber",
            expectedDate: "",
            amount24_25: 0,
            addCompany: 1079000,
            amount25_26: 24619,
            advance: 0,
            highlight: true
          }
        ];
        setEntries(seed);
        localStorage.setItem("igpl_payment_collection", JSON.stringify(seed));
      }
      setLoading(false);
    }, 300);
  };

  const deleteEntry = (id) => {
    if (confirm("Delete this client record?")) {
      const updated = entries.filter((e) => e.id !== id);
      setEntries(updated);
      localStorage.setItem("igpl_payment_collection", JSON.stringify(updated));
      toast.success("Record deleted");
    }
  };

  // Calculations
  const stats = useMemo(() => {
    return entries.reduce(
      (acc, curr) => ({
        total24_25: acc.total24_25 + (parseFloat(curr.amount24_25) || 0),
        total25_26: acc.total25_26 + (parseFloat(curr.amount25_26) || 0),
        totalAdvance: acc.totalAdvance + (parseFloat(curr.advance) || 0),
      }),
      { total24_25: 0, total25_26: 0, totalAdvance: 0 }
    );
  }, [entries]);

  const filteredEntries = entries.filter((e) =>
    e.clientName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto">
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
              <h1 className="text-2xl font-bold text-slate-900">Payment Collection</h1>
              <p className="text-slate-500 text-sm">Track client dues, company adds, and advances.</p>
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
              onClick={() => router.push("/dashboard/expenses/collection/new")}
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Client
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total 24-25 Amount
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ₹{stats.total24_25.toLocaleString()}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-purple-200 bg-purple-50/30 shadow-sm">
            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
              Total 25-26 Amount
            </div>
            <div className="text-2xl font-bold text-purple-700">
              ₹{stats.total25_26.toLocaleString()}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Advances
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              ₹{stats.totalAdvance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm transition-all"
              placeholder="Search Client Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table View (Replicating the Image Structure) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading data...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No records found. Add a new client.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Client Name</th>
                    <th className="px-6 py-4">Expected Date</th>
                    <th className="px-6 py-4 text-right">24-25 (Amt)</th>
                    <th className="px-6 py-4 text-right">Add Company</th>
                    <th className="px-6 py-4 text-right">25-26 (Amt)</th>
                    <th className="px-6 py-4 text-right">Advance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.map((entry) => (
                    <tr 
                      key={entry.id} 
                      className={`hover:bg-slate-50 transition-colors group ${
                        entry.highlight ? "bg-amber-50/50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {entry.clientName}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {entry.expectedDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {entry.expectedDate}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-600">
                        {entry.amount24_25 ? `₹${entry.amount24_25.toLocaleString()}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-blue-600">
                         {entry.addCompany ? `₹${entry.addCompany.toLocaleString()}` : "-"}
                      </td>
                      <td className={`px-6 py-4 text-right font-mono font-bold ${
                        entry.amount25_26 < 0 ? 'text-red-600' : 'text-slate-900'
                      }`}>
                         {entry.amount25_26 ? `₹${entry.amount25_26.toLocaleString()}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-emerald-600">
                         {entry.advance ? `₹${entry.advance.toLocaleString()}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Footer Note from Image */}
        <div className="mt-4 text-xs text-slate-400 italic">
          * (SCEx/H) Debit no. 506. H&H - 24/3/2022 Weight Scale Diff - Input token or not
        </div>
      </div>
    </div>
  );
}