"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Save,
  Trash2,
  Printer,
  FileDown,
  PlusCircle,
  Calculator,
  Search,
  X,
  Check,
  Package,
  Filter,
  Lock,
  Eye,
  Edit,
} from "lucide-react";
import { kavyaAPI } from "@/services/kavya.service";
import KavyaPreviewModal from "./_components/KavyaPreviewModal";

export default function KavyaSheetPage() {
  const params = useParams();
  const router = useRouter();
  const sheetId = params.sheetId;

  const [sheet, setSheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [containerFilter, setContainerFilter] = useState("");

  // New Entry Form
  const [entry, setEntry] = useState({
    containerCode: "",
    loadingDate: "",
    deliveryDate: "",
    shippingMark: "",
    particular: "",
    rateCbmWeight: "",
    cbmKg: "",
    dutyFvb: "",
    total: 0,
    paid: "",
    paymentDate: "",
  });

  // Edit Sheet Form
  const [editSheet, setEditSheet] = useState({
    title: "",
    description: "",
    tags: [],
    isLocked: false,
    status: "ACTIVE",
    openingBalance: 0,
  });

  const loadSheetData = useCallback(async () => {
    try {
      const data = await kavyaAPI.getSheet(sheetId);
      setSheet(data.data.data);
      setEditSheet({
        title: data.data.data.title,
        description: data.data.data.description || "",
        tags: data.data.data.tags || [],
        isLocked: data.data.data.isLocked || false,
        status: data.data.data.status,
        openingBalance: data.data.data.openingBalance || 0,
      });
    } catch (error) {
      toast.error(error.message || "Failed to load sheet");
    }
  }, [sheetId]);

  // Load Data
  useEffect(() => {
    if (sheetId !== "new") {
      loadSheetData();
      loadEntries();
    } else {
      generateDefaultTitle();
      setLoading(false);
    }
  }, [sheetId, search, containerFilter, loadSheetData]);

  // Handle Create/Update Sheet
  const handleSaveSheet = useCallback(async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    if (!editSheet.title) {
      return toast.error("Sheet title is required");
    }

    try {
      if (sheetId === "new") {
        const sheetData = {
          title: editSheet.title,
          description: editSheet.description,
          tags: editSheet.tags,
          openingBalance: parseFloat(editSheet.openingBalance) || 0,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        };

        const response = await kavyaAPI.createSheet(sheetData);
        toast.success("Sheet created successfully");
        router.push(`/dashboard/accounts/kavya/${response.data.data.id}`);
      } else {
        const sheetData = {
          title: editSheet.title,
          description: editSheet.description,
          tags: editSheet.tags,
          isLocked: editSheet.isLocked,
          status: editSheet.status,
          openingBalance: parseFloat(editSheet.openingBalance) || 0,
        };

        await kavyaAPI.updateSheet(sheetId, sheetData);
        toast.success("Sheet updated successfully");
        loadSheetData();
      }
    } catch (error) {
      console.error("Save sheet error:", error);
      const responseData = error.response?.data || error.data || {};
      const errorMessage = responseData.message || error.message || "Failed to save sheet";
      const errors = responseData.errors || [];

      if (errors && Array.isArray(errors) && errors.length > 0) {
        errors.forEach(err => {
          const message = err.message || (err.field ? `${err.field}: Invalid value` : "Validation error");
          toast.error(message);
        });
      } else if (errorMessage && errorMessage !== "Failed to save sheet") {
        toast.error(errorMessage);
      } else {
        toast.error("Failed to save sheet. Please check all fields are valid.");
      }
    }
  }, [sheetId, editSheet, router, loadSheetData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        const target = e.target;
        const isInEntriesTable = target.closest('table');

        if (isInEntriesTable) {
          return;
        }

        const isNewSheet = sheetId === "new";
        const isEditMode = sheet && editSheet && editSheet.title;

        if (isNewSheet || isEditMode) {
          e.preventDefault();
          const syntheticEvent = {
            preventDefault: () => { },
            target: { form: document.querySelector('form') }
          };
          handleSaveSheet(syntheticEvent);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sheetId, sheet, editSheet, handleSaveSheet]);

  const generateDefaultTitle = async () => {
    try {
      const data = await kavyaAPI.generateDefaultTitle();
      setEditSheet((prev) => ({ ...prev, title: data.data.data.title }));
    } catch (error) {
      console.error("Failed to generate title:", error);
    }
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        containerCode: containerFilter,
        page: 1,
        limit: 1000,
      };

      const data = await kavyaAPI.getSheetEntries(sheetId, params);
      setEntries(data.data.data.entries || []);
    } catch (error) {
      toast.error(error.message || "Failed to load entries");
    } finally {
      setLoading(false);
    }
  };

  // Calculate total automatically (rateCbmWeight + cbmKg + dutyFvb)
  useEffect(() => {
    const rateCbmWeight = parseFloat(entry.rateCbmWeight) || 0;
    const cbmKg = parseFloat(entry.cbmKg) || 0;
    const dutyFvb = parseFloat(entry.dutyFvb) || 0;
    const total = rateCbmWeight + cbmKg + dutyFvb;
    setEntry((prev) => ({
      ...prev,
      total: isNaN(total) ? 0 : parseFloat(total.toFixed(2)),
    }));
  }, [entry.rateCbmWeight, entry.cbmKg, entry.dutyFvb]);

  // Handle Add Entry
  const handleAddEntry = async (e) => {
    if (e) {
      e.preventDefault();
    }

    // Validate numeric fields to ensure they're >= 0
    const rateCbmWeight = parseFloat(entry.rateCbmWeight) || 0;
    const cbmKg = parseFloat(entry.cbmKg) || 0;
    const dutyFvb = parseFloat(entry.dutyFvb) || 0;
    const paid = parseFloat(entry.paid) || 0;

    if (rateCbmWeight < 0 || cbmKg < 0 || dutyFvb < 0 || paid < 0) {
      return toast.error("Numeric fields must be greater than or equal to 0");
    }

    try {
      const entryData = {
        ...entry,
        rateCbmWeight: rateCbmWeight,
        cbmKg: cbmKg,
        dutyFvb: dutyFvb,
        paid: paid,
      };

      await kavyaAPI.addEntry(sheetId, entryData);

      toast.success("Entry added successfully");

      // Reset form
      setEntry({
        containerCode: "",
        loadingDate: "",
        deliveryDate: "",
        shippingMark: "",
        particular: "",
        rateCbmWeight: "",
        cbmKg: "",
        dutyFvb: "",
        total: 0,
        paid: "",
        paymentDate: "",
      });

      loadEntries();
      loadSheetData();
    } catch (error) {
      console.error("Add entry error:", error);
      const responseData = error.response?.data || error.data || {};
      const errorMessage = responseData.message || error.message || "Failed to add entry";
      const errors = responseData.errors || [];

      if (errors && Array.isArray(errors) && errors.length > 0) {
        errors.forEach(err => {
          const message = err.message || (err.field ? `${err.field}: Invalid value` : "Validation error");
          toast.error(message);
        });
      } else if (errorMessage && errorMessage !== "Failed to add entry") {
        toast.error(errorMessage);
      } else {
        toast.error("Failed to add entry. Please check all fields are valid.");
      }
    }
  };

  // Handle Update Entry
  const handleUpdateEntry = async (entryId, field, value) => {
    try {
      const entryToUpdate = entries.find((e) => e.id === entryId);
      if (!entryToUpdate) return;

      // Validate numeric fields to ensure they're >= 0
      if (["rateCbmWeight", "cbmKg", "dutyFvb", "paid"].includes(field)) {
        const numValue = parseFloat(value) || 0;
        if (numValue < 0) {
          return toast.error(`${field} must be greater than or equal to 0`);
        }
      }

      const updateData = { ...entryToUpdate, [field]: value };

      // Recalculate total if relevant fields changed
      if (field === "rateCbmWeight" || field === "cbmKg" || field === "dutyFvb") {
        const rateCbmWeight = field === "rateCbmWeight" ? parseFloat(value) || 0 : entryToUpdate.rateCbmWeight || 0;
        const cbmKg = field === "cbmKg" ? parseFloat(value) || 0 : entryToUpdate.cbmKg || 0;
        const dutyFvb = field === "dutyFvb" ? parseFloat(value) || 0 : entryToUpdate.dutyFvb || 0;
        updateData.total = rateCbmWeight + cbmKg + dutyFvb;
      }

      // Handle number fields
      if (["rateCbmWeight", "cbmKg", "dutyFvb", "paid"].includes(field)) {
        updateData[field] = parseFloat(value) || 0;
      }

      // Recalculate balance
      updateData.balance = (updateData.total || 0) - (updateData.paid || 0);

      await kavyaAPI.updateEntry(entryId, updateData);

      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, ...updateData } : e))
      );

      toast.success("Entry updated");
      loadSheetData();
    } catch (error) {
      console.error("Update entry error:", error);
      const responseData = error.response?.data || error.data || {};
      const errorMessage = responseData.message || error.message || "Failed to update entry";
      const errors = responseData.errors || [];

      if (errors && Array.isArray(errors) && errors.length > 0) {
        errors.forEach(err => {
          const message = err.message || (err.field ? `${err.field}: Invalid value` : "Validation error");
          toast.error(message);
        });
      } else if (errorMessage && errorMessage !== "Failed to update entry") {
        toast.error(errorMessage);
      } else {
        toast.error("Failed to update entry. Please check all fields are valid.");
      }
    }
  };

  // Handle Delete Entry
  const handleDeleteEntry = async (entryId) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      await kavyaAPI.deleteEntry(entryId);
      toast.success("Entry deleted");
      loadEntries();
      loadSheetData();
    } catch (error) {
      toast.error(error.message || "Failed to delete entry");
    }
  };

  // Handle Export
  const handleExport = async () => {
    try {
      const blob = await kavyaAPI.exportSheet(sheetId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KAVYA_SHEET_${sheet?.title || "sheet"}_export_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Sheet exported successfully");
    } catch (error) {
      toast.error(error.message || "Failed to export");
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    if (!sheet) {
      return {
        totalRateCbmWeight: 0,
        totalCbmKg: 0,
        totalDutyFvb: 0,
        totalPayable: 0,
        totalPaid: 0,
        totalBalance: 0,
      };
    }

    const totalRateCbmWeight = entries.reduce((sum, e) => sum + (e.rateCbmWeight || 0), 0);
    const totalCbmKg = entries.reduce((sum, e) => sum + (e.cbmKg || 0), 0);
    const totalDutyFvb = entries.reduce((sum, e) => sum + (e.dutyFvb || 0), 0);
    const totalPayable = entries.reduce((sum, e) => sum + (e.total || 0), 0);
    const totalPaid = entries.reduce((sum, e) => sum + (e.paid || 0), 0);
    const totalBalance = totalPayable - totalPaid;

    return {
      totalRateCbmWeight,
      totalCbmKg,
      totalDutyFvb,
      totalPayable,
      totalPaid,
      totalBalance,
    };
  }, [entries, sheet]);

  // Get unique containers for filter
  const containers = useMemo(() => {
    const unique = [...new Set(entries.map((e) => e.containerCode).filter(Boolean))];
    return unique.sort();
  }, [entries]);

  // Final balance (opening balance + balance)
  const finalBalance = useMemo(() => {
    const openingBalance = sheet?.openingBalance || 0;
    return openingBalance + totals.totalBalance;
  }, [sheet, totals.totalBalance]);

  if (loading && !sheet) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading sheet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard/accounts")}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {sheet?.title || editSheet.title || "New Sheet"}
                </h1>
                {sheet && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    {sheet.description || "Kavya Account Sheet"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {sheet && !sheet.isLocked && (
                <>
                  <button
                    onClick={() => setIsPreviewOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium text-sm shadow-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white border border-emerald-500 rounded-lg hover:bg-emerald-700 font-medium text-sm shadow-lg shadow-emerald-50"
                  >
                    <FileDown className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={() =>
                      setEditSheet({
                        title: sheet.title,
                        description: sheet.description || "",
                        tags: sheet.tags || [],
                        isLocked: sheet.isLocked || false,
                        status: sheet.status,
                        openingBalance: sheet.openingBalance || 0,
                      })
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Sheet
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sheet Info Form (Only for new or edit mode) */}
      {
        (sheetId === "new" || (sheet && editSheet.title !== sheet.title)) && (
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                {sheetId === "new" ? "Sheet Information" : "Edit Sheet Details"}
              </h2>

              <form onSubmit={handleSaveSheet} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 block">
                      Sheet Title *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-pink-500/5 focus:border-pink-400 outline-none font-bold text-slate-900"
                      value={editSheet.title}
                      onChange={(e) =>
                        setEditSheet({ ...editSheet, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 block">
                      Opening Balance
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-pink-500/5 focus:border-pink-400 outline-none font-bold text-slate-900"
                      value={editSheet.openingBalance}
                      onChange={(e) =>
                        setEditSheet({
                          ...editSheet,
                          openingBalance: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 block">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-pink-500/5 focus:border-pink-400 outline-none font-medium text-slate-900"
                    placeholder="Add a description for this sheet..."
                    value={editSheet.description}
                    onChange={(e) =>
                      setEditSheet({ ...editSheet, description: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      sheetId === "new"
                        ? router.push("/dashboard/accounts/kavya")
                        : setEditSheet({
                          title: sheet.title,
                          description: sheet.description || "",
                          tags: sheet.tags || [],
                          isLocked: sheet.isLocked || false,
                          status: sheet.status,
                          openingBalance: sheet.openingBalance || 0,
                        })
                    }
                    className="flex-1 py-4 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 font-bold uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 font-bold uppercase text-[10px] tracking-widest"
                  >
                    {sheetId === "new" ? "Create Sheet" : "Save Changes"}
                  </button>
                </div>
                <p className="text-xs text-slate-400 text-center mt-4">
                  <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono text-[10px]">S</kbd> to save
                </p>
              </form>
            </div>
          </div>
        )
      }

      {/* Only show entries if not in create mode */}
      {
        sheetId !== "new" && !sheet?.isLocked && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Filters */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/60 p-4 mb-8 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by container code, shipping mark, or particular..."
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-pink-500/5 focus:border-pink-400 outline-none font-medium text-slate-600"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <select
                    className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-pink-500/5 focus:border-pink-400 outline-none font-medium text-slate-600"
                    value={containerFilter}
                    onChange={(e) => setContainerFilter(e.target.value)}
                  >
                    <option value="">All Containers</option>
                    {containers.map((container) => (
                      <option key={container} value={container}>
                        {container}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-widest block mb-2">
                  Opening Balance
                </span>
                <div className="text-2xl font-bold text-slate-900">
                  ₹{(sheet?.openingBalance || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-widest block mb-2">
                  Total Amount
                </span>
                <div className="text-2xl font-bold text-slate-900">
                  ₹{totals.totalPayable.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <span className="text-[10px] font-semibold uppercase text-emerald-500/60 tracking-widest block mb-2">
                  Total Paid
                </span>
                <div className="text-2xl font-bold text-emerald-600">
                  ₹{totals.totalPaid.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-200 bg-amber-50/30">
                <span className="text-[10px] font-semibold uppercase text-amber-500/60 tracking-widest block mb-2">
                  Final Balance
                </span>
                <div className="text-2xl font-bold text-amber-600">
                  ₹{finalBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Entries Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Keyboard shortcuts hint */}
              <div className="px-6 py-3 bg-pink-50/50 border-b border-pink-100">
                <p className="text-xs text-slate-600 flex items-center gap-4 flex-wrap">
                  <span className="font-medium">Shortcuts:</span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-mono text-[10px]">Tab</kbd>
                    <span className="text-slate-400">Navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-mono text-[10px]">Enter</kbd>
                    <span className="text-slate-400">Add entry</span>
                  </span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ minWidth: '50px' }}>
                        SR
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ minWidth: '120px' }}>
                        CONT CODE
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ minWidth: '120px' }}>
                        LOADING DATE
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ minWidth: '120px' }}>
                        DLY DATE
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ minWidth: '120px' }}>
                        SHIPPING MARK
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ minWidth: '200px' }}>
                        PARTICULARS
                      </th>
                      <th className="px-3 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ minWidth: '100px' }}>
                        RATE-CBM/WT
                      </th>
                      <th className="px-3 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ minWidth: '80px' }}>
                        CBM/KG
                      </th>
                      <th className="px-3 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ minWidth: '80px' }}>
                        DUTY-FVB
                      </th>
                      <th className="px-3 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ minWidth: '100px' }}>
                        TOTAL
                      </th>
                      <th className="px-3 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ minWidth: '100px' }}>
                        PAID
                      </th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ minWidth: '120px' }}>
                        DATE
                      </th>
                      <th className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest" style={{ minWidth: '60px' }}>
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Opening Balance Row */}
                    {sheet && (
                      <tr className="bg-slate-50/50 font-semibold">
                        <td className="px-3 py-3 text-center text-slate-400">-</td>
                        <td className="px-3 py-3 text-slate-700" colSpan="4">OPENING BALANCE</td>
                        <td className="px-3 py-3"></td>
                        <td className="px-3 py-3"></td>
                        <td className="px-3 py-3"></td>
                        <td className="px-3 py-3"></td>
                        <td className="px-3 py-3"></td>
                        <td className="px-3 py-3 text-right font-bold text-slate-900">
                          ₹{(sheet.openingBalance || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-3"></td>
                        <td className="px-3 py-3"></td>
                      </tr>
                    )}

                    {entries.map((row, index) => (
                      <tr key={row.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-3 py-3 text-center text-slate-400 font-medium text-xs">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3">
                          <input
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-100 bg-transparent hover:border-slate-200 focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-500/5 outline-none font-semibold text-slate-800 text-sm"
                            value={row.containerCode || ""}
                            onChange={(e) =>
                              handleUpdateEntry(row.id, "containerCode", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="date"
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-100 bg-transparent hover:border-slate-200 focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-500/5 outline-none text-xs font-medium text-slate-600"
                            value={
                              row.loadingDate
                                ? new Date(row.loadingDate).toISOString().split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              handleUpdateEntry(row.id, "loadingDate", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="date"
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-100 bg-transparent hover:border-slate-200 focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-500/5 outline-none text-xs font-medium text-slate-600"
                            value={
                              row.deliveryDate
                                ? new Date(row.deliveryDate).toISOString().split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              handleUpdateEntry(row.id, "deliveryDate", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-100 bg-transparent hover:border-slate-200 focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-500/5 outline-none font-medium text-slate-600 text-sm"
                            placeholder="Mark"
                            value={row.shippingMark || ""}
                            onChange={(e) =>
                              handleUpdateEntry(row.id, "shippingMark", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-100 bg-transparent hover:border-slate-200 focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-500/5 outline-none font-medium text-slate-600 text-sm"
                            placeholder="Particulars"
                            value={row.particular || ""}
                            onChange={(e) =>
                              handleUpdateEntry(row.id, "particular", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-100 bg-transparent hover:border-slate-200 focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-500/5 outline-none text-right font-medium text-slate-600 text-sm"
                            value={row.rateCbmWeight || ""}
                            onChange={(e) =>
                              handleUpdateEntry(row.id, "rateCbmWeight", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-100 bg-transparent hover:border-slate-200 focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-500/5 outline-none text-right font-medium text-slate-600 text-sm"
                            value={row.cbmKg || ""}
                            onChange={(e) =>
                              handleUpdateEntry(row.id, "cbmKg", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-100 bg-transparent hover:border-slate-200 focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-500/5 outline-none text-right font-medium text-slate-600 text-sm"
                            value={row.dutyFvb || ""}
                            onChange={(e) =>
                              handleUpdateEntry(row.id, "dutyFvb", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-slate-900">
                          ₹{(row.total || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-2 py-1.5 rounded-lg border border-emerald-50 bg-emerald-50/20 hover:border-emerald-200 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none text-right font-bold text-emerald-600 text-sm"
                            value={row.paid || ""}
                            onChange={(e) =>
                              handleUpdateEntry(row.id, "paid", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="date"
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-100 bg-transparent hover:border-slate-200 focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-500/5 outline-none text-xs font-medium text-slate-600"
                            value={
                              row.paymentDate
                                ? new Date(row.paymentDate).toISOString().split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              handleUpdateEntry(row.id, "paymentDate", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleDeleteEntry(row.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Totals Row */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-200">
                      <td className="px-3 py-3 text-slate-700" colSpan="6">
                        TOTAL
                      </td>
                      <td className="px-3 py-3 text-right text-slate-900">
                        ₹{totals.totalRateCbmWeight.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-900">
                        {totals.totalCbmKg.toFixed(3)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-900">
                        ₹{totals.totalDutyFvb.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-900">
                        ₹{totals.totalPayable.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right text-emerald-600">
                        ₹{totals.totalPaid.toLocaleString()}
                      </td>
                      <td className="px-3 py-3"></td>
                      <td className="px-3 py-3"></td>
                    </tr>

                    {/* Balance Row */}
                    <tr className="bg-amber-50/50 font-bold">
                      <td className="px-3 py-3 text-right text-slate-700" colSpan="10">
                        BALANCE
                      </td>
                      <td className="px-3 py-3 text-right text-amber-600">
                        ₹{finalBalance.toLocaleString()}
                      </td>
                      <td className="px-3 py-3"></td>
                      <td className="px-3 py-3"></td>
                    </tr>

                    {/* New Entry Row */}
                    <tr className="bg-pink-50/30 border-t-2 border-pink-100">
                      <td className="px-3 py-4 text-center text-pink-400 font-bold">
                        +
                      </td>
                      <td className="px-3 py-4">
                        <input
                          className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white focus:ring-4 focus:ring-pink-500/5 focus:border-pink-400 outline-none font-bold text-slate-900 text-sm"
                          placeholder="Container Code"
                          value={entry.containerCode}
                          onChange={(e) =>
                            setEntry({ ...entry, containerCode: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              handleAddEntry(e);
                            }
                          }}
                          tabIndex={1}
                          autoFocus
                        />
                      </td>
                      <td className="px-3 py-4">
                        <input
                          type="date"
                          className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white focus:ring-4 focus:ring-pink-500/5 focus:border-pink-400 outline-none text-xs font-medium text-slate-700"
                          value={entry.loadingDate}
                          onChange={(e) =>
                            setEntry({ ...entry, loadingDate: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              handleAddEntry(e);
                            }
                          }}
                          tabIndex={2}
                        />
                      </td>
                      <td className="px-3 py-4">
                        <input
                          type="date"
                          className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white focus:ring-4 focus:ring-pink-500/5 focus:border-pink-400 outline-none text-xs font-medium text-slate-700"
                          value={entry.deliveryDate}
                          onChange={(e) =>
                            setEntry({ ...entry, deliveryDate: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              handleAddEntry(e);
                            }
                          }}
                          tabIndex={3}
                        />
                      </td>
                      <td className="px-3 py-4">
                        <input
                          className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white focus:ring-4 focus:ring-pink-500/5 focus:border-pink-400 outline-none font-medium text-slate-700 text-sm"
                          placeholder="Shipping Mark"
                          value={entry.shippingMark}
                          onChange={(e) =>
                            setEntry({ ...entry, shippingMark: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              handleAddEntry(e);
                            }
                          }}
                          tabIndex={4}
                        />
                      </td>
                      <td className="px-3 py-4">
                        <input
                          className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white focus:ring-4 focus:ring-pink-500/5 focus:border-pink-400 outline-none font-medium text-slate-700 text-sm"
                          placeholder="Particulars"
                          value={entry.particular}
                          onChange={(e) =>
                            setEntry({ ...entry, particular: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              handleAddEntry(e);
                            }
                          }}
                          tabIndex={5}
                        />
                      </td>
                      <td className="px-3 py-4">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white focus:ring-4 focus:ring-pink-500/5 focus:border-pink-400 outline-none text-right font-medium text-slate-700 text-sm"
                          placeholder="0"
                          value={entry.rateCbmWeight}
                          onChange={(e) =>
                            setEntry({ ...entry, rateCbmWeight: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              handleAddEntry(e);
                            }
                          }}
                          tabIndex={6}
                        />
                      </td>
                      <td className="px-3 py-4">
                        <input
                          type="number"
                          step="0.001"
                          className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white focus:ring-4 focus:ring-pink-500/5 focus:border-pink-400 outline-none text-right font-medium text-slate-700 text-sm"
                          placeholder="0"
                          value={entry.cbmKg}
                          onChange={(e) =>
                            setEntry({ ...entry, cbmKg: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              handleAddEntry(e);
                            }
                          }}
                          tabIndex={7}
                        />
                      </td>
                      <td className="px-3 py-4">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white focus:ring-4 focus:ring-pink-500/5 focus:border-pink-400 outline-none text-right font-medium text-slate-700 text-sm"
                          placeholder="0"
                          value={entry.dutyFvb}
                          onChange={(e) =>
                            setEntry({ ...entry, dutyFvb: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              handleAddEntry(e);
                            }
                          }}
                          tabIndex={8}
                        />
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="text-sm font-black text-slate-900">
                          ₹{entry.total.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-bold text-pink-400 uppercase tracking-tighter mt-1">
                          Auto
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50/50 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/5 outline-none text-right font-black text-emerald-600 text-sm"
                          placeholder="0"
                          value={entry.paid}
                          onChange={(e) =>
                            setEntry({ ...entry, paid: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              handleAddEntry(e);
                            }
                          }}
                          tabIndex={9}
                        />
                      </td>
                      <td className="px-3 py-4">
                        <input
                          type="date"
                          className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-white focus:ring-4 focus:ring-pink-500/5 focus:border-pink-400 outline-none text-xs font-medium text-slate-700"
                          value={entry.paymentDate}
                          onChange={(e) =>
                            setEntry({ ...entry, paymentDate: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                              e.preventDefault();
                              handleAddEntry(e);
                            }
                          }}
                          tabIndex={10}
                        />
                      </td>
                      <td className="px-3 py-4 text-center">
                        <button
                          onClick={handleAddEntry}
                          className="p-2 bg-pink-600 text-white rounded-xl hover:bg-pink-700 shadow-lg transition-all active:scale-90"
                          title="Add Entry"
                        >
                          <PlusCircle className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      }

      {/* Locked Sheet Message */}
      {
        sheet?.isLocked && (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-xl">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
                <Lock className="w-10 h-10 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Sheet is Locked
              </h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                This sheet has been locked to prevent further edits. You can view
                the entries but cannot modify them.
              </p>
              <button
                onClick={() => router.push("/dashboard/accounts/kavya")}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl hover:bg-slate-800 font-bold uppercase text-[10px] tracking-widest transition-all shadow-xl"
              >
                Back to Sheets
              </button>
            </div>
          </div>
        )
      }
      {/* Preview Modal */}
      <KavyaPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        sheet={sheet}
        entries={entries}
        totals={totals}
        finalBalance={finalBalance}
      />
    </div >
  );
}
