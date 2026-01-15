"use client";
import React, { useState, useEffect, useMemo } from "react";
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
  Users,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link as LinkIcon,
  Unlink,
  Tag,
  Lock,
  Unlock,
  Edit,
} from "lucide-react";
import { dineshbhaiAPI } from "@/services/dineshbhai.service";

export default function DineshSheetPage() {
  const params = useParams();
  const router = useRouter();
  const sheetId = params.sheetId;

  const [sheet, setSheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [isPaidFilter, setIsPaidFilter] = useState("");

  // New Entry Form
  const [entry, setEntry] = useState({
    supplier: "",
    paymentDate: new Date().toISOString().split("T")[0],
    amount: "",
    booking: "",
    rate: "",
    total: 0,
    paid: "",
    clientRef: "",
    notes: "",
    priority: "MEDIUM",
  });

  // Edit Sheet Form
  const [editSheet, setEditSheet] = useState({
    title: "",
    description: "",
    tags: [],
    isLocked: false,
    status: "ACTIVE",
  });

  // Load Data
  useEffect(() => {
    if (sheetId !== "new") {
      loadSheetData();
      loadEntries();
    } else {
      // For new sheet, generate default title
      generateDefaultTitle();
      setLoading(false);
    }
  }, [sheetId, dateRange, search, supplierFilter, isPaidFilter]);

  const generateDefaultTitle = async () => {
    try {
      const data = await dineshbhaiAPI.generateDefaultTitle();
      setEditSheet((prev) => ({ ...prev, title: data.data.data.title }));
    } catch (error) {
      console.error("Failed to generate title:", error);
    }
  };

  const loadSheetData = async () => {
    try {
      const data = await dineshbhaiAPI.getSheet(sheetId);
      setSheet(data.data.data);
      setEditSheet({
        title: data.data.data.title,
        description: data.data.data.description || "",
        tags: data.data.data.tags || [],
        isLocked: data.data.data.isLocked || false,
        status: data.data.data.status,
      });
    } catch (error) {
      toast.error(error.message || "Failed to load sheet");
    }
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        supplier: supplierFilter,
        isPaid: isPaidFilter,
        page: 1,
        limit: 1000,
      };

      const data = await dineshbhaiAPI.getSheetEntries(sheetId, params);
      setEntries(data.data.data.entries || []);
    } catch (error) {
      toast.error(error.message || "Failed to load entries");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals automatically
  useEffect(() => {
    const booking = parseFloat(entry.booking) || 0;
    const rate = parseFloat(entry.rate) || 0;
    const total = booking * rate;
    setEntry((prev) => ({
      ...prev,
      total: isNaN(total) ? 0 : parseFloat(total.toFixed(2)),
    }));
  }, [entry.booking, entry.rate]);

  // Handle Create/Update Sheet
  const handleSaveSheet = async (e) => {
    e.preventDefault();

    if (!editSheet.title) {
      return toast.error("Sheet title is required");
    }

    try {
      if (sheetId === "new") {
        // Create new sheet
        const sheetData = {
          title: editSheet.title,
          description: editSheet.description,
          tags: editSheet.tags,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        };

        const response = await dineshbhaiAPI.createSheet(sheetData);
        toast.success("Sheet created successfully");
        router.push(`/dashboard/dineshbhai/${response.data.id}`);
      } else {
        // Update existing sheet
        const sheetData = {
          title: editSheet.title,
          description: editSheet.description,
          tags: editSheet.tags,
          isLocked: editSheet.isLocked,
          status: editSheet.status,
        };

        await dineshbhaiAPI.updateSheet(sheetId, sheetData);
        toast.success("Sheet updated successfully");
        loadSheetData();
      }
    } catch (error) {
      toast.error(error.message || "Failed to save sheet");
    }
  };

  // Handle Add Entry
  const handleAddEntry = async (e) => {
    e.preventDefault();

    if (!entry.supplier) {
      return toast.error("Supplier name is required");
    }

    try {
      const entryData = {
        ...entry,
        amount: entry.amount ? parseFloat(entry.amount) : null,
        booking: entry.booking ? parseFloat(entry.booking) : null,
        rate: entry.rate ? parseFloat(entry.rate) : null,
        paid: entry.paid ? parseFloat(entry.paid) : null,
      };

      await dineshbhaiAPI.addEntry(sheetId, entryData);

      toast.success("Entry added successfully");

      // Reset form
      setEntry({
        supplier: "",
        paymentDate: new Date().toISOString().split("T")[0],
        amount: "",
        booking: "",
        rate: "",
        total: 0,
        paid: "",
        clientRef: "",
        notes: "",
        priority: "MEDIUM",
      });

      // Reload entries
      loadEntries();
      loadSheetData();
    } catch (error) {
      toast.error(error.message || "Failed to add entry");
    }
  };

  // Handle Update Entry
  const handleUpdateEntry = async (entryId, field, value) => {
    try {
      const entryToUpdate = entries.find((e) => e.id === entryId);
      if (!entryToUpdate) return;

      // Include existing data to satisfy required field constraints in partial updates
      const updateData = { 
        ...entryToUpdate,
        [field]: value 
      };

      // Ensure numbers are correctly formatted
      if (['amount', 'booking', 'rate', 'paid', 'total', 'balance'].includes(field)) {
        updateData[field] = parseFloat(value) || 0;
      }

      // Recalculate total if booking or rate changed
      if (field === "booking" || field === "rate") {
        const booking = field === "booking" ? parseFloat(value) || 0 : entryToUpdate.booking || 0;
        const rate = field === "rate" ? parseFloat(value) || 0 : entryToUpdate.rate || 0;
        updateData.total = booking * rate;
      }

      await dineshbhaiAPI.updateEntry(entryId, updateData);

      // Update local state immediately for better UX
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, ...updateData } : e))
      );

      toast.success("Entry updated");
      loadSheetData(); // Reload sheet totals
    } catch (error) {
      toast.error(error.message || "Failed to update entry");
    }
  };

  // Handle Delete Entry
  const handleDeleteEntry = async (entryId) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      await dineshbhaiAPI.deleteEntry(entryId);
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
      const blob = await dineshbhaiAPI.exportSheet(sheetId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sheet?.title || "sheet"}_export_${new Date()
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
    return entries.reduce(
      (acc, e) => ({
        totalPayable: acc.totalPayable + (e.total || 0),
        totalPaid: acc.totalPaid + (e.paid || 0),
        totalBalance: acc.totalBalance + (e.balance || 0),
      }),
      { totalPayable: 0, totalPaid: 0, totalBalance: 0 }
    );
  }, [entries]);

  // Get unique suppliers for filter
  const suppliers = useMemo(() => {
    return [...new Set(entries.map((e) => e.supplier).filter(Boolean))].sort();
  }, [entries]);

  if (loading && sheetId !== "new")
    return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-6">
            <button
              onClick={() => router.push("/dashboard/accounts/dinesh")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sheets
            </button>

            <div className="flex items-center gap-3">
              {sheet && (
                <>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 font-semibold text-sm active:scale-95"
                  >
                    <FileDown className="w-4 h-4" />
                    Export Excel
                  </button>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold text-sm">
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={() =>
                      router.push(`/dashboard/accounts/dinesh/${sheet.id}/edit`)
                    }
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold text-sm"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sheet Title & Status */}
          <div className="mt-8">
            {sheetId === "new" ? (
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Create New Sheet
              </h1>
            ) : (
              <div className="flex items-end justify-between gap-8 pb-2">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-none mb-2">
                    {sheet?.title}
                  </h1>
                  {sheet?.description && (
                    <p className="text-slate-500 font-normal">{sheet.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {sheet?.isLocked && (
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-100 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${
                      sheet?.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : sheet?.status === "ARCHIVED"
                        ? "bg-slate-50 text-slate-500 border-slate-100"
                        : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}
                  >
                    {sheet?.status}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sheet Info Form (Only for new or edit mode) */}
      {(sheetId === "new" || (sheet && editSheet.title !== sheet.title)) && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 focus:bg-white outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                    value={editSheet.title}
                    onChange={(e) =>
                      setEditSheet({ ...editSheet, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 block">
                    Status
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 focus:bg-white outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                    value={editSheet.status}
                    onChange={(e) =>
                      setEditSheet({ ...editSheet, status: e.target.value })
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ARCHIVED">Archived</option>
                    <option value="LOCKED">Locked</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 block">
                  Description
                </label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 focus:bg-white outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300 resize-none"
                  placeholder="Add a description for this sheet..."
                  value={editSheet.description}
                  onChange={(e) =>
                    setEditSheet({ ...editSheet, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 block">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 focus:bg-white outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300"
                  placeholder="e.g., dinesh, booking, payments"
                  value={editSheet.tags.join(", ")}
                  onChange={(e) =>
                    setEditSheet({
                      ...editSheet,
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag),
                    })
                  }
                />
              </div>

              {sheetId !== "new" && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isLocked"
                    checked={editSheet.isLocked}
                    onChange={(e) =>
                      setEditSheet({ ...editSheet, isLocked: e.target.checked })
                    }
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="isLocked" className="text-sm text-slate-700">
                    Lock sheet (prevent edits)
                  </label>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    sheetId === "new"
                      ? router.push("/dashboard/dineshbhai")
                      : setEditSheet({
                          title: sheet.title,
                          description: sheet.description || "",
                          tags: sheet.tags || [],
                          isLocked: sheet.isLocked || false,
                          status: sheet.status,
                        })
                  }
                  className="flex-1 py-4 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 font-bold uppercase text-[10px] tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 font-bold uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-slate-200"
                >
                  {sheetId === "new" ? "Create Sheet" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Only show entries if not in create mode */}
      {sheetId !== "new" && !sheet?.isLocked && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Filters */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/60 p-4 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search entries..."
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none transition-all font-medium text-slate-600 placeholder:text-slate-300"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <select
                  className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none transition-all font-medium text-slate-600 appearance-none cursor-pointer"
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier} value={supplier}>
                      {supplier}
                    </option>
                  ))}
                </select>

                <select
                  className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none transition-all font-medium text-slate-600 appearance-none cursor-pointer"
                  value={isPaidFilter}
                  onChange={(e) => setIsPaidFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="true">Paid</option>
                  <option value="false">Pending</option>
                </select>

                <button
                  onClick={loadEntries}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold text-sm active:scale-95 shadow-lg shadow-slate-200"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          <div className="w-full">
            {/* Entries Table */}
            <div className="w-full">

              {/* Totals Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-all">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-widest leading-none mb-3">Total Payable</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900 tracking-tight">₹{totals.totalPayable.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-all">
                  <span className="text-[10px] font-semibold uppercase text-emerald-500/60 tracking-widest leading-none mb-3">Total Paid</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900 tracking-tight text-emerald-600">₹{totals.totalPaid.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-all">
                  <span className="text-[10px] font-semibold uppercase text-amber-500/60 tracking-widest leading-none mb-3">Balance Due</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900 tracking-tight text-amber-600">₹{totals.totalBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Entries Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[200px]">
                          Supplier / Reference
                        </th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[100px]">
                          Date
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[150px]">
                          Calculation
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[120px]">
                          Total
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[120px]">
                          Paid
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[120px]">
                          Balance
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[80px]">
                          -
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {entries.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-6 py-3">
                            <input
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-100 bg-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none font-semibold text-slate-800 transition-all text-sm mb-1"
                              value={row.supplier}
                              onChange={(e) =>
                                handleUpdateEntry(
                                  row.id,
                                  "supplier",
                                  e.target.value
                                )
                              }
                            />
                            <input
                              className="px-3 py-1 font-medium text-[10px] text-slate-400 border border-transparent hover:border-slate-100 rounded outline-none w-full"
                              value={row.clientRef || ""}
                              placeholder="Add Reference..."
                              onChange={(e) =>
                                handleUpdateEntry(
                                  row.id,
                                  "clientRef",
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          <td className="px-6 py-3">
                            <input
                              type="date"
                              className="px-3 py-1.5 rounded-lg border border-slate-100 bg-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none text-xs font-medium text-slate-600 transition-all"
                              value={
                                row.paymentDate
                                  ? new Date(row.paymentDate).toISOString().split("T")[0]
                                  : ""
                              }
                              onChange={(e) =>
                                handleUpdateEntry(
                                  row.id,
                                  "paymentDate",
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          <td className="px-6 py-3">
                            <div className="flex items-center gap-1.5 justify-end">
                              <input
                                type="number"
                                step="0.001"
                                className="w-16 px-2 py-1.5 rounded-lg border border-slate-100 bg-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white outline-none text-right font-medium text-slate-600 text-xs transition-all"
                                placeholder="Qty"
                                value={row.booking || ""}
                                onChange={(e) =>
                                  handleUpdateEntry(
                                    row.id,
                                    "booking",
                                    e.target.value
                                  )
                                }
                              />
                              <span className="text-slate-300 text-[10px]">×</span>
                              <input
                                type="number"
                                step="0.01"
                                className="w-16 px-2 py-1.5 rounded-lg border border-slate-100 bg-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white outline-none text-right font-medium text-slate-600 text-xs transition-all"
                                placeholder="Rate"
                                value={row.rate || ""}
                                onChange={(e) =>
                                  handleUpdateEntry(
                                    row.id,
                                    "rate",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </td>

                          <td className="px-6 py-3 text-right font-bold text-slate-900 tracking-tight">
                            ₹{row.total.toLocaleString()}
                          </td>

                          <td className="px-6 py-3">
                            <input
                              type="number"
                              className="w-full px-3 py-1.5 rounded-lg border border-emerald-50 bg-emerald-50/20 hover:border-emerald-200 focus:border-emerald-400 focus:bg-white outline-none text-right font-bold text-emerald-600 transition-all text-sm"
                              placeholder="0"
                              value={row.paid || ""}
                              onChange={(e) =>
                                handleUpdateEntry(
                                  row.id,
                                  "paid",
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          <td className="px-6 py-3 text-right">
                            <div
                              className={`font-bold tracking-tight ${
                                row.balance > 0
                                  ? "text-amber-500"
                                  : "text-emerald-500"
                              }`}
                            >
                              ₹{row.balance.toLocaleString()}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mt-0.5">
                              {row.isPaid ? "Paid" : "Pending"}
                            </div>
                          </td>

                          <td className="px-6 py-3 text-right">
                            <button
                              onClick={() => handleDeleteEntry(row.id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* New Entry Row */}
                      <tr className="bg-blue-50/30 border-t-2 border-blue-100/50">
                        <td className="px-6 py-4">
                            <input
                              className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none font-bold text-slate-900 transition-all text-sm placeholder:text-slate-300"
                              placeholder="Supplier name"
                              value={entry.supplier}
                              onChange={(e) => setEntry({ ...entry, supplier: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddEntry(e)}
                            />
                            <input
                              className="mt-2 w-full px-3 py-1.5 rounded-lg border border-blue-100 bg-white/50 focus:bg-white outline-none text-[10px] font-medium text-slate-600"
                              placeholder="Reference / Notes"
                              value={entry.clientRef}
                              onChange={(e) => setEntry({ ...entry, clientRef: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddEntry(e)}
                            />
                          </td>
                          <td className="px-6 py-4">
                             <input
                              type="date"
                              className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none text-xs font-bold text-slate-700 transition-all"
                              value={entry.paymentDate}
                              onChange={(e) => setEntry({ ...entry, paymentDate: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddEntry(e)}
                            />
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-1.5 justify-end">
                              <input
                                type="number"
                                step="0.001"
                                className="w-20 px-2 py-2 rounded-xl border border-blue-100 bg-white focus:border-blue-400 outline-none text-right font-bold text-slate-700 text-xs transition-all"
                                placeholder="Qty"
                                value={entry.booking}
                                onChange={(e) => setEntry({ ...entry, booking: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddEntry(e)}
                              />
                              <span className="text-blue-300 font-black">×</span>
                              <input
                                type="number"
                                step="0.01"
                                className="w-20 px-2 py-2 rounded-xl border border-blue-100 bg-white focus:border-blue-400 outline-none text-right font-bold text-slate-700 text-xs transition-all"
                                placeholder="Rate"
                                value={entry.rate}
                                onChange={(e) => setEntry({ ...entry, rate: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddEntry(e)}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-sm font-black text-slate-900">₹{entry.total.toLocaleString()}</div>
                            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter mt-1">Calculated</div>
                          </td>
                          <td className="px-6 py-4">
                             <input
                              type="number"
                              className="w-full px-3 py-3 rounded-xl border border-emerald-200 bg-emerald-50/50 focus:bg-white focus:border-emerald-400 outline-none text-right font-black text-emerald-600 transition-all text-sm"
                              placeholder="Paid"
                              value={entry.paid}
                              onChange={(e) => setEntry({ ...entry, paid: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddEntry(e)}
                            />
                          </td>
                        <td className="px-6 py-4 text-right">
                           <div className="text-xs font-black text-slate-400">NEW ENTRY</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button
                            onClick={handleAddEntry}
                            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-90"
                            title="Save Entry"
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
          </div>
        </div>
      )}

      {/* Locked Sheet Message */}
      {sheet?.isLocked && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-xl animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
              <Lock className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
              Sheet is Locked
            </h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              This sheet has been locked to prevent further edits. You can view
              the entries but cannot modify them.
            </p>
            <button
              onClick={() => router.push("/dashboard/dineshbhai")}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl hover:bg-slate-800 font-bold uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-slate-200"
            >
              Back to Sheets
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
