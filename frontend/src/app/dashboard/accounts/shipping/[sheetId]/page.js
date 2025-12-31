"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  DollarSign,
  Ship,
  Container,
  Truck,
  Package,
  Edit,
  Save,
  X,
  Loader2,
  Copy,
  Download,
  Trash2,
  FileText,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";

export default function ShippingSheetPage() {
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

  useEffect(() => {
    if (sheetId === "new") {
      // Initialize new sheet
      setSheetName("New Shipping Sheet");
      setSheetDescription("");
      setEntries([
        {
          id: 1,
          containerCode: "",
          loadingFrom: "YIWU / GUANGZHOU / FULL",
          ctn: 0,
          loadingDate: new Date().toISOString().split("T")[0],
          deliveryDate: "",
          freightUSD: 0,
          freightINR: 0,
          cha: 0,
          fobTerms: 0,
          cfsDoYard: 0,
          scanning: 0,
          simsPims: 0,
          duty: 0,
          penalty: 0,
          trucking: 0,
          loadingUnloading: 0,
          deliveryStatus: "PENDING",
          notes: "",
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
      const response = await API.get(`/accounts/shipping/${sheetId}`);
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
      toast.error("Failed to load shipping sheet");
      router.push("/dashboard/accounts/shipping");
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
      if (sheetName !== sheetDetails?.name || sheetDescription !== sheetDetails?.description) {
        await API.put(`/accounts/shipping/${sheetId}`, {
          name: sheetName,
          description: sheetDescription,
        });
      }

      // Save entries
      const response = await API.put(
        `/accounts/shipping/${sheetId}/bulk-entries`,
        entries.map((entry) => ({
          containerCode: entry.containerCode || "",
          loadingFrom: entry.loadingFrom || "YIWU / GUANGZHOU / FULL",
          ctn: parseInt(entry.ctn) || 0,
          loadingDate: entry.loadingDate || new Date().toISOString().split("T")[0],
          deliveryDate: entry.deliveryDate || null,
          freightUSD: parseFloat(entry.freightUSD) || 0,
          freightINR: parseFloat(entry.freightINR) || 0,
          cha: parseFloat(entry.cha) || 0,
          fobTerms: parseFloat(entry.fobTerms) || 0,
          cfsDoYard: parseFloat(entry.cfsDoYard) || 0,
          scanning: parseFloat(entry.scanning) || 0,
          simsPims: parseFloat(entry.simsPims) || 0,
          duty: parseFloat(entry.duty) || 0,
          penalty: parseFloat(entry.penalty) || 0,
          trucking: parseFloat(entry.trucking) || 0,
          loadingUnloading: parseFloat(entry.loadingUnloading) || 0,
          deliveryStatus: entry.deliveryStatus || "PENDING",
          notes: entry.notes || "",
        }))
      );

      if (response.data.success) {
        toast.success("Shipping sheet saved successfully");
        setLastSaved(new Date());
        
        // Reload sheet details
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
      const response = await API.post("/accounts/shipping/", {
        name: sheetName || "New Shipping Sheet",
        description: sheetDescription,
        fiscalYear: "2024-2025",
        tags: ["shipping", "logistics"],
      });

      if (response.data.success) {
        const newSheet = response.data.data;
        
        // Save entries to the new sheet
        await API.put(
          `/accounts/shipping/${newSheet.id}/bulk-entries`,
          entries.filter(entry => entry.containerCode.trim() !== "").map((entry) => ({
            containerCode: entry.containerCode || "",
            loadingFrom: entry.loadingFrom || "YIWU / GUANGZHOU / FULL",
            ctn: parseInt(entry.ctn) || 0,
            loadingDate: entry.loadingDate || new Date().toISOString().split("T")[0],
            deliveryDate: entry.deliveryDate || null,
            freightUSD: parseFloat(entry.freightUSD) || 0,
            freightINR: parseFloat(entry.freightINR) || 0,
            cha: parseFloat(entry.cha) || 0,
            fobTerms: parseFloat(entry.fobTerms) || 0,
            cfsDoYard: parseFloat(entry.cfsDoYard) || 0,
            scanning: parseFloat(entry.scanning) || 0,
            simsPims: parseFloat(entry.simsPims) || 0,
            duty: parseFloat(entry.duty) || 0,
            penalty: parseFloat(entry.penalty) || 0,
            trucking: parseFloat(entry.trucking) || 0,
            loadingUnloading: parseFloat(entry.loadingUnloading) || 0,
            deliveryStatus: entry.deliveryStatus || "PENDING",
            notes: entry.notes || "",
          }))
        );

        toast.success("Shipping sheet created successfully");
        router.push(`/dashboard/accounts/shipping/${newSheet.id}`);
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
        `${process.env.NEXT_PUBLIC_API_URL}/accounts/shipping/${sheetId}/export`,
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
      const response = await API.post("/accounts/shipping/", {
        name: newName,
        description: sheetDescription,
        fiscalYear: "2024-2025",
        tags: ["shipping", "logistics", "copy"],
      });

      if (response.data.success) {
        const newSheet = response.data.data;

        // Duplicate entries
        await API.put(
          `/accounts/shipping/${newSheet.id}/bulk-entries`,
          entries.map((entry) => ({
            containerCode: entry.containerCode,
            loadingFrom: entry.loadingFrom,
            ctn: entry.ctn || 0,
            loadingDate: entry.loadingDate,
            deliveryDate: entry.deliveryDate,
            freightUSD: entry.freightUSD || 0,
            freightINR: entry.freightINR || 0,
            cha: entry.cha || 0,
            fobTerms: entry.fobTerms || 0,
            cfsDoYard: entry.cfsDoYard || 0,
            scanning: entry.scanning || 0,
            simsPims: entry.simsPims || 0,
            duty: entry.duty || 0,
            penalty: entry.penalty || 0,
            trucking: entry.trucking || 0,
            loadingUnloading: entry.loadingUnloading || 0,
            deliveryStatus: entry.deliveryStatus || "PENDING",
            notes: entry.notes || "",
          }))
        );

        toast.success("Sheet duplicated successfully");
        router.push(`/dashboard/accounts/shipping/${newSheet.id}`);
      }
    } catch (error) {
      console.error("Error duplicating sheet:", error);
      toast.error("Failed to duplicate sheet");
    }
  };

  // Local state management
  const save = useCallback((data) => {
    setEntries(data);
  }, []);

  const addRow = () => {
    const newRow = {
      id: Date.now(),
      containerCode: "",
      loadingFrom: "YIWU / GUANGZHOU / FULL",
      ctn: 0,
      loadingDate: new Date().toISOString().split("T")[0],
      deliveryDate: "",
      freightUSD: 0,
      freightINR: 0,
      cha: 0,
      fobTerms: 0,
      cfsDoYard: 0,
      scanning: 0,
      simsPims: 0,
      duty: 0,
      penalty: 0,
      trucking: 0,
      loadingUnloading: 0,
      deliveryStatus: "PENDING",
      notes: "",
    };
    const newEntries = [...entries, newRow];
    save(newEntries);
    
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const updateRow = (id, field, value) => {
    const updated = entries.map((entry) =>
      entry.id === id ? { ...entry, [field]: value } : entry
    );
    save(updated);
  };

  const deleteRow = (id) => {
    if (confirm("Are you sure you want to delete this container entry?")) {
      save(entries.filter((entry) => entry.id !== id));
      toast.success("Entry removed");
    }
  };

  const clearSheet = () => {
    if (confirm("Are you sure you want to clear all entries?")) {
      save([]);
      toast.success("All entries cleared");
    }
  };

  const updateDeliveryStatus = (id, status) => {
    const updated = entries.map((entry) =>
      entry.id === id ? { ...entry, deliveryStatus: status } : entry
    );
    save(updated);
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) =>
    entry.containerCode?.toLowerCase().includes(search.toLowerCase()) ||
    entry.loadingFrom?.toLowerCase().includes(search.toLowerCase()) ||
    entry.notes?.toLowerCase().includes(search.toLowerCase())
  );

  // Calculations
  const stats = useMemo(() => {
    return entries.reduce(
      (acc, curr) => {
        const localCharges = (parseFloat(curr.cha) || 0) + 
                            (parseFloat(curr.fobTerms) || 0) + 
                            (parseFloat(curr.cfsDoYard) || 0) + 
                            (parseFloat(curr.scanning) || 0) + 
                            (parseFloat(curr.simsPims) || 0) + 
                            (parseFloat(curr.duty) || 0) + 
                            (parseFloat(curr.penalty) || 0) + 
                            (parseFloat(curr.trucking) || 0) + 
                            (parseFloat(curr.loadingUnloading) || 0);
        
        const totalAmount = (parseFloat(curr.freightINR) || 0) + localCharges;
        
        return {
          totalCTN: acc.totalCTN + (parseInt(curr.ctn) || 0),
          totalFreightUSD: acc.totalFreightUSD + (parseFloat(curr.freightUSD) || 0),
          totalFreightINR: acc.totalFreightINR + (parseFloat(curr.freightINR) || 0),
          totalLocalCharges: acc.totalLocalCharges + localCharges,
          grandTotal: acc.grandTotal + totalAmount,
          pendingCount: acc.pendingCount + (curr.deliveryStatus === "PENDING" ? 1 : 0),
          inTransitCount: acc.inTransitCount + (curr.deliveryStatus === "IN_TRANSIT" ? 1 : 0),
          deliveredCount: acc.deliveredCount + (curr.deliveryStatus === "DELIVERED" ? 1 : 0),
        };
      },
      { 
        totalCTN: 0, 
        totalFreightUSD: 0, 
        totalFreightINR: 0, 
        totalLocalCharges: 0, 
        grandTotal: 0,
        pendingCount: 0,
        inTransitCount: 0,
        deliveredCount: 0,
      }
    );
  }, [entries]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatCurrencyUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      IN_TRANSIT: "bg-blue-100 text-blue-800",
      ARRIVED: "bg-green-100 text-green-800",
      DELIVERED: "bg-emerald-100 text-emerald-800",
    };
    return colors[status] || colors.PENDING;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-slate-600">Loading shipping sheet...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Navigation & Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard/accounts/shipping")}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                title="Back to Shipping"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        value={sheetName}
                        onChange={(e) => setSheetName(e.target.value)}
                        className="px-3 py-1.5 border border-indigo-500 rounded-lg text-lg font-bold text-slate-900 outline-none min-w-[300px]"
                        autoFocus
                        placeholder="Sheet Name"
                      />
                      <input
                        type="text"
                        value={sheetDescription}
                        onChange={(e) => setSheetDescription(e.target.value)}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 outline-none min-w-[300px]"
                        placeholder="Description (optional)"
                      />
                    </div>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSheetName(sheetDetails?.name || "");
                        setSheetDescription(sheetDetails?.description || "");
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
                    <div>
                      <h1
                        className="text-xl font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors truncate max-w-[400px]"
                        onClick={() => setIsEditingName(true)}
                        title="Click to edit"
                      >
                        {sheetName}
                      </h1>
                      {sheetDescription && (
                        <p className="text-sm text-slate-500 mt-1">
                          {sheetDescription}
                        </p>
                      )}
                    </div>
                    <Edit
                      className="w-4 h-4 text-slate-400 cursor-pointer hover:text-indigo-500 transition-colors"
                      onClick={() => setIsEditingName(true)}
                      title="Edit sheet details"
                    />

                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">
                      {sheetId === "new" ? "New Sheet" : "Shipping Ledger"}
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
              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase">Containers</div>
                  <div className="font-mono font-bold text-slate-900">
                    {entries.length}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase">Freight</div>
                  <div className="font-mono font-bold text-blue-600">
                    ₹{formatCurrency(stats.totalFreightINR)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase">Total</div>
                  <div className="font-mono font-bold text-indigo-700">
                    ₹{formatCurrency(stats.grandTotal)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={exportToExcel}
                  className="p-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  title="Export to Excel"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                <button
                  onClick={duplicateSheet}
                  className="p-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  title="Duplicate Sheet"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={saveSheet}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-lg shadow-md transition-all ${
                    isSaving
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
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
      <main className="max-w-[1600px] mx-auto p-4 md:p-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Containers
            </div>
            <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Container className="w-5 h-5" />
              {entries.length}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">
              CTN Count
            </div>
            <div className="text-xl font-bold text-blue-600">
              {stats.totalCTN}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">
              Freight (INR)
            </div>
            <div className="text-xl font-bold text-blue-600">
              ₹{formatCurrency(stats.totalFreightINR)}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">
              Local Charges
            </div>
            <div className="text-xl font-bold text-emerald-600">
              ₹{formatCurrency(stats.totalLocalCharges)}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 shadow-sm">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              Grand Total
            </div>
            <div className="text-xl font-bold text-indigo-700">
              ₹{formatCurrency(stats.grandTotal)}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Freight (USD)
            </div>
            <div className="text-xl font-bold text-slate-900">
              {formatCurrencyUSD(stats.totalFreightUSD)}
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">
                  Pending
                </div>
                <div className="text-xl font-bold text-yellow-700">
                  {stats.pendingCount} containers
                </div>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                  In Transit
                </div>
                <div className="text-xl font-bold text-blue-700">
                  {stats.inTransitCount} containers
                </div>
              </div>
              <Ship className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  Delivered
                </div>
                <div className="text-xl font-bold text-emerald-700">
                  {stats.deliveredCount} containers
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Search container code, loading from, or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300"
            >
              {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAdvanced ? " Hide Charges" : " Show Charges"}
            </button>
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
              Add Container
            </button>
          </div>
        </div>

        {/* Info Bar */}
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="text-slate-700">
                <span className="font-medium">Containers:</span> {entries.length} total
              </div>
              <div className="text-slate-700">
                <span className="font-medium">Filtered:</span> {filteredEntries.length} shown
              </div>
              <div className="text-slate-700">
                <span className="font-medium">Total CTN:</span> {stats.totalCTN}
              </div>
            </div>
            <button
              onClick={saveSheet}
              disabled={isSaving}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded ${
                isSaving
                  ? "bg-indigo-400 text-white cursor-not-allowed"
                  : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
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

        {/* Shipping Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left">Container Details</th>
                  <th className="p-4 text-left">Dates</th>
                  <th className="p-4 text-right">Freight (INR)</th>
                  {showAdvanced && (
                    <>
                      <th className="p-4 text-right">CHA</th>
                      <th className="p-4 text-right">FOB Terms</th>
                      <th className="p-4 text-right">CFS/DO/Yard</th>
                      <th className="p-4 text-right">Scanning</th>
                      <th className="p-4 text-right">SIMS/PIMS</th>
                      <th className="p-4 text-right">Duty</th>
                      <th className="p-4 text-right">Penalty</th>
                      <th className="p-4 text-right">Trucking</th>
                      <th className="p-4 text-right">Unloading</th>
                    </>
                  )}
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={showAdvanced ? 15 : 6} 
                      className="text-center py-20 text-slate-400"
                    >
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      {search
                        ? "No matching container entries found."
                        : "No container entries yet."}
                      <br />
                      <button
                        onClick={addRow}
                        className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        Add your first container entry
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => {
                    const localCharges = (parseFloat(entry.cha) || 0) + 
                                        (parseFloat(entry.fobTerms) || 0) + 
                                        (parseFloat(entry.cfsDoYard) || 0) + 
                                        (parseFloat(entry.scanning) || 0) + 
                                        (parseFloat(entry.simsPims) || 0) + 
                                        (parseFloat(entry.duty) || 0) + 
                                        (parseFloat(entry.penalty) || 0) + 
                                        (parseFloat(entry.trucking) || 0) + 
                                        (parseFloat(entry.loadingUnloading) || 0);
                    
                    const totalAmount = (parseFloat(entry.freightINR) || 0) + localCharges;
                    const isOverdue = entry.deliveryDate && new Date(entry.deliveryDate) < new Date();
                    
                    return (
                      <tr 
                        key={entry.id} 
                        className="group hover:bg-slate-50 transition-colors"
                      >
                        {/* Container Details */}
                        <td className="p-4">
                          <div className="space-y-2">
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-bold text-slate-900"
                              placeholder="Container Code"
                              value={entry.containerCode}
                              onChange={(e) => updateRow(entry.id, "containerCode", e.target.value)}
                            />
                            <div className="flex items-center gap-2">
                              <select
                                className="w-full px-3 py-2 border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none text-sm text-slate-600"
                                value={entry.loadingFrom}
                                onChange={(e) => updateRow(entry.id, "loadingFrom", e.target.value)}
                              >
                                <option value="YIWU / GUANGZHOU / FULL">YIWU / GUANGZHOU / FULL</option>
                                <option value="NINGBO / SHANGHAI / FULL">NINGBO / SHANGHAI / FULL</option>
                                <option value="SHENZHEN / HONG KONG / FULL">SHENZHEN / HONG KONG / FULL</option>
                                <option value="QINGDAO / TIANJIN / FULL">QINGDAO / TIANJIN / FULL</option>
                              </select>
                              <input
                                type="number"
                                className="w-24 px-3 py-2 border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none text-sm text-slate-600"
                                placeholder="CTN"
                                value={entry.ctn || ""}
                                onChange={(e) => updateRow(entry.id, "ctn", e.target.value)}
                              />
                            </div>
                          </div>
                        </td>
                        
                        {/* Dates */}
                        <td className="p-4">
                          <div className="space-y-2">
                            <div className="relative">
                              <input
                                type="date"
                                className="w-full px-3 py-2 border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none text-slate-600"
                                value={entry.loadingDate || ""}
                                onChange={(e) => updateRow(entry.id, "loadingDate", e.target.value)}
                              />
                              <Calendar className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                              <input
                                type="date"
                                className={`w-full px-3 py-2 border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none text-slate-600 ${
                                  isOverdue ? 'text-red-600' : ''
                                }`}
                                value={entry.deliveryDate || ""}
                                onChange={(e) => updateRow(entry.id, "deliveryDate", e.target.value)}
                              />
                              <Calendar className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            {isOverdue && (
                              <div className="text-xs text-red-500">
                                Overdue
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* Freight */}
                        <td className="p-4">
                          <div className="space-y-2">
                            <input
                              type="number"
                              step="0.01"
                              className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono text-blue-600"
                              placeholder="0"
                              value={entry.freightUSD || ""}
                              onChange={(e) => updateRow(entry.id, "freightUSD", e.target.value)}
                            />
                            <input
                              type="number"
                              step="0.01"
                              className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono font-bold text-blue-700"
                              placeholder="0"
                              value={entry.freightINR || ""}
                              onChange={(e) => updateRow(entry.id, "freightINR", e.target.value)}
                            />
                          </div>
                        </td>
                        
                        {/* Local Charges (Advanced View) */}
                        {showAdvanced && (
                          <>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.cha || ""}
                                onChange={(e) => updateRow(entry.id, "cha", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.fobTerms || ""}
                                onChange={(e) => updateRow(entry.id, "fobTerms", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.cfsDoYard || ""}
                                onChange={(e) => updateRow(entry.id, "cfsDoYard", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.scanning || ""}
                                onChange={(e) => updateRow(entry.id, "scanning", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.simsPims || ""}
                                onChange={(e) => updateRow(entry.id, "simsPims", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.duty || ""}
                                onChange={(e) => updateRow(entry.id, "duty", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.penalty || ""}
                                onChange={(e) => updateRow(entry.id, "penalty", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.trucking || ""}
                                onChange={(e) => updateRow(entry.id, "trucking", e.target.value)}
                              />
                            </td>
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 text-right border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white bg-transparent outline-none font-mono"
                                placeholder="0"
                                value={entry.loadingUnloading || ""}
                                onChange={(e) => updateRow(entry.id, "loadingUnloading", e.target.value)}
                              />
                            </td>
                          </>
                        )}
                        
                        {/* Total */}
                        <td className="p-4 text-right">
                          <div className="px-3 py-2 bg-indigo-50 text-indigo-700 font-bold font-mono rounded-lg">
                            ₹{formatCurrency(totalAmount)}
                          </div>
                        </td>
                        
                        {/* Status */}
                        <td className="p-4 text-center">
                          <select
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(entry.deliveryStatus || "PENDING")}`}
                            value={entry.deliveryStatus || "PENDING"}
                            onChange={(e) => updateDeliveryStatus(entry.id, e.target.value)}
                          >
                            <option value="PENDING" className="bg-yellow-100 text-yellow-800">Pending</option>
                            <option value="IN_TRANSIT" className="bg-blue-100 text-blue-800">In Transit</option>
                            <option value="ARRIVED" className="bg-green-100 text-green-800">Arrived</option>
                            <option value="DELIVERED" className="bg-emerald-100 text-emerald-800">Delivered</option>
                          </select>
                        </td>
                        
                        {/* Actions */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => deleteRow(entry.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Footer Summary */}
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {filteredEntries.length} of {entries.length} container entries
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-slate-500">Total Freight</div>
                <div className="font-bold text-blue-600">₹{formatCurrency(stats.totalFreightINR)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Local Charges</div>
                <div className="font-bold text-emerald-600">₹{formatCurrency(stats.totalLocalCharges)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Grand Total</div>
                <div className="font-bold text-indigo-700">₹{formatCurrency(stats.grandTotal)}</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Save Button for Mobile */}
      <div className="md:hidden fixed bottom-6 right-6 z-20">
        <button
          onClick={saveSheet}
          disabled={isSaving}
          className={`p-4 rounded-full shadow-lg ${
            isSaving ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
          } text-white`}
        >
          {isSaving ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Save className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}