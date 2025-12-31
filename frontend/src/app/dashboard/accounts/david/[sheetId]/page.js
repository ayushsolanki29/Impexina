"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Plus,
  ArrowLeft,
  Trash2,
  Search,
  Download,
  Wallet,
  Edit,
  Save,
  X,
  Loader2,
  Copy,
  Calendar,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";

export default function DavidSheetPage() {
  const router = useRouter();
  const params = useParams();
  const sheetId = params.sheetId;

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sheetDetails, setSheetDetails] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (sheetId === "new") {
      // Initialize new sheet
      setSheetName("New Forex Sheet");
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
      router.push("/dashboard/accounts/david");
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
      // Update sheet name if changed
      if (sheetName !== sheetDetails?.name) {
        await API.put(`/accounts/david/${sheetId}`, {
          name: sheetName,
        });
      }

      // Save entries
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
        
        // Reload sheet details
        if (sheetName !== sheetDetails?.name) {
          loadSheet();
        }
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
        name: sheetName || "New Forex Sheet",
        description: "",
        tags: ["forex", "ledger"],
      });

      if (response.data.success) {
        const newSheet = response.data.data;
        
        // Save entries to the new sheet
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
        router.push(`/dashboard/accounts/david/${newSheet.id}`);
      }
    } catch (error) {
      console.error("Error creating sheet:", error);
      toast.error("Failed to create sheet");
    } finally {
      setIsSaving(false);
    }
  };

  const exportToExcel = async () => {
    if (sheetId === "new") {
      toast.info("Please save the sheet first to export");
      return;
    }

    try {
      window.open(
        `${process.env.NEXT_PUBLIC_API_URL}/accounts/david/${sheetId}/export`,
        "_blank"
      );
      toast.success("Export started");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Failed to export sheet");
    }
  };

  const duplicateSheet = async () => {
    const newName = `${sheetName} (Copy)`;
    try {
      const response = await API.post("/accounts/david/", {
        name: newName,
        description: "",
        tags: ["forex", "ledger", "copy"],
      });

      if (response.data.success) {
        const newSheet = response.data.data;

        // Duplicate entries
        await API.post(
          `/accounts/david/${newSheet.id}/import`,
          rows.map((row) => ({
            date: row.date,
            particulars: row.particulars,
            debitRMB: row.debitRMB || 0,
            creditRMB: row.creditRMB || 0,
            debitUSD: row.debitUSD || 0,
            creditUSD: row.creditUSD || 0,
          }))
        );

        toast.success("Sheet duplicated");
        router.push(`/dashboard/accounts/david/${newSheet.id}`);
      }
    } catch (error) {
      console.error("Error duplicating sheet:", error);
      toast.error("Failed to duplicate sheet");
    }
  };

  // Local state management
  const save = useCallback(
    (data) => {
      setRows(data);
      // Auto-save to localStorage for backup
      localStorage.setItem(`david_sheet_${sheetId}`, JSON.stringify({
        name: sheetName,
        rows: data,
        lastSaved: new Date().toISOString(),
      }));
    },
    [sheetId, sheetName]
  );

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
    const newRows = [...rows, newRow];
    save(newRows);
    
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const updateRow = (id, field, value) => {
    const updated = rows.map((r) =>
      r.id === id ? { ...r, [field]: value } : r
    );
    save(updated);
  };

  const deleteRow = (id) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      save(rows.filter((r) => r.id !== id));
      toast.success("Entry removed");
    }
  };

  const clearSheet = () => {
    if (confirm("Are you sure you want to clear all entries?")) {
      save([]);
      toast.success("All entries cleared");
    }
  };

  // Filter rows
  const filteredRows = rows.filter((r) =>
    (r.particulars || "").toLowerCase().includes(search.toLowerCase())
  );

  // Calculate Totals
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

  const formatCurrency = (amount, currency = "RMB") => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Loading sheet...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Navigation & Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard/accounts/david")}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                title="Back to Sheets"
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
                      className="px-3 py-1.5 border border-blue-500 rounded-lg text-lg font-bold text-slate-900 outline-none min-w-[300px]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setIsEditingName(false);
                        if (e.key === "Escape") {
                          setSheetName(sheetDetails?.name || "");
                          setIsEditingName(false);
                        }
                      }}
                    />
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      title="Save Name"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSheetName(sheetDetails?.name || "");
                        setIsEditingName(false);
                      }}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1
                      className="text-xl font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors truncate max-w-[400px]"
                      onClick={() => setIsEditingName(true)}
                      title="Click to edit name"
                    >
                      {sheetName}
                    </h1>
                    <Edit
                      className="w-4 h-4 text-slate-400 cursor-pointer hover:text-blue-500 transition-colors"
                      onClick={() => setIsEditingName(true)}
                      title="Edit sheet name"
                    />

                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">
                      {sheetId === "new" ? "New Sheet" : "Forex Ledger"}
                    </span>

                    {lastSaved && (
                      <span className="text-xs text-slate-500">
                        Last saved: {new Date(lastSaved).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Stats & Actions */}
            <div className="flex items-center gap-4">
              {/* RMB Card */}
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-full">
                  <span className="font-bold text-xs">¥</span>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-amber-700 tracking-wide">
                    RMB Net
                  </div>
                  <div className="font-mono font-bold text-slate-900">
                    ¥{formatCurrency(netRMB)}
                  </div>
                </div>
              </div>

              {/* USD Card */}
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                  <span className="font-bold text-xs">$</span>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-emerald-700 tracking-wide">
                    USD Net
                  </div>
                  <div className="font-mono font-bold text-slate-900">
                    ${formatCurrency(netUSD)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={duplicateSheet}
                  className="p-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  title="Duplicate Sheet"
                >
                  <Copy className="w-4 h-4" />
                </button>
                
                <button
                  onClick={exportToExcel}
                  className="p-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  title="Export to Excel"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={saveSheet}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-lg shadow-md transition-all ${
                    isSaving
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto p-4 md:p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Search particulars..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={clearSheet}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 font-medium text-sm rounded-lg hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>

            <button
              onClick={addRow}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-medium text-sm rounded-lg hover:bg-slate-800 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Info Bar */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="text-slate-700">
                <span className="font-medium">Entries:</span> {rows.length}
              </div>
              <div className="text-slate-700">
                <span className="font-medium">RMB:</span> ¥{formatCurrency(totals.dRMB)} / ¥{formatCurrency(totals.cRMB)}
              </div>
              <div className="text-slate-700">
                <span className="font-medium">USD:</span> ${formatCurrency(totals.dUSD)} / ${formatCurrency(totals.cUSD)}
              </div>
            </div>
            <button
              onClick={saveSheet}
              disabled={isSaving}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded ${
                isSaving
                  ? "bg-blue-400 text-white cursor-not-allowed"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  Save Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)]">
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="font-semibold px-4 py-3 text-left w-32">Date</th>
                  <th className="font-semibold px-4 py-3 text-left min-w-[280px]">Particulars</th>
                  <th className="font-semibold px-2 py-3 text-center bg-amber-50/50 border-l border-amber-100 w-32 text-amber-800">
                    Debit (RMB)
                  </th>
                  <th className="font-semibold px-2 py-3 text-center bg-amber-50/50 border-r border-amber-100 w-32 text-amber-800">
                    Credit (RMB)
                  </th>
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
                      {search
                        ? "No matching transactions found."
                        : "No transactions yet."}
                      <br />
                      <button
                        onClick={addRow}
                        className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Add your first transaction
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className="group hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-2 py-1 align-top">
                        <div className="relative">
                          <input
                            type="date"
                            className="w-full px-2 py-2 rounded border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white bg-transparent outline-none text-slate-600"
                            value={row.date}
                            onChange={(e) =>
                              updateRow(row.id, "date", e.target.value)
                            }
                          />
                          <Calendar className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-2 py-1 align-top">
                        <textarea
                          rows={1}
                          className="w-full px-3 py-2.5 rounded border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white bg-transparent outline-none font-medium text-slate-800 resize-none overflow-hidden"
                          placeholder="Enter description..."
                          value={row.particulars}
                          onChange={(e) => {
                            updateRow(row.id, "particulars", e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = e.target.scrollHeight + "px";
                          }}
                          style={{ minHeight: "40px" }}
                        />
                      </td>
                      <td className="px-2 py-1 align-top bg-amber-50/20 border-l border-amber-100/50">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-2 py-2 text-right rounded border border-transparent hover:border-amber-300 focus:border-amber-500 focus:bg-white bg-transparent outline-none font-mono"
                          placeholder="0.00"
                          value={row.debitRMB}
                          onChange={(e) =>
                            updateRow(row.id, "debitRMB", e.target.value)
                          }
                        />
                      </td>
                      <td className="px-2 py-1 align-top bg-amber-50/20 border-r border-amber-100/50">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-2 py-2 text-right rounded border border-transparent hover:border-amber-300 focus:border-amber-500 focus:bg-white bg-transparent outline-none font-mono text-red-600"
                          placeholder="0.00"
                          value={row.creditRMB}
                          onChange={(e) =>
                            updateRow(row.id, "creditRMB", e.target.value)
                          }
                        />
                      </td>
                      <td className="px-2 py-1 align-top bg-emerald-50/20 border-l border-emerald-100/50">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-2 py-2 text-right rounded border border-transparent hover:border-emerald-300 focus:border-emerald-500 focus:bg-white bg-transparent outline-none font-mono"
                          placeholder="0.00"
                          value={row.debitUSD}
                          onChange={(e) =>
                            updateRow(row.id, "debitUSD", e.target.value)
                          }
                        />
                      </td>
                      <td className="px-2 py-1 align-top bg-emerald-50/20">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-2 py-2 text-right rounded border border-transparent hover:border-emerald-300 focus:border-emerald-500 focus:bg-white bg-transparent outline-none font-mono text-red-600"
                          placeholder="0.00"
                          value={row.creditUSD}
                          onChange={(e) =>
                            updateRow(row.id, "creditUSD", e.target.value)
                          }
                        />
                      </td>
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

          {/* Footer Totals */}
          <div className="bg-slate-50 border-t border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-slate-500">
                Showing {filteredRows.length} of {rows.length} entries
              </div>
              <div className="flex flex-wrap items-center justify-end gap-8 text-sm">
                <div className="font-semibold text-slate-500 uppercase tracking-wider text-xs">
                  Totals
                </div>
                <div className="flex gap-6 border-r border-slate-300 pr-8">
                  <div className="text-right">
                    <div className="text-[10px] text-amber-700/70 uppercase">Total Debit</div>
                    <div className="font-bold text-slate-700 font-mono">
                      ¥{formatCurrency(totals.dRMB)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-amber-700/70 uppercase">Total Credit</div>
                    <div className="font-bold text-red-600 font-mono">
                      ¥{formatCurrency(totals.cRMB)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-right">
                    <div className="text-[10px] text-emerald-700/70 uppercase">Total Debit</div>
                    <div className="font-bold text-slate-700 font-mono">
                      ${formatCurrency(totals.dUSD)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-emerald-700/70 uppercase">Total Credit</div>
                    <div className="font-bold text-red-600 font-mono">
                      ${formatCurrency(totals.cUSD)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}