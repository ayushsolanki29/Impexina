"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2, Check, Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { get, post, put, del } from "@/lib/api";

// --- Components ---

const HeaderMetric = ({ label, value, colorClass = "text-gray-900" }) => (
    <div className="flex flex-col items-end">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</span>
        <span className={`text-2xl font-black tracking-tight ${colorClass}`}>{value}</span>
    </div>
);

// Minimal Editable Cell
const EditableCell = ({ 
    value, 
    onChange, 
    onKeyDown,
    type = "text", 
    className = "", 
    placeholder = "",
    autoFocus = false,
    id,
    disabled = false
}) => {
    return (
        <input
            id={id}
            type={type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            className={`w-full bg-transparent border-none outline-none p-2 text-sm placeholder:text-slate-300 focus:bg-slate-50 transition-colors ${className}`}
            placeholder={placeholder}
            autoFocus={autoFocus}
            autoComplete="off"
        />
    );
};

export default function ExcelLedgerPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const containerCode = searchParams.get("containerCode");
  const querySheetName = searchParams.get("sheetName");
  
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [availableSheets, setAvailableSheets] = useState([]);
  const [sheetName, setSheetName] = useState("");
  
  useEffect(() => {
    fetchData();
  }, [id, containerCode, querySheetName]);

  // Global Keyboard Shortcuts
  useEffect(() => {
      const handleGlobalKeyDown = (e) => {
          if (e.ctrlKey && e.key === 's') {
              e.preventDefault();
              // Try to save focused row if any
              const active = document.activeElement;
              if (active && active.id && active.id.startsWith('cell-')) {
                  const rowIndex = parseInt(active.id.split('-')[1]);
                  saveRow(rowIndex);
              } else {
                  toast.info("All rows are synced or will auto-save on blur");
              }
          }
          if (e.key === 'Escape') {
              e.preventDefault();
              router.push(`/dashboard/accounts/clients/${id}/containers`);
          }
      };
      
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (containerCode) params.set("containerCode", containerCode);
      if (querySheetName) params.set("sheetName", querySheetName);

      const res = await get(`/accounts/clts/${id}?${params.toString()}`);
      if (res.success) {
        setClient(res.data);
        const mapTxns = (res.data.transactions || []).map(t => ({ ...t, isNew: false }));
        setTransactions(mapTxns);
        setAvailableSheets(res.data.availableSheets || []);

        // Naming Logic
        if (containerCode) {
            const date = new Date();
            const month = date.toLocaleString('en-US', { month: 'long' });
            setSheetName(`${res.data.name} ${containerCode} ${month}`.toUpperCase());
        } else if (querySheetName) {
            setSheetName(querySheetName.toUpperCase());
        } else {
            setSheetName("ENTIRE LEDGER");
        }
      }
    } catch (error) {
      toast.error("Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRow = (rowIndex, field, value) => {
      const updatedTxns = [...transactions];
      updatedTxns[rowIndex] = { ...updatedTxns[rowIndex], [field]: value };
      if (field === 'amount' || field === 'paid') {
          const amt = parseFloat(updatedTxns[rowIndex].amount || 0);
          const pd = parseFloat(updatedTxns[rowIndex].paid || 0);
          updatedTxns[rowIndex].balance = amt - pd;
      }
      setTransactions(updatedTxns);
  };

  const lastSavedData = useRef({});

  const saveRow = async (rowIndex) => {
      const txn = transactions[rowIndex];
      if (!txn) return;

      const { isNew, id: txnId, ...dataToSave } = txn;
      
      // Redundancy Check: Compare with last saved state of this specific row
      const currentStateString = JSON.stringify(dataToSave);
      if (lastSavedData.current[txnId] === currentStateString && !isNew) {
          return; // No changes
      }

      try {
          let res;
          const payload = {
              ...dataToSave,
              transactionDate: dataToSave.transactionDate ? new Date(dataToSave.transactionDate) : new Date(),
              deliveryDate: dataToSave.deliveryDate ? new Date(dataToSave.deliveryDate) : undefined,
              paymentDate: dataToSave.paymentDate ? new Date(dataToSave.paymentDate) : undefined
          };

          if (isNew) {
              res = await post(`/accounts/clts/${id}/transactions`, payload);
              const updated = [...transactions];
              updated[rowIndex] = { ...res.data, isNew: false };
              setTransactions(updated);
              lastSavedData.current[res.data.id] = JSON.stringify(res.data);
              
              // Automatically add sheet to available sheets if it's new
              if (sheetName && !availableSheets.includes(sheetName)) {
                  setAvailableSheets(prev => [...prev, sheetName]);
              }

              toast.success(sheetName ? `Row Added to ${sheetName}` : "Row Created", { duration: 2000 });
          } else {
              res = await put(`/accounts/clts/${id}/transactions/${txnId}`, payload);
              lastSavedData.current[txnId] = currentStateString;
              toast.success("Row Updated Details Saved", { duration: 2000 });
          }
      } catch (e) {
          console.error(e);
          toast.error("Failed to save row: " + (e.response?.data?.message || e.message));
      }
  };

  const handleAddRow = () => {
      const newTxn = {
          id: `temp-${Date.now()}`,
          isNew: true,
          containerCode: "",
          deliveryDate: new Date().toISOString().split('T')[0],
          particulars: "",
          quantity: "", 
          rate: "",
          amount: "", 
          paid: "",
          paymentDate: "",
          paymentMode: "",
          clientId: id,
          billingType: "FLAT",
          containerCode: containerCode || "",
          sheetName: querySheetName || ""
      };
      setTransactions(prev => [...prev, newTxn]);
      
      setTimeout(() => {
          const lastIdx = transactions.length; 
          const el = document.getElementById(`cell-${lastIdx}-containerCode`);
          if (el) el.focus();
      }, 50);
  };

  const handleDeleteRow = async (rowIndex) => {
      const txn = transactions[rowIndex];
      if (!confirm("Delete this row?")) return;
      
      if (!txn.isNew) {
          try {
              await del(`/accounts/clts/${id}/transactions/${txn.id}`);
              toast.success("Deleted");
          } catch(e) {
              toast.error("Failed to delete");
              return;
          }
      }
      const updated = transactions.filter((_, i) => i !== rowIndex);
      setTransactions(updated);
  };

  const handleRenameSheet = async (newName) => {
      const capsName = newName.toUpperCase();
      try {
          await post(`/accounts/clts/${id}/rename-sheet`, {
              oldSheetName: sheetName,
              newSheetName: capsName
          });
          setSheetName(capsName);
          
          // Update available sheets list
          setAvailableSheets(prev => {
              if (prev.includes(sheetName)) {
                  return prev.map(s => s === sheetName ? capsName : s);
              } else {
                  return [...prev, capsName];
              }
          });

          // Also update the URL so if they refresh they stay on the same renamed sheet
          const params = new URLSearchParams(window.location.search);
          params.set('sheetName', capsName);
          window.history.replaceState(null, '', `?${params.toString()}`);
          toast.success("Sheet Renamed");
      } catch (e) {
          toast.error("Failed to rename sheet");
      }
  };

  const handleKeyDown = (e, rowIndex, colKey) => {
      // Allow default tab behavior but keep arrow keys
      if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          handleAddRow();
          return;
      }
      
      // Save current row on Ctrl+S as well
      if (e.ctrlKey && e.key === 's') {
          e.preventDefault();
          saveRow(rowIndex);
          toast.success("Saved");
          return;
      }

      if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextEl = document.getElementById(`cell-${rowIndex + 1}-${colKey}`);
          if (nextEl) nextEl.focus();
      } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevEl = document.getElementById(`cell-${rowIndex - 1}-${colKey}`);
          if (prevEl) prevEl.focus();
      } else if (e.key === 'Enter') {
          e.preventDefault();
          saveRow(rowIndex);
          // Logic: If on last column, go to next row start? Or just save and stay?
          // Let's just go down for Excel feel
          const nextEl = document.getElementById(`cell-${rowIndex + 1}-${colKey}`);
          if (nextEl) nextEl.focus();
          else handleAddRow();
      }
  };

  const totalAmount = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const totalPaid = transactions.reduce((sum, t) => sum + (parseFloat(t.paid) || 0), 0);
  const balance = totalAmount - totalPaid;

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>;
  if (!client) return <div className="p-12 text-center text-slate-500">Client not found</div>;

  return (
    <div className="flex flex-col h-screen max-w-[100vw] overflow-hidden bg-white font-sans text-slate-900">
      
      {/* Minimal Header */}
      <div className="flex-none px-8 py-6 border-b border-slate-100 flex items-start justify-between">
        <div className="flex items-center gap-6">
           <button onClick={() => router.push(`/dashboard/accounts/clients/${id}/containers`)} className="group p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-900 icon-btn" title="Go Back (Esc)">
            <ArrowLeft className="w-5 h-5" />
           </button>
           <div>
               <h1 className="text-2xl font-medium tracking-tight text-slate-900">
                   {client.name}
               </h1>
                              <div className="flex items-center gap-3 text-sm text-slate-400 mt-1 uppercase">
                   <div className="relative flex items-center gap-2">
                       <select 
                            value={querySheetName ? querySheetName.toUpperCase() : (containerCode ? containerCode : "ENTIRE LEDGER")}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === "NEW") {
                                    const newName = prompt("ENTER NEW SHEET NAME:");
                                    if (newName) {
                                        const cleanName = newName.toUpperCase().trim();
                                        router.push(`/dashboard/accounts/clients/${id}?sheetName=${encodeURIComponent(cleanName)}`);
                                    }
                                } else if (val === "ENTIRE LEDGER") {
                                    router.push(`/dashboard/accounts/clients/${id}`);
                                } else {
                                    // Navigate to specific sheet
                                    router.push(`/dashboard/accounts/clients/${id}?sheetName=${encodeURIComponent(val)}`);
                                }
                            }}
                            className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded border border-transparent focus:border-blue-200 outline-none appearance-none cursor-pointer pr-8"
                       >
                           <option value="ENTIRE LEDGER">ENTIRE LEDGER</option>
                           <optgroup label="SHEETS">
                               {availableSheets.map(s => (
                                   <option key={s} value={s}>{s}</option>
                               ))}
                           </optgroup>
                           <option value="NEW" className="text-emerald-600 font-bold font-sans">+ NEW SHEET</option>
                       </select>
                       <div className="absolute right-2 pointer-events-none">
                            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                       </div>
                   </div>

                   <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                   
                   <input 
                        value={sheetName} 
                        onChange={(e) => setSheetName(e.target.value.toUpperCase())}
                        onBlur={(e) => {
                            if (e.target.value.toUpperCase() !== querySheetName?.toUpperCase()) {
                                handleRenameSheet(e.target.value);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') e.target.blur();
                        }}
                        className="bg-slate-50 text-slate-600 font-bold px-2 py-0.5 rounded border border-transparent focus:border-blue-200 outline-none min-w-[200px]"
                        title="RENAME CURRENT SHEET"
                   />
                   
                   <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                   <span>{client.companyName}</span>
                   {client.city && (
                       <>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{client.city}</span>
                       </>
                   )}
               </div>
           </div>
        </div>
        
         <div className="flex items-center gap-10">
             <HeaderMetric label="Billed" value={`₹${totalAmount.toLocaleString()}`} />
             <HeaderMetric label="Paid" value={`₹${totalPaid.toLocaleString()}`} colorClass="text-emerald-500" />
             <div className="flex flex-col items-end">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Balance</span>
                 <div className={`text-2xl font-black tracking-tight px-3 py-1 rounded-xl shadow-sm ${balance > 0 ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                     ₹{balance.toLocaleString()}
                 </div>
             </div>
         </div>
      </div>

      {/* Clean Table Area */}
      <div className="flex-1 overflow-auto">
         <div className="min-w-[1200px]">
             {/* Header Row */}
             <div className="sticky top-0 bg-white z-10 grid grid-cols-[120px_100px_1fr_80px_100px_100px_120px_120px_100px_100px_50px] border-b border-slate-100">
                 {['Container', 'Delivery', 'Particulars', 'CBM', 'Weight', 'Rate', 'Total', 'Paid', 'Payment Date', 'Mode', ''].map((h, i) => (
                     <div key={i} className={`px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-slate-400 ${['CBM', 'Weight', 'Rate', 'Total', 'Paid'].includes(h) ? 'text-right' : ''}`}>
                         {h}
                     </div>
                 ))}
             </div>

             {/* Data Rows */}
             <div className="divide-y divide-slate-50">
                 {transactions.map((txn, idx) => (
                     <div 
                        key={txn.id} 
                        className={`grid grid-cols-[120px_100px_1fr_80px_100px_100px_120px_120px_100px_100px_50px] hover:bg-slate-50 transition-colors group text-sm ${txn.isNew ? 'bg-blue-50/10' : ''}`}
                     >
                         <div className="px-2 py-1"><EditableCell id={`cell-${idx}-containerCode`} value={txn.containerCode} onChange={v => handleUpdateRow(idx, 'containerCode', v)} onKeyDown={(e) => handleKeyDown(e, idx, 'containerCode')} placeholder="--" className="text-slate-600" /></div>
                         <div className="px-2 py-1"><input id={`cell-${idx}-deliveryDate`} type="date" value={txn.deliveryDate ? new Date(txn.deliveryDate).toISOString().split('T')[0] : ''} onChange={e => handleUpdateRow(idx, 'deliveryDate', e.target.value)} onKeyDown={(e) => handleKeyDown(e, idx, 'deliveryDate')} className="w-full bg-transparent border-none outline-none p-2 text-sm text-slate-400 font-medium" /></div>
                         <div className="px-2 py-1"><EditableCell id={`cell-${idx}-particulars`} value={txn.particulars} onChange={v => handleUpdateRow(idx, 'particulars', v)} onKeyDown={(e) => handleKeyDown(e, idx, 'particulars')} placeholder="Description" className="text-slate-900 font-medium" /></div>
                         <div className="px-2 py-1"><EditableCell id={`cell-${idx}-quantity`} value={txn.quantity} type="number" onChange={v => handleUpdateRow(idx, 'quantity', v)} onKeyDown={(e) => handleKeyDown(e, idx, 'quantity')} className="text-right text-slate-500" /></div>
                         <div className="px-2 py-1 text-right text-slate-300 py-3 text-xs">-</div>
                         <div className="px-2 py-1"><EditableCell id={`cell-${idx}-rate`} value={txn.rate} type="number" onChange={v => handleUpdateRow(idx, 'rate', v)} onKeyDown={(e) => handleKeyDown(e, idx, 'rate')} className="text-right text-slate-500" /></div>
                         
                         {/* Total Column with Yellow Bg */}
                         <div className="px-2 py-1 bg-yellow-50/50 border-x border-yellow-100/50">
                             <EditableCell 
                                id={`cell-${idx}-amount`}
                                value={txn.amount} 
                                type="number" 
                                onChange={v => handleUpdateRow(idx, 'amount', v)} 
                                onKeyDown={(e) => handleKeyDown(e, idx, 'amount')}
                                className="text-right font-bold text-slate-900" 
                             />
                         </div>
                         
                         <div className="px-2 py-1"><EditableCell id={`cell-${idx}-paid`} value={txn.paid} type="number" onChange={v => handleUpdateRow(idx, 'paid', v)} onKeyDown={(e) => handleKeyDown(e, idx, 'paid')} className="text-right text-emerald-600 font-medium" /></div>
                         <div className="px-2 py-1"><input id={`cell-${idx}-paymentDate`} type="date" value={txn.paymentDate ? new Date(txn.paymentDate).toISOString().split('T')[0] : ''} onChange={e => handleUpdateRow(idx, 'paymentDate', e.target.value)} onKeyDown={(e) => handleKeyDown(e, idx, 'paymentDate')} className="w-full bg-transparent border-none outline-none p-2 text-sm text-slate-400" /></div>
                         <div className="px-2 py-1">
                             <select id={`cell-${idx}-paymentMode`} value={txn.paymentMode || ''} onChange={e => handleUpdateRow(idx, 'paymentMode', e.target.value)} onKeyDown={(e) => handleKeyDown(e, idx, 'paymentMode')} className="w-full h-full bg-transparent border-none outline-none p-2 text-xs font-medium text-slate-500">
                                 <option value="">-</option>
                                 <option value="CASH">Cash</option>
                                 <option value="CHEQUE">Cheque</option>
                                 <option value="UPI">UPI</option>
                                 <option value="BANK_TRANSFER">Bank</option>
                             </select>
                         </div>
                         <div className="px-2 py-1 flex items-center justify-center gap-1">
                             <button onClick={() => saveRow(idx)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded transition-colors" title="Save Row">
                                 <Check className="w-4 h-4" />
                             </button>
                             <button onClick={() => handleDeleteRow(idx)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" tabIndex={-1} title="Delete Row">
                                 <Trash2 className="w-4 h-4" />
                             </button>
                         </div>
                     </div>
                 ))}
             </div>
             
             {/* Add Row Button Area */}
             <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                 <button onClick={handleAddRow} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                     <Plus className="w-4 h-4" />
                     Add Row (Ctrl + Enter)
                 </button>
             </div>
         </div>
      </div>
    </div>
  );
}
