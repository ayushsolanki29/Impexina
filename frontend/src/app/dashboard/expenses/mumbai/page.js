"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Truck,
  Wallet,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { Toaster, toast } from "sonner";

export default function MumbaiLedgerDashboard() {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [filterType, setFilterType] = useState("ALL"); // ALL, EXPENSE, ADVANCE

  // Load Data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      const saved = localStorage.getItem("igpl_mumbai_ledger");
      if (saved) {
        setEntries(JSON.parse(saved));
      } else {
        // Seed Data
        const seed = [
          {
            id: 1,
            type: "ADVANCE",
            date: "2025-10-01",
            note: "Office Advance",
            total: 20000
          },
          {
            id: 2,
            type: "EXPENSE",
            date: "2025-10-04",
            code: "PSCT-72",
            items: [
              { label: "UNLOADING", amount: 5500 },
              { label: "TEA", amount: 180 },
              { label: "LUNCH", amount: 1200 },
            ],
            total: 6880
          }
        ];
        setEntries(seed);
        localStorage.setItem("igpl_mumbai_ledger", JSON.stringify(seed));
      }
      setLoading(false);
    }, 300);
  };

  const deleteEntry = (id) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      const updated = entries.filter((e) => e.id !== id);
      setEntries(updated);
      localStorage.setItem("igpl_mumbai_ledger", JSON.stringify(updated));
      toast.success("Entry deleted");
    }
  };

  const toggleRow = (id) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  // Calculations
  const stats = useMemo(() => {
    return entries.reduce(
      (acc, curr) => ({
        expense: acc.expense + (curr.type === "EXPENSE" ? parseFloat(curr.total || 0) : 0),
        advance: acc.advance + (curr.type === "ADVANCE" ? parseFloat(curr.total || 0) : 0),
      }),
      { expense: 0, advance: 0 }
    );
  }, [entries]);

  const balance = stats.advance - stats.expense;

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      e.code?.toLowerCase().includes(search.toLowerCase()) ||
      e.note?.toLowerCase().includes(search.toLowerCase()) ||
      e.date.includes(search);
    const matchesType = filterType === "ALL" || e.type === filterType;
    return matchesSearch && matchesType;
  });

  // Sort by date desc
  const sortedEntries = [...filteredEntries].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/expenses")}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Mumbai Ledger
              </h1>
              <p className="text-slate-500 text-sm">
                Track container expenses and office cash flow.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 border bg-white rounded-lg hover:bg-slate-50 text-slate-600"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={() => router.push("/dashboard/expenses/mumbai/new")}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> New Entry
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Total Expenses
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ₹{stats.expense.toLocaleString()}
              </div>
            </div>
            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Total Advances
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                ₹{stats.advance.toLocaleString()}
              </div>
            </div>
            <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div
            className={`bg-white p-5 rounded-xl border shadow-sm flex items-center justify-between ${
              balance < 0 ? "border-red-200 bg-red-50/30" : "border-blue-200 bg-blue-50/30"
            }`}
          >
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Net Balance
              </div>
              <div
                className={`text-2xl font-bold ${
                  balance < 0 ? "text-red-600" : "text-blue-600"
                }`}
              >
                ₹{balance.toLocaleString()}
              </div>
            </div>
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                balance < 0 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
              }`}
            >
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Search code, note, or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {["ALL", "EXPENSE", "ADVANCE"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  filterType === type
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                }`}
              >
                {type === "ALL" ? "All" : type === "EXPENSE" ? "Expenses" : "Advances"}
              </button>
            ))}
          </div>
        </div>

        {/* List View */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading ledger...</div>
          ) : sortedEntries.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No entries found. Start by creating a new entry.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sortedEntries.map((entry) => (
                <div key={entry.id} className="group hover:bg-slate-50 transition-colors">
                  <div className="p-4 flex items-center justify-between">
                    {/* Left Icon & Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-bold ${
                          entry.type === "ADVANCE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        <span>{new Date(entry.date).getDate()}</span>
                        <span className="uppercase text-[10px]">
                          {new Date(entry.date).toLocaleString("default", { month: "short" })}
                        </span>
                      </div>
                      
                      <div>
                        {entry.type === "ADVANCE" ? (
                          <>
                            <h3 className="font-bold text-slate-900">{entry.note || "Advance"}</h3>
                            <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">
                              Cash In
                            </span>
                          </>
                        ) : (
                          <>
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                              {entry.code}
                              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {entry.items?.length || 0} items
                              </span>
                            </h3>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Truck className="w-3 h-3" /> Container Expense
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Amount & Actions */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold font-mono ${
                            entry.type === "ADVANCE" ? "text-emerald-600" : "text-slate-900"
                          }`}
                        >
                          {entry.type === "ADVANCE" ? "+" : "-"} ₹
                          {parseFloat(entry.total).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {entry.type === "EXPENSE" && (
                          <button
                            onClick={() => toggleRow(entry.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            {expandedRows.has(entry.id) ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details for Expenses */}
                  {entry.type === "EXPENSE" && expandedRows.has(entry.id) && (
                    <div className="bg-slate-50/80 border-t border-slate-100 px-16 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                        {entry.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-sm border-b border-slate-200/60 pb-1 last:border-0"
                          >
                            <span className="text-slate-600 font-medium uppercase text-xs">
                              {item.label}
                            </span>
                            <span className="text-slate-900 font-mono">
                              ₹{parseFloat(item.amount).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}