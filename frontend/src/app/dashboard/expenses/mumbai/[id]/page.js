"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Toaster, toast } from "sonner";

export default function ContainerExpenseDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [container, setContainer] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    // Load Container Info
    const allContainers = JSON.parse(localStorage.getItem("igpl_exp_mumbai_containers") || "[]");
    const found = allContainers.find(c => c.id === id);
    if(found) setContainer(found);

    // Load Expenses for this container
    const allExpenses = JSON.parse(localStorage.getItem(`igpl_exp_mumbai_details_${id}`) || "[]");
    if(allExpenses.length > 0) {
        setRows(allExpenses);
    } else {
        // Initial Empty Row
        setRows([{ id: Date.now(), particular: "UNLOADING", amount: 5500 }]);
    }
  }, [id]);

  const save = () => {
    // 1. Save Rows
    localStorage.setItem(`igpl_exp_mumbai_details_${id}`, JSON.stringify(rows));
    
    // 2. Update Total in Parent List
    const total = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const allContainers = JSON.parse(localStorage.getItem("igpl_exp_mumbai_containers") || "[]");
    const updatedContainers = allContainers.map(c => c.id === id ? {...c, total: total} : c);
    localStorage.setItem("igpl_exp_mumbai_containers", JSON.stringify(updatedContainers));

    toast.success("Expenses Saved");
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now(), particular: "", amount: "" }]);
  };

  const updateRow = (rowId, field, value) => {
    setRows(rows.map(r => r.id === rowId ? { ...r, [field]: value } : r));
  };

  const deleteRow = (rowId) => {
    setRows(rows.filter(r => r.id !== rowId));
  };

  const total = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  if(!container) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      
      {/* Top Bar */}
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-10 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard/expenses/mumbai')} className="hover:bg-slate-700 p-2 rounded-full">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-lg font-bold">{container.code}</h1>
                <p className="text-xs text-slate-400">Expense Detail Sheet</p>
            </div>
        </div>
        <div className="text-right">
            <div className="text-xs text-slate-400 uppercase">Total Expense</div>
            <div className="text-xl font-mono font-bold">₹{total.toLocaleString()}</div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3 text-left w-3/4">Particular</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-2 py-3"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => (
                        <tr key={row.id}>
                            <td className="p-2">
                                <input 
                                    className="w-full p-2 border border-transparent hover:border-slate-200 focus:border-blue-500 rounded outline-none font-medium uppercase"
                                    placeholder="e.g. LUNCH"
                                    value={row.particular}
                                    onChange={(e) => updateRow(row.id, 'particular', e.target.value)}
                                />
                            </td>
                            <td className="p-2">
                                <input 
                                    type="number"
                                    className="w-full p-2 border border-transparent hover:border-slate-200 focus:border-blue-500 rounded outline-none text-right font-mono"
                                    placeholder="0"
                                    value={row.amount}
                                    onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                                />
                            </td>
                            <td className="p-2 text-center">
                                <button onClick={() => deleteRow(row.id)} className="text-slate-300 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="p-3 bg-slate-50 flex gap-2 border-t border-slate-200">
                <button onClick={addRow} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded text-slate-700 text-sm hover:bg-slate-50">
                    <Plus className="w-4 h-4" /> Add Line
                </button>
                <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded text-sm hover:bg-slate-800 ml-auto shadow-sm">
                    <Save className="w-4 h-4" /> Save Details
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}