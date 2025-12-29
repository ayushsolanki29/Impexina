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

      const updateData = { [field]: value };

      // Recalculate total if booking or rate changed
      if (field === "booking" || field === "rate") {
        const booking =
          field === "booking"
            ? parseFloat(value) || 0
            : entryToUpdate.booking || 0;
        const rate =
          field === "rate" ? parseFloat(value) || 0 : entryToUpdate.rate || 0;
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard/accounts/dinesh")}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sheets
            </button>

            <div className="flex gap-3">
              {sheet && (
                <>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <FileDown className="w-4 h-4" />
                    Export Excel
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={() =>
                      router.push(`/dashboard/accounts/dinesh/${sheet.id}/edit`)
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sheet Title & Status */}
          <div className="mt-4">
            {sheetId === "new" ? (
              <h1 className="text-2xl font-bold text-slate-900">
                Create New Sheet
              </h1>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {sheet?.title}
                  </h1>
                  {sheet?.description && (
                    <p className="text-slate-600 mt-1">{sheet.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {sheet?.isLocked && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${
                      sheet?.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800"
                        : sheet?.status === "ARCHIVED"
                        ? "bg-slate-100 text-slate-800"
                        : "bg-amber-100 text-amber-800"
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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">
              {sheetId === "new" ? "Sheet Information" : "Edit Sheet Details"}
            </h2>

            <form onSubmit={handleSaveSheet} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Sheet Title *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={editSheet.title}
                    onChange={(e) =>
                      setEditSheet({ ...editSheet, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
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
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Description
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Add a description for this sheet..."
                  value={editSheet.description}
                  onChange={(e) =>
                    setEditSheet({ ...editSheet, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
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

              <div className="flex gap-3 pt-2">
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
                  className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
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
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search entries..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <select
                  className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
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
                  className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={isPaidFilter}
                  onChange={(e) => setIsPaidFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="true">Paid</option>
                  <option value="false">Pending</option>
                </select>

                <button
                  onClick={loadEntries}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Add Entry Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-emerald-100 shadow-sm sticky top-6">
                <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100">
                  <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-emerald-600" />
                    New Entry
                  </h2>
                </div>

                <form onSubmit={handleAddEntry} className="p-5 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Supplier *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Supplier name"
                      value={entry.supplier}
                      onChange={(e) =>
                        setEntry({ ...entry, supplier: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={entry.paymentDate}
                      onChange={(e) =>
                        setEntry({ ...entry, paymentDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Amount
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="0"
                        value={entry.amount}
                        onChange={(e) =>
                          setEntry({ ...entry, amount: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Priority
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={entry.priority}
                        onChange={(e) =>
                          setEntry({ ...entry, priority: e.target.value })
                        }
                      >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                  </div>

                  {/* Booking & Rate */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-xs font-medium text-slate-600 mb-2">
                      Booking Calculation
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500">
                          Booking
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          className="w-full px-3 py-2 border rounded text-sm"
                          placeholder="0"
                          value={entry.booking}
                          onChange={(e) =>
                            setEntry({ ...entry, booking: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Rate</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 border rounded text-sm"
                          placeholder="0.00"
                          value={entry.rate}
                          onChange={(e) =>
                            setEntry({ ...entry, rate: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Total (₹)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border rounded-lg font-medium text-slate-900"
                        value={entry.total}
                        onChange={(e) =>
                          setEntry({ ...entry, total: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Paid (₹)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-emerald-200 rounded-lg"
                        placeholder="0"
                        value={entry.paid}
                        onChange={(e) =>
                          setEntry({ ...entry, paid: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Client Reference
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Optional reference"
                      value={entry.clientRef}
                      onChange={(e) =>
                        setEntry({ ...entry, clientRef: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Notes
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="Additional notes..."
                      value={entry.notes}
                      onChange={(e) =>
                        setEntry({ ...entry, notes: e.target.value })
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium"
                  >
                    Add Entry
                  </button>
                </form>
              </div>
            </div>

            {/* Entries Table */}
            <div className="lg:col-span-3">
              {/* Totals Summary */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-bold">
                        Total Payable
                      </div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">
                        ₹{totals.totalPayable.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-bold">
                        Total Paid
                      </div>
                      <div className="text-2xl font-bold text-emerald-700 mt-1">
                        ₹{totals.totalPaid.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-amber-600 uppercase font-bold">
                        Balance Due
                      </div>
                      <div className="text-2xl font-bold text-amber-700 mt-1">
                        ₹{totals.totalBalance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entries Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                          Supplier
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                          Date
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                          Booking × Rate
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                          Total
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                          Paid
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                          Balance
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {entries.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-8 text-center text-slate-400"
                          >
                            <div className="flex flex-col items-center">
                              <Calculator className="w-8 h-8 mb-2 opacity-50" />
                              No entries found. Add one using the form.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        entries.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <input
                                className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white outline-none font-medium"
                                value={row.supplier}
                                onChange={(e) =>
                                  handleUpdateEntry(
                                    row.id,
                                    "supplier",
                                    e.target.value
                                  )
                                }
                              />
                              {row.clientRef && (
                                <div className="text-xs text-slate-500 mt-1">
                                  Ref: {row.clientRef}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <input
                                type="date"
                                className="px-2 py-1 rounded border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white outline-none text-sm"
                                value={
                                  new Date(row.paymentDate)
                                    .toISOString()
                                    .split("T")[0]
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

                            <td className="px-4 py-3">
                              <div className="flex gap-2 justify-end">
                                <input
                                  type="number"
                                  step="0.001"
                                  className="w-20 px-2 py-1 rounded border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white outline-none text-right"
                                  placeholder="Booking"
                                  value={row.booking || ""}
                                  onChange={(e) =>
                                    handleUpdateEntry(
                                      row.id,
                                      "booking",
                                      e.target.value
                                    )
                                  }
                                />
                                <span className="text-slate-400">×</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-20 px-2 py-1 rounded border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white outline-none text-right"
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

                            <td className="px-4 py-3 text-right font-medium text-slate-900">
                              ₹{row.total.toLocaleString()}
                            </td>

                            <td className="px-4 py-3">
                              <input
                                type="number"
                                className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white outline-none text-right"
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

                            <td className="px-4 py-3 text-right">
                              <div
                                className={`font-medium ${
                                  row.balance > 0
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                ₹{row.balance.toLocaleString()}
                              </div>
                              <div className="text-xs text-slate-500">
                                {row.isPaid ? "Paid" : "Pending"}
                              </div>
                            </td>

                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDeleteEntry(row.id)}
                                className="p-1.5 text-slate-300 hover:text-red-500"
                                title="Delete"
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Locked Sheet Message */}
      {sheet?.isLocked && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-amber-800 mb-2">
              Sheet is Locked
            </h3>
            <p className="text-amber-700 mb-4">
              This sheet has been locked to prevent further edits. You can view
              the entries but cannot modify them.
            </p>
            <button
              onClick={() => router.push("/dashboard/dineshbhai")}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
            >
              Back to Sheets
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
