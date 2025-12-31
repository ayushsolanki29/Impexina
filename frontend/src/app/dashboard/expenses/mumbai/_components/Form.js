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
  Truck,
  Wallet,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import API from "@/lib/api";

export default function MumbaiLedgerForm() {
  const router = useRouter();
  const params = useParams();
  const ledgerId = params.ledgerId;

  const [ledger, setLedger] = useState(null);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: "EXPENSE",
    entryDate: new Date().toISOString().split("T")[0],
    containerCode: "",
    expenseNote: "",
    advanceNote: "Office Advance",
    items: [{ label: "UNLOADING", amount: "" }],
    amount: "",
  });
  const [containerSuggestions, setContainerSuggestions] = useState([]);

  // Load ledger data
  useEffect(() => {
    if (ledgerId === "new") {
      initializeNewLedger();
    } else {
      loadLedger();
    }
    fetchContainerSuggestions();
  }, [ledgerId]);

  const initializeNewLedger = () => {
    setLedger({
      name: `Mumbai Ledger - ${new Date().toLocaleDateString()}`,
      description: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });
    setEntries([]);
    setIsLoading(false);
  };

  const loadLedger = async () => {
    setIsLoading(true);
    try {
      const response = await API.get(`/expenses/mumbai-ledger/${ledgerId}`);
      if (response.data.success) {
        const ledgerData = response.data.data;
        setLedger(ledgerData);
        setEntries(ledgerData.entries || []);
      }
    } catch (error) {
      console.error("Error loading ledger:", error);
      toast.error("Failed to load ledger");
      router.push("/dashboard/expenses/mumbai");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContainerSuggestions = async () => {
    try {
      const response = await API.get("/expenses/mumbai-ledger/containers/suggestions");
      if (response.data.success) {
        setContainerSuggestions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching container suggestions:", error);
    }
  };

  // Save ledger
  const saveLedger = async () => {
    if (!ledger?.name?.trim()) {
      toast.error("Please enter a ledger name");
      return;
    }

    setIsSaving(true);
    try {
      let response;
      
      if (ledgerId === "new") {
        response = await API.post("/expenses/mumbai-ledger", ledger);
        toast.success("Ledger created successfully");
        
        // Redirect to edit page for new ledger
        if (response.data.success) {
          setTimeout(() => {
            router.push(`/dashboard/expenses/mumbai/${response.data.data.id}`);
          }, 1000);
          return;
        }
      } else {
        response = await API.put(`/expenses/mumbai-ledger/${ledgerId}`, ledger);
        toast.success("Ledger updated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  // Add new entry
  const addEntry = async () => {
    if (!newEntry.amount || parseFloat(newEntry.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (newEntry.type === "EXPENSE" && !newEntry.containerCode.trim()) {
      toast.error("Please enter container code for expense");
      return;
    }

    if (newEntry.type === "ADVANCE" && !newEntry.advanceNote.trim()) {
      toast.error("Please enter advance note");
      return;
    }

    setIsSaving(true);
    try {
      const entryData = {
        ...newEntry,
        amount: parseFloat(newEntry.amount),
        items: newEntry.type === "EXPENSE" ? newEntry.items.filter(item => 
          item.label.trim() && item.amount && parseFloat(item.amount) > 0
        ) : [],
      };

      const response = await API.post(
        `/expenses/mumbai-ledger/${ledgerId}/entries`,
        entryData
      );

      if (response.data.success) {
        toast.success("Entry added successfully");
        
        // Add to local state
        setEntries(prev => [response.data.data, ...prev]);
        
        // Update ledger totals locally
        if (ledger) {
          const amount = parseFloat(newEntry.amount);
          setLedger(prev => ({
            ...prev,
            totalExpense: prev.totalExpense + (newEntry.type === "EXPENSE" ? amount : 0),
            totalAdvance: prev.totalAdvance + (newEntry.type === "ADVANCE" ? amount : 0),
            totalBalance: prev.totalBalance + (newEntry.type === "ADVANCE" ? amount : -amount),
          }));
        }
        
        // Reset form
        setNewEntry({
          type: "EXPENSE",
          entryDate: new Date().toISOString().split("T")[0],
          containerCode: "",
          expenseNote: "",
          advanceNote: "Office Advance",
          items: [{ label: "UNLOADING", amount: "" }],
          amount: "",
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
        `/expenses/mumbai-ledger/entries/${entryId}`,
        updates
      );

      if (response.data.success) {
        toast.success("Entry updated");
        
        // Update local state
        setEntries(prev => prev.map(entry => 
          entry.id === entryId ? response.data.data : entry
        ));
        
        // Reload ledger to update totals
        if (ledgerId !== "new") {
          loadLedger();
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
      const response = await API.delete(`/expenses/mumbai-ledger/entries/${entryId}`);

      if (response.data.success) {
        toast.success("Entry deleted");
        
        // Remove from local state
        setEntries(prev => prev.filter(entry => entry.id !== entryId));
        
        // Reload ledger to update totals
        if (ledgerId !== "new") {
          loadLedger();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  // Handle new entry form changes
  const handleNewEntryChange = (field, value) => {
    setNewEntry(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...newEntry.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setNewEntry(prev => ({ ...prev, items: newItems }));
  };

  const addItemRow = () => {
    setNewEntry(prev => ({
      ...prev,
      items: [...prev.items, { label: "", amount: "" }]
    }));
  };

  const removeItemRow = (index) => {
    const newItems = newEntry.items.filter((_, i) => i !== index);
    setNewEntry(prev => ({ ...prev, items: newItems }));
  };

  // Calculate totals
  const calculateItemTotal = () => {
    if (newEntry.type !== "EXPENSE") return newEntry.amount || 0;
    
    const total = newEntry.items.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);
    
    // Update the amount field
    if (total > 0 && total !== parseFloat(newEntry.amount || 0)) {
      handleNewEntryChange("amount", total.toString());
    }
    
    return total;
  };

  // Toggle row expansion
  const toggleRow = (id) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = search ? 
      entry.containerCode?.toLowerCase().includes(search.toLowerCase()) ||
      entry.expenseNote?.toLowerCase().includes(search.toLowerCase()) ||
      entry.advanceNote?.toLowerCase().includes(search.toLowerCase()) : true;
    
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
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard/expenses/mumbai")}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex-1">
                {ledgerId === "new" ? (
                  <input
                    type="text"
                    value={ledger?.name || ""}
                    onChange={(e) => setLedger({...ledger, name: e.target.value})}
                    className="text-2xl md:text-3xl font-bold text-slate-900 bg-transparent border-b-2 border-transparent focus:border-blue-500 outline-none w-full"
                    placeholder="Enter ledger name"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                      {ledger?.name}
                    </h1>
                    <button
                      onClick={() => {
                        const newName = prompt("Enter new ledger name:", ledger?.name);
                        if (newName && newName.trim()) {
                          setLedger({...ledger, name: newName});
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {ledger?.description && (
                  <p className="text-slate-500 mt-1">{ledger.description}</p>
                )}
                
                {ledger?.month && ledger?.year && (
                  <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(ledger.year, ledger.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {ledgerId !== "new" && (
                <button
                  onClick={() => window.open(
                    `${process.env.NEXT_PUBLIC_API_URL}/expenses/mumbai-ledger/${ledgerId}/export`,
                    "_blank"
                  )}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}
              
              <button
                onClick={saveLedger}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {ledgerId === "new" ? "Create Ledger" : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Total Expense
              </div>
              <div className="text-2xl font-bold text-red-600">
                ₹{formatCurrency(ledger?.totalExpense || 0)}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Container & Other Expenses
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Total Advance
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                ₹{formatCurrency(ledger?.totalAdvance || 0)}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Office Advances Received
              </div>
            </div>

            <div className={`bg-white p-5 rounded-xl border shadow-sm ${
              (ledger?.totalBalance || 0) < 0 
                ? "border-red-200 bg-red-50/30" 
                : "border-emerald-200 bg-emerald-50/30"
            }`}>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Net Balance
              </div>
              <div className={`text-2xl font-bold flex items-center gap-2 ${
                (ledger?.totalBalance || 0) < 0 ? "text-red-600" : "text-emerald-600"
              }`}>
                <DollarSign className="w-6 h-6" />
                ₹{formatCurrency(ledger?.totalBalance || 0)}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {ledger?.totalBalance < 0 ? "Expense > Advance" : "Advance > Expense"}
              </div>
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
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
                  placeholder="Search container code or notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType("ALL")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === "ALL"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType("EXPENSE")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === "EXPENSE"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Expenses
                </button>
                <button
                  onClick={() => setFilterType("ADVANCE")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === "ADVANCE"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Advances
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowNewEntryForm(!showNewEntryForm)}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-all ${
                showNewEntryForm
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <Plus className="w-4 h-4" />
              {showNewEntryForm ? "Cancel" : "New Entry"}
            </button>
          </div>
        </div>

        {/* New Entry Form */}
        {showNewEntryForm && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Add New Entry
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleNewEntryChange("type", "EXPENSE")}
                      className={`flex-1 py-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                        newEntry.type === "EXPENSE"
                          ? "bg-red-50 text-red-700 border-2 border-red-200"
                          : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Truck className="w-5 h-5" />
                      <span className="font-medium">Container Expense</span>
                    </button>
                    <button
                      onClick={() => handleNewEntryChange("type", "ADVANCE")}
                      className={`flex-1 py-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                        newEntry.type === "ADVANCE"
                          ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200"
                          : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Wallet className="w-5 h-5" />
                      <span className="font-medium">Office Advance</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newEntry.entryDate}
                      onChange={(e) => handleNewEntryChange("entryDate", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {newEntry.type === "EXPENSE" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Container Code
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            list="containerSuggestions"
                            value={newEntry.containerCode}
                            onChange={(e) => handleNewEntryChange("containerCode", e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"
                            placeholder="e.g., PSCT-72"
                          />
                          <datalist id="containerSuggestions">
                            {containerSuggestions.map((code, index) => (
                              <option key={index} value={code} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Expense Note (Optional)
                        </label>
                        <input
                          type="text"
                          value={newEntry.expenseNote}
                          onChange={(e) => handleNewEntryChange("expenseNote", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Additional notes"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Advance Note
                      </label>
                      <input
                        type="text"
                        value={newEntry.advanceNote}
                        onChange={(e) => handleNewEntryChange("advanceNote", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g., Office Advance, Cash Deposit"
                      />
                    </div>
                  )}
                </div>

                {/* Right Column - Amount & Items */}
                <div className="space-y-4">
                  {newEntry.type === "EXPENSE" ? (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-medium text-slate-700">
                          Expense Items
                        </label>
                        <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          Total: ₹{formatCurrency(calculateItemTotal())}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {newEntry.items.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded outline-none uppercase placeholder:normal-case"
                              placeholder="Particular (e.g., UNLOADING)"
                              value={item.label}
                              onChange={(e) => handleItemChange(index, "label", e.target.value)}
                            />
                            <input
                              type="number"
                              className="w-32 px-3 py-2 text-sm border border-slate-300 rounded outline-none text-right font-mono"
                              placeholder="Amount"
                              value={item.amount}
                              onChange={(e) => handleItemChange(index, "amount", e.target.value)}
                            />
                            {newEntry.items.length > 1 && (
                              <button
                                onClick={() => removeItemRow(index)}
                                className="px-2 text-slate-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={addItemRow}
                        className="w-full mt-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-all"
                      >
                        + Add Item
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Advance Amount
                      </label>
                      <input
                        type="number"
                        value={newEntry.amount}
                        onChange={(e) => handleNewEntryChange("amount", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono text-right"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {/* Total Amount Display */}
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-700">
                        Total Amount
                      </span>
                      <span className="text-2xl font-bold text-blue-700">
                        ₹{formatCurrency(calculateItemTotal())}
                      </span>
                    </div>
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
                    newEntry.type === "ADVANCE"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  } disabled:opacity-50`}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    `Add ${newEntry.type === "ADVANCE" ? "Advance" : "Expense"} Entry`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Entries List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {sortedEntries.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {search || filterType !== "ALL" 
                  ? "No matching entries found" 
                  : "No entries yet"}
              </h3>
              <p className="text-slate-600 mb-6">
                {search || filterType !== "ALL" 
                  ? "Try adjusting your search or filters" 
                  : "Start by adding your first entry"}
              </p>
              <button
                onClick={() => setShowNewEntryForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add First Entry
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sortedEntries.map((entry) => (
                <div key={entry.id} className="group hover:bg-slate-50 transition-colors">
                  <div className="p-4 flex items-center justify-between">
                    {/* Left Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-bold ${
                          entry.type === "ADVANCE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        <span>{new Date(entry.entryDate).getDate()}</span>
                        <span className="uppercase text-[10px]">
                          {new Date(entry.entryDate).toLocaleString("default", { month: "short" })}
                        </span>
                      </div>
                      
                      <div>
                        {entry.type === "ADVANCE" ? (
                          <>
                            <h3 className="font-bold text-slate-900">{entry.advanceNote || "Office Advance"}</h3>
                            <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">
                              Cash In
                            </span>
                          </>
                        ) : (
                          <>
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                              {entry.containerCode}
                              {entry.expenseNote && (
                                <span className="text-sm font-normal text-slate-500">
                                  - {entry.expenseNote}
                                </span>
                              )}
                            </h3>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Truck className="w-3 h-3" />
                              Container Expense
                              {entry.items?.length > 0 && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                                  {entry.items.length} items
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Amount & Actions */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold font-mono ${
                            entry.type === "ADVANCE" 
                              ? "text-emerald-600" 
                              : "text-red-600"
                          }`}
                        >
                          {entry.type === "ADVANCE" ? "+" : "-"} ₹
                          {formatCurrency(entry.amount)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {formatDate(entry.entryDate)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {entry.type === "EXPENSE" && (
                          <button
                            onClick={() => toggleRow(entry.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            {expandedRows.has(entry.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details for Expenses */}
                  {entry.type === "EXPENSE" && expandedRows.has(entry.id) && (
                    <div className="bg-slate-50/80 border-t border-slate-100 px-16 py-4">
                      {entry.items && entry.items.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                          {entry.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm border-b border-slate-200/60 pb-1 last:border-0"
                            >
                              <span className="text-slate-600 font-medium uppercase text-xs">
                                {item.label}
                              </span>
                              <span className="text-slate-900 font-mono">
                                ₹{formatCurrency(item.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 italic">
                          No item details available
                        </div>
                      )}
                    </div>
                  )}
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
                <span>Total Entries:</span>
                <span className="font-semibold">{entries.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Expense Entries:</span>
                <span className="font-semibold text-red-600">
                  {entries.filter(e => e.type === "EXPENSE").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Advance Entries:</span>
                <span className="font-semibold text-emerald-600">
                  {entries.filter(e => e.type === "ADVANCE").length}
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
                className="px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
              >
                Add Entry
              </button>
              {ledgerId !== "new" && (
                <button
                  onClick={() => window.open(
                    `${process.env.NEXT_PUBLIC_API_URL}/expenses/mumbai-ledger/${ledgerId}/export`,
                    "_blank"
                  )}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"
                >
                  Export to Excel
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm("Refresh ledger data?")) {
                    loadLedger();
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