"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  ArrowLeft, 
  Trash2, 
  Coins, 
  Search,
  Download,
  Wallet
} from "lucide-react";
import { Toaster, toast } from "sonner";

export default function DavidSheet() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("igpl_david_sheet");
    if (saved) setRows(JSON.parse(saved));
    else {
        // Initial Seed Data
        setRows([
            { id: 1, date: "", particulars: "OCTOBER BALANCE", debitRMB: 365543, creditRMB: 0, debitUSD: 0, creditUSD: 0 }
        ])
    }
  }, []);

  const save = (data) => {
    setRows(data);
    localStorage.setItem("igpl_david_sheet", JSON.stringify(data));
  };

  const addRow = () => {
    const newRow = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      particulars: "",
      debitRMB: "", creditRMB: "",
      debitUSD: "", creditUSD: ""
    };
    save([...rows, newRow]);
    // Scroll to bottom
    setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const updateRow = (id, field, value) => {
    const updated = rows.map(r => r.id === id ? { ...r, [field]: value } : r);
    save(updated);
  };

  const deleteRow = (id) => {
     if(confirm("Are you sure you want to delete this line?")) {
        save(rows.filter(r => r.id !== id));
        toast.success("Entry removed");
     }
  }

  // Filter rows
  const filteredRows = rows.filter(r => 
    (r.particulars || "").toLowerCase().includes(search.toLowerCase())
  );

  // Calculate Totals
  const totals = rows.reduce((acc, r) => ({
    dRMB: acc.dRMB + (Number(r.debitRMB) || 0),
    cRMB: acc.cRMB + (Number(r.creditRMB) || 0),
    dUSD: acc.dUSD + (Number(r.debitUSD) || 0),
    cUSD: acc.cUSD + (Number(r.creditUSD) || 0),
  }), { dRMB: 0, cRMB: 0, dUSD: 0, cUSD: 0 });

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors />
      
      {/* --- Top Header with Actions --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
         <div className="max-w-[1400px] mx-auto px-4 py-3">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 
                 {/* Left: Title & Back */}
                 <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.push('/dashboard/accounts')} 
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            David Impex 
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">
                                Forex Ledger
                            </span>
                        </h1>
                    </div>
                 </div>

                 {/* Right: Quick Stats */}
                 <div className="flex items-center gap-4">
                     {/* RMB Card */}
                     <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-full">
                            <span className="font-bold text-xs">¥</span>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-semibold text-amber-700 tracking-wide">RMB Net</div>
                            <div className="font-mono font-bold text-slate-900">
                                {(totals.dRMB - totals.cRMB).toLocaleString()}
                            </div>
                        </div>
                     </div>

                     {/* USD Card */}
                     <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                            <span className="font-bold text-xs">$</span>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-semibold text-emerald-700 tracking-wide">USD Net</div>
                            <div className="font-mono font-bold text-slate-900">
                                {(totals.dUSD - totals.cUSD).toLocaleString()}
                            </div>
                        </div>
                     </div>
                 </div>
             </div>
         </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-[1400px] mx-auto p-4 md:p-6">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
            <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Search particulars..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => toast.info("Export feature coming soon!")}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 shadow-sm transition-all"
                >
                    <Download className="w-4 h-4" /> Export
                </button>
                <button 
                    onClick={addRow} 
                    className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white font-medium text-sm rounded-lg hover:bg-slate-800 shadow-md transition-all hover:shadow-lg active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Add Transaction
                </button>
            </div>
        </div>

        {/* --- Ledger Table --- */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)]">
            <div className="overflow-auto flex-1">
                <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <th className="font-semibold px-4 py-3 text-left w-32">Date</th>
                            <th className="font-semibold px-4 py-3 text-left min-w-[280px]">Particulars</th>
                            
                            {/* RMB Group */}
                            <th className="font-semibold px-2 py-3 text-center bg-amber-50/50 border-l border-amber-100 w-32 text-amber-800">
                                Debit (RMB)
                            </th>
                            <th className="font-semibold px-2 py-3 text-center bg-amber-50/50 border-r border-amber-100 w-32 text-amber-800">
                                Credit (RMB)
                            </th>

                            {/* USD Group */}
                            <th className="font-semibold px-2 py-3 text-center bg-emerald-50/50 border-l border-emerald-100 w-32 text-emerald-800">
                                Debit (USD)
                            </th>
                            <th className="font-semibold px-2 py-3 text-center bg-emerald-50/50 w-32 text-emerald-800">
                                Credit (USD)
                            </th>
                            
                            <th className="w-12 px-2 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-20 text-slate-400">
                                    <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    No transactions found.
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map((row) => (
                                <tr key={row.id} className="group hover:bg-slate-50 transition-colors">
                                    {/* Date */}
                                    <td className="px-2 py-1 align-top border-r border-transparent group-hover:border-slate-200/50">
                                        <input 
                                            type="date" 
                                            className="w-full px-2 py-2 rounded border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white bg-transparent outline-none text-slate-600" 
                                            value={row.date} 
                                            onChange={e => updateRow(row.id, 'date', e.target.value)} 
                                        />
                                    </td>

                                    {/* Particulars */}
                                    <td className="px-2 py-1 align-top border-r border-transparent group-hover:border-slate-200/50">
                                        <textarea 
                                            rows={1}
                                            className="w-full px-3 py-2.5 rounded border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white bg-transparent outline-none font-medium text-slate-800 resize-none overflow-hidden" 
                                            placeholder="Enter description..." 
                                            value={row.particulars} 
                                            onChange={e => {
                                                updateRow(row.id, 'particulars', e.target.value);
                                                e.target.style.height = 'auto';
                                                e.target.style.height = e.target.scrollHeight + 'px';
                                            }}
                                            style={{ minHeight: '40px' }}
                                        />
                                    </td>

                                    {/* RMB Inputs */}
                                    <td className="px-2 py-1 align-top bg-amber-50/20 group-hover:bg-amber-50/40 border-l border-amber-100/50">
                                        <input 
                                            type="number" 
                                            className="w-full px-2 py-2 text-right rounded border border-transparent hover:border-amber-300 focus:border-amber-500 focus:bg-white bg-transparent outline-none font-mono" 
                                            placeholder="-" 
                                            value={row.debitRMB} 
                                            onChange={e => updateRow(row.id, 'debitRMB', e.target.value)} 
                                        />
                                    </td>
                                    <td className="px-2 py-1 align-top bg-amber-50/20 group-hover:bg-amber-50/40 border-r border-amber-100/50">
                                        <input 
                                            type="number" 
                                            className="w-full px-2 py-2 text-right rounded border border-transparent hover:border-amber-300 focus:border-amber-500 focus:bg-white bg-transparent outline-none font-mono text-red-600" 
                                            placeholder="-" 
                                            value={row.creditRMB} 
                                            onChange={e => updateRow(row.id, 'creditRMB', e.target.value)} 
                                        />
                                    </td>

                                    {/* USD Inputs */}
                                    <td className="px-2 py-1 align-top bg-emerald-50/20 group-hover:bg-emerald-50/40 border-l border-emerald-100/50">
                                        <input 
                                            type="number" 
                                            className="w-full px-2 py-2 text-right rounded border border-transparent hover:border-emerald-300 focus:border-emerald-500 focus:bg-white bg-transparent outline-none font-mono" 
                                            placeholder="-" 
                                            value={row.debitUSD} 
                                            onChange={e => updateRow(row.id, 'debitUSD', e.target.value)} 
                                        />
                                    </td>
                                    <td className="px-2 py-1 align-top bg-emerald-50/20 group-hover:bg-emerald-50/40">
                                        <input 
                                            type="number" 
                                            className="w-full px-2 py-2 text-right rounded border border-transparent hover:border-emerald-300 focus:border-emerald-500 focus:bg-white bg-transparent outline-none font-mono text-red-600" 
                                            placeholder="-" 
                                            value={row.creditUSD} 
                                            onChange={e => updateRow(row.id, 'creditUSD', e.target.value)} 
                                        />
                                    </td>

                                    {/* Delete */}
                                    <td className="px-2 py-1 align-middle text-center">
                                        <button 
                                            onClick={() => deleteRow(row.id)} 
                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete Entry"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Footer Totals --- */}
            <div className="bg-slate-50 border-t border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-end gap-8 text-sm">
                    <div className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Totals</div>
                    
                    {/* RMB Summary */}
                    <div className="flex gap-6 border-r border-slate-300 pr-8">
                        <div className="text-right">
                            <div className="text-[10px] text-amber-700/70 uppercase">Total Debit</div>
                            <div className="font-bold text-slate-700 font-mono">¥{totals.dRMB.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-amber-700/70 uppercase">Total Credit</div>
                            <div className="font-bold text-red-600 font-mono">¥{totals.cRMB.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* USD Summary */}
                    <div className="flex gap-6">
                        <div className="text-right">
                            <div className="text-[10px] text-emerald-700/70 uppercase">Total Debit</div>
                            <div className="font-bold text-slate-700 font-mono">${totals.dUSD.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-emerald-700/70 uppercase">Total Credit</div>
                            <div className="font-bold text-red-600 font-mono">${totals.cUSD.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}