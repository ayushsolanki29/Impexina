"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Plus, ArrowLeft, Trash2, Search, Wallet, 
  Edit, Save, X, Loader2, Copy, Calendar, MoreVertical, 
  ChevronLeft, ChevronRight, FileText, List, Eye
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import PartnerPreviewModal from "./_components/PartnerPreviewModal";

export default function PartnerSheet({ partnerName = "David", partnerPath = "david", themeColor = "blue" }) {
  const router = useRouter();
  const params = useParams();
  const sheetId = params.sheetId;

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sheetDetails, setSheetDetails] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (sheetId === "new") {
      setSheetName(`New ${partnerName} Sheet`);
      setRows([
        {
          id: 1,
          date: new Date().toISOString().split("T")[0],
          particulars: "INITIAL BALANCE",
          debitRMB: 0,
          creditRMB: 0,
          debitUSD: 0,
          creditUSD: 0,
        },
      ]);
      setIsLoading(false);
    } else {
      loadSheet();
    }
  }, [sheetId]);

  const loadSheet = async () => {
    setIsLoading(true);
    try {
      // All partners use the same 'david' endpoint in the backend
      const response = await API.get(`/accounts/david/${sheetId}`);
      if (response.data.success) {
        const sheet = response.data.data;
        setSheetDetails(sheet);
        setSheetName(sheet.name || "");
        setRows(sheet.entries || []);
        setLastSaved(new Date(sheet.updatedAt));
      }
    } catch (error) {
      console.error("Error loading sheet:", error);
      toast.error("Failed to load sheet");
      router.push(`/dashboard/accounts/${partnerPath}/list`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSheet = async () => {
    if (sheetId === "new") {
      await createAndSaveNewSheet();
      return;
    }

    setIsSaving(true);
    try {
      if (sheetName !== sheetDetails?.name) {
        await API.put(`/accounts/david/${sheetId}`, {
          name: sheetName,
        });
      }

      const response = await API.put(
        `/accounts/david/${sheetId}/bulk-entries`,
        rows.map((row) => ({
          date: row.date || new Date().toISOString().split("T")[0],
          particulars: row.particulars || "",
          debitRMB: parseFloat(row.debitRMB) || 0,
          creditRMB: parseFloat(row.creditRMB) || 0,
          debitUSD: parseFloat(row.debitUSD) || 0,
          creditUSD: parseFloat(row.creditUSD) || 0,
        }))
      );

      if (response.data.success) {
        toast.success("Sheet saved successfully");
        setLastSaved(new Date());
        if (sheetName !== sheetDetails?.name) loadSheet();
      }
    } catch (error) {
      console.error("Error saving sheet:", error);
      toast.error("Failed to save sheet");
    } finally {
      setIsSaving(false);
    }
  };

  const createAndSaveNewSheet = async () => {
    setIsSaving(true);
    try {
      const response = await API.post("/accounts/david/", {
        name: sheetName || `New ${partnerName} Sheet`,
        description: "",
        tags: ["forex", "ledger", partnerName.toLowerCase()],
      });

      if (response.data.success) {
        const newSheet = response.data.data;
        await API.put(
          `/accounts/david/${newSheet.id}/bulk-entries`,
          rows.map((row) => ({
            date: row.date || new Date().toISOString().split("T")[0],
            particulars: row.particulars || "",
            debitRMB: parseFloat(row.debitRMB) || 0,
            creditRMB: parseFloat(row.creditRMB) || 0,
            debitUSD: parseFloat(row.debitUSD) || 0,
            creditUSD: parseFloat(row.creditUSD) || 0,
          }))
        );

        toast.success("Sheet created successfully");
        router.push(`/dashboard/accounts/${partnerPath}/${newSheet.id}`);
      }
    } catch (error) {
      console.error("Error creating sheet:", error);
      toast.error("Failed to create sheet");
    } finally {
      setIsSaving(false);
    }
  };



  const addRow = () => {
    const newRow = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      particulars: "",
      debitRMB: "",
      creditRMB: "",
      debitUSD: "",
      creditUSD: "",
    };
    setRows([...rows, newRow]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };

  const deleteRow = (id) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      setRows(rows.filter((r) => r.id !== id));
      toast.success("Entry removed");
    }
  };

  const totals = rows.reduce(
    (acc, r) => ({
      dRMB: acc.dRMB + (Number(r.debitRMB) || 0),
      cRMB: acc.cRMB + (Number(r.creditRMB) || 0),
      dUSD: acc.dUSD + (Number(r.debitUSD) || 0),
      cUSD: acc.cUSD + (Number(r.creditUSD) || 0),
    }),
    { dRMB: 0, cRMB: 0, dUSD: 0, cUSD: 0 }
  );

  const netRMB = totals.dRMB - totals.cRMB;
  const netUSD = totals.dUSD - totals.cUSD;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className={`w-8 h-8 animate-spin text-${themeColor}-600`} />
        <span className="ml-3 text-slate-600">Loading sheet...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/dashboard/accounts/${partnerPath}/list`)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                title="Back to Sheet List"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push("/dashboard/accounts")}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                title="Back to Hub"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={sheetName}
                      onChange={(e) => setSheetName(e.target.value)}
                      className={`px-3 py-1.5 border border-${themeColor}-500 rounded-lg text-lg font-bold text-slate-900 outline-none min-w-[300px]`}
                      autoFocus
                    />
                    <button onClick={() => setIsEditingName(false)} className="p-2 bg-green-500 text-white rounded-lg"><Save className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1
                      className={`text-xl font-bold text-slate-900 cursor-pointer hover:text-${themeColor}-600 transition-colors truncate max-w-[400px]`}
                      onClick={() => setIsEditingName(true)}
                    >
                      {sheetName}
                    </h1>
                    <Edit className="w-4 h-4 text-slate-400 cursor-pointer" onClick={() => setIsEditingName(true)} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex gap-4">
                <div className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-amber-600">RMB Balance</div>
                  <div className="font-mono font-bold">¥{formatCurrency(netRMB)}</div>
                </div>
                <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-emerald-600">USD Balance</div>
                  <div className="font-mono font-bold">${formatCurrency(netUSD)}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium text-sm shadow-sm transition-all"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={saveSheet}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-6 py-2.5 bg-${themeColor}-600 text-white font-bold rounded-lg shadow-md hover:bg-${themeColor}-700 disabled:opacity-50`}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search descriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={addRow}
            className={`flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800`}
          >
            <Plus className="w-4 h-4" /> Add Transaction
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left w-32 border-b">Date</th>
                <th className="px-4 py-3 text-left border-b">Particulars</th>
                <th className="px-4 py-3 text-right bg-amber-50/50 border-b border-l border-amber-100 w-32">Debit (¥)</th>
                <th className="px-4 py-3 text-right bg-amber-50/50 border-b border-r border-amber-100 w-32">Credit (¥)</th>
                <th className="px-4 py-3 text-right bg-emerald-50/50 border-b border-l border-emerald-100 w-32">Debit ($)</th>
                <th className="px-4 py-3 text-right bg-emerald-50/50 border-b w-32">Credit ($)</th>
                <th className="px-4 py-3 w-12 border-b"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.filter(r => r.particulars?.toLowerCase().includes(search.toLowerCase())).map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 group">
                  <td className="px-2 py-1"><input type="date" className="w-full bg-transparent p-2 outline-none" value={row.date} onChange={(e) => updateRow(row.id, "date", e.target.value)} /></td>
                  <td className="px-2 py-1"><input className="w-full bg-transparent p-2 outline-none font-medium" placeholder="Description..." value={row.particulars} onChange={(e) => updateRow(row.id, "particulars", e.target.value)} /></td>
                  <td className="px-2 py-1 bg-amber-50/10 border-l"><input type="number" className="w-full bg-transparent p-2 text-right outline-none font-mono" value={row.debitRMB} onChange={(e) => updateRow(row.id, "debitRMB", e.target.value)} /></td>
                  <td className="px-2 py-1 bg-amber-50/10 border-r"><input type="number" className="w-full bg-transparent p-2 text-right outline-none font-mono text-red-600" value={row.creditRMB} onChange={(e) => updateRow(row.id, "creditRMB", e.target.value)} /></td>
                  <td className="px-2 py-1 bg-emerald-50/10 border-l"><input type="number" className="w-full bg-transparent p-2 text-right outline-none font-mono" value={row.debitUSD} onChange={(e) => updateRow(row.id, "debitUSD", e.target.value)} /></td>
                  <td className="px-2 py-1 bg-emerald-50/10"><input type="number" className="w-full bg-transparent p-2 text-right outline-none font-mono text-red-600" value={row.creditUSD} onChange={(e) => updateRow(row.id, "creditUSD", e.target.value)} /></td>
                  <td className="px-2 py-1 text-center">
                    <button onClick={() => deleteRow(row.id)} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold">
              <tr>
                <td colSpan="2" className="p-4 text-right text-slate-500 uppercase text-[10px] tracking-widest">Totals</td>
                <td className="p-4 text-right font-mono border-l">¥{formatCurrency(totals.dRMB)}</td>
                <td className="p-4 text-right font-mono border-r text-red-600">¥{formatCurrency(totals.cRMB)}</td>
                <td className="p-4 text-right font-mono border-l">${formatCurrency(totals.dUSD)}</td>
                <td className="p-4 text-right font-mono text-red-600">${formatCurrency(totals.cUSD)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </main>
      {/* Preview Modal */}
      <PartnerPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        sheetName={sheetName}
        rows={rows}
        totals={totals}
        partnerName={partnerName}
        themeColor={themeColor}
      />
    </div>
  );
}
