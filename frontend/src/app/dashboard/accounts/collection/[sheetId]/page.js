"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Edit,
  Save,
  X,
  Loader2,
  Copy,
  Download,
  Trash2,
  FileText,
  AlertTriangle,
  Eye,
  EyeOff,
  Filter,
  MoreVertical,
  ChevronDown,
  Sparkles,
  Check,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import CollectionPreviewModal from "./_components/CollectionPreviewModal";

export default function PaymentCollectionSheetPage() {
  const router = useRouter();
  const params = useParams();
  const sheetId = params.sheetId;

  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [sheetDescription, setSheetDescription] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sheetDetails, setSheetDetails] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Load sheet data
  useEffect(() => {
    if (sheetId === "new") {
      initializeNewSheet();
    } else {
      loadSheet();
    }
  }, [sheetId]);

  const initializeNewSheet = () => {
    setSheetName("New Payment Collection");
    setSheetDescription("");
    setEntries([
      {
        id: 1,
        clientName: "",
        expectedDate: "",
        amount24_25: 0,
        addCompany: 0,
        amount25_26: 0,
        advance: 0,
        highlight: false,
        notes: "",
        status: "pending",
      },
    ]);
    setIsLoading(false);
  };

  const loadSheet = async () => {
    setIsLoading(true);
    try {
      const response = await API.get(`/accounts/collection/${sheetId}`);
      if (response.data.success) {
        const sheet = response.data.data;
        setSheetDetails(sheet);
        setSheetName(sheet.name || "");
        setSheetDescription(sheet.description || "");
        setEntries(sheet.entries || []);
        setLastSaved(new Date(sheet.updatedAt));
      }
    } catch (error) {
      console.error("Error loading sheet:", error);
      toast.error("Failed to load payment collection sheet");
      router.push("/dashboard/accounts/collection");
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
      if (sheetName !== sheetDetails?.name || sheetDescription !== sheetDetails?.description) {
        await API.put(`/accounts/collection/${sheetId}`, {
          name: sheetName,
          description: sheetDescription,
        });
      }

      const response = await API.put(
        `/accounts/collection/${sheetId}/bulk-entries`,
        entries.map((entry) => ({
          clientName: entry.clientName || "",
          expectedDate: entry.expectedDate || null,
          amount24_25: parseFloat(entry.amount24_25) || 0,
          addCompany: parseFloat(entry.addCompany) || 0,
          amount25_26: parseFloat(entry.amount25_26) || 0,
          advance: parseFloat(entry.advance) || 0,
          isHighlighted: entry.highlight || false,
          notes: entry.notes || "",
        }))
      );

      if (response.data.success) {
        toast.success("Payment collection sheet saved successfully");
        setLastSaved(new Date());

        if (sheetName !== sheetDetails?.name || sheetDescription !== sheetDetails?.description) {
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
      const response = await API.post("/accounts/collection/", {
        name: sheetName || "New Payment Collection",
        description: sheetDescription,
        fiscalYear: "2024-2025",
        tags: ["payment", "collection"],
      });

      if (response.data.success) {
        const newSheet = response.data.data;

        await API.put(
          `/accounts/collection/${newSheet.id}/bulk-entries`,
          entries.filter(entry => entry.clientName.trim() !== "").map((entry) => ({
            clientName: entry.clientName || "",
            expectedDate: entry.expectedDate || null,
            amount24_25: parseFloat(entry.amount24_25) || 0,
            addCompany: parseFloat(entry.addCompany) || 0,
            amount25_26: parseFloat(entry.amount25_26) || 0,
            advance: parseFloat(entry.advance) || 0,
            isHighlighted: entry.highlight || false,
            notes: entry.notes || "",
          }))
        );

        toast.success("Payment collection sheet created successfully");
        router.push(`/dashboard/accounts/collection/${newSheet.id}`);
      }
    } catch (error) {
      console.error("Error creating sheet:", error);
      toast.error("Failed to create sheet");
    } finally {
      setIsSaving(false);
    }
  };

  // Entry management
  const addRow = () => {
    const newRow = {
      id: Date.now(),
      clientName: "",
      expectedDate: "",
      amount24_25: 0,
      addCompany: 0,
      amount25_26: 0,
      advance: 0,
      highlight: false,
      notes: "",
      status: "pending",
    };
    const newEntries = [...entries, newRow];
    setEntries(newEntries);

    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const updateRow = (id, field, value) => {
    const updated = entries.map((entry) =>
      entry.id === id ? { ...entry, [field]: value } : entry
    );
    setEntries(updated);
  };

  const deleteRow = (id) => {
    if (confirm("Are you sure you want to delete this client entry?")) {
      setEntries(entries.filter((entry) => entry.id !== id));
      toast.success("Entry removed");
    }
  };

  const clearSheet = () => {
    if (confirm("Are you sure you want to clear all entries?")) {
      setEntries([]);
      toast.success("All entries cleared");
    }
  };
  const exportToExcel = () => {
    toast.info("Export feature coming soon!");
  }

  const toggleHighlight = (id) => {
    const updated = entries.map((entry) =>
      entry.id === id ? { ...entry, highlight: !entry.highlight } : entry
    );
    setEntries(updated);
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) =>
    entry.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    entry.notes?.toLowerCase().includes(search.toLowerCase())
  );

  // Calculations
  const stats = useMemo(() => {
    return entries.reduce(
      (acc, curr) => ({
        total24_25: acc.total24_25 + (parseFloat(curr.amount24_25) || 0),
        totalAddCompany: acc.totalAddCompany + (parseFloat(curr.addCompany) || 0),
        total25_26: acc.total25_26 + (parseFloat(curr.amount25_26) || 0),
        totalAdvance: acc.totalAdvance + (parseFloat(curr.advance) || 0),
        totalBalance: acc.totalBalance + ((parseFloat(curr.amount25_26) || 0) - (parseFloat(curr.advance) || 0)),
        highlightedCount: acc.highlightedCount + (curr.highlight ? 1 : 0),
        overdueCount: acc.overdueCount + (curr.expectedDate && new Date(curr.expectedDate) < new Date() ? 1 : 0),
      }),
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <span className="mt-4 text-slate-600 font-medium">Loading payment collection sheet...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Navigation & Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard/accounts")}
                className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-200 hover:shadow-sm"
                title="Back to Accounts Hub"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>

                <div className="min-w-0">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <input
                          type="text"
                          value={sheetName}
                          onChange={(e) => setSheetName(e.target.value)}
                          className="px-3 py-2 border-2 border-purple-500 rounded-lg text-lg font-bold text-slate-900 bg-white outline-none min-w-[250px] focus:ring-2 focus:ring-purple-300 focus:ring-offset-1"
                          autoFocus
                          placeholder="Sheet Name"
                        />
                        <input
                          type="text"
                          value={sheetDescription}
                          onChange={(e) => setSheetDescription(e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 bg-white outline-none min-w-[250px] focus:ring-2 focus:ring-purple-300 focus:ring-offset-1"
                          placeholder="Description (optional)"
                        />
                      </div>
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                        title="Save"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSheetName(sheetDetails?.name || "");
                          setSheetDescription(sheetDetails?.description || "");
                          setIsEditingName(false);
                        }}
                        className="p-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                        title="Cancel"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors truncate max-w-[300px]">
                            {sheetName}
                          </h1>
                          <Edit className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors opacity-0 group-hover:opacity-100" />
                        </div>
                        {sheetDescription ? (
                          <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{sheetDescription}</p>
                        ) : (
                          <p className="text-sm text-slate-400 italic mt-0.5">Click to add description</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden md:flex items-center gap-2 ml-4">
                  <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 text-xs font-semibold border border-purple-200">
                    Collection Sheet
                  </span>
                  {lastSaved && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      Saved {new Date(lastSaved).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2 divide-x divide-slate-200">
                <div className="pr-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Balance</div>
                  <div className={`font-mono font-bold text-lg ${stats.totalBalance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                    ₹{formatCurrency(stats.totalBalance)}
                  </div>
                </div>
                <div className="px-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Clients</div>
                  <div className="font-bold text-lg text-slate-900 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {entries.length}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewOpen(true)}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200"
                  title="Preview & Print"
                >
                  <FileText className="w-5 h-5" />
                </button>

                <button
                  onClick={saveSheet}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl shadow-lg transition-all duration-200 ${isSaving
                    ? "bg-gradient-to-r from-purple-400 to-purple-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white hover:shadow-xl"
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
                      Save Sheet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">24-25 Amount</div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">₹{formatCurrency(stats.total24_25)}</div>
            <div className="mt-2 text-xs text-slate-500">Previous fiscal year</div>
          </div>

          <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-blue-500 uppercase tracking-wider">Add Company</div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Plus className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">₹{formatCurrency(stats.totalAddCompany)}</div>
            <div className="mt-2 text-xs text-slate-500">Additional company funds</div>
          </div>

          <div className="bg-gradient-to-br from-white to-purple-50 p-5 rounded-2xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-purple-600 uppercase tracking-wider">25-26 Amount</div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calculator className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-700">₹{formatCurrency(stats.total25_26)}</div>
            <div className="mt-2 text-xs text-purple-600">Current fiscal year</div>
          </div>

          <div className="bg-gradient-to-br from-white to-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Net Balance</div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                {stats.totalBalance >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            <div className={`text-2xl font-bold ${stats.totalBalance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
              ₹{formatCurrency(stats.totalBalance)}
            </div>
            <div className={`mt-2 text-xs ${stats.totalBalance < 0 ? 'text-red-500' : 'text-slate-500'}`}>
              {stats.totalBalance < 0 ? 'Negative balance' : 'Positive balance'}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:flex-initial">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  className="w-full md:w-72 pl-10 pr-4 py-2.5 text-sm border border-slate-300 bg-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="Search clients or notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 ${showAdvanced
                  ? "bg-purple-50 border-purple-300 text-purple-700"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
              >
                {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAdvanced ? "Simple View" : "Advanced View"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {stats.overdueCount > 0 && (
                <div className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {stats.overdueCount} overdue
                </div>
              )}

              {stats.highlightedCount > 0 && (
                <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-600 text-sm font-medium rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {stats.highlightedCount} highlighted
                </div>
              )}

              <button
                onClick={addRow}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-semibold text-sm rounded-xl hover:shadow-lg transition-all duration-200 hover:from-slate-800 hover:to-slate-900"
              >
                <Plus className="w-4 h-4" />
                Add Client
              </button>
            </div>
          </div>
        </div>

        {/* Collection Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left font-semibold text-slate-700 min-w-[300px]">Client</th>
                  <th className="p-4 text-left font-semibold text-slate-700 min-w-[150px]">Expected Date</th>
                  <th className="p-4 text-right font-semibold text-slate-700 min-w-[150px]">24-25</th>
                  <th className="p-4 text-right font-semibold text-blue-700 min-w-[150px]">Add Co.</th>
                  <th className="p-4 text-right font-semibold text-purple-700 min-w-[150px]">25-26</th>
                  <th className="p-4 text-right font-semibold text-emerald-700 min-w-[150px]">Advance</th>
                  <th className="p-4 text-right font-semibold text-slate-900 min-w-[150px]">Balance</th>
                  {showAdvanced && (
                    <th className="p-4 text-left font-semibold text-slate-700 min-w-[200px]">Notes</th>
                  )}
                  <th className="p-4 text-center font-semibold text-slate-700 min-w-[150px]">Flag</th>
                  <th className="p-4 text-center font-semibold text-slate-700 min-w-[150px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={showAdvanced ? 10 : 9}
                      className="text-center py-16"
                    >
                      <div className="max-w-sm mx-auto">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">
                          {search ? "No matching entries" : "No client entries yet"}
                        </h3>
                        <p className="text-slate-500 mb-6">
                          {search ? "Try adjusting your search terms" : "Start by adding your first client entry"}
                        </p>
                        <button
                          onClick={addRow}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                        >
                          Add First Client
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => {
                    const balance = (parseFloat(entry.amount25_26) || 0) - (parseFloat(entry.advance) || 0);
                    const isOverdue = entry.expectedDate && new Date(entry.expectedDate) < new Date();

                    return (
                      <tr
                        key={entry.id}
                        className={`group hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-white transition-all duration-200 ${entry.highlight ? "bg-gradient-to-r from-amber-50/50 to-amber-50/30" : ""
                          }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg flex items-center justify-center">
                              <Users className="w-4 h-4 text-purple-600" />
                            </div>
                            <input
                              type="text"
                              className="flex-1 px-3 py-2 border border-transparent hover:border-slate-200 focus:border-purple-500 focus:bg-white bg-transparent outline-none font-medium text-slate-800 rounded-lg transition-all"
                              placeholder="Client Name"
                              value={entry.clientName}
                              onChange={(e) => updateRow(entry.id, "clientName", e.target.value)}
                            />
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="relative">
                            <input
                              type="date"
                              className={`w-full px-3 py-2 border rounded-lg outline-none transition-all ${isOverdue
                                ? "border-red-300 bg-red-50 text-red-700"
                                : "border-slate-200 hover:border-slate-300 focus:border-purple-500 focus:bg-white"
                                }`}
                              value={entry.expectedDate || ""}
                              onChange={(e) => updateRow(entry.id, "expectedDate", e.target.value)}
                            />
                            {isOverdue && (
                              <div className="absolute -top-2 -right-2">
                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-white">!</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-4">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 text-right border border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:bg-white bg-slate-50/50 outline-none font-mono rounded-lg transition-all"
                            placeholder="0"
                            value={entry.amount24_25 || ""}
                            onChange={(e) => updateRow(entry.id, "amount24_25", e.target.value)}
                          />
                        </td>

                        <td className="p-4">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 text-right border border-blue-200 hover:border-blue-300 focus:border-blue-500 focus:bg-white bg-blue-50/30 outline-none font-mono font-medium text-blue-700 rounded-lg transition-all"
                            placeholder="0"
                            value={entry.addCompany || ""}
                            onChange={(e) => updateRow(entry.id, "addCompany", e.target.value)}
                          />
                        </td>

                        <td className="p-4">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 text-right border border-purple-200 hover:border-purple-300 focus:border-purple-500 focus:bg-white bg-purple-50/30 outline-none font-mono font-bold text-purple-700 rounded-lg transition-all"
                            placeholder="0"
                            value={entry.amount25_26 || ""}
                            onChange={(e) => updateRow(entry.id, "amount25_26", e.target.value)}
                          />
                        </td>

                        <td className="p-4">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 text-right border border-emerald-200 hover:border-emerald-300 focus:border-emerald-500 focus:bg-white bg-emerald-50/30 outline-none font-mono font-medium text-emerald-700 rounded-lg transition-all"
                            placeholder="0"
                            value={entry.advance || ""}
                            onChange={(e) => updateRow(entry.id, "advance", e.target.value)}
                          />
                        </td>

                        <td className="p-4">
                          <div className={`px-3 py-2 text-right font-mono font-bold rounded-lg ${balance < 0
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : balance > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                            ₹{formatCurrency(balance)}
                          </div>
                        </td>

                        {showAdvanced && (
                          <td className="p-4">
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-slate-200 hover:border-slate-300 focus:border-purple-500 focus:bg-white bg-transparent outline-none text-sm text-slate-600 rounded-lg transition-all"
                              placeholder="Add notes..."
                              value={entry.notes || ""}
                              onChange={(e) => updateRow(entry.id, "notes", e.target.value)}
                            />
                          </td>
                        )}

                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleHighlight(entry.id)}
                            className={`p-2 rounded-lg transition-all duration-200 ${entry.highlight
                              ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                              }`}
                            title={entry.highlight ? "Remove flag" : "Flag for follow-up"}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() => deleteRow(entry.id)}
                            className="w-full p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 group-hover:opacity-100"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-white to-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-sm font-semibold text-slate-700 mb-2">Quick Summary</div>
            <div className="space-y-1 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Total Clients:</span>
                <span className="font-semibold">{entries.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Filtered:</span>
                <span className="font-semibold">{filteredEntries.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Highlighted:</span>
                <span className="font-semibold text-amber-600">{stats.highlightedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Overdue:</span>
                <span className="font-semibold text-red-600">{stats.overdueCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-purple-50 p-4 rounded-xl border border-purple-200">
            <div className="text-sm font-semibold text-purple-700 mb-2">Financial Overview</div>
            <div className="space-y-1 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Expected Revenue:</span>
                <span className="font-semibold text-purple-700">₹{formatCurrency(stats.total25_26)}</span>
              </div>
              <div className="flex justify-between">
                <span>Collected:</span>
                <span className="font-semibold text-emerald-600">₹{formatCurrency(stats.totalAdvance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending:</span>
                <span className={`font-semibold ${stats.totalBalance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                  ₹{formatCurrency(stats.totalBalance)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-sm font-semibold text-slate-700 mb-2">Quick Actions</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={saveSheet}
                disabled={isSaving}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-lg hover:shadow-md transition-all"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={exportToExcel}
                disabled={sheetId === "new"}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-all"
              >
                Export
              </button>
            </div>
            <div className="mt-3 text-xs text-slate-500 italic">
              * Changes are saved automatically. Export for backup.
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      {entries.length > 5 && (
        <div className="fixed bottom-6 right-6 z-30">
          <div className="flex flex-col gap-2">
            <button
              onClick={saveSheet}
              disabled={isSaving}
              className={`p-4 rounded-full shadow-xl transition-all duration-200 ${isSaving
                ? "bg-gradient-to-r from-purple-400 to-purple-500"
                : "bg-gradient-to-r from-purple-600 to-purple-700 hover:shadow-2xl"
                } text-white`}
              title="Save Sheet"
            >
              {isSaving ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Save className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={addRow}
              className="p-4 rounded-full shadow-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white transition-all duration-200 hover:shadow-2xl"
              title="Add Client"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <CollectionPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        sheetName={sheetName}
        sheetDescription={sheetDescription}
        entries={entries}
        stats={stats}
      />
    </div>
  );
}