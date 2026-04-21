"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Eye, 
  PlusCircle, 
  Trash2, 
  Save, 
  Loader2, 
  Search,
  FileText
} from "lucide-react";
import Link from "next/link";
import { tukaramAPI } from "@/services/tukaram.service";
import TukaramPreviewModal from "./_components/TukaramPreviewModal";

export default function TukaramSheetPage() {
  const params = useParams();
  const router = useRouter();
  const sheetId = params.sheetId;

  const [sheet, setSheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Sheet edit state
  const [editSheet, setEditSheet] = useState({
    title: "",
    description: "",
    openingBalance: 0,
  });

  // New entry state
  const [newEntry, setNewEntry] = useState({
    containerCode: "",
    totalCtn: "",
    loadingDate: "",
    deliveryDate: "",
    particular: "",
    charges: "",
    scanning: "",
    dc: "",
    paid: "",
    paymentDate: "",
    note: "",
  });

  const loadSheetData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tukaramAPI.getSheet(sheetId);
      const data = response.data.data;
      setSheet(data);
      setEditSheet({
        title: data.title || "",
        description: data.description || "",
        openingBalance: data.openingBalance || 0,
      });

      const entriesResponse = await tukaramAPI.getSheetEntries(sheetId, { limit: 1000 });
      setEntries(entriesResponse.data.data.entries || []);
    } catch (error) {
      toast.error("Failed to load sheet data");
    } finally {
      setLoading(false);
    }
  }, [sheetId]);

  useEffect(() => {
    if (sheetId && sheetId !== "new") {
      loadSheetData();
    } else if (sheetId === "new") {
      setEditSheet({ title: "New Tukaram Sheet", description: "", openingBalance: 0 });
      setLoading(false);
    }
  }, [sheetId, loadSheetData]);

  const handleSaveSheet = async () => {
    setIsSaving(true);
    try {
      if (sheetId === "new") {
        const response = await tukaramAPI.createSheet({
          ...editSheet,
          openingBalance: parseFloat(editSheet.openingBalance) || 0,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        });
        toast.success("Sheet created successfully");
        router.push(`/dashboard/accounts/tukaram/${response.data.data.id}`);
      } else {
        await tukaramAPI.updateSheet(sheetId, {
          ...editSheet,
          openingBalance: parseFloat(editSheet.openingBalance) || 0,
        });
        toast.success("Sheet updated successfully");
        loadSheetData();
      }
    } catch (error) {
      toast.error("Failed to save sheet");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.containerCode && !newEntry.particular) {
      toast.error("Container Code or Particular is required");
      return;
    }
    try {
      const entryData = {
        ...newEntry,
        totalCtn: parseInt(newEntry.totalCtn) || 0,
        charges: parseFloat(newEntry.charges) || 0,
        scanning: parseFloat(newEntry.scanning) || 0,
        dc: parseFloat(newEntry.dc) || 0,
        paid: parseFloat(newEntry.paid) || 0,
      };
      await tukaramAPI.addEntry(sheetId, entryData);
      toast.success("Entry added");
      setNewEntry({
        containerCode: "",
        totalCtn: "",
        loadingDate: "",
        deliveryDate: "",
        particular: "",
        charges: "",
        scanning: "",
        dc: "",
        paid: "",
        paymentDate: "",
        note: "",
      });
      loadSheetData();
    } catch (error) {
      toast.error("Failed to add entry");
    }
  };

  const handleUpdateEntry = async (entryId, field, value) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      const updatedData = { ...entry, [field]: value };
      
      // Auto-recalculate total if charges/scanning/dc change
      if (['charges', 'scanning', 'dc'].includes(field)) {
        updatedData.total = (parseFloat(updatedData.charges) || 0) + 
                         (parseFloat(updatedData.scanning) || 0) + 
                         (parseFloat(updatedData.dc) || 0);
      }

      await tukaramAPI.updateEntry(entryId, updatedData);
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, ...updatedData } : e));
    } catch (error) {
      toast.error("Failed to update entry");
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await tukaramAPI.deleteEntry(entryId);
      toast.success("Entry deleted");
      setEntries(prev => prev.filter(e => e.id !== entryId));
    } catch (error) {
      toast.error("Failed to delete entry");
    }
  };

  const stats = useMemo(() => {
    const totals = entries.reduce((acc, curr) => {
      acc.charges += parseFloat(curr.charges) || 0;
      acc.scanning += parseFloat(curr.scanning) || 0;
      acc.dc += parseFloat(curr.dc) || 0;
      acc.total += parseFloat(curr.total) || 0;
      acc.paid += parseFloat(curr.paid) || 0;
      return acc;
    }, { charges: 0, scanning: 0, dc: 0, total: 0, paid: 0 });

    const balance = totals.total - totals.paid;
    const finalBalance = (parseFloat(editSheet.openingBalance) || 0) + balance;

    return { ...totals, balance, finalBalance };
  }, [entries, editSheet.openingBalance]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        router.push("/dashboard/accounts");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveSheet();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editSheet, isSaving]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard/accounts" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex items-center gap-3">
             <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider hidden sm:inline">
              Ctrl+S Save · Esc Back
            </span>
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium"
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button
              onClick={handleSaveSheet}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Blue Banner */}
      <div className="bg-blue-600 text-white py-10">
        <div className="max-w-[1800px] mx-auto px-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black uppercase tracking-tight">
              {sheet?.title || "Tukaram Account"}
            </h1>
            <p className="text-blue-100 text-sm font-medium">
              Manage containers, charges, and payments for Tukaram account.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="bg-blue-700/50 rounded-lg px-3 py-2 flex items-center gap-3 border border-blue-500/30">
              <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider whitespace-nowrap">Title:</span>
              <input
                className="bg-transparent border-0 outline-none text-sm font-bold uppercase w-64 placeholder:text-blue-400"
                value={editSheet.title}
                onChange={(e) => setEditSheet({ ...editSheet, title: e.target.value })}
                placeholder="SHEET TITLE..."
              />
            </div>
            <div className="bg-blue-700/50 rounded-lg px-3 py-2 flex items-center gap-3 border border-blue-500/30">
              <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider whitespace-nowrap">Opening Bal:</span>
              <input
                type="number"
                className="bg-transparent border-0 outline-none text-sm font-bold w-32 placeholder:text-blue-400"
                value={editSheet.openingBalance}
                onChange={(e) => setEditSheet({ ...editSheet, openingBalance: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="max-w-[1800px] mx-auto px-6 -mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 z-20 relative">
        <div className="bg-white p-5 rounded-xl shadow-lg border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Charges</div>
            <div className="text-xl font-black text-slate-900">₹{stats.total.toLocaleString("en-IN")}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-lg border border-slate-100">
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Total Paid</div>
            <div className="text-xl font-black text-emerald-600">₹{stats.paid.toLocaleString("en-IN")}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-lg border border-slate-100">
            <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Sheet Balance</div>
            <div className="text-xl font-black text-blue-600">₹{stats.balance.toLocaleString("en-IN")}</div>
        </div>
        <div className="bg-amber-500 p-5 rounded-xl shadow-lg border border-amber-400 text-white">
            <div className="text-[10px] font-bold text-amber-100 uppercase tracking-widest mb-1">Final Balance</div>
            <div className="text-xl font-black">₹{stats.finalBalance.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Table Section */}
      <div className="max-w-[1800px] mx-auto px-6 py-8 overflow-x-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: "1600px" }}>
          <thead>
            <tr className="bg-amber-200 text-slate-900 border border-slate-300">
              <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase w-12">SR</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase w-40">Cont. Code</th>
              <th className="border border-slate-300 px-3 py-2 text-center font-bold uppercase w-20">CTN</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase w-32">Loading</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase w-32">Delivery</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase">Particular</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase w-28 bg-blue-50/50">Charges</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase w-28 bg-blue-50/50">Scanning</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase w-28 bg-blue-50/50 text-blue-800">DC</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase w-32 bg-slate-100">Total</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase w-32 bg-emerald-50/50 text-emerald-800">Paid</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase w-32">Pay Date</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase">Note</th>
              <th className="border border-slate-300 px-2 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {/* Opening Balance Row */}
            <tr className="bg-slate-50 border-b border-slate-200 italic text-slate-500">
                <td className="border border-slate-200 px-3 py-2 text-center">-</td>
                <td className="border border-slate-200 px-3 py-2 font-bold uppercase" colSpan="4">Opening Balance</td>
                <td className="border border-slate-200 px-3 py-2"></td>
                <td className="border border-slate-200 px-3 py-2"></td>
                <td className="border border-slate-200 px-3 py-2"></td>
                <td className="border border-slate-200 px-3 py-2"></td>
                <td className="border border-slate-200 px-3 py-2 text-right font-mono font-bold text-slate-900">
                    {parseFloat(editSheet.openingBalance || 0).toLocaleString("en-IN")}
                </td>
                <td className="border border-slate-200 px-3 py-2" colSpan="4"></td>
            </tr>

            {entries.map((row, idx) => (
              <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                <td className="border border-slate-200 px-3 py-1.5 text-center text-slate-400 font-medium">
                  {idx + 1}
                </td>
                <td className="border border-slate-200 px-3 py-1.5">
                  <input
                    className="w-full bg-transparent border-0 outline-none py-0.5 font-bold text-slate-800 uppercase"
                    value={row.containerCode || ""}
                    onChange={(e) => handleUpdateEntry(row.id, "containerCode", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5">
                  <input
                    type="number"
                    className="w-full text-center bg-transparent border-0 outline-none py-0.5"
                    value={row.totalCtn || ""}
                    onChange={(e) => handleUpdateEntry(row.id, "totalCtn", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5">
                  <input
                    type="date"
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-xs text-slate-600"
                    value={row.loadingDate ? new Date(row.loadingDate).toISOString().split("T")[0] : ""}
                    onChange={(e) => handleUpdateEntry(row.id, "loadingDate", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5">
                  <input
                    type="date"
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-xs text-slate-600"
                    value={row.deliveryDate ? new Date(row.deliveryDate).toISOString().split("T")[0] : ""}
                    onChange={(e) => handleUpdateEntry(row.id, "deliveryDate", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5">
                  <input
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-slate-700"
                    value={row.particular || ""}
                    onChange={(e) => handleUpdateEntry(row.id, "particular", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5 font-mono"
                    value={row.charges || ""}
                    onChange={(e) => handleUpdateEntry(row.id, "charges", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5 font-mono"
                    value={row.scanning || ""}
                    onChange={(e) => handleUpdateEntry(row.id, "scanning", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5 font-mono text-blue-700"
                    value={row.dc || ""}
                    onChange={(e) => handleUpdateEntry(row.id, "dc", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right bg-slate-50 font-black font-mono text-slate-900">
                  {(parseFloat(row.total) || 0).toLocaleString("en-IN")}
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right bg-emerald-50/20">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5 font-mono font-bold text-emerald-700"
                    value={row.paid || ""}
                    onChange={(e) => handleUpdateEntry(row.id, "paid", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5">
                  <input
                    type="date"
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-xs text-slate-600"
                    value={row.paymentDate ? new Date(row.paymentDate).toISOString().split("T")[0] : ""}
                    onChange={(e) => handleUpdateEntry(row.id, "paymentDate", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5">
                  <input
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-slate-500 italic text-xs"
                    placeholder="..."
                    value={row.note || ""}
                    onChange={(e) => handleUpdateEntry(row.id, "note", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1.5 text-center">
                  <button
                    onClick={() => handleDeleteEntry(row.id)}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {/* New Entry Row */}
            <tr className="bg-blue-50/30 border-t-2 border-blue-200">
              <td className="border border-slate-200 px-3 py-2 text-center">
                <PlusCircle className="w-4 h-4 text-blue-400 mx-auto" />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  className="w-full border border-blue-200 rounded px-2 py-1 text-xs font-bold uppercase"
                  placeholder="CONT CODE"
                  value={newEntry.containerCode}
                  onChange={(e) => setNewEntry({ ...newEntry, containerCode: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAddEntry()}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="number"
                  className="w-full border border-blue-200 rounded px-2 py-1 text-xs text-center"
                  placeholder="0"
                  value={newEntry.totalCtn}
                  onChange={(e) => setNewEntry({ ...newEntry, totalCtn: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="date"
                  className="w-full border border-blue-200 rounded px-1 py-1 text-[10px]"
                  value={newEntry.loadingDate}
                  onChange={(e) => setNewEntry({ ...newEntry, loadingDate: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="date"
                  className="w-full border border-blue-200 rounded px-1 py-1 text-[10px]"
                  value={newEntry.deliveryDate}
                  onChange={(e) => setNewEntry({ ...newEntry, deliveryDate: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  className="w-full border border-blue-200 rounded px-2 py-1 text-xs"
                  placeholder="PARTICULAR"
                  value={newEntry.particular}
                  onChange={(e) => setNewEntry({ ...newEntry, particular: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="number"
                  className="w-full border border-blue-200 rounded px-2 py-1 text-xs text-right"
                  placeholder="0"
                  value={newEntry.charges}
                  onChange={(e) => setNewEntry({ ...newEntry, charges: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="number"
                  className="w-full border border-blue-200 rounded px-2 py-1 text-xs text-right"
                  placeholder="0"
                  value={newEntry.scanning}
                  onChange={(e) => setNewEntry({ ...newEntry, scanning: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="number"
                  className="w-full border border-blue-200 rounded px-2 py-1 text-xs text-right text-blue-700 font-bold"
                  placeholder="0"
                  value={newEntry.dc}
                  onChange={(e) => setNewEntry({ ...newEntry, dc: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2 text-right font-black text-slate-400">
                ADD
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="number"
                  className="w-full border border-blue-200 rounded px-2 py-1 text-xs text-right text-emerald-700 font-bold"
                  placeholder="0"
                  value={newEntry.paid}
                  onChange={(e) => setNewEntry({ ...newEntry, paid: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2" colSpan="2">
                <button
                  onClick={handleAddEntry}
                  className="w-full py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" /> ADD ENTRY
                </button>
              </td>
              <td className="border border-slate-200 px-2 py-2"></td>
            </tr>
          </tbody>
          {/* Footer Totals */}
          <tfoot>
            <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
              <td colSpan="6" className="border border-slate-300 px-3 py-3 text-right text-slate-500 uppercase tracking-widest text-[10px]">
                GRAND TOTAL
              </td>
              <td className="border border-slate-300 px-3 py-3 text-right font-mono">
                {stats.charges.toLocaleString("en-IN")}
              </td>
              <td className="border border-slate-300 px-3 py-3 text-right font-mono">
                {stats.scanning.toLocaleString("en-IN")}
              </td>
              <td className="border border-slate-300 px-3 py-3 text-right font-mono text-blue-700">
                {stats.dc.toLocaleString("en-IN")}
              </td>
              <td className="border border-slate-300 px-3 py-3 text-right font-black font-mono text-lg text-slate-900">
                ₹{stats.total.toLocaleString("en-IN")}
              </td>
              <td className="border border-slate-300 px-3 py-3 text-right font-black font-mono text-lg text-emerald-700">
                ₹{stats.paid.toLocaleString("en-IN")}
              </td>
              <td colSpan="3" className="border border-slate-300 bg-white"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <TukaramPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        sheet={sheet}
        entries={entries}
        totals={stats}
        finalBalance={stats.finalBalance}
      />
    </div>
  );
}
