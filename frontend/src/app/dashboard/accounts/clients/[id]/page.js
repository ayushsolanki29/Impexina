"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Save,
  Trash2,
  Printer,
  FileDown,
  PlusCircle,
  Calculator
} from "lucide-react";

export default function ClientLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id;

  const [client, setClient] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Form State for New Entry ---
  const [entry, setEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    containerCode: "",
    particulars: "",
    billingType: "cbm", // 'cbm' or 'weight'
    quantity: "", // This will be the CBM or Weight value
    rate: "",
    total: 0,
    paid: "",
    paymentMode: "",
    paymentDate: "",
    fromAccount: "Main",
    toAccount: "Client"
  });

  // Load Data
  useEffect(() => {
    // Simulate fetching client and their transactions
    const clientsRaw = localStorage.getItem("igpl_clients");
    const transRaw = localStorage.getItem(`igpl_ledger_${clientId}`);

    if (clientsRaw) {
      const allClients = JSON.parse(clientsRaw);
      const found = allClients.find(c => c.id === clientId);
      if (found) setClient(found);
    }

    if (transRaw) {
      setTransactions(JSON.parse(transRaw));
    }
    setLoading(false);
  }, [clientId]);

  // Update Total automatically when Quantity or Rate changes
  useEffect(() => {
    const qty = parseFloat(entry.quantity) || 0;
    const rate = parseFloat(entry.rate) || 0;
    setEntry(prev => ({ ...prev, total: Math.round(qty * rate) }));
  }, [entry.quantity, entry.rate]);

  // Handle Form Submit
  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!entry.particulars || !entry.total) {
      return toast.error("Particulars and Total amount are required");
    }

    const newTrans = {
      id: `tr-${Date.now()}`,
      ...entry,
      paid: parseFloat(entry.paid) || 0,
      balance: entry.total - (parseFloat(entry.paid) || 0)
    };

    const updatedTrans = [...transactions, newTrans];
    setTransactions(updatedTrans);
    localStorage.setItem(`igpl_ledger_${clientId}`, JSON.stringify(updatedTrans));

    // Update Client Summary Balance in the main list
    updateClientSummary(updatedTrans);

    toast.success("Entry added to ledger");
    // Reset critical fields only
    setEntry(prev => ({
      ...prev,
      containerCode: "",
      particulars: "",
      quantity: "",
      rate: "",
      total: 0,
      paid: "",
    }));
  };

  const updateClientSummary = (currentTransactions) => {
    const totalExp = currentTransactions.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
    const totalPaid = currentTransactions.reduce((sum, t) => sum + (parseFloat(t.paid) || 0), 0);
    
    const clientsRaw = localStorage.getItem("igpl_clients");
    if (clientsRaw) {
      const allClients = JSON.parse(clientsRaw);
      const updatedClients = allClients.map(c => {
        if (c.id === clientId) {
          return {
            ...c,
            totalExpense: totalExp,
            totalPaid: totalPaid,
            balance: totalExp - totalPaid,
            lastActive: new Date().toISOString().split('T')[0]
          };
        }
        return c;
      });
      localStorage.setItem("igpl_clients", JSON.stringify(updatedClients));
      setClient(updatedClients.find(c => c.id === clientId));
    }
  }

  const handleDelete = (id) => {
    if(confirm("Are you sure you want to delete this entry?")) {
      const filtered = transactions.filter(t => t.id !== id);
      setTransactions(filtered);
      localStorage.setItem(`igpl_ledger_${clientId}`, JSON.stringify(filtered));
      updateClientSummary(filtered);
      toast.success("Entry deleted");
    }
  };

  // --- Calculations for Bottom Bar ---
  const totals = useMemo(() => {
    return transactions.reduce((acc, t) => ({
      expense: acc.expense + (parseFloat(t.total) || 0),
      paid: acc.paid + (parseFloat(t.paid) || 0)
    }), { expense: 0, paid: 0 });
  }, [transactions]);

  if (loading) return <div className="p-10">Loading ledger...</div>;
  if (!client) return <div className="p-10">Client not found</div>;

  return (
    <div className="p-6 min-h-screen bg-slate-50/50">
      <Toaster position="top-right" />

      {/* --- Breadcrumb & Header --- */}
      <div className="max-w-7xl mx-auto mb-6">
        <button 
          onClick={() => router.push("/dashboard/accounts/clients")}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Accounts
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-slate-900 uppercase">{client.name}</h1>
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium">
                {client.location}
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              Ledger for Financial Year 24-25
            </p>
          </div>

          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 text-sm font-medium">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 text-sm font-medium">
              <FileDown className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- Left Side: New Entry Form --- */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden sticky top-6">
            <div className="bg-blue-50/50 px-5 py-3 border-b border-blue-100 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-slate-800">New Entry</h2>
            </div>
            
            <form onSubmit={handleAddTransaction} className="p-5 space-y-4">
              {/* Row 1: Container & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Container</label>
                  <input 
                    className="w-full mt-1 px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="PSDH-171"
                    value={entry.containerCode}
                    onChange={e => setEntry({...entry, containerCode: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</label>
                  <input 
                    type="date"
                    className="w-full mt-1 px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={entry.date}
                    onChange={e => setEntry({...entry, date: e.target.value})}
                  />
                </div>
              </div>

              {/* Row 2: Particulars */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Particulars *</label>
                <textarea 
                  required
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Item details, Invoice No..."
                  value={entry.particulars}
                  onChange={e => setEntry({...entry, particulars: e.target.value})}
                />
              </div>

              {/* Row 3: Calculation (CBM/Weight * Rate) */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="btype" 
                      checked={entry.billingType === 'cbm'} 
                      onChange={() => setEntry({...entry, billingType: 'cbm'})}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">CBM</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="btype" 
                      checked={entry.billingType === 'weight'} 
                      onChange={() => setEntry({...entry, billingType: 'weight'})}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Weight</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Qty ({entry.billingType})</label>
                    <input 
                      type="number" step="0.001"
                      className="w-full mt-1 px-3 py-2 bg-white border rounded text-sm outline-none"
                      placeholder="0.00"
                      value={entry.quantity}
                      onChange={e => setEntry({...entry, quantity: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Rate</label>
                    <input 
                      type="number"
                      className="w-full mt-1 px-3 py-2 bg-white border rounded text-sm outline-none"
                      placeholder="₹ 0"
                      value={entry.rate}
                      onChange={e => setEntry({...entry, rate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Totals & Paid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 text-sm">₹</span>
                    <input 
                      type="number"
                      className="w-full mt-1 pl-7 pr-3 py-2 border border-slate-300 rounded text-sm font-bold text-slate-800 outline-none"
                      value={entry.total}
                      onChange={e => setEntry({...entry, total: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Paid Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-green-600 text-sm">₹</span>
                    <input 
                      type="number"
                      className="w-full mt-1 pl-7 pr-3 py-2 border border-green-200 bg-green-50/30 rounded text-sm outline-none focus:border-green-400"
                      placeholder="0"
                      value={entry.paid}
                      onChange={e => setEntry({...entry, paid: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Account Transfer Details */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-[10px] text-slate-400 uppercase">From Acc</label>
                    <select 
                      className="w-full text-xs p-1.5 border rounded bg-slate-50"
                      value={entry.fromAccount}
                      onChange={e => setEntry({...entry, fromAccount: e.target.value})}
                    >
                      <option>Main</option>
                      <option>Cash</option>
                      <option>Bank</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] text-slate-400 uppercase">To Acc</label>
                    <select 
                      className="w-full text-xs p-1.5 border rounded bg-slate-50"
                      value={entry.toAccount}
                      onChange={e => setEntry({...entry, toAccount: e.target.value})}
                    >
                      <option>Client</option>
                      <option>Expense</option>
                    </select>
                 </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 mt-2 transition-colors"
              >
                <Save className="w-4 h-4" /> Save Entry
              </button>
            </form>
          </div>
        </div>

        {/* --- Right Side: The Table (Expense Sheet) --- */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 min-w-[120px]">Container / Date</th>
                    <th className="px-4 py-3 min-w-[200px]">Particulars</th>
                    <th className="px-4 py-3 text-right">Qty (CBM/Wt)</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center">
                          <Calculator className="w-8 h-8 mb-2 opacity-50" />
                          No transactions found. Add one using the form.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-slate-800">{t.containerCode || "-"}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {t.date}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="text-slate-800 whitespace-pre-wrap">{t.particulars}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {t.fromAccount} → {t.toAccount}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right align-top text-slate-600">
                          {t.quantity ? (
                            <>
                              {t.quantity} <span className="text-[10px] uppercase text-slate-400">{t.billingType}</span>
                            </>
                          ) : "-"}
                        </td>
                        <td className="px-4 py-3 text-right align-top text-slate-600">
                          {t.rate ? `₹${t.rate}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-right align-top font-medium text-slate-900">
                          ₹{t.total?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right align-top text-green-700 font-medium">
                          {t.paid > 0 ? `₹${t.paid.toLocaleString()}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <button 
                            onClick={() => handleDelete(t.id)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-right items-center">
                 <div className="text-sm text-slate-500">
                    Total Expense: <span className="font-bold text-slate-900 ml-1">₹{totals.expense.toLocaleString()}</span>
                 </div>
                 <div className="text-sm text-green-700">
                    Total Paid: <span className="font-bold ml-1">₹{totals.paid.toLocaleString()}</span>
                 </div>
                 <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-bold shadow-sm border border-amber-200">
                    Balance Due: ₹{(totals.expense - totals.paid).toLocaleString()}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}