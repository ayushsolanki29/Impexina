"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import {
  ChevronLeft,
  Plus,
  ImageIcon,
  Save,
  Trash2,
  Zap,
  Copy,
  Lock,
  Unlock,
} from "lucide-react";

/**
 * Enhanced Loading Page with:
 * 1. Summary Sheet Reference (Top Reference Block)
 * 2. Header Validation Gate - Items hidden until header complete
 * 3. Optimized Keyboard Shortcuts
 * 4. Renamed Fields: Mark → Shipping Mark, Added CTN Mark
 * 5. Particular & Item No Sync
 */

const EMPTY_ROW = {
  id: null,
  photo: null,
  particular: "",
  shippingMark: "",
  ctnMark: "",
  _shippingMarkQuery: "",
  _shippingMarkOpen: false,
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

// Keyboard shortcuts handler
function useLoadingShortcuts({ enabled, handlers }) {
  useEffect(() => {
    if (!enabled) return;

    function normalize(e) {
      const parts = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.metaKey) parts.push("Meta");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");
      let k = e.key;
      if (k === " ") k = "Space";
      if (k === "Esc") k = "Escape";
      if (k.startsWith("Arrow")) k = k.replace("Arrow", "");
      if (k.length === 1) k = k.toUpperCase();
      parts.push(k);
      return parts.join("+");
    }

    function onKeyDown(e) {
      const combo = normalize(e);
      
      // Only handle our specific shortcuts
      if (handlers && handlers[combo]) {
        e.preventDefault();
        e.stopPropagation();
        handlers[combo](e);
        return;
      }
      
      // Block browser shortcuts we don't want
      const browserShortcuts = [
        "Ctrl+R", "Meta+R", "Ctrl+Shift+R", "F5",
        "Ctrl+W", "Meta+W", "Ctrl+T", "Meta+T",
        "Ctrl+Shift+N", "Ctrl+P", "Meta+P"
      ];
      
      if (browserShortcuts.includes(combo)) {
        e.preventDefault();
        e.stopPropagation();
        toast("Use app shortcuts instead");
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, [enabled, handlers]);
}

export default function NewLoadingPage() {
  const router = useRouter();
  const firstRef = useRef(null);
  const rowRefs = useRef({});

  // Header fields with validation
  const [containerCode, setContainerCode] = useState("PSDH-86");
  const [origin, setOrigin] = useState("YIWU");
  const [loadingDate, setLoadingDate] = useState(new Date().toISOString().slice(0, 10));
  const [totalCTN, setTotalCTN] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalCBM, setTotalCBM] = useState(0);

  // Validation state
  const [isHeaderComplete, setIsHeaderComplete] = useState(false);
  
  // Rows and clients data
  const [rows, setRows] = useState([]);
  const [shippingMarks, setShippingMarks] = useState(["BB-AMD", "RAJ", "SMWINK", "KD"]);
  
  // Shortcuts toggle
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);

  // Calculate derived totals for a row
  function recalcRowDerived(r) {
    const c = Number(r.ctn || 0);
    const pcs = Number(r.pcs || 0);
    const cbm = Number(r.cbm || 0);
    const wt = Number(r.wt || 0);
    return {
      ...r,
      tpcs: Number(c * pcs),
      tcbm: Number((c * cbm).toFixed(3)),
      twt: Number((c * wt).toFixed(2)),
    };
  }

  // Update row with sync between Particular and Item No
  function updateRow(id, field, value) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        
        const updated = { ...r, [field]: value };
        
        // Sync Particular and Item No
        if (field === "particular") {
          updated.itemNo = value; // Auto-sync to Item No
        }
        
        // Recalculate derived fields
        if (["ctn", "pcs", "cbm", "wt"].includes(field)) {
          return recalcRowDerived(updated);
        }
        
        return updated;
      })
    );
  }

  // Add new row
  function addRow(autoFocus = false) {
    if (!isHeaderComplete) {
      toast.error("Complete header fields first");
      return;
    }
    
    const newRow = { 
      ...EMPTY_ROW, 
      id: `r-${Date.now()}`, 
      _shippingMarkOpen: true 
    };
    setRows((p) => [...p, newRow]);
    toast.success("New item added");
    
    if (autoFocus) {
      setTimeout(() => {
        rowRefs.current[`${newRow.id}_particular`]?.focus();
      }, 60);
    }
  }

  // Duplicate row
  function duplicateRow(r) {
    const dup = { ...r, id: `r-${Date.now()}` };
    setRows((prev) => {
      const idx = prev.findIndex((x) => x.id === r.id);
      const copy = [...prev];
      copy.splice(idx + 1, 0, dup);
      return copy;
    });
    toast.success("Row duplicated");
  }

  // Remove row
  function removeRow(id) {
    setRows((p) => p.filter((r) => r.id !== id));
    toast.success("Row removed");
  }

  // Ensure shipping mark exists
  function ensureShippingMark(name) {
    if (!name) return;
    if (!shippingMarks.includes(name)) {
      setShippingMarks((prev) => [name, ...prev]);
    }
  }

  // File handling
  function handleFileInput(file, rowId) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateRow(rowId, "photo", ev.target.result);
    reader.readAsDataURL(file);
  }
  
  function onDropFile(e, rowId) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileInput(f, rowId);
  }
  
  function onChooseFile(e, rowId) {
    const f = e.target.files?.[0];
    if (f) handleFileInput(f, rowId);
  }

  // Calculate totals from rows
  function computeTotals(list = rows) {
    return list.reduce(
      (acc, r) => {
        acc.ctn += Number(r.ctn || 0);
        acc.tpcs += Number(r.tpcs || 0);
        acc.tcbm += Number(r.tcbm || 0);
        acc.twt += Number(r.twt || 0);
        return acc;
      },
      { ctn: 0, tpcs: 0, tcbm: 0, twt: 0 }
    );
  }
  
  const rowTotals = computeTotals();

  // Check if header is complete
  useEffect(() => {
    const complete = containerCode.trim() !== "" && 
                    origin.trim() !== "" && 
                    loadingDate.trim() !== "" &&
                    totalCTN > 0 &&
                    totalWeight > 0 &&
                    totalCBM > 0;
    
    setIsHeaderComplete(complete);
    
    // Auto-calculate if user hasn't entered reference values
    if (!complete && rows.length > 0) {
      const totals = computeTotals(rows);
      if (totalCTN === 0) setTotalCTN(totals.ctn);
      if (totalWeight === 0) setTotalWeight(Number(totals.twt.toFixed(2)));
      if (totalCBM === 0) setTotalCBM(Number(totals.tcbm.toFixed(3)));
    }
  }, [containerCode, origin, loadingDate, totalCTN, totalWeight, totalCBM, rows]);

  // Keyboard shortcuts
  const handlers = {
    "Ctrl+N": () => addRow(true),
    "Meta+N": () => addRow(true),
    "Ctrl+ArrowDown": () => addRow(true),
    "Ctrl+S": (e) => {
      e.preventDefault();
      handleSave();
    },
    "Meta+S": (e) => {
      e.preventDefault();
      handleSave();
    },
  };
  
  useLoadingShortcuts({
    enabled: shortcutsEnabled && isHeaderComplete,
    handlers,
  });

  // Enter to navigate between fields
  function onEnterFocusNext(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    
    if (!isHeaderComplete) return;
    
    const inputs = Array.from(
      document.querySelectorAll(
        "input[data-row-input], select[data-row-input], textarea[data-row-input]"
      )
    ).filter((el) => !el.disabled && el.tabIndex !== -1);
    
    const idx = inputs.indexOf(e.target);
    if (idx > -1 && idx < inputs.length - 1) {
      inputs[idx + 1].focus();
      return;
    }
    
    // Last field - add new row
    addRow(true);
  }

  // Focus first input on mount
  useEffect(() => {
    setTimeout(() => firstRef.current?.focus(), 80);
  }, []);

  // Shipping mark dropdown
  function openShippingMarkForRow(id) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, _shippingMarkOpen: true } : { ...r, _shippingMarkOpen: false }
      )
    );
    setTimeout(() => rowRefs.current[`${id}_shippingMark`]?.focus(), 40);
  }
  
  function closeShippingMarkDropdowns() {
    setRows((prev) =>
      prev.map((r) =>
        r._shippingMarkOpen ? { ...r, _shippingMarkOpen: false, _shippingMarkQuery: "" } : r
      )
    );
  }

  // Local storage persistence
  function savePayloadToLocal(payload) {
    const existing = JSON.parse(localStorage.getItem("igpl_loading") || "[]");
    localStorage.setItem(
      "igpl_loading",
      JSON.stringify([payload, ...existing])
    );
  }

  // Save function
  function handleSave() {
    if (!isHeaderComplete) {
      toast.error("Complete all header fields first");
      return;
    }
    
    if (rows.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    // Ensure shipping marks exist
    rows.forEach((r) => ensureShippingMark(r.shippingMark));

    const payload = {
      id: `sheet-${Date.now()}`,
      containerCode,
      origin,
      loadingDate,
      referenceTotals: {
        totalCTN,
        totalWeight,
        totalCBM
      },
      status: "draft",
      totals: rowTotals,
      rows,
      createdAt: new Date().toISOString(),
    };

    savePayloadToLocal(payload);
    toast.success("Loading sheet saved");
    setTimeout(() => router.push("/dashboard/loading"), 350);
  }

  // Save and new function
  function handleSaveAndNew() {
    if (!isHeaderComplete) {
      toast.error("Complete all header fields first");
      return;
    }
    
    if (rows.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    rows.forEach((r) => ensureShippingMark(r.shippingMark));

    const payload = {
      id: `sheet-${Date.now()}`,
      containerCode,
      origin,
      loadingDate,
      referenceTotals: {
        totalCTN,
        totalWeight,
        totalCBM
      },
      status: "draft",
      totals: rowTotals,
      rows,
      createdAt: new Date().toISOString(),
    };
    
    savePayloadToLocal(payload);
    toast.success("Saved — starting new sheet");

    // Clear rows but keep header
    setRows([]);
    setTimeout(() => {
      if (firstRef.current) firstRef.current.focus();
    }, 80);
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/loading")}
              className="text-sm text-slate-600 inline-flex items-center gap-2 hover:bg-slate-100 px-3 py-1 rounded"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                New Loading Sheet
              </h2>
              <div className="text-sm text-slate-500">
                Fast entry with validation gate
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs px-3 py-1.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
              <input
                type="checkbox"
                checked={shortcutsEnabled}
                onChange={(e) => setShortcutsEnabled(e.target.checked)}
                className="rounded"
              />
              Shortcuts
            </label>

            <div className="text-xs text-slate-700 flex items-center gap-4 px-4 py-2 border rounded bg-white">
              <div className="flex items-center gap-1">
                <Plus className="w-4 h-4 text-sky-500" /> <span>Ctrl+N</span>
              </div>
              <div className="flex items-center gap-1">
                <Save className="w-4 h-4 text-sky-600" /> <span>Ctrl+S</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-amber-500" /> <span>Ctrl+↓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Sheet Reference Block */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Summary Sheet Reference
            </h3>
            <div className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
              Side-by Container Reference
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-blue-700 font-medium">Date</label>
              <input
                type="date"
                value={loadingDate}
                onChange={(e) => setLoadingDate(e.target.value)}
                className="w-full border border-blue-200 px-3 py-2 rounded mt-1 bg-white focus:ring-2 focus:ring-blue-200"
              />
            </div>
            
            <div>
              <label className="text-xs text-blue-700 font-medium">Total CTN</label>
              <input
                type="number"
                value={totalCTN}
                onChange={(e) => setTotalCTN(Number(e.target.value) || 0)}
                className="w-full border border-blue-200 px-3 py-2 rounded mt-1 bg-white focus:ring-2 focus:ring-blue-200 text-right"
                placeholder="Enter total cartons"
              />
            </div>
            
            <div>
              <label className="text-xs text-blue-700 font-medium">Total Weight (KG)</label>
              <input
                type="number"
                step="0.01"
                value={totalWeight}
                onChange={(e) => setTotalWeight(Number(e.target.value) || 0)}
                className="w-full border border-blue-200 px-3 py-2 rounded mt-1 bg-white focus:ring-2 focus:ring-blue-200 text-right"
                placeholder="Enter total weight"
              />
            </div>
            
            <div>
              <label className="text-xs text-blue-700 font-medium">Total CBM</label>
              <input
                type="number"
                step="0.001"
                value={totalCBM}
                onChange={(e) => setTotalCBM(Number(e.target.value) || 0)}
                className="w-full border border-blue-200 px-3 py-2 rounded mt-1 bg-white focus:ring-2 focus:ring-blue-200 text-right"
                placeholder="Enter total CBM"
              />
            </div>
          </div>
        </div>

        {/* Main Container */}
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          {/* Header Validation Gate */}
          <div className="px-6 py-5 border-b bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Container Information
              </h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${isHeaderComplete ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {isHeaderComplete ? (
                  <span className="flex items-center gap-1">
                    <Unlock className="w-4 h-4" /> Ready for item entry
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Lock className="w-4 h-4" /> Complete header to continue
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm text-slate-700 font-medium">Container Code *</label>
                <input
                  ref={firstRef}
                  value={containerCode}
                  onChange={(e) => setContainerCode(e.target.value)}
                  className="w-full border border-slate-300 px-4 py-3 rounded mt-1 focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                  placeholder="e.g., PSDH-86"
                />
              </div>
              
              <div>
                <label className="text-sm text-slate-700 font-medium">Origin *</label>
                <input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full border border-slate-300 px-4 py-3 rounded mt-1 focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                  placeholder="e.g., YIWU"
                />
              </div>
              
              <div>
                <label className="text-sm text-slate-700 font-medium">Loading Date *</label>
                <input
                  type="date"
                  value={loadingDate}
                  onChange={(e) => setLoadingDate(e.target.value)}
                  className="w-full border border-slate-300 px-4 py-3 rounded mt-1 focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                />
              </div>
            </div>
            
            {!isHeaderComplete && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                <strong>Validation Required:</strong> Please fill all header fields (Container Code, Origin, Date, and reference totals) to unlock item entry.
              </div>
            )}
          </div>

          {/* Items Section (Hidden until header complete) */}
          {isHeaderComplete ? (
            <>
              {/* Items Table */}
              <div className="px-4 py-4 overflow-x-auto" onClick={closeShippingMarkDropdowns}>
                {rows.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-slate-400 mb-3">No items added yet</div>
                    <button
                      onClick={() => addRow(true)}
                      className="inline-flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded hover:bg-sky-700"
                    >
                      <Plus className="w-4 h-4" /> Add First Item
                    </button>
                  </div>
                ) : (
                  <>
                    <table className="min-w-full">
                      <thead className="text-xs text-slate-600 bg-slate-50">
                        <tr>
                          <th className="px-3 py-3 font-medium">Photo</th>
                          <th className="px-3 py-3 font-medium">Particular</th>
                          <th className="px-3 py-3 font-medium">Shipping Mark</th>
                          <th className="px-3 py-3 font-medium">CTN Mark</th>
                          <th className="px-3 py-3 font-medium">Item No</th>
                          <th className="px-3 py-3 font-medium">CTN</th>
                          <th className="px-3 py-3 font-medium">PCS</th>
                          <th className="px-3 py-3 font-medium">T.PCS</th>
                          <th className="px-3 py-3 font-medium">CBM</th>
                          <th className="px-3 py-3 font-medium">T.CBM</th>
                          <th className="px-3 py-3 font-medium">WT (KG)</th>
                          <th className="px-3 py-3 font-medium">T.WT (KG)</th>
                          <th className="px-3 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.id} className="border-t hover:bg-slate-50/50">
                            {/* Photo */}
                            <td className="px-3 py-3 align-top">
                              <div
                                onDrop={(e) => onDropFile(e, r.id)}
                                onDragOver={(e) => e.preventDefault()}
                                className="w-24 h-20 border border-dashed border-slate-300 rounded flex items-center justify-center bg-white cursor-pointer hover:bg-slate-50"
                              >
                                {r.photo ? (
                                  <div className="relative w-full h-full">
                                    <img
                                      src={r.photo}
                                      alt="preview"
                                      className="w-full h-full object-cover rounded"
                                    />
                                    <button
                                      onClick={() => updateRow(r.id, "photo", null)}
                                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center cursor-pointer text-slate-500 text-xs">
                                    <ImageIcon className="w-6 h-6 mb-1" />
                                    <span>Upload</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => onChooseFile(e, r.id)}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>
                            </td>

                            {/* Particular */}
                            <td className="px-3 py-3 align-top">
                              <input
                                data-row-input
                                ref={(el) => (rowRefs.current[`${r.id}_particular`] = el)}
                                value={r.particular}
                                onChange={(e) => updateRow(r.id, "particular", e.target.value)}
                                onKeyDown={onEnterFocusNext}
                                className="w-48 border border-slate-300 px-3 py-2 rounded text-sm focus:ring-1 focus:ring-sky-300"
                                placeholder="Particular"
                              />
                              <div className="text-xs text-slate-500 mt-1">Auto-syncs to Item No</div>
                            </td>

                            {/* Shipping Mark */}
                            <td className="px-3 py-3 align-top">
                              <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <input
                                  data-row-input
                                  ref={(el) => (rowRefs.current[`${r.id}_shippingMark`] = el)}
                                  value={r.shippingMark}
                                  onFocus={() => openShippingMarkForRow(r.id)}
                                  onChange={(e) => {
                                    updateRow(r.id, "shippingMark", e.target.value);
                                    setRows((prev) =>
                                      prev.map((rr) =>
                                        rr.id === r.id
                                          ? {
                                              ...rr,
                                              _shippingMarkQuery: e.target.value,
                                              _shippingMarkOpen: true,
                                            }
                                          : rr
                                      )
                                    );
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      const v = e.target.value.trim();
                                      if (v) ensureShippingMark(v);
                                      setRows((prev) =>
                                        prev.map((rr) =>
                                          rr.id === r.id
                                            ? { ...rr, _shippingMarkOpen: false, _shippingMarkQuery: "" }
                                            : rr
                                        )
                                      );
                                      onEnterFocusNext(e);
                                    } else onEnterFocusNext(e);
                                  }}
                                  placeholder="Shipping Mark"
                                  className="w-40 border border-slate-300 px-3 py-2 rounded text-sm focus:ring-1 focus:ring-sky-300"
                                />
                                {r._shippingMarkOpen && (
                                  <ul className="absolute left-0 mt-1 w-40 bg-white border border-slate-300 rounded shadow-lg max-h-48 overflow-auto text-sm z-30">
                                    {shippingMarks
                                      .filter((c) =>
                                        c.toLowerCase().includes((r._shippingMarkQuery || "").toLowerCase())
                                      )
                                      .map((c) => (
                                        <li
                                          key={c}
                                          className="px-3 py-2 hover:bg-sky-50 cursor-pointer border-b last:border-b-0"
                                          onMouseDown={(ev) => {
                                            ev.preventDefault();
                                            updateRow(r.id, "shippingMark", c);
                                            setRows((prev) =>
                                              prev.map((rr) =>
                                                rr.id === r.id
                                                  ? { ...rr, _shippingMarkOpen: false, _shippingMarkQuery: "" }
                                                  : rr
                                              )
                                            );
                                          }}
                                        >
                                          {c}
                                        </li>
                                      ))}
                                    {r._shippingMarkQuery && !shippingMarks.some(c => 
                                      c.toLowerCase() === r._shippingMarkQuery.toLowerCase()
                                    ) && (
                                      <li className="px-3 py-2 text-sky-600 bg-sky-50 border-t">
                                        Press Enter to add "{r._shippingMarkQuery}"
                                      </li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            </td>

                            {/* CTN Mark */}
                            <td className="px-3 py-3 align-top">
                              <input
                                data-row-input
                                value={r.ctnMark}
                                onChange={(e) => updateRow(r.id, "ctnMark", e.target.value)}
                                onKeyDown={onEnterFocusNext}
                                className="w-36 border border-slate-300 px-3 py-2 rounded text-sm focus:ring-1 focus:ring-sky-300"
                                placeholder="CTN Mark"
                              />
                            </td>

                            {/* Item No (auto-synced from Particular) */}
                            <td className="px-3 py-3 align-top">
                              <input
                                data-row-input
                                value={r.itemNo}
                                onChange={(e) => updateRow(r.id, "itemNo", e.target.value)}
                                onKeyDown={onEnterFocusNext}
                                className="w-36 border border-slate-300 px-3 py-2 rounded text-sm bg-slate-50 focus:ring-1 focus:ring-sky-300"
                                placeholder="Auto-filled from Particular"
                                readOnly
                              />
                            </td>

                            {/* CTN */}
                            <td className="px-3 py-3 align-top">
                              <input
                                data-row-input
                                value={r.ctn}
                                type="number"
                                min="0"
                                onChange={(e) =>
                                  updateRow(r.id, "ctn", Number(e.target.value || 0))
                                }
                                onKeyDown={onEnterFocusNext}
                                className="w-20 border border-slate-300 px-3 py-2 rounded text-sm text-right focus:ring-1 focus:ring-sky-300"
                              />
                            </td>

                            {/* PCS */}
                            <td className="px-3 py-3 align-top">
                              <input
                                data-row-input
                                value={r.pcs}
                                type="number"
                                min="0"
                                onChange={(e) =>
                                  updateRow(r.id, "pcs", Number(e.target.value || 0))
                                }
                                onKeyDown={onEnterFocusNext}
                                className="w-20 border border-slate-300 px-3 py-2 rounded text-sm text-right focus:ring-1 focus:ring-sky-300"
                              />
                            </td>

                            {/* T.PCS */}
                            <td className="px-3 py-3 align-top">
                              <div className="w-24 text-right text-sm font-semibold text-slate-800 bg-blue-50 px-3 py-2 rounded">
                                {Number(r.tpcs || 0).toLocaleString()}
                              </div>
                            </td>

                            {/* CBM */}
                            <td className="px-3 py-3 align-top">
                              <input
                                data-row-input
                                value={r.cbm}
                                type="number"
                                step="0.001"
                                min="0"
                                onChange={(e) =>
                                  updateRow(r.id, "cbm", Number(e.target.value || 0))
                                }
                                onKeyDown={onEnterFocusNext}
                                className="w-24 border border-slate-300 px-3 py-2 rounded text-sm text-right focus:ring-1 focus:ring-sky-300"
                              />
                            </td>

                            {/* T.CBM */}
                            <td className="px-3 py-3 align-top">
                              <div className="w-24 text-right text-sm font-semibold text-slate-800 bg-blue-50 px-3 py-2 rounded">
                                {Number(r.tcbm || 0).toFixed(3)}
                              </div>
                            </td>

                            {/* WT */}
                            <td className="px-3 py-3 align-top">
                              <input
                                data-row-input
                                value={r.wt}
                                type="number"
                                step="0.01"
                                min="0"
                                onChange={(e) =>
                                  updateRow(r.id, "wt", Number(e.target.value || 0))
                                }
                                onKeyDown={onEnterFocusNext}
                                className="w-24 border border-slate-300 px-3 py-2 rounded text-sm text-right focus:ring-1 focus:ring-sky-300"
                              />
                            </td>

                            {/* T.WT */}
                            <td className="px-3 py-3 align-top">
                              <div className="w-24 text-right text-sm font-semibold text-slate-800 bg-blue-50 px-3 py-2 rounded">
                                {Number(r.twt || 0).toFixed(2)}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-3 align-top">
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => duplicateRow(r)}
                                  className="text-xs px-3 py-2 rounded bg-slate-100 border border-slate-300 text-slate-700 inline-flex items-center gap-2 hover:bg-slate-200"
                                >
                                  <Copy className="w-3 h-3" /> Duplicate
                                </button>
                                <button
                                  onClick={() => removeRow(r.id)}
                                  className="text-xs px-3 py-2 rounded bg-rose-50 border border-rose-200 text-rose-700 inline-flex items-center gap-2 hover:bg-rose-100"
                                >
                                  <Trash2 className="w-3 h-3" /> Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>

                      {/* Totals Footer */}
                      <tfoot className="bg-gradient-to-r from-slate-100 to-slate-200">
                        <tr>
                          <td colSpan={5} className="px-3 py-4">
                            <div className="text-sm font-bold text-slate-800">TOTALS</div>
                          </td>

                          <td className="px-3 py-4 text-right">
                            <div className="text-lg font-bold text-slate-900 bg-white px-4 py-2 rounded">
                              {rowTotals.ctn}
                            </div>
                          </td>

                          <td className="px-3 py-4" />

                          <td className="px-3 py-4 text-right">
                            <div className="text-lg font-bold text-slate-900 bg-white px-4 py-2 rounded">
                              {rowTotals.tpcs.toLocaleString()}
                            </div>
                          </td>

                          <td className="px-3 py-4" />

                          <td className="px-3 py-4 text-right">
                            <div className="text-lg font-bold text-slate-900 bg-white px-4 py-2 rounded">
                              {Number(rowTotals.tcbm).toFixed(3)}
                            </div>
                          </td>

                          <td className="px-3 py-4" />

                          <td className="px-3 py-4 text-right">
                            <div className="text-lg font-bold text-slate-900 bg-white px-4 py-2 rounded">
                              {Number(rowTotals.twt).toFixed(2)}
                            </div>
                          </td>

                          <td className="px-3 py-4" />
                        </tr>
                      </tfoot>
                    </table>
                  </>
                )}
              </div>

              {/* Bottom Toolbar */}
              <div className="px-6 py-4 border-t bg-gradient-to-t from-white/60 to-slate-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-slate-800">Shortcuts:</span> Enter → next • Ctrl+N → add • Ctrl+S → save • Ctrl+↓ → new item
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => addRow(true)}
                      className="inline-flex items-center gap-2 bg-sky-600 text-white px-4 py-2.5 rounded hover:bg-sky-700 shadow-sm"
                      title="Add item (Ctrl+N)"
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </button>

                    <button
                      onClick={handleSaveAndNew}
                      className="inline-flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded hover:bg-slate-900 shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Save & New
                    </button>

                    <button
                      onClick={handleSave}
                      className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded shadow-sm"
                    >
                      <Save className="w-4 h-4" /> Save Loading Sheet
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Locked State */
            <div className="py-16 text-center">
              <div className="inline-flex flex-col items-center gap-4 p-8 border border-slate-300 rounded-lg bg-gradient-to-b from-slate-50 to-white">
                <Lock className="w-12 h-12 text-slate-400" />
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-2">
                    Item Entry Locked
                  </h4>
                  <p className="text-slate-600 max-w-md mb-4">
                    Complete all header fields above to unlock item entry. This ensures 
                    items are always associated with the correct container.
                  </p>
                  <div className="text-sm text-slate-500 bg-slate-100 p-3 rounded">
                    Required: Container Code, Origin, Date, and reference totals
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reference Comparison */}
        {isHeaderComplete && rows.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Reference vs. Actual Comparison
              </h4>
              <div className="text-xs text-amber-700">
                Side-by-side validation
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-3 rounded ${totalCTN === rowTotals.ctn ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                <div className="text-xs font-medium">CTN</div>
                <div className="flex items-center justify-between">
                  <span>Reference: {totalCTN}</span>
                  <span>Actual: {rowTotals.ctn}</span>
                </div>
                {totalCTN !== rowTotals.ctn && (
                  <div className="text-xs mt-1">Difference: {Math.abs(totalCTN - rowTotals.ctn)}</div>
                )}
              </div>
              
              <div className={`p-3 rounded ${Math.abs(totalWeight - rowTotals.twt) < 0.01 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                <div className="text-xs font-medium">Weight (KG)</div>
                <div className="flex items-center justify-between">
                  <span>Reference: {totalWeight}</span>
                  <span>Actual: {Number(rowTotals.twt).toFixed(2)}</span>
                </div>
                {Math.abs(totalWeight - rowTotals.twt) >= 0.01 && (
                  <div className="text-xs mt-1">Difference: {(totalWeight - rowTotals.twt).toFixed(2)}</div>
                )}
              </div>
              
              <div className={`p-3 rounded ${Math.abs(totalCBM - rowTotals.tcbm) < 0.001 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                <div className="text-xs font-medium">CBM</div>
                <div className="flex items-center justify-between">
                  <span>Reference: {totalCBM}</span>
                  <span>Actual: {Number(rowTotals.tcbm).toFixed(3)}</span>
                </div>
                {Math.abs(totalCBM - rowTotals.tcbm) >= 0.001 && (
                  <div className="text-xs mt-1">Difference: {(totalCBM - rowTotals.tcbm).toFixed(3)}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}