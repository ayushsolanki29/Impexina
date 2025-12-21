"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {  toast } from "sonner";
import { ChevronLeft, Plus, Save, Lock, Unlock, Eye, ArrowRight } from "lucide-react";
import LoadingTable from "../_components/LoadingTable";
import QuickActionsFooter from "../_components/QuickActionsFooter";
import QuickFillPanel from "../_components/QuickFillPanel";
import api from "@/lib/api";

const EMPTY_ROW = {
  id: null,
  photo: null,
  particular: "",
  shippingMark: "",
  ctnMark: "",
  itemNo: "",
  ctn: 0,
  pcs: 0,
  tpcs: 0,
  unit: "PCS",
  cbm: 0,
  tcbm: 0,
  wt: 0,
  twt: 0,
};

export default function NewLoadingPage() {
  const router = useRouter();
  const firstRef = useRef(null);
  const lastAddedRowRef = useRef(null);

  // Header state
  const [containerCode, setContainerCode] = useState("");
  const [origin, setOrigin] = useState("");
  const [loadingDate, setLoadingDate] = useState(new Date().toISOString().slice(0, 10));
  const [shippingMark, setShippingMark] = useState("");

  // Reference totals state
  const [referenceTotals, setReferenceTotals] = useState({
    totalCTN: 0,
    totalWeight: 0,
    totalCBM: 0,
  });

  // Data state
  const [rows, setRows] = useState([]);
  const [containerSuggestions, setContainerSuggestions] = useState([]);
  const [shippingMarkSuggestions, setShippingMarkSuggestions] = useState([]);
  const [isHeaderComplete, setIsHeaderComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMismatchWarning, setShowMismatchWarning] = useState(false);

  // Calculate totals from rows
  const calculateTotals = useCallback((rowArray = rows) => {
    return rowArray.reduce(
      (totals, row) => ({
        ctn: totals.ctn + Number(row.ctn || 0),
        tpcs: totals.tpcs + Number(row.tpcs || 0),
        tcbm: totals.tcbm + Number(row.tcbm || 0),
        twt: totals.twt + Number(row.twt || 0),
      }),
      { ctn: 0, tpcs: 0, tcbm: 0, twt: 0 }
    );
  }, [rows]);

  const rowTotals = calculateTotals();

  // Check for mismatch warning
  useEffect(() => {
    const mismatchCTN = Math.abs(rowTotals.ctn - referenceTotals.totalCTN) > 0.1;
    const mismatchWeight = Math.abs(rowTotals.twt - referenceTotals.totalWeight) > 0.01;
    const mismatchCBM = Math.abs(rowTotals.tcbm - referenceTotals.totalCBM) > 0.001;
    
    const hasMismatch = mismatchCTN || mismatchWeight || mismatchCBM;
    setShowMismatchWarning(hasMismatch && rows.length > 0);
  }, [rowTotals, referenceTotals, rows.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isHeaderComplete && rows.length > 0) {
          handleSave("save");
        }
      }
      
      // Ctrl+N to add new item
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        addRow();
      }
      
      // Ctrl+D to duplicate last item
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateLastRow();
      }
      
      // Ctrl+Shift+N for save and next
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        if (isHeaderComplete && rows.length > 0) {
          handleSave("next");
        }
      }
      
      // Escape to go back
      if (e.key === 'Escape') {
        router.push("/dashboard/loading");
      }
      
      // Enter in last row to add new row
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && lastAddedRowRef.current) {
        const isLastInput = e.target === lastAddedRowRef.current;
        if (isLastInput && isHeaderComplete) {
          setTimeout(() => addRow(), 100);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHeaderComplete, rows.length]);

  // Focus first field on mount
  useEffect(() => {
    if (firstRef.current) {
      firstRef.current.focus();
    }
  }, []);

  // Fetch suggestions
  useEffect(() => {
    fetchShippingMarkSuggestions();
  }, []);

  const fetchContainerSuggestions = async (search = "") => {
    try {
      const response = await api.get("/loading/suggestions/containers", {
        params: { search }
      });
      if (response.data.success) {
        setContainerSuggestions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching container suggestions:", error);
    }
  };
const handleContainerCodeChange = (value) => {
    setContainerCode(value);
    fetchContainerSuggestions(value);

}
  const fetchShippingMarkSuggestions = async (search = "") => {
    try {
      const response = await api.get("/loading/suggestions/shipping-marks", {
        params: { search }
      });
      if (response.data.success) {
        setShippingMarkSuggestions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching shipping mark suggestions:", error);
    }
  };

  // Calculate row derived values
  const recalcRow = (row) => {
    const c = Number(row.ctn || 0);
    const pcs = Number(row.pcs || 0);
    const cbm = Number(row.cbm || 0);
    const wt = Number(row.wt || 0);

    return {
      ...row,
      tpcs: c * pcs,
      tcbm: Number((c * cbm).toFixed(3)),
      twt: Number((c * wt).toFixed(2)),
    };
  };

  // Update row
  const updateRow = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        let updatedRow = { ...row, [field]: value };

        // Auto-sync Particular to Item No
        if (field === "particular") {
          updatedRow.itemNo = value;
        }

        // Auto-fill shipping mark from header if empty
        if (field === "shippingMark" && !value && shippingMark) {
          updatedRow.shippingMark = shippingMark;
        }

        // Recalculate if numeric field changed
        if (["ctn", "pcs", "cbm", "wt"].includes(field)) {
          updatedRow = recalcRow(updatedRow);
        }

        return updatedRow;
      })
    );
  };

  // Add new row
  const addRow = () => {
    if (!isHeaderComplete) {
      toast.error("Complete container details first");
      return;
    }

    const newRow = {
      ...EMPTY_ROW,
      id: `r-${Date.now()}`,
      shippingMark: shippingMark,
    };

    setRows((prev) => [...prev, newRow]);
    
    // Focus on the new row's first input after a delay
    setTimeout(() => {
      const newRowInputs = document.querySelectorAll(`[data-row-id="${newRow.id}"] input`);
      if (newRowInputs[0]) {
        newRowInputs[0].focus();
      }
    }, 100);
  };

  // Duplicate last row
  const duplicateLastRow = () => {
    if (rows.length === 0) {
      toast.error("No items to duplicate");
      return;
    }

    const lastRow = rows[rows.length - 1];
    duplicateRow(lastRow);
  };

  // Duplicate specific row
  const duplicateRow = (rowToDuplicate) => {
    const duplicatedRow = {
      ...rowToDuplicate,
      id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    setRows((prev) => {
      const index = prev.findIndex((r) => r.id === rowToDuplicate.id);
      const newRows = [...prev];
      newRows.splice(index + 1, 0, duplicatedRow);
      return newRows;
    });
    
    toast.success("Row duplicated");
  };

  // Remove row
  const removeRow = (id) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  // Clear all rows
  const clearAllRows = () => {
    if (rows.length === 0) return;
    if (window.confirm("Clear all items?")) {
      setRows([]);
    }
  };

  // Apply reference totals
  const applyReferenceTotals = (totals) => {
    setReferenceTotals({
      totalCTN: totals.ctn || totals.totalCTN || 0,
      totalWeight: totals.twt || totals.totalWeight || 0,
      totalCBM: totals.tcbm || totals.totalCBM || 0,
    });
  };

  // Auto-fill with calculated totals
  const autoFillWithCalculated = () => {
    applyReferenceTotals(rowTotals);
    setShowMismatchWarning(false);
    toast.success("Auto-filled with calculated totals");
  };

  // Validate header completion
  useEffect(() => {
    const complete =
      containerCode.trim() !== "" &&
      origin.trim() !== "" &&
      shippingMark.trim() !== "" &&
      loadingDate.trim() !== "";

    setIsHeaderComplete(complete);
  }, [containerCode, origin, shippingMark, loadingDate]);

  // Auto-fill reference totals when rows change
  useEffect(() => {
    if (rows.length > 0) {
      // Auto-update reference totals to match calculated
      applyReferenceTotals(rowTotals);
    }
  }, [rows.length]);

  // Upload photo function
  const uploadPhoto = async (file, rowId) => {
    if (!containerCode) {
      toast.error("Enter container code first");
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await api.post(`/loading/upload-photo?containerCode=${containerCode}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        const photoUrl = response.data.data.photo;
        updateRow(rowId, "photo", photoUrl);
        toast.success("Photo uploaded");
        return photoUrl;
      }
      throw new Error("Upload failed");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to upload photo";
      toast.error(errorMessage);
      return null;
    }
  };

  // Handle photo upload for a row
  const handlePhotoUpload = async (rowId, file) => {
    return await uploadPhoto(file, rowId);
  };

  // Save loading sheet
  const handleSave = async (action = "save") => {
    // Validate
    if (!containerCode.trim()) {
      toast.error("Container code is required");
      return;
    }
    if (!origin.trim()) {
      toast.error("Origin is required");
      return;
    }
    if (!shippingMark.trim()) {
      toast.error("Shipping mark is required");
      return;
    }
    if (rows.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    // Quick validation - check if any required fields are empty
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.particular.trim()) {
        toast.error(`Row ${i + 1}: Item description required`);
        return;
      }
      if (!row.ctnMark.trim()) {
        toast.error(`Row ${i + 1}: CTN mark required`);
        return;
      }
      if (row.ctn <= 0) {
        toast.error(`Row ${i + 1}: CTN must be greater than 0`);
        return;
      }
      if (row.pcs <= 0) {
        toast.error(`Row ${i + 1}: PCS must be greater than 0`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        containerCode,
        origin,
        loadingDate,
        shippingMark,
        rows: rows.map(row => ({
          particular: row.particular,
          shippingMark: row.shippingMark || shippingMark,
          ctnMark: row.ctnMark,
          itemNo: row.itemNo || row.particular,
          ctn: Number(row.ctn),
          pcs: Number(row.pcs),
          unit: row.unit || "PCS",
          cbm: Number(row.cbm),
          wt: Number(row.wt),
          photo: row.photo || '',
        })),
      };

      const response = await api.post("/loading", payload);

      if (response.data.success) {
        const successMsg = action === "view" 
          ? "Saved! Redirecting..."
          : action === "next"
          ? "Saved! Ready for next..."
          : "Saved successfully";

        toast.success(successMsg);

        if (action === "view") {
          setTimeout(() => router.push(`/dashboard/loading/${containerCode}`), 800);
        } else if (action === "next") {
          // Clear for next client, keep container
          setShippingMark("");
          setRows([]);
          setTimeout(() => {
            const particularInput = document.querySelector('input[placeholder*="Item description"]');
            if (particularInput) particularInput.focus();
          }, 100);
        } else {
          setTimeout(() => router.push("/dashboard/loading"), 800);
        }
      } else {
        toast.error(response.data.message || "Failed to save");
      }
    } catch (error) {
      console.error("Save error:", error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to save. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load container data
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerCode.length >= 3) {
        loadContainerData();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [containerCode]);

  const loadContainerData = async () => {
    if (!containerCode || containerCode.length < 3) return;
    
    try {
      const response = await api.get(`/loading/container/${containerCode}`);
      
      if (response.data.success && response.data.data.origin) {
        setOrigin(response.data.data.origin);
        toast.success(`Auto-filled origin: ${response.data.data.origin}`);
      }
    } catch (error) {
      // Container not found - it's okay
    }
  };

  // Get mismatch warning message
  const getMismatchWarning = () => {
    const messages = [];
    
    if (Math.abs(rowTotals.ctn - referenceTotals.totalCTN) > 0.1) {
      messages.push(`CTN: Calculated ${rowTotals.ctn} vs Reference ${referenceTotals.totalCTN}`);
    }
    
    if (Math.abs(rowTotals.twt - referenceTotals.totalWeight) > 0.01) {
      messages.push(`Weight: Calculated ${rowTotals.twt.toFixed(2)} vs Reference ${referenceTotals.totalWeight}`);
    }
    
    if (Math.abs(rowTotals.tcbm - referenceTotals.totalCBM) > 0.001) {
      messages.push(`CBM: Calculated ${rowTotals.tcbm.toFixed(3)} vs Reference ${referenceTotals.totalCBM}`);
    }
    
    return messages.join(" • ");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-20"> {/* Extra padding for footer */}
   
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard/loading")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                title="Go back (Esc)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back (Esc)</span>
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  New Loading Sheet
                </h1>
                <p className="text-sm text-gray-500">
                  Add shipment items quickly with shortcuts
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={clearAllRows}
                disabled={rows.length === 0 || isSubmitting}
                className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                title="Clear all items"
              >
                Clear All
              </button>
              <button
                onClick={autoFillWithCalculated}
                disabled={rows.length === 0}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                title="Auto-fill with calculated totals"
              >
                Auto-Fill
              </button>
            </div>
          </div>
        </div>

        {/* Container Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-4 md:p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Container & Client Details
              </h2>
              
              <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${isHeaderComplete ? "bg-green-50 text-green-700 border border-green-200" : "bg-yellow-50 text-yellow-700 border border-yellow-200"}`}>
                {isHeaderComplete ? (
                  <span className="flex items-center gap-1.5">
                    <Unlock className="w-4 h-4" />
                    Ready (Press Tab to navigate)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    Complete Details First
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Container Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Container Number *
                </label>
                <div className="relative">
                  <input
                    ref={firstRef}
                    value={containerCode}
                    onChange={(e) => handleContainerCodeChange(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="CTN-12345"
                    list="containerSuggestions"
                    autoFocus
                  />
                  {containerSuggestions.length > 0 && (
                    <datalist id="containerSuggestions">
                      {containerSuggestions.map((container, index) => (
                        <option key={index} value={container.containerCode}>
                          {container.origin} - {container.containerCode}
                        </option>
                      ))}
                    </datalist>
                  )}
                </div>
              </div>

              {/* Origin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Origin Port *
                </label>
                <input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="YIWU, Shanghai, etc."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && containerCode && shippingMark) {
                      addRow();
                    }
                  }}
                />
              </div>

              {/* Shipping Mark */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Shipping Mark *
                </label>
                <div className="relative">
                  <input
                    value={shippingMark}
                    onChange={(e) => setShippingMark(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="BB-AMD, SMWINK, etc."
                    list="shippingMarkSuggestions"
                  />
                  <datalist id="shippingMarkSuggestions">
                    {shippingMarkSuggestions.map((mark, index) => (
                      <option key={index} value={mark.name}>
                        {mark.source ? `${mark.name} (${mark.source})` : mark.name}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Loading Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Loading Date *
                </label>
                <input
                  type="date"
                  value={loadingDate}
                  onChange={(e) => setLoadingDate(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Quick Fill Panel */}
          {isHeaderComplete && rows.length > 0 && (
            <QuickFillPanel
              calculatedTotals={rowTotals}
              onApplyTotals={applyReferenceTotals}
              showWarning={showMismatchWarning}
              warningMessage={getMismatchWarning()}
            />
          )}

          {/* Items Section */}
          {isHeaderComplete ? (
            <>
              <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Shipment Items
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {rows.length} item{rows.length !== 1 ? 's' : ''} • Press Enter in last field to add new
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={duplicateLastRow}
                      disabled={rows.length === 0}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors"
                      title="Duplicate Last Item (Ctrl+D)"
                    >
                      Duplicate Last
                    </button>
                    <button
                      onClick={addRow}
                      disabled={!isHeaderComplete}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      title="Add New Item (Ctrl+N)"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                  </div>
                </div>

                {rows.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                    <div className="text-gray-400 mb-4">
                      No items added yet
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={addRow}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add First Item
                      </button>
                      <p className="text-xs text-gray-500">
                        Or press Ctrl+N
                      </p>
                    </div>
                  </div>
                ) : (
                  <LoadingTable
                    rows={rows}
                    onUpdateRow={updateRow}
                    onDuplicateRow={duplicateRow}
                    onRemoveRow={removeRow}
                    onPhotoUpload={handlePhotoUpload}
                    shippingMarkSuggestions={shippingMarkSuggestions}
                    setLastRowRef={(ref) => (lastAddedRowRef.current = ref)}
                  />
                )}
              </div>

              {/* Action Buttons */}
              {rows.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      <div className="font-medium text-gray-800">
                        Container: {containerCode} • Client: {shippingMark}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Press Ctrl+S to save • Ctrl+Shift+N for Save & Next
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleSave("save")}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        title="Save (Ctrl+S)"
                      >
                        <Save className="w-4 h-4" />
                        Save Only
                      </button>
                      
                      <button
                        onClick={() => handleSave("next")}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        title="Save & Next Client (Ctrl+Shift+N)"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Save & Next
                      </button>
                      
                      <button
                        onClick={() => handleSave("view")}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        title="Save & View Container"
                      >
                        <Eye className="w-4 h-4" />
                        Save & View
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 md:p-12 text-center">
              <div className="inline-flex flex-col items-center gap-4 p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 max-w-md">
                <Lock className="w-12 h-12 text-gray-400" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Complete Container Details
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Fill in all required fields above to start.
                  </p>
                  <p className="text-xs text-gray-500">
                    Press Tab to navigate between fields
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Footer */}
      {/* <QuickActionsFooter
        onSave={() => handleSave("save")}
        onAddItem={addRow}
        onDuplicateLast={duplicateLastRow}
        onClearAll={clearAllRows}
        onSaveAndNext={() => handleSave("next")}
        disabled={!isHeaderComplete || rows.length === 0}
        isSubmitting={isSubmitting}
      /> */}
    </div>
  );
}