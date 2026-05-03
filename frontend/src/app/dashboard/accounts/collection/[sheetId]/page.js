"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Eye, PlusCircle, Trash2, Save, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import API from "@/lib/api";
import CollectionPreviewModal from "./_components/CollectionPreviewModal";

function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function PaymentCollectionSheetPage() {
  const params = useParams();
  const router = useRouter();
  const sheetId = params.sheetId;

  const [sheetName, setSheetName] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sheetDetails, setSheetDetails] = useState(null);

  const [newEntry, setNewEntry] = useState({
    clientName: "",
    expectedDate: "",
    amount24_25: "",
    addCompany: "",
    amount25_26: "",
    advance: "",
    notes: "",
    highlight: false,
    hisab: false,
  });

  useEffect(() => {
    if (sheetId && sheetId !== "new") {
      loadSheetData();
    } else if (sheetId === "new") {
      setSheetName("New Payment Collection");
      setLoading(false);
    }
  }, [sheetId]);

  const loadSheetData = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/accounts/collection/${sheetId}`);
      if (response.data.success) {
        const data = response.data.data;
        setSheetDetails(data);
        setSheetName(data.name || "");
        setEntries(data.entries || []);
      }
    } catch (error) {
      toast.error("Failed to load collection sheet");
    } finally {
      setLoading(false);
    }
  };

  const saveSheet = async () => {
    if (sheetId === "new") {
      await createNewSheet();
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update sheet name if changed
      await API.put(`/accounts/collection/${sheetId}`, {
        name: sheetName,
      });

      // 2. Save all entries (Bulk update)
      const response = await API.put(
        `/accounts/collection/${sheetId}/bulk-entries`,
        entries.map((e) => ({
          clientName: e.clientName || "",
          expectedDate: e.expectedDate || null,
          amount24_25: parseFloat(e.amount24_25) || 0,
          addCompany: parseFloat(e.addCompany) || 0,
          amount25_26: parseFloat(e.amount25_26) || 0,
          advance: parseFloat(e.advance) || 0,
          isHighlighted: e.highlight || false,
          hisab: e.hisab || false,
          notes: e.notes || "",
        }))
      );

      if (response.data.success) {
        toast.success("All changes saved");
        loadSheetData(); // Refresh IDs and data
      }
    } catch (error) {
      const errorMsg = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || "Failed to save sheet";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const createNewSheet = async () => {
    setIsSaving(true);
    try {
      const response = await API.post("/accounts/collection/", {
        name: sheetName || "New Collection",
        fiscalYear: "2024-2025",
      });

      if (response.data.success) {
        const newSheet = response.data.data;
        
        // If there are entries, save them too
        if (entries.length > 0) {
            await API.put(
                `/accounts/collection/${newSheet.id}/bulk-entries`,
                entries.map((e) => ({
                    clientName: e.clientName || "",
                    expectedDate: e.expectedDate || null,
                    amount24_25: parseFloat(e.amount24_25) || 0,
                    addCompany: parseFloat(e.addCompany) || 0,
                    amount25_26: parseFloat(e.amount25_26) || 0,
                    advance: parseFloat(e.advance) || 0,
                    isHighlighted: e.highlight || false,
                    hisab: e.hisab || false,
                    notes: e.notes || "",
                }))
            );
        }

        toast.success("Sheet created successfully");
        router.push(`/dashboard/accounts/collection/${newSheet.id}`);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || "Failed to create sheet";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard: Ctrl+S save, Escape back
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (isPreviewOpen) {
          setIsPreviewOpen(false);
        } else {
          router.push("/dashboard/accounts");
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveSheet();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPreviewOpen, sheetName, entries, isSaving]);

  const handleAddEntry = () => {
    if (!newEntry.clientName) {
      toast.error("Client Name is required");
      return;
    }
    const entry = {
      ...newEntry,
      id: Date.now(),
      amount24_25: parseFloat(newEntry.amount24_25) || 0,
      addCompany: parseFloat(newEntry.addCompany) || 0,
      amount25_26: parseFloat(newEntry.amount25_26) || 0,
      advance: parseFloat(newEntry.advance) || 0,
    };
    setEntries([...entries, entry]);
    setNewEntry({
      clientName: "",
      expectedDate: "",
      amount24_25: "",
      addCompany: "",
      amount25_26: "",
      advance: "",
      notes: "",
      highlight: false,
      hisab: false,
    });
  };

  const handleUpdateEntry = (id, field, value) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const handleDeleteEntry = (id) => {
    if (!confirm("Delete this entry?")) return;
    setEntries(entries.filter((e) => e.id !== id));
  };

  const stats = useMemo(() => {
    return entries.reduce(
      (acc, curr) => {
        const a2425 = parseFloat(curr.amount24_25) || 0;
        const addCo = parseFloat(curr.addCompany) || 0;
        const a2526 = parseFloat(curr.amount25_26) || 0;
        const adv = parseFloat(curr.advance) || 0;
        const bal = a2526 - adv;

        return {
          total24_25: acc.total24_25 + a2425,
          totalAddCompany: acc.totalAddCompany + addCo,
          total25_26: acc.total25_26 + a2526,
          totalAdvance: acc.totalAdvance + adv,
          totalBalance: acc.totalBalance + bal,
          highlightedCount: acc.highlightedCount + (curr.highlight ? 1 : 0),
          overdueCount: acc.overdueCount + (curr.expectedDate && new Date(curr.expectedDate) < new Date() ? 1 : 0),
        };
      },
      {
        total24_25: 0,
        totalAddCompany: 0,
        total25_26: 0,
        totalAdvance: 0,
        totalBalance: 0,
        highlightedCount: 0,
        overdueCount: 0,
      }
    );
  }, [entries]);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-medium flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading Collection Sheet...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard/accounts"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider hidden sm:inline">
              Ctrl+S Save · Esc Back
            </span>
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={saveSheet}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-bold shadow-md transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Purple banner */}
      <div className="bg-purple-600 text-white py-10">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black uppercase tracking-tight">
              {sheetName || "Payment Collection"}
            </h1>
            <p className="text-purple-100 text-sm font-medium">
              Manage client collections, fiscal balances and expected dates.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="bg-purple-700/50 rounded-lg px-3 py-2 flex items-center gap-3 border border-purple-500/30">
              <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider whitespace-nowrap">
                Current Sheet:
              </span>
              <input
                className="bg-transparent border-0 outline-none text-sm font-bold uppercase w-80 placeholder:text-purple-400"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="ENTER SHEET NAME..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="max-w-[1600px] mx-auto px-6 py-8 overflow-x-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: "1200px" }}>
          <thead>
            <tr className="bg-amber-200 text-slate-900 border border-slate-300">
              <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase whitespace-nowrap">Client Name</th>
              <th className="border border-slate-300 px-3 py-2 text-center font-bold uppercase w-16">HISAB</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase w-40">Exp. Date</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase w-32 bg-amber-100/50">Amt 24-25</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase w-32 bg-blue-100/50 text-blue-800">Add Co.</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase w-32 bg-purple-100/50 text-purple-800">Amt 25-26</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase w-32 bg-emerald-100/50 text-emerald-800">Advance</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold uppercase w-32 bg-slate-100">Balance</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-bold uppercase">Notes</th>
              <th className="border border-slate-300 px-2 py-2 w-10">Flag</th>
              <th className="border border-slate-300 px-2 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {entries.map((row) => (
              <tr 
                key={row.id} 
                className={`border-b border-slate-200 hover:bg-slate-50/50 transition-colors ${row.highlight ? "bg-amber-50" : ""}`}
              >
                <td className="border border-slate-200 px-3 py-1.5">
                  <input
                    className="w-full bg-transparent border-0 outline-none py-0.5 font-bold text-slate-800 uppercase"
                    value={row.clientName || ""}
                    onChange={(e) => handleUpdateEntry(row.id, "clientName", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" 
                    checked={row.hisab || false} 
                    onChange={(e) => handleUpdateEntry(row.id, "hisab", e.target.checked)} 
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5">
                  <input
                    type="date"
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-slate-600 text-xs"
                    value={row.expectedDate ? new Date(row.expectedDate).toISOString().split("T")[0] : ""}
                    onChange={(e) => handleUpdateEntry(row.id, "expectedDate", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5 font-mono"
                    value={row.amount24_25 ?? ""}
                    onChange={(e) => handleUpdateEntry(row.id, "amount24_25", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right bg-blue-50/20">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5 font-mono text-blue-700"
                    value={row.addCompany ?? ""}
                    onChange={(e) => handleUpdateEntry(row.id, "addCompany", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right bg-purple-50/20">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5 font-mono font-bold text-purple-700"
                    value={row.amount25_26 ?? ""}
                    onChange={(e) => handleUpdateEntry(row.id, "amount25_26", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right bg-emerald-50/20">
                  <input
                    type="number"
                    className="w-full text-right bg-transparent border-0 outline-none py-0.5 font-mono text-emerald-700"
                    value={row.advance ?? ""}
                    onChange={(e) => handleUpdateEntry(row.id, "advance", e.target.value)}
                  />
                </td>
                <td className={`border border-slate-200 px-3 py-1.5 text-right font-black font-mono ${((parseFloat(row.amount25_26) || 0) - (parseFloat(row.advance) || 0)) < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {((parseFloat(row.amount25_26) || 0) - (parseFloat(row.advance) || 0)).toLocaleString("en-IN")}
                </td>
                <td className="border border-slate-200 px-3 py-1.5">
                  <input
                    className="w-full bg-transparent border-0 outline-none py-0.5 text-slate-500 italic text-xs"
                    placeholder="Notes..."
                    value={row.notes || ""}
                    onChange={(e) => handleUpdateEntry(row.id, "notes", e.target.value)}
                  />
                </td>
                <td className="border border-slate-200 px-2 py-1.5 text-center">
                   <button
                    onClick={() => handleUpdateEntry(row.id, "highlight", !row.highlight)}
                    className={`p-1.5 rounded transition-colors ${row.highlight ? "bg-amber-400 text-white" : "text-slate-300 hover:text-amber-500"}`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
                </td>
                <td className="border border-slate-200 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteEntry(row.id)}
                    className="p-1 text-slate-300 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {/* New entry row */}
            <tr className="bg-slate-50 border-t-2 border-slate-300">
              <td className="border border-slate-200 px-3 py-2">
                <input
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-bold uppercase"
                  placeholder="NEW CLIENT NAME"
                  value={newEntry.clientName}
                  onChange={(e) => setNewEntry({ ...newEntry, clientName: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAddEntry()}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2 text-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" 
                  checked={newEntry.hisab} 
                  onChange={(e) => setNewEntry({ ...newEntry, hisab: e.target.checked })} 
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                  value={newEntry.expectedDate}
                  onChange={(e) => setNewEntry({ ...newEntry, expectedDate: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-right"
                  placeholder="0"
                  value={newEntry.amount24_25}
                  onChange={(e) => setNewEntry({ ...newEntry, amount24_25: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-right text-blue-700"
                  placeholder="0"
                  value={newEntry.addCompany}
                  onChange={(e) => setNewEntry({ ...newEntry, addCompany: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-right text-purple-700 font-bold"
                  placeholder="0"
                  value={newEntry.amount25_26}
                  onChange={(e) => setNewEntry({ ...newEntry, amount25_26: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-right text-emerald-700"
                  placeholder="0"
                  value={newEntry.advance}
                  onChange={(e) => setNewEntry({ ...newEntry, advance: e.target.value })}
                />
              </td>
              <td className="border border-slate-200 px-3 py-2 text-right font-black text-slate-400">
                ADD
              </td>
              <td className="border border-slate-200 px-3 py-2">
                <input
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                  placeholder="NOTES..."
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAddEntry()}
                />
              </td>
              <td className="border border-slate-200 px-2 py-2">
              </td>
              <td className="border border-slate-200 px-2 py-2">
                <button
                  type="button"
                  onClick={handleAddEntry}
                  className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
          {/* Footer totals */}
          <tfoot>
            <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
              <td colSpan="3" className="border border-slate-300 px-3 py-3 text-right text-slate-500 uppercase tracking-widest text-[10px]">
                GRAND TOTAL
              </td>
              <td className="border border-slate-300 px-3 py-3 text-right font-mono">
                {stats.total24_25.toLocaleString("en-IN")}
              </td>
              <td className="border border-slate-300 px-3 py-3 text-right font-mono text-blue-700">
                {stats.totalAddCompany.toLocaleString("en-IN")}
              </td>
              <td className="border border-slate-300 px-3 py-3 text-right font-mono text-purple-700">
                {stats.total25_26.toLocaleString("en-IN")}
              </td>
              <td className="border border-slate-300 px-3 py-3 text-right font-mono text-emerald-700">
                {stats.totalAdvance.toLocaleString("en-IN")}
              </td>
              <td className={`border border-slate-300 px-3 py-3 text-right font-black font-mono text-lg ${stats.totalBalance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                ₹{stats.totalBalance.toLocaleString("en-IN")}
              </td>
              <td colSpan="3" className="border border-slate-300 bg-white"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <CollectionPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        sheetName={sheetName}
        sheetDescription={sheetDetails?.description}
        entries={entries}
        stats={stats}
      />
    </div>
  );
}
