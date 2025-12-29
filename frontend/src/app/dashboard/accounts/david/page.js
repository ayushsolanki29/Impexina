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
// "use client";
// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Plus,
//   Globe,
//   Search,
//   Filter,
//   Calendar,
//   Archive,
//   Lock,
//   Unlock,
//   FileText,
//   TrendingUp,
//   TrendingDown,
//   Download,
//   MoreVertical,
//   Edit,
//   Trash2,
//   Eye,
//   Coins,
//   Wallet,
// } from "lucide-react";
// import {  toast } from "sonner";
// import { forexAPI } from "@/services/forex.service";


// export default function ForexSheetsPage() {
//   const router = useRouter();
//   const [sheets, setSheets] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [currencyFilter, setCurrencyFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [dashboardStats, setDashboardStats] = useState(null);
//   const [currencies] = useState(["RMB", "USD", "EUR", "GBP", "JPY", "OTHER"]);

//   // Load data
//   useEffect(() => {
//     loadSheets();
//     loadDashboardStats();
//   }, [search, currencyFilter, statusFilter]);

//   const loadSheets = async () => {
//     try {
//       setLoading(true);
//       const params = {
//         search,
//         currency: currencyFilter,
//         status: statusFilter,
//         page: 1,
//         limit: 100,
//       };
//       const data = await forexAPI.getSheets(params);
//       setSheets(data.data.data.sheets || []);
//     } catch (error) {
//       toast.error(error.message || "Failed to load forex sheets");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadDashboardStats = async () => {
//     try {
//       const data = await forexAPI.getDashboardOverview();
//       setDashboardStats(data.data.data);
//     } catch (error) {
//       console.error("Failed to load dashboard stats:", error);
//     }
//   };

//   const handleCreateSheet = async () => {
//     router.push("/dashboard/accounts/david/new");
//   };

//   const handleDeleteSheet = async (sheetId, sheetName) => {
//     if (!confirm(`Are you sure you want to archive "${sheetName}"?`)) return;

//     try {
//       await forexAPI.deleteSheet(sheetId);
//       toast.success("Forex sheet archived successfully");
//       loadSheets();
//       loadDashboardStats();
//     } catch (error) {
//       toast.error(error.message || "Failed to archive sheet");
//     }
//   };

//   const handleExportSheet = async (sheetId, sheetName) => {
//     try {
//       const blob = await forexAPI.exportSheet(sheetId);
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `${sheetName.replace(/\s+/g, "_")}_forex_${new Date()
//         .toISOString()
//         .slice(0, 10)}.xlsx`;
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);
//       toast.success("Forex sheet exported successfully");
//     } catch (error) {
//       toast.error(error.message || "Failed to export sheet");
//     }
//   };

//   // Get currency symbol
//   const getCurrencySymbol = (currency) => {
//     switch (currency) {
//       case "RMB":
//         return "¥";
//       case "USD":
//         return "$";
//       case "EUR":
//         return "€";
//       case "GBP":
//         return "£";
//       case "JPY":
//         return "¥";
//       default:
//         return currency;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">


//       {/* Header */}
//       <div className="bg-white border-b border-slate-200">
//         <div className="max-w-7xl mx-auto px-4 py-6">
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//             <div>
//               <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
//                 <Globe className="w-6 h-6 text-blue-600" />
//                 Forex Sheets
//               </h1>
//               <p className="text-sm text-slate-600 mt-1">
//                 Manage multi-currency forex ledgers and transactions
//               </p>
//             </div>
//             <button
//               onClick={handleCreateSheet}
//               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm"
//             >
//               <Plus className="w-4 h-4" />
//               New Forex Sheet
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Dashboard Stats */}
//       {dashboardStats && (
//         <div className="max-w-7xl mx-auto px-4 py-6">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="text-xs font-medium text-slate-500 uppercase">
//                     Total Sheets
//                   </div>
//                   <div className="text-2xl font-bold text-slate-900 mt-1">
//                     {dashboardStats.totals.totalSheets}
//                   </div>
//                 </div>
//                 <FileText className="w-8 h-8 text-blue-500" />
//               </div>
//               <div className="mt-2 text-xs text-slate-500">
//                 Active: {dashboardStats.totals.activeSheets}
//               </div>
//             </div>

//             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="text-xs font-medium text-slate-500 uppercase">
//                     Total Entries
//                   </div>
//                   <div className="text-2xl font-bold text-slate-900 mt-1">
//                     {dashboardStats.totals.totalEntries}
//                   </div>
//                 </div>
//                 <Wallet className="w-8 h-8 text-purple-500" />
//               </div>
//             </div>

//             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="text-xs font-medium text-slate-500 uppercase">
//                     Base Currencies
//                   </div>
//                   <div className="text-2xl font-bold text-slate-900 mt-1">
//                     {dashboardStats.currencyDistribution.length}
//                   </div>
//                 </div>
//                 <Coins className="w-8 h-8 text-amber-500" />
//               </div>
//               <div className="mt-2 text-xs text-slate-500">
//                 {dashboardStats.currencyDistribution
//                   .map((c) => c.currency)
//                   .join(", ")}
//               </div>
//             </div>

//             <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-blue-50/50">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="text-xs font-medium text-blue-700 uppercase">
//                     Recent Activity
//                   </div>
//                   <div className="text-lg font-bold text-blue-700 mt-1">
//                     {dashboardStats.recentSheets.length} active
//                   </div>
//                 </div>
//                 <TrendingUp className="w-8 h-8 text-blue-500" />
//               </div>
//               <div className="mt-2 text-xs text-blue-600">
//                 Latest: {dashboardStats.recentSheets[0]?.name}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Filters */}
//       <div className="max-w-7xl mx-auto px-4 py-4">
//         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
//           <div className="flex flex-col md:flex-row gap-4">
//             <div className="flex-1">
//               <div className="relative">
//                 <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
//                 <input
//                   type="text"
//                   placeholder="Search forex sheets by name or description..."
//                   className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                 />
//               </div>
//             </div>
//             <div className="flex gap-3">
//               <select
//                 className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//                 value={currencyFilter}
//                 onChange={(e) => setCurrencyFilter(e.target.value)}
//               >
//                 <option value="">All Currencies</option>
//                 {currencies.map((currency) => (
//                   <option key={currency} value={currency}>
//                     {currency}
//                   </option>
//                 ))}
//               </select>
//               <select
//                 className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//               >
//                 <option value="">All Status</option>
//                 <option value="ACTIVE">Active</option>
//                 <option value="ARCHIVED">Archived</option>
//                 <option value="LOCKED">Locked</option>
//               </select>
//               <button
//                 onClick={loadSheets}
//                 className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-2"
//               >
//                 <Filter className="w-4 h-4" />
//                 Filter
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Sheets Grid */}
//       <div className="max-w-7xl mx-auto px-4 pb-8">
//         {loading ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {[...Array(6)].map((_, i) => (
//               <div
//                 key={i}
//                 className="h-48 bg-slate-100 animate-pulse rounded-xl"
//               />
//             ))}
//           </div>
//         ) : sheets.length === 0 ? (
//           <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
//             <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
//             <h3 className="text-lg font-medium text-slate-900">
//               No forex sheets found
//             </h3>
//             <p className="text-slate-500 text-sm mb-4">
//               Create your first forex sheet to track multi-currency transactions
//             </p>
//             <button
//               onClick={handleCreateSheet}
//               className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//             >
//               <Plus className="w-4 h-4 inline mr-2" />
//               Create Sheet
//             </button>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {sheets.map((sheet) => (
//               <div
//                 key={sheet.id}
//                 className={`group bg-white p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${
//                   sheet.status === "ARCHIVED"
//                     ? "border-slate-200 opacity-80"
//                     : sheet.status === "LOCKED"
//                     ? "border-amber-200"
//                     : "border-blue-200"
//                 }`}
//               >
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">
//                         {sheet.name}
//                       </h3>
//                       {sheet.status === "LOCKED" && (
//                         <Lock className="w-4 h-4 text-amber-500" />
//                       )}
//                       {sheet.status === "ARCHIVED" && (
//                         <Archive className="w-4 h-4 text-slate-400" />
//                       )}
//                     </div>
//                     <div className="flex items-center gap-2 mt-1">
//                       <span className="text-xs text-slate-500 flex items-center gap-1">
//                         <Coins className="w-3 h-3" />
//                         Base: {sheet.baseCurrency}
//                       </span>
//                       {sheet.tags && sheet.tags.length > 0 && (
//                         <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
//                           {sheet.tags[0]}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                   <div className="relative">
//                     <button className="p-1 text-slate-400 hover:text-slate-600">
//                       <MoreVertical className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>

//                 {sheet.description && (
//                   <p className="text-sm text-slate-600 mb-4 line-clamp-2">
//                     {sheet.description}
//                   </p>
//                 )}

//                 {/* Currency Totals */}
//                 <div className="mb-4">
//                   <div className="grid grid-cols-2 gap-3">
//                     {/* RMB */}
//                     {sheet.totals.rmb.balance !== 0 && (
//                       <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
//                         <div className="text-[10px] uppercase font-bold text-amber-700">
//                           RMB
//                         </div>
//                         <div className="flex justify-between items-center mt-1">
//                           <span className="text-sm font-medium text-amber-900">
//                             {getCurrencySymbol("RMB")}
//                             {Math.abs(
//                               sheet.totals.rmb.balance
//                             ).toLocaleString()}
//                           </span>
//                           <span
//                             className={`text-xs px-1 py-0.5 rounded ${
//                               sheet.totals.rmb.balance > 0
//                                 ? "bg-amber-100 text-amber-800"
//                                 : "bg-red-100 text-red-800"
//                             }`}
//                           >
//                             {sheet.totals.rmb.balance > 0 ? "DR" : "CR"}
//                           </span>
//                         </div>
//                       </div>
//                     )}

//                     {/* USD */}
//                     {sheet.totals.usd.balance !== 0 && (
//                       <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
//                         <div className="text-[10px] uppercase font-bold text-emerald-700">
//                           USD
//                         </div>
//                         <div className="flex justify-between items-center mt-1">
//                           <span className="text-sm font-medium text-emerald-900">
//                             {getCurrencySymbol("USD")}
//                             {Math.abs(
//                               sheet.totals.usd.balance
//                             ).toLocaleString()}
//                           </span>
//                           <span
//                             className={`text-xs px-1 py-0.5 rounded ${
//                               sheet.totals.usd.balance > 0
//                                 ? "bg-emerald-100 text-emerald-800"
//                                 : "bg-red-100 text-red-800"
//                             }`}
//                           >
//                             {sheet.totals.usd.balance > 0 ? "DR" : "CR"}
//                           </span>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <div className="border-t border-slate-100 pt-4">
//                   <div className="flex justify-between items-center mb-3">
//                     <span className="text-xs text-slate-400">
//                       {sheet._count.entries} entries
//                     </span>
//                     <div
//                       className={`text-xs px-2 py-1 rounded-full ${
//                         sheet.status === "ACTIVE"
//                           ? "bg-blue-50 text-blue-700 border border-blue-100"
//                           : sheet.status === "ARCHIVED"
//                           ? "bg-slate-100 text-slate-600 border border-slate-200"
//                           : "bg-amber-50 text-amber-700 border border-amber-100"
//                       }`}
//                     >
//                       {sheet.status}
//                     </div>
//                   </div>

//                   <div className="flex gap-2">
//                     <button
//                       onClick={() =>
//                         router.push(`/dashboard/forex/${sheet.id}`)
//                       }
//                       className="flex-1 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
//                     >
//                       <Eye className="w-4 h-4" />
//                       Open
//                     </button>

//                     <div className="flex gap-1">
//                       <button
//                         onClick={() => handleExportSheet(sheet.id, sheet.name)}
//                         className="p-2 text-slate-400 hover:text-blue-600"
//                         title="Export"
//                       >
//                         <Download className="w-4 h-4" />
//                       </button>
//                       {sheet.status !== "ARCHIVED" && (
//                         <>
//                           <button
//                             onClick={() =>
//                               router.push(`/dashboard/forex/${sheet.id}/edit`)
//                             }
//                             className="p-2 text-slate-400 hover:text-blue-600"
//                             title="Edit"
//                           >
//                             <Edit className="w-4 h-4" />
//                           </button>
//                           <button
//                             onClick={() =>
//                               handleDeleteSheet(sheet.id, sheet.name)
//                             }
//                             className="p-2 text-slate-400 hover:text-red-600"
//                             title="Archive"
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </button>
//                         </>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
