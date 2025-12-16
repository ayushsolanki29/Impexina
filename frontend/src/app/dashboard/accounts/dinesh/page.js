"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  ArrowLeft, 
  Trash2, 
  Search, 
  Download, 
  TrendingUp,
  Briefcase
} from "lucide-react";
import { Toaster, toast } from "sonner";

export default function DineshSheet() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  // --- Data Loading & Saving ---
  useEffect(() => {
    const saved = localStorage.getItem("igpl_dinesh_sheet");
    if (saved) setRows(JSON.parse(saved));
  }, []);

  const save = (data) => {
    setRows(data);
    localStorage.setItem("igpl_dinesh_sheet", JSON.stringify(data));
  };

  // --- Actions ---
  const addRow = () => {
    const newRow = {
      id: Date.now(),
      supplier: "",
      paymentDate: new Date().toISOString().split('T')[0],
      amount: "",
      booking: "",
      rate: "",
      total: 0,
      paid: "",
      clientRef: ""
    };
    save([...rows, newRow]);
    
    // Smooth scroll to bottom
    setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const updateRow = (id, field, value) => {
    const updated = rows.map(r => {
      if (r.id === id) {
        const newData = { ...r, [field]: value };
        // Auto-calc Total: Booking * Rate
        if (field === 'booking' || field === 'rate') {
          const b = parseFloat(field === 'booking' ? value : r.booking) || 0;
          const rt = parseFloat(field === 'rate' ? value : r.rate) || 0;
          newData.total = Math.round(b * rt);
        }
        return newData;
      }
      return r;
    });
    save(updated);
  };

  const deleteRow = (id) => {
    if(confirm("Are you sure you want to delete this entry?")) {
        save(rows.filter(r => r.id !== id));
        toast.success("Row deleted");
    }
  };

  // --- Filtering & Calculations ---
  const filteredRows = rows.filter(r => 
    (r.supplier || "").toLowerCase().includes(search.toLowerCase()) || 
    (r.clientRef || "").toLowerCase().includes(search.toLowerCase())
  );

  const stats = rows.reduce((acc, r) => ({
    totalPayable: acc.totalPayable + (parseFloat(r.total) || 0),
    totalPaid: acc.totalPaid + (parseFloat(r.paid) || 0)
  }), { totalPayable: 0, totalPaid: 0 });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-center" richColors />
      
      {/* --- Sticky Header --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
         <div className="max-w-[1600px] mx-auto px-4 py-3">
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
                            Dineshbhai
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                                Booking Ledger 25-26
                            </span>
                        </h1>
                    </div>
                 </div>

                 {/* Right: Stats Cards */}
                 <div className="flex items-center gap-4 text-sm overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                     {/* Total Payable */}
                     <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm min-w-[180px]">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Total Payable</div>
                            <div className="font-bold text-slate-900 text-base">
                                ₹{stats.totalPayable.toLocaleString()}
                            </div>
                        </div>
                     </div>

                     {/* Total Paid */}
                     <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm min-w-[180px]">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full">
                            <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">Total Paid</div>
                            <div className="font-bold text-emerald-700 text-base">
                                ₹{stats.totalPaid.toLocaleString()}
                            </div>
                        </div>
                     </div>

                     {/* Balance */}
                     <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 border border-amber-100 rounded-lg shadow-sm min-w-[180px]">
                        <div>
                            <div className="text-[10px] uppercase font-bold text-amber-700/70 tracking-wide">Balance Due</div>
                            <div className="font-bold text-amber-700 text-lg">
                                ₹{(stats.totalPayable - stats.totalPaid).toLocaleString()}
                            </div>
                        </div>
                     </div>
                 </div>
             </div>
         </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-[1600px] mx-auto p-4 md:p-6">
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                    placeholder="Search Supplier or Client Ref..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="flex w-full sm:w-auto gap-2">
                <button 
                    onClick={() => toast.info("Export feature coming soon!")}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 shadow-sm transition-all"
                >
                    <Download className="w-4 h-4" /> Export
                </button>
                <button 
                    onClick={addRow} 
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 text-white font-medium text-sm rounded-lg hover:bg-emerald-700 shadow-md transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Add Entry
                </button>
            </div>
        </div>

        {/* --- Ledger Table Card --- */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-left w-48">Supplier</th>
                            <th className="px-4 py-3 text-left w-36">Payment Date</th>
                            <th className="px-4 py-3 text-right w-32">Amount</th>
                            <th className="px-4 py-3 text-right w-32 bg-blue-50/50 text-blue-700">Booking</th>
                            <th className="px-4 py-3 text-right w-24 bg-blue-50/50 text-blue-700">Rate</th>
                            <th className="px-4 py-3 text-right w-36 bg-emerald-50/50 text-emerald-700 border-l border-emerald-100">Total</th>
                            <th className="px-4 py-3 text-right w-36">Paid</th>
                            <th className="px-4 py-3 text-left min-w-[200px]">Client Ref</th>
                            <th className="px-2 py-3 w-12 text-center"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="text-center py-20 text-slate-400">
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                            <Search className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p>No entries found.</p>
                                        <button onClick={addRow} className="mt-2 text-emerald-600 hover:underline font-medium">Add your first entry</button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map((row) => (
                                <tr key={row.id} className="group hover:bg-slate-50 transition-colors">
                                    {/* Supplier */}
                                    <td className="px-2 py-1 align-top">
                                        <input 
                                            className="w-full px-2 py-2 rounded border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white bg-transparent outline-none font-bold text-slate-700 uppercase"
                                            placeholder="Supplier Name" 
                                            value={row.supplier} 
                                            onChange={e => updateRow(row.id, 'supplier', e.target.value)} 
                                        />
                                    </td>
                                    
                                    {/* Date */}
                                    <td className="px-2 py-1 align-top">
                                        <input 
                                            type="date" 
                                            className="w-full px-2 py-2 rounded border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white bg-transparent outline-none text-slate-600"
                                            value={row.paymentDate} 
                                            onChange={e => updateRow(row.id, 'paymentDate', e.target.value)} 
                                        />
                                    </td>

                                    {/* Amount */}
                                    <td className="px-2 py-1 align-top">
                                        <input 
                                            type="number" 
                                            className="w-full px-2 py-2 text-right rounded border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white bg-transparent outline-none text-slate-600"
                                            placeholder="-" 
                                            value={row.amount} 
                                            onChange={e => updateRow(row.id, 'amount', e.target.value)} 
                                        />
                                    </td>

                                    {/* Booking */}
                                    <td className="px-2 py-1 align-top bg-blue-50/20 group-hover:bg-blue-50/40">
                                        <input 
                                            type="number" 
                                            className="w-full px-2 py-2 text-right rounded border border-transparent hover:border-blue-300 focus:border-blue-500 focus:bg-white bg-transparent outline-none font-medium text-slate-800"
                                            placeholder="0" 
                                            value={row.booking} 
                                            onChange={e => updateRow(row.id, 'booking', e.target.value)} 
                                        />
                                    </td>

                                    {/* Rate */}
                                    <td className="px-2 py-1 align-top bg-blue-50/20 group-hover:bg-blue-50/40">
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            className="w-full px-2 py-2 text-right rounded border border-transparent hover:border-blue-300 focus:border-blue-500 focus:bg-white bg-transparent outline-none font-medium text-slate-800"
                                            placeholder="0.00" 
                                            value={row.rate} 
                                            onChange={e => updateRow(row.id, 'rate', e.target.value)} 
                                        />
                                    </td>

                                    {/* Total (Calculated) */}
                                    <td className="px-4 py-3 align-top text-right font-bold text-emerald-700 bg-emerald-50/20 group-hover:bg-emerald-50/40 border-l border-emerald-50">
                                        {row.total ? row.total.toLocaleString() : "-"}
                                    </td>

                                    {/* Paid */}
                                    <td className="px-2 py-1 align-top">
                                        <input 
                                            type="number" 
                                            className="w-full px-2 py-2 text-right rounded border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white bg-transparent outline-none font-medium text-slate-700"
                                            placeholder="-" 
                                            value={row.paid} 
                                            onChange={e => updateRow(row.id, 'paid', e.target.value)} 
                                        />
                                    </td>

                                    {/* Client Ref */}
                                    <td className="px-2 py-1 align-top">
                                        <input 
                                            className="w-full px-2 py-2 rounded border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white bg-transparent outline-none text-slate-600"
                                            placeholder="Add reference..." 
                                            value={row.clientRef} 
                                            onChange={e => updateRow(row.id, 'clientRef', e.target.value)} 
                                        />
                                    </td>

                                    {/* Delete Action */}
                                    <td className="px-2 py-1 align-middle text-center">
                                        <button 
                                            onClick={() => deleteRow(row.id)} 
                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete Row"
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
            
            {/* Table Footer / Summary */}
            <div className="bg-slate-50 border-t border-slate-200 p-3 text-xs text-slate-500 flex justify-between items-center">
                <span>Showing {filteredRows.length} entries</span>
                <span>Auto-saved to local storage</span>
            </div>
        </div>
      </main>
    </div>
  );
}