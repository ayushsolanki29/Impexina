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
} from "lucide-react";

/**
 * NewLoadingPage — bluish theme
 * - Palette: slate base + sky (blue) accents
 * - Auto-calculates T.PCS, T.CBM, T.WT
 * - Totals card sticky at top-right (blue)
 * - Mark (client) dropdown opens on focus
 * - Photo upload + preview
 * - Keyboard: Enter -> next; Ctrl+N -> Add; Ctrl+S -> Save
 * - Persists to localStorage for Save & Save & New
 */

const EMPTY_ROW = {
  id: null,
  photo: null,
  particular: "",
  mark: "",
  _markQuery: "",
  _markOpen: false,
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

function useBlockBrowserShortcuts({ enabled, handlers = {}, blockAll = true }) {
  useEffect(() => {
    if (!enabled) return;

    function isEditable(el) {
      if (!el) return false;
      const tag = el.tagName;
      return el.isContentEditable || tag === "INPUT" || tag === "TEXTAREA";
    }

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
      if (handlers && handlers[combo]) {
        try {
          e.preventDefault();
        } catch {}
        handlers[combo](e);
        return;
      }

      const editing = isEditable(e.target);
      const commonlyBlocked = new Set([
        "Ctrl+R",
        "Meta+R",
        "Ctrl+Shift+R",
        "F5",
        "Ctrl+W",
        "Meta+W",
        "Ctrl+T",
        "Meta+T",
        "Ctrl+N",
        "Meta+N",
        "Ctrl+Shift+N",
        "Ctrl+F",
        "Ctrl+G",
        "Ctrl+H",
        "Ctrl+Tab",
        "Meta+Tab",
      
      ]);
      if (blockAll && commonlyBlocked.has(combo)) {
        if (editing) {
          const allowedInEdit = new Set([
            "Ctrl+C",
            "Ctrl+V",
            "Ctrl+X",
            "Ctrl+A",
            "Meta+C",
            "Meta+V",
            "Meta+X",
            "Meta+A",
          ]);
          if (allowedInEdit.has(combo)) return;
        }
        try {
          e.preventDefault();
          e.stopImmediatePropagation();
        } catch {}
        toast("App shortcut active");
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [enabled, handlers, blockAll]);
}

export default function NewLoadingPage() {
  const router = useRouter();
  const firstRef = useRef(null);
  const rowRefs = useRef({});

  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);

  // header fields
  const [containerCode, setContainerCode] = useState("PSDH-86");
  const [origin, setOrigin] = useState("YIWU");
  const [loadingDate] = useState(new Date().toISOString().slice(0, 10));

  // rows and clients
  const [rows, setRows] = useState(() => [
    {
      ...EMPTY_ROW,
      id: `r-${Date.now()}`,
      particular: "FOOTREST",
      mark: "BB-AMD",
      itemNo: "FOOTREST",
      ctn: 5,
      pcs: 100,
      cbm: 0.083,
      wt: 7,
      tpcs: 5 * 100,
      tcbm: Number((5 * 0.083).toFixed(3)),
      twt: Number((5 * 7).toFixed(2)),
      _markOpen: true,
    },
  ]);
  const [clients, setClients] = useState(["BB-AMD", "RAJ", "SMWINK", "KD"]);

  // derived totals
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

  function updateRow(id, field, value) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (["ctn", "pcs", "cbm", "wt"].includes(field))
          return recalcRowDerived(updated);
        return updated;
      })
    );
  }

  function addRow(autoFocus = false) {
    const newRow = { ...EMPTY_ROW, id: `r-${Date.now()}`, _markOpen: true };
    setRows((p) => [...p, newRow]);
    toast.success("New item added (draft)");
    if (autoFocus)
      setTimeout(() => rowRefs.current[`${newRow.id}_particular`]?.focus(), 60);
  }

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

  function removeRow(id) {
    setRows((p) => p.filter((r) => r.id !== id));
    toast.success("Row removed");
  }

  function ensureClient(name) {
    if (!name) return;
    if (!clients.includes(name)) setClients((prev) => [name, ...prev]);
  }

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

  // totals
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
  const totals = computeTotals();

  // shortcuts handlers
  const handlers = {
    "Ctrl+N": () => addRow(true),
    "Meta+N": () => addRow(true),
    "Ctrl+S": (e) => {
      e.preventDefault();
      handleSave();
    },
    "Meta+S": (e) => {
      e.preventDefault();
      handleSave();
    },
    "Ctrl+Shift+N": () => addRow(true),
    "Meta+Shift+N": () => addRow(true),
  };
  useBlockBrowserShortcuts({
    enabled: shortcutsEnabled,
    handlers,
    blockAll: true,
  });

  // focus-next behaviour on Enter
  function onEnterFocusNext(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
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
    addRow(true);
  }

  useEffect(() => {
    setTimeout(() => firstRef.current?.focus(), 80);
  }, []);

  // mark dropdown helpers
  function openMarkForRow(id) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, _markOpen: true } : { ...r, _markOpen: false }
      )
    );
    setTimeout(() => rowRefs.current[`${id}_mark`]?.focus(), 40);
  }
  function closeMarkDropdowns() {
    setRows((prev) =>
      prev.map((r) =>
        r._markOpen ? { ...r, _markOpen: false, _markQuery: "" } : r
      )
    );
  }

  // local persistence
  function savePayloadToLocal(payload) {
    const existing = JSON.parse(localStorage.getItem("igpl_loading") || "[]");
    localStorage.setItem(
      "igpl_loading",
      JSON.stringify([payload, ...existing])
    );
  }

  function handleSave() {
    if (!containerCode.trim()) return toast.error("Container code required");
    if (rows.length === 0) return toast.error("Add at least one row");

    rows.forEach((r) => ensureClient(r.mark));

    const payload = {
      id: `sheet-${Date.now()}`,
      containerCode,
      origin,
      loadingDate,
      status: "draft",
      totals,
      rows,
      createdAt: new Date().toISOString(),
    };

    savePayloadToLocal(payload);
    toast.success("Saved");
    setTimeout(() => router.push("/dashboard/loading"), 350);
  }

  function handleSaveAndNew() {
    if (!containerCode.trim()) return toast.error("Container code required");
    if (rows.length === 0) return toast.error("Add at least one row");

    rows.forEach((r) => ensureClient(r.mark));

    const payload = {
      id: `sheet-${Date.now()}`,
      containerCode,
      origin,
      loadingDate,
      status: "draft",
      totals,
      rows,
      createdAt: new Date().toISOString(),
    };
    savePayloadToLocal(payload);
    toast.success("Saved — ready for new");

    setRows([{ ...EMPTY_ROW, id: `r-${Date.now()}`, _markOpen: true }]);
    setTimeout(() => firstRef.current?.focus(), 80);
  }

  // ---------------- UI ----------------
  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/loading")}
              className="text-sm text-slate-600 inline-flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                New Loading — Fast Entry
              </h2>
              <div className="text-sm text-slate-500">
                Only the item fields — optimized for speed
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-sky-50 text-sky-700">
              <input
                type="checkbox"
                checked={shortcutsEnabled}
                onChange={(e) => setShortcutsEnabled(e.target.checked)}
              />
              Shortcuts
            </label>

            <div className="text-xs text-slate-500 flex items-center gap-3 px-3 py-1 border rounded">
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-sky-500" /> <span>Ctrl+N</span>
              </div>
              <div className="text-slate-400">|</div>
              <div className="flex items-center gap-1">
                <Save className="w-4 h-4 text-sky-600" /> <span>Ctrl+S</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 bg-sky-700 hover:bg-sky-800 text-white px-4 py-2 rounded shadow"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border overflow-hidden">
          {/* header + totals */}
          <div className="px-6 py-4 border-b grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-xs text-slate-600">Container Code</label>
              <input
                data-row-input
                ref={firstRef}
                value={containerCode}
                onChange={(e) => setContainerCode(e.target.value)}
                onKeyDown={onEnterFocusNext}
                className="w-full border border-slate-200 px-3 py-2 rounded mt-1 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600">Origin</label>
              <input
                data-row-input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                onKeyDown={onEnterFocusNext}
                className="w-full border border-slate-200 px-3 py-2 rounded mt-1 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="md:col-span-1 flex items-center justify-end">
              <div className="bg-gradient-to-r from-sky-50 to-sky-100 border border-slate-100 px-4 py-3 rounded-md shadow-sm w-full md:w-auto">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-xs text-slate-500">CTN</div>
                    <div className="text-2xl font-semibold text-slate-900">
                      {totals.ctn}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">T.PCS</div>
                    <div className="text-2xl font-semibold text-slate-900">
                      {totals.tpcs}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">T.CBM</div>
                    <div className="text-2xl font-semibold text-slate-900">
                      {Number(totals.tcbm).toFixed(3)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">T.WT (KG)</div>
                    <div className="text-2xl font-semibold text-slate-900">
                      {Number(totals.twt).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-2 text-right">
                  Auto-calculated
                </div>
              </div>
            </div>
          </div>

          {/* decorative strip */}
          <div className="px-6 py-2">
            <div className="w-full bg-slate-100 h-1 rounded overflow-hidden">
              <div
                className="h-1 rounded bg-gradient-to-r from-sky-400 to-sky-300 transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((totals.ctn / Math.max(1, 200)) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* rows table */}
          <div
            className="px-4 py-4 overflow-x-auto"
            onClick={closeMarkDropdowns}
          >
            <table className="min-w-full">
              <thead className="text-xs text-slate-600 bg-slate-50">
                <tr>
                  <th className="px-2 py-2">Photo</th>
                  <th className="px-2 py-2">Particular</th>
                  <th className="px-2 py-2">Mark (Client)</th>
                  <th className="px-2 py-2">Item No</th>
                  <th className="px-2 py-2">CTN</th>
                  <th className="px-2 py-2">PCS</th>
                  <th className="px-2 py-2">T.PCS</th>
                  <th className="px-2 py-2">CBM</th>
                  <th className="px-2 py-2">T.CBM</th>
                  <th className="px-2 py-2">WT</th>
                  <th className="px-2 py-2">T.WT</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    {/* Photo */}
                    <td className="px-2 py-2 align-top">
                      <div
                        onDrop={(e) => onDropFile(e, r.id)}
                        onDragOver={(e) => e.preventDefault()}
                        className="w-20 h-16 border border-dashed rounded flex items-center justify-center bg-white/60"
                      >
                        {r.photo ? (
                          <img
                            src={r.photo}
                            alt="preview"
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <label className="flex flex-col items-center justify-center cursor-pointer text-slate-400 text-xs">
                            <ImageIcon className="w-5 h-5" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => onChooseFile(e, r.id)}
                              className="hidden"
                            />
                            <span className="mt-1">Upload</span>
                          </label>
                        )}
                      </div>
                    </td>

                    {/* Particular */}
                    <td className="px-2 py-2 align-top">
                      <input
                        data-row-input
                        ref={(el) =>
                          (rowRefs.current[`${r.id}_particular`] = el)
                        }
                        value={r.particular}
                        onChange={(e) =>
                          updateRow(r.id, "particular", e.target.value)
                        }
                        onKeyDown={onEnterFocusNext}
                        className="w-52 border border-slate-200 px-2 py-1 rounded text-sm"
                        placeholder="Particular"
                      />
                    </td>

                    {/* Mark */}
                    <td className="px-2 py-2 align-top">
                      <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          data-row-input
                          ref={(el) => (rowRefs.current[`${r.id}_mark`] = el)}
                          value={r.mark}
                          onFocus={() => openMarkForRow(r.id)}
                          onChange={(e) => {
                            updateRow(r.id, "mark", e.target.value);
                            setRows((prev) =>
                              prev.map((rr) =>
                                rr.id === r.id
                                  ? {
                                      ...rr,
                                      _markQuery: e.target.value,
                                      _markOpen: true,
                                    }
                                  : rr
                              )
                            );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const v = e.target.value.trim();
                              if (v) ensureClient(v);
                              setRows((prev) =>
                                prev.map((rr) =>
                                  rr.id === r.id
                                    ? {
                                        ...rr,
                                        _markOpen: false,
                                        _markQuery: "",
                                      }
                                    : rr
                                )
                              );
                              onEnterFocusNext(e);
                            } else onEnterFocusNext(e);
                          }}
                          placeholder="Client name"
                          className="w-36 border border-slate-200 px-2 py-1 rounded text-sm"
                        />
                        {r._markOpen && (
                          <ul className="absolute left-0 mt-1 w-36 bg-white border rounded shadow-sm max-h-36 overflow-auto text-sm z-30">
                            {clients
                              .filter((c) =>
                                c
                                  .toLowerCase()
                                  .includes((r._markQuery || "").toLowerCase())
                              )
                              .map((c) => (
                                <li
                                  key={c}
                                  className="px-2 py-1 hover:bg-sky-50 cursor-pointer"
                                  onMouseDown={(ev) => {
                                    ev.preventDefault();
                                    updateRow(r.id, "mark", c);
                                    setRows((prev) =>
                                      prev.map((rr) =>
                                        rr.id === r.id
                                          ? {
                                              ...rr,
                                              _markOpen: false,
                                              _markQuery: "",
                                            }
                                          : rr
                                      )
                                    );
                                  }}
                                >
                                  {c}
                                </li>
                              ))}
                            <li className="px-2 py-1 text-xs text-slate-500">
                              Press Enter to create new client
                            </li>
                          </ul>
                        )}
                      </div>
                    </td>

                    {/* Item No */}
                    <td className="px-2 py-2 align-top">
                      <input
                        data-row-input
                        value={r.itemNo}
                        onChange={(e) =>
                          updateRow(r.id, "itemNo", e.target.value)
                        }
                        onKeyDown={onEnterFocusNext}
                        className="w-36 border border-slate-200 px-2 py-1 rounded text-sm"
                        placeholder="Item No"
                      />
                    </td>

                    {/* CTN */}
                    <td className="px-2 py-2 align-top">
                      <input
                        data-row-input
                        value={r.ctn}
                        type="number"
                        onChange={(e) =>
                          updateRow(r.id, "ctn", Number(e.target.value || 0))
                        }
                        onKeyDown={onEnterFocusNext}
                        className="w-20 border border-slate-200 px-2 py-1 rounded text-sm text-right"
                      />
                    </td>

                    {/* PCS */}
                    <td className="px-2 py-2 align-top">
                      <input
                        data-row-input
                        value={r.pcs}
                        type="number"
                        onChange={(e) =>
                          updateRow(r.id, "pcs", Number(e.target.value || 0))
                        }
                        onKeyDown={onEnterFocusNext}
                        className="w-20 border border-slate-200 px-2 py-1 rounded text-sm text-right"
                      />
                    </td>

                    {/* T.PCS */}
                    <td className="px-2 py-2 align-top">
                      <div className="w-20 text-right text-sm font-medium text-slate-700">
                        {Number(r.tpcs || 0)}
                      </div>
                    </td>

                    {/* CBM */}
                    <td className="px-2 py-2 align-top">
                      <input
                        data-row-input
                        value={r.cbm}
                        type="number"
                        step="0.001"
                        onChange={(e) =>
                          updateRow(r.id, "cbm", Number(e.target.value || 0))
                        }
                        onKeyDown={onEnterFocusNext}
                        className="w-24 border border-slate-200 px-2 py-1 rounded text-sm text-right"
                      />
                    </td>

                    {/* T.CBM */}
                    <td className="px-2 py-2 align-top">
                      <div className="w-24 text-right text-sm font-medium text-slate-700">
                        {Number(r.tcbm || 0).toFixed(3)}
                      </div>
                    </td>

                    {/* WT */}
                    <td className="px-2 py-2 align-top">
                      <input
                        data-row-input
                        value={r.wt}
                        type="number"
                        onChange={(e) =>
                          updateRow(r.id, "wt", Number(e.target.value || 0))
                        }
                        onKeyDown={onEnterFocusNext}
                        className="w-20 border border-slate-200 px-2 py-1 rounded text-sm text-right"
                      />
                    </td>

                    {/* T.WT */}
                    <td className="px-2 py-2 align-top">
                      <div className="w-24 text-right text-sm font-medium text-slate-700">
                        {Number(r.twt || 0).toFixed(2)}
                      </div>
                    </td>

                    {/* actions */}
                    <td className="px-2 py-2 align-top">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => duplicateRow(r)}
                          className="text-xs px-2 py-1 rounded bg-slate-50 border text-slate-700 inline-flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Duplicate
                        </button>
                        <button
                          onClick={() => removeRow(r.id)}
                          className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* totals footer with blueish bg */}
              <tfoot>
                <tr>
                  <td colSpan={4} className="px-3 py-3 bg-slate-100">
                    <div className="text-sm font-medium text-slate-700">
                      TOTAL
                    </div>
                  </td>

                  <td className="px-3 py-3 bg-slate-100 text-right">
                    <div className="text-lg font-semibold text-slate-900">
                      {totals.ctn}
                    </div>
                  </td>

                  <td className="px-3 py-3 bg-slate-100" />

                  <td className="px-3 py-3 bg-slate-100 text-right">
                    <div className="text-lg font-semibold text-slate-900">
                      {totals.tpcs}
                    </div>
                  </td>

                  <td className="px-3 py-3 bg-slate-100 text-right">
                    <div className="text-lg font-semibold text-slate-900">
                      {Number(totals.tcbm).toFixed(3)}
                    </div>
                  </td>

                  <td className="px-3 py-3 bg-slate-100" />

                  <td className="px-3 py-3 bg-slate-100 text-right">
                    <div className="text-lg font-semibold text-slate-900">
                      {Number(totals.twt).toFixed(2)}
                    </div>
                  </td>

                  <td className="px-3 py-3 bg-slate-100" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* bottom toolbar */}
          <div className="px-6 py-4 border-t flex items-center justify-between bg-gradient-to-t from-white/60 to-slate-50">
            <div className="text-xs text-slate-500">
              Enter → next •{" "}
              <span className="font-medium text-slate-700">Ctrl+N</span> → add •{" "}
              <span className="font-medium text-slate-700">Ctrl+S</span> → save
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => addRow(true)}
                className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 px-3 py-2 rounded border hover:bg-sky-100"
                title="Add item (Ctrl+N)"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>

              <button
                onClick={handleSaveAndNew}
                className="inline-flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900"
                title="Save and clear for new"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M12 5v14M5 12h14"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>{" "}
                Save & New
              </button>

              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 bg-sky-700 hover:bg-sky-800 text-white px-4 py-2 rounded"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // local helper placed after JSX because it's referenced earlier.
  function handleSaveAndNew() {
    if (!containerCode.trim()) return toast.error("Container code required");
    if (rows.length === 0) return toast.error("Add at least one row");

    rows.forEach((r) => ensureClient(r.mark));

    const payload = {
      id: `sheet-${Date.now()}`,
      containerCode,
      origin,
      loadingDate,
      status: "draft",
      totals,
      rows,
      createdAt: new Date().toISOString(),
    };
    savePayloadToLocal(payload);
    toast.success("Saved — ready for new");

    setRows([{ ...EMPTY_ROW, id: `r-${Date.now()}`, _markOpen: true }]);
    setTimeout(() => firstRef.current?.focus(), 80);
  }
}
