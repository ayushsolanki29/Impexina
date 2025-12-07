"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import {
  Search as SearchIcon,
  Filter,
  Edit3,
  Download,
  Save,
  X,
  Package,
  Boxes,
  Weight,
  CurlyBraces,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format } from "date-fns";

/* ---------- helpers ---------- */
function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || [];
  } catch {
    return [];
  }
}
function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
function fmt(n, digits = 2) {
  if (n === null || n === undefined) return "-";
  return Number(n).toFixed(digits);
}

/* ---------- demo seed ---------- */
const DEMO_SEED = [
  {
    id: "sheet-1",
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "2025-10-09",
    deliveryDate: null,
    invoiceNo: null,
    clientName: "BB-AMD",
    status: "draft",
    tctn: 42,
    tpcs: 1300,
    tcbm: 4.585,
    twt: 414,
    items: [
      {
        id: "i1",
        particular: "FOOTREST",
        mark: "BB-AMD",
        itemNo: "FOOTREST",
        ctn: 5,
        pcs: 100,
        tpcs: 500,
        cbm: 0.083,
        tcbm: 0.417,
        wt: 7,
        twt: 35,
      },
      {
        id: "i2",
        particular: "TELESCOPIC SHELF",
        mark: "BB-AMD",
        itemNo: "TELESHELF",
        ctn: 12,
        pcs: 25,
        tpcs: 300,
        cbm: 0.113,
        tcbm: 1.356,
        wt: 17,
        twt: 204,
      },
      {
        id: "i3",
        particular: "PET STORAGE BAG",
        mark: "BB-AMD",
        itemNo: "PETBAG",
        ctn: 25,
        pcs: 20,
        tpcs: 500,
        cbm: 0.112,
        tcbm: 2.812,
        wt: 7,
        twt: 175,
      },
    ],
  },
  {
    id: "sheet-2",
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "2025-10-09",
    deliveryDate: "2025-10-20",
    invoiceNo: "643",
    clientName: "BST-AD",
    status: "completed",
    tctn: 170,
    tpcs: 5000,
    tcbm: 11.2,
    twt: 1200,
    items: [
      {
        id: "i4",
        particular: "STACKING STAND",
        mark: "BST-AD",
        itemNo: "STACK-1",
        ctn: 20,
        pcs: 6,
        tpcs: 120,
        cbm: 1.78,
        tcbm: 35.6,
        wt: 10,
        twt: 200,
      },
    ],
  },
];

/* ---------------- component ---------------- */
export default function BifurcationPage() {
  const containerRef = useRef(null);
  const parentRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [sheets, setSheets] = useState([]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const qRef = useRef("");
  const [originFilter, setOriginFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [minCtn, setMinCtn] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [overrides, setOverrides] = useState(
    () => readLocal("igpl_bifurcation_overrides") || {}
  );
  const [editing, setEditing] = useState(null); // { key, draft }

  // seed demo if empty
  useEffect(() => {
    const existing = readLocal("igpl_loading");
    if (!existing || existing.length === 0) {
      writeLocal("igpl_loading", DEMO_SEED);
    }
  }, []);

  // load sheets
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      const raw = readLocal("igpl_loading");
      const normalized = raw.map((s) => ({
        ...s,
        items: s.items || s.rows || [],
        clientName:
          s.clientName ||
          (s.items && s.items[0]?.mark) ||
          (s.rows && s.rows[0]?.mark) ||
          "UNKNOWN",
      }));
      setSheets(normalized);
      setLoading(false);
    }, 140);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setOverrides(readLocal("igpl_bifurcation_overrides") || {});
  }, []);

  useEffect(() => {
    writeLocal("igpl_bifurcation_overrides", overrides);
  }, [overrides]);

  // debounced search
  useEffect(() => {
    qRef.current = q;
    const id = setTimeout(() => setDebouncedQ(qRef.current.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  // GROUP + AGGREGATE
  const groups = useMemo(() => {
    if (loading) return [];
    const qLower = debouncedQ.toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
    const toTs = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;
    const minCtnN = minCtn ? Number(minCtn) : null;
    const map = new Map();

    for (const s of sheets) {
      if (
        originFilter &&
        s.origin &&
        !s.origin.toLowerCase().includes(originFilter.toLowerCase())
      )
        continue;
      if (
        statusFilter &&
        (!s.status || s.status.toLowerCase() !== statusFilter.toLowerCase())
      )
        continue;
      if (minCtnN !== null && Number(s.tctn || 0) < minCtnN) continue;
      if (fromTs || toTs) {
        const ld = s.loadingDate ? new Date(s.loadingDate).getTime() : null;
        if (fromTs && (!ld || ld < fromTs)) continue;
        if (toTs && (!ld || ld > toTs)) continue;
      }

      if (qLower) {
        const hay = `${s.clientName} ${s.id} ${s.containerCode} ${s.origin} ${
          s.invoiceNo || ""
        } ${s.tctn || ""} ${s.tpcs || ""}`.toLowerCase();
        let match = hay.includes(qLower);
        if (!match) {
          for (const it of s.items || []) {
            if (
              (
                (it.particular || "") +
                " " +
                (it.mark || "") +
                " " +
                (it.itemNo || "")
              )
                .toLowerCase()
                .includes(qLower)
            ) {
              match = true;
              break;
            }
          }
        }
        if (!match) continue;
      }

      const key = `${s.containerCode}__${s.clientName}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          containerCode: s.containerCode,
          clientName: s.clientName,
          sheets: [],
          totals: { tctn: 0, tpcs: 0, tcbm: 0, twt: 0 },
          loadingDate: s.loadingDate || null,
        });
      }
      const g = map.get(key);
      g.sheets.push(s);
      g.totals.tctn += Number(s.tctn || 0);
      g.totals.tpcs += Number(s.tpcs || 0);
      g.totals.tcbm += Number(s.tcbm || 0);
      g.totals.twt += Number(s.twt || 0);
      if (!g.loadingDate || new Date(s.loadingDate) > new Date(g.loadingDate)) {
        g.loadingDate = s.loadingDate;
      }
    }

    const arr = Array.from(map.values()).map((g) => {
      const prods = new Set();
      for (const sh of g.sheets) {
        for (const it of sh.items || []) {
          if (it.particular) {
            prods.add(it.particular);
            if (prods.size >= 6) break;
          }
        }
        if (prods.size >= 6) break;
      }
      const productStr = Array.from(prods).slice(0, 5).join(", ");
      const ov = overrides[g.key] || null;
      return {
        ...g,
        product: (ov && ov.product) || productStr || "MIX ITEM",
        deliveryDate: ov ? ov.deliveryDate : null,
        invoiceNo: ov ? ov.invoiceNo : null,
        gst: ov ? ov.gst : null,
        editedAt: ov ? ov.editedAt : null,
      };
    });

    arr.sort(
      (a, b) =>
        b.totals.tctn - a.totals.tctn ||
        a.clientName.localeCompare(b.clientName)
    );
    return arr;
  }, [
    sheets,
    debouncedQ,
    originFilter,
    statusFilter,
    dateFrom,
    dateTo,
    minCtn,
    overrides,
    loading,
  ]);

  // High-level stats
  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const totalCtn = groups.reduce((sum, g) => sum + (g.totals.tctn || 0), 0);
    const totalCbm = groups.reduce((sum, g) => sum + (g.totals.tcbm || 0), 0);
    const totalWt = groups.reduce((sum, g) => sum + (g.totals.twt || 0), 0);
    return { totalGroups, totalCtn, totalCbm, totalWt };
  }, [groups]);

  // CSV export
  function exportCSV(list) {
    const headers = [
      "CODE",
      "MARK",
      "CTN",
      "PRODUCT",
      "TOTAL CBM",
      "TOTAL WT",
      "LOADING DATE",
      "DELIVERY DATE",
      "INV NO.",
      "GST",
      "STATUS",
    ];
    const rows = list.map((g) => [
      g.containerCode,
      g.clientName,
      g.totals.tctn,
      `"${String(g.product || "").replace(/"/g, "''")}"`,
      fmt(g.totals.tcbm, 3),
      fmt(g.totals.twt, 1),
      g.loadingDate || "",
      g.deliveryDate || "",
      g.invoiceNo || "",
      g.gst || "",
      g.editedAt ? "Edited" : "System generated",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bifurcation_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openEdit(group) {
    setEditing({
      key: group.key,
      draft: {
        containerCode: group.containerCode,
        clientName: group.clientName,
        product: group.product,
        deliveryDate: group.deliveryDate || "",
        invoiceNo: group.invoiceNo || "",
        gst: group.gst || "",
      },
    });
  }

  function saveEdit() {
    if (!editing) return;
    const { key, draft } = editing;
    const now = new Date().toISOString();
    const next = { ...(overrides || {}) };
    next[key] = {
      product: draft.product,
      deliveryDate: draft.deliveryDate || null,
      invoiceNo: draft.invoiceNo || null,
      gst: draft.gst || null,
      editedAt: now,
    };
    setOverrides(next);
    setEditing(null);
    toast.success("Bifurcation updated");
  }

  function doDeleteGroup(keyToRemove) {
    const nextOverrides = { ...overrides };
    delete nextOverrides[keyToRemove];
    setOverrides(nextOverrides);
    toast.success("Override removed. Row is now system generated.");
  }

  /* ---------- Virtualizer setup ---------- */
  const rowHeight = 64;
  const virtualizer = useVirtualizer({
    count: groups.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
  });

  // row renderer
  const Row = ({ g, index }) => {
    if (!g) return null;
    const isEdited = !!g.editedAt;
    const zebra = index % 2 === 0 ? "bg-white" : "bg-slate-50";

    return (
      <div
        className={`px-4 py-3 border-b border-slate-100 flex items-center gap-3 text-sm ${zebra} hover:bg-sky-50/60 transition-colors`}
        style={{ height: rowHeight }}
      >
        <div className="w-36 flex flex-col">
          <span className="font-medium text-slate-900">
            {g.containerCode}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            {(g.sheets && g.sheets[0]?.origin) || "-"}
          </span>
        </div>
        <div className="w-44 flex flex-col">
          <span className="font-semibold text-slate-900 truncate">
            {g.clientName}
          </span>
          <span
            className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] tracking-wide border ${
              isEdited
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-slate-50 text-slate-500 border-slate-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isEdited ? "bg-amber-500" : "bg-slate-400"
              }`}
            />
            {isEdited ? "Edited" : "System"}
          </span>
        </div>
        <div className="flex-1 text-slate-700 truncate">{g.product}</div>
        <div className="w-20 text-right font-semibold text-slate-900">
          {g.totals.tctn}
        </div>
        <div className="w-28 text-right text-slate-700">
          {fmt(g.totals.tcbm, 3)}
        </div>
        <div className="w-28 text-right text-slate-700">
          {fmt(g.totals.twt, 1)}
        </div>
        <div className="w-28 text-xs text-slate-700">
          {g.loadingDate ? format(new Date(g.loadingDate), "dd-MM-yy") : "-"}
        </div>
        <div className="w-28 text-xs text-slate-700">
          {g.deliveryDate ? (
            format(new Date(g.deliveryDate), "dd-MM-yy")
          ) : (
            <span className="text-[11px] text-slate-400">Not captured</span>
          )}
        </div>
        <div className="w-28 text-xs text-slate-800">{g.invoiceNo || "—"}</div>
        <div className="w-20 text-xs text-slate-800">{g.gst || "—"}</div>
        <div className="w-36 flex items-center justify-end gap-1">
          <button
            onClick={() => openEdit(g)}
            className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 text-xs inline-flex items-center gap-1 border border-sky-100 hover:bg-sky-100 transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={() => doDeleteGroup(g.key)}
            className="px-2 py-1 rounded-full bg-rose-50 text-rose-700 text-xs border border-rose-100 hover:bg-rose-100 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 py-8 px-4">
      <Toaster position="top-right" richColors />
      <div className="max-w-7xl mx-auto space-y-5" ref={containerRef}>
        {/* header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
                Bifurcation
              </h1>
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-sky-700">
                Auto from loading sheets
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 max-w-xl">
              Review container-wise grouped loading sheets, update delivery /
              invoice / GST, and export a clean bifurcation CSV for operations
              and accounts.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 md:w-[360px]">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                }}
                placeholder="Search client, container, invoice, product..."
                className="w-full rounded-full border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/80 focus:border-sky-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setFiltersOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-sky-400 hover:text-sky-700 hover:bg-sky-50 transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
              </button>
              <button
                onClick={() => exportCSV(groups)}
                className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 active:bg-sky-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>
        </header>

        {/* stats bar */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className="rounded-xl bg-sky-50 p-2">
              <Package className="w-4 h-4 text-sky-700" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Groups
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {stats.totalGroups}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className="rounded-xl bg-sky-50 p-2">
              <Boxes className="w-4 h-4 text-sky-700" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Total CTN
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {stats.totalCtn}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className="rounded-xl bg-sky-50 p-2">
              <CurlyBraces className="w-4 h-4 text-sky-700" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Total CBM
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {fmt(stats.totalCbm, 2)}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className="rounded-xl bg-sky-50 p-2">
              <Weight className="w-4 h-4 text-sky-700" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Total Weight
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {fmt(stats.totalWt, 1)}
              </p>
            </div>
          </div>
        </section>

        {/* filters */}
        <section
          className={`transform-gpu transition-all duration-200 ${
            filtersOpen
              ? "opacity-100 translate-y-0 max-h-40"
              : "opacity-0 -translate-y-1 max-h-0 pointer-events-none"
          }`}
        >
          <div
            id="bif-filters"
            className="bg-white border border-slate-200 rounded-2xl p-3 grid grid-cols-1 md:grid-cols-6 gap-2 text-xs text-slate-800 shadow-sm"
          >
            <input
              placeholder="Origin"
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-300 bg-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="">All status</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            />
            <input
              placeholder="Min CTN"
              value={minCtn}
              onChange={(e) => setMinCtn(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => {
                  setOriginFilter("");
                  setStatusFilter("");
                  setDateFrom("");
                  setDateTo("");
                  setMinCtn("");
                  setQ("");
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 text-xs text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Reset filters
              </button>
            </div>
          </div>
        </section>

        {/* table card */}
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* header row */}
          <div className="px-4 py-3 flex items-center gap-3 text-[11px] font-medium text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200">
            <div className="w-36">Code</div>
            <div className="w-44">Mark</div>
            <div className="flex-1">Product</div>
            <div className="w-20 text-right">CTN</div>
            <div className="w-28 text-right">Total CBM</div>
            <div className="w-28 text-right">Total WT</div>
            <div className="w-28">Loading Date</div>
            <div className="w-28">Delivery Date</div>
            <div className="w-28">Inv No.</div>
            <div className="w-20">GST</div>
            <div className="w-36 text-right">Action</div>
          </div>

          {/* virtualized list */}
          <div className="">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Loading bifurcation…
              </div>
            ) : groups.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No bifurcation rows match the current filters.
              </div>
            ) : (
              <div ref={parentRef} style={{ height: 600, overflow: "auto" }}>
                <div
                  style={{
                    height: virtualizer.getTotalSize(),
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const g = groups[virtualRow.index];
                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <Row g={g} index={virtualRow.index} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-700">
                  {editing.draft.clientName} —{" "}
                  <span className="font-semibold text-slate-900">
                    {editing.draft.containerCode}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Override product summary, delivery date, invoice number and
                  GST. Row will be marked as{" "}
                  <span className="font-semibold text-amber-600">
                    Edited
                  </span>
                  .
                </div>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="p-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500">
                  Product summary
                </label>
                <input
                  value={editing.draft.product}
                  onChange={(e) =>
                    setEditing((st) => ({
                      ...st,
                      draft: { ...st.draft, product: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500">
                  Delivery date
                </label>
                <input
                  type="date"
                  value={editing.draft.deliveryDate}
                  onChange={(e) =>
                    setEditing((st) => ({
                      ...st,
                      draft: { ...st.draft, deliveryDate: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500">
                  Invoice no.
                </label>
                <input
                  value={editing.draft.invoiceNo}
                  onChange={(e) =>
                    setEditing((st) => ({
                      ...st,
                      draft: { ...st.draft, invoiceNo: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500">GST</label>
                <input
                  value={editing.draft.gst}
                  onChange={(e) =>
                    setEditing((st) => ({
                      ...st,
                      draft: { ...st.draft, gst: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-full border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 rounded-full bg-sky-600 text-xs font-semibold text-white inline-flex items-center gap-2 shadow-sm hover:bg-sky-700 active:bg-sky-800 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
