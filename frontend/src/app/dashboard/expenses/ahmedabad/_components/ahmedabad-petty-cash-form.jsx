"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  FileText,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  AlertCircle,
  Clock,
  List,
} from "lucide-react";
import {  toast } from "sonner";
import API from "@/lib/api";

export default function AhmedabadPettyCashForm() {
  const router = useRouter();
  const params = useParams();
  const sheetId = params.sheetId;

  const [sheet, setSheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: "DEBIT",
    entryDate: new Date().toISOString().split("T")[0],
    particular: "",
    contCode: "",
    mode: "Cash",
    credit: "",
    debit: "",
    notes: "",
  });
  const [containerSuggestions, setContainerSuggestions] = useState([]);

  // Load sheet data
  useEffect(() => {
    if (sheetId === "new") {
      initializeNewSheet();
    } else {
      loadSheet();
    }
    fetchContainerSuggestions();
  }, [sheetId]);

  const initializeNewSheet = () => {
    setSheet({
      name: `Ahmedabad Petty Cash - ${new Date().toLocaleDateString()}`,
      description: "",
      openingBalance: "0",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });
    setEntries([]);
    setIsLoading(false);
  };

  const loadSheet = async () => {
    setIsLoading(true);
    try {
      const response = await API.get(
        `/expenses/ahmedabad-petty-cash/${sheetId}`
      );
      if (response.data.success) {
        const sheetData = response.data.data;
        setSheet(sheetData);
        setEntries(sheetData.entries || []);
      }
    } catch (error) {
      console.error("Error loading sheet:", error);
      toast.error("Failed to load petty cash sheet");
      router.push("/dashboard/expenses/ahmedabad/list");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContainerSuggestions = async () => {
    try {
      const response = await API.get(
        "/expenses/ahmedabad-petty-cash/containers/suggestions"
      );
      if (response.data.success) {
        setContainerSuggestions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching container suggestions:", error);
    }
  };

  // Save sheet
  const saveSheet = async () => {
    if (!sheet?.name?.trim()) {
      toast.error("Please enter a sheet name");
      return;
    }

    setIsSaving(true);
    try {
      let response;

      if (sheetId === "new") {
        response = await API.post("/expenses/ahmedabad-petty-cash", sheet);
        toast.success("Petty cash sheet created successfully");

        // Redirect to edit page for new sheet
        if (response.data.success) {
          setTimeout(() => {
            router.push(
              `/dashboard/expenses/ahmedabad/${response.data.data.id}`
            );
          }, 1000);
          return;
        }
      } else {
        response = await API.put(
          `/expenses/ahmedabad-petty-cash/${sheetId}`,
          sheet
        );
        toast.success("Sheet updated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  // Add new entry
  const addEntry = async () => {
    if (!newEntry.particular.trim()) {
      toast.error("Please enter particular");
      return;
    }

    if (
      newEntry.type === "CREDIT" &&
      (!newEntry.credit || parseFloat(newEntry.credit) <= 0)
    ) {
      toast.error("Please enter valid credit amount");
      return;
    }

    if (
      newEntry.type === "DEBIT" &&
      (!newEntry.debit || parseFloat(newEntry.debit) <= 0)
    ) {
      toast.error("Please enter valid debit amount");
      return;
    }

    setIsSaving(true);
    try {
      const entryData = {
        ...newEntry,
        credit: newEntry.type === "CREDIT" ? parseFloat(newEntry.credit) : 0,
        debit: newEntry.type === "DEBIT" ? parseFloat(newEntry.debit) : 0,
      };

      const response = await API.post(
        `/expenses/ahmedabad-petty-cash/${sheetId}/entries`,
        entryData
      );

      if (response.data.success) {
        toast.success("Entry added successfully");

        // Add to local state
        setEntries((prev) => [response.data.data, ...prev]);

        // Update sheet totals locally
        if (sheet) {
          const amount =
            newEntry.type === "CREDIT"
              ? parseFloat(newEntry.credit)
              : parseFloat(newEntry.debit);

          setSheet((prev) => ({
            ...prev,
            totalCredit:
              prev.totalCredit + (newEntry.type === "CREDIT" ? amount : 0),
            totalDebit:
              prev.totalDebit + (newEntry.type === "DEBIT" ? amount : 0),
            closingBalance:
              prev.closingBalance +
              (newEntry.type === "CREDIT" ? amount : -amount),
          }));
        }

        // Reset form
        setNewEntry({
          type: "DEBIT",
          entryDate: new Date().toISOString().split("T")[0],
          particular: "",
          contCode: "",
          mode: "Cash",
          credit: "",
          debit: "",
          notes: "",
        });
        setShowNewEntryForm(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add entry");
    } finally {
      setIsSaving(false);
    }
  };

  // Update entry
  const updateEntry = async (entryId, updates) => {
    try {
      const response = await API.put(
        `/expenses/ahmedabad-petty-cash/entries/${entryId}`,
        updates
      );

      if (response.data.success) {
        toast.success("Entry updated");

        // Update local state
        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === entryId ? response.data.data : entry
          )
        );

        // Reload sheet to update totals
        if (sheetId !== "new") {
          loadSheet();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  // Delete entry
  const deleteEntry = async (entryId) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const response = await API.delete(
        `/expenses/ahmedabad-petty-cash/entries/${entryId}`
      );

      if (response.data.success) {
        toast.success("Entry deleted");

        // Remove from local state
        setEntries((prev) => prev.filter((entry) => entry.id !== entryId));

        // Reload sheet to update totals
        if (sheetId !== "new") {
          loadSheet();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  // Handle new entry form changes
  const handleNewEntryChange = (field, value) => {
    setNewEntry((prev) => ({ ...prev, [field]: value }));
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = search
      ? entry.particular?.toLowerCase().includes(search.toLowerCase()) ||
        entry.contCode?.toLowerCase().includes(search.toLowerCase()) ||
        entry.notes?.toLowerCase().includes(search.toLowerCase())
      : true;

    const matchesType = filterType === "ALL" || entry.type === filterType;

    return matchesSearch && matchesType;
  });

  // Sort by date desc
  const sortedEntries = [...filteredEntries].sort(
    (a, b) => new Date(b.entryDate) - new Date(a.entryDate)
  );

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading petty cash sheet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
     

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard/expenses")}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Back to Expenses Hub"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() =>
                  router.push("/dashboard/expenses/ahmedabad/list")
                }
                className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
                title="View Ahmedabad Vault List"
              >
                <List className="w-5 h-5" />
              </button>

              <div className="flex-1">
                {sheetId === "new" ? (
                  <input
                    type="text"
                    value={sheet?.name || ""}
                    onChange={(e) =>
                      setSheet({ ...sheet, name: e.target.value })
                    }
                    className="text-2xl md:text-3xl font-bold text-slate-900 bg-transparent border-b-2 border-transparent focus:border-emerald-500 outline-none w-full"
                    placeholder="Enter sheet name"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                      {sheet?.name}
                    </h1>
                    <button
                      onClick={() => {
                        const newName = prompt(
                          "Enter new sheet name:",
                          sheet?.name
                        );
                        if (newName && newName.trim()) {
                          setSheet({ ...sheet, name: newName });
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {sheet?.description && (
                  <p className="text-slate-500 mt-1">{sheet.description}</p>
                )}

                {sheet?.month && sheet?.year && (
                  <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(sheet.year, sheet.month - 1).toLocaleDateString(
                      "en-US",
                      { month: "long", year: "numeric" }
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {sheetId !== "new" && (
                <button
                  onClick={() =>
                    window.open(
                      `${process.env.NEXT_PUBLIC_API_URL}/expenses/ahmedabad-petty-cash/${sheetId}/export`,
                      "_blank"
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}

              <button
                onClick={saveSheet}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {sheetId === "new" ? "Create Sheet" : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Opening Balance
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ₹{formatCurrency(sheet?.openingBalance || 0)}
              </div>
              <div className="text-sm text-slate-500 mt-1">Starting amount</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                Credit (In)
              </div>
              <div className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5" />₹
                {formatCurrency(sheet?.totalCredit || 0)}
              </div>
              <div className="text-sm text-slate-500 mt-1">Money received</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
                Debit (Out)
              </div>
              <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5" />₹
                {formatCurrency(sheet?.totalDebit || 0)}
              </div>
              <div className="text-sm text-slate-500 mt-1">Money spent</div>
            </div>

            <div
              className={`bg-white p-5 rounded-xl border shadow-sm ${
                (sheet?.closingBalance || 0) < 0
                  ? "border-red-200 bg-red-50/30"
                  : "border-emerald-200 bg-emerald-50/30"
              }`}
            >
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Current Balance
              </div>
              <div
                className={`text-2xl font-bold flex items-center gap-2 ${
                  (sheet?.closingBalance || 0) < 0
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                <Wallet className="w-5 h-5" />₹
                {formatCurrency(sheet?.closingBalance || 0)}
              </div>
              <div className="text-sm text-slate-500 mt-1">Available cash</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none w-64"
                  placeholder="Search particular or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType("ALL")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === "ALL"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType("CREDIT")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === "CREDIT"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Credit (In)
                </button>
                <button
                  onClick={() => setFilterType("DEBIT")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === "DEBIT"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Debit (Out)
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowNewEntryForm(!showNewEntryForm)}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-all ${
                showNewEntryForm
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <Plus className="w-4 h-4" />
              {showNewEntryForm ? "Cancel" : "New Transaction"}
            </button>
          </div>
        </div>

        {/* New Entry Form */}
        {showNewEntryForm && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Add New Transaction
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleNewEntryChange("type", "DEBIT")}
                      className={`flex-1 py-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                        newEntry.type === "DEBIT"
                          ? "bg-red-50 text-red-700 border-2 border-red-200"
                          : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <ArrowUpRight className="w-5 h-5" />
                      <span className="font-medium">Expense (Out)</span>
                    </button>
                    <button
                      onClick={() => handleNewEntryChange("type", "CREDIT")}
                      className={`flex-1 py-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                        newEntry.type === "CREDIT"
                          ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200"
                          : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <ArrowDownLeft className="w-5 h-5" />
                      <span className="font-medium">Deposit (In)</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newEntry.entryDate}
                      onChange={(e) =>
                        handleNewEntryChange("entryDate", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Particular
                    </label>
                    <input
                      type="text"
                      value={newEntry.particular}
                      onChange={(e) =>
                        handleNewEntryChange("particular", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="e.g., Tea & Snacks, Office Supplies"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Container/Reference Code (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list="containerSuggestions"
                        value={newEntry.contCode}
                        onChange={(e) =>
                          handleNewEntryChange(
                            "contCode",
                            e.target.value.toUpperCase()
                          )
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                        placeholder="e.g., 01-03-25"
                      />
                      <datalist id="containerSuggestions">
                        {containerSuggestions.map((code, index) => (
                          <option key={index} value={code} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Right Column - Amount & Mode */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {newEntry.type === "CREDIT"
                        ? "Credit Amount"
                        : "Debit Amount"}
                    </label>
                    <input
                      type="number"
                      value={
                        newEntry.type === "CREDIT"
                          ? newEntry.credit
                          : newEntry.debit
                      }
                      onChange={(e) =>
                        handleNewEntryChange(
                          newEntry.type === "CREDIT" ? "credit" : "debit",
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none text-lg font-mono text-right ${
                        newEntry.type === "CREDIT"
                          ? "border-emerald-200 focus:ring-emerald-500 text-emerald-700"
                          : "border-red-200 focus:ring-red-500 text-red-700"
                      }`}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Payment Mode
                    </label>
                    <select
                      value={newEntry.mode}
                      onChange={(e) =>
                        handleNewEntryChange("mode", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online/UPI">Online / UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Self">Self</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={newEntry.notes}
                      onChange={(e) =>
                        handleNewEntryChange("notes", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                      placeholder="Additional details..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={() => setShowNewEntryForm(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addEntry}
                  disabled={isSaving}
                  className={`px-6 py-2 font-medium rounded-lg transition-colors ${
                    newEntry.type === "CREDIT"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  } disabled:opacity-50`}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    `Add ${
                      newEntry.type === "CREDIT" ? "Credit" : "Debit"
                    } Entry`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {sortedEntries.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {search || filterType !== "ALL"
                  ? "No matching transactions found"
                  : "No transactions yet"}
              </h3>
              <p className="text-slate-600 mb-6">
                {search || filterType !== "ALL"
                  ? "Try adjusting your search or filters"
                  : "Start by adding your first transaction"}
              </p>
              <button
                onClick={() => setShowNewEntryForm(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Add First Transaction
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sortedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="group hover:bg-slate-50 transition-colors p-4"
                >
                  <div className="flex items-center justify-between">
                    {/* Left Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-bold ${
                          entry.type === "CREDIT"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {entry.type === "CREDIT" ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900">
                          {entry.particular}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {entry.contCode && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
                              {entry.contCode}
                            </span>
                          )}
                          <span className="text-xs text-slate-500">
                            {entry.mode || "Cash"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(entry.entryDate)}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-slate-600 mt-1">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Amount & Actions */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        {entry.type === "CREDIT" ? (
                          <span className="font-mono font-bold text-emerald-600 block">
                            +₹{formatCurrency(entry.credit)}
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-red-600 block">
                            -₹{formatCurrency(entry.debit)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newParticular = prompt(
                              "Edit particular:",
                              entry.particular
                            );
                            if (
                              newParticular !== null &&
                              newParticular.trim()
                            ) {
                              updateEntry(entry.id, {
                                particular: newParticular,
                              });
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-sm font-semibold text-slate-700 mb-2">
              Summary
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Total Transactions:</span>
                <span className="font-semibold">{entries.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Credit Entries:</span>
                <span className="font-semibold text-emerald-600">
                  {entries.filter((e) => e.type === "CREDIT").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Debit Entries:</span>
                <span className="font-semibold text-red-600">
                  {entries.filter((e) => e.type === "DEBIT").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Filtered View:</span>
                <span className="font-semibold">{filteredEntries.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-sm font-semibold text-slate-700 mb-2">
              Quick Actions
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowNewEntryForm(true)}
                className="px-3 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700"
              >
                Add Transaction
              </button>
              {sheetId !== "new" && (
                <button
                  onClick={() =>
                    window.open(
                      `${process.env.NEXT_PUBLIC_API_URL}/expenses/ahmedabad-petty-cash/${sheetId}/export`,
                      "_blank"
                    )
                  }
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"
                >
                  Export to Excel
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm("Refresh sheet data?")) {
                    loadSheet();
                  }
                }}
                className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
