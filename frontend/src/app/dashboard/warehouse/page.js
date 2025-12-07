"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import {
  Search as SearchIcon,
  Filter,
  Download,
  Edit3,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

/**
 * Warehouse Plan Page (container-wise & detailed)
 *
 * - Reads loading/packing sheets from localStorage (keys igpl_packing_v1 or igpl_loading)
 * - Aggregates by clientName -> containerCode groups
 * - Editable fields: deliveryDate, invoiceNo, gst, transporter (persisted in igpl_bifurcation_overrides)
 * - Expand container to view item-level details (photo if present)
 * - Export CSV for current visible groups
 * - Lightweight "Load more" for large lists (replace with server paging/react-window for millions)
 */

// Safe local helpers
function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || null;
  } catch {
    return null;
  }
}
function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
// small number formatter
const fmt = (n, d = 2) =>
  n === null || n === undefined || Number.isNaN(Number(n)) ? "-" : Number(n).toFixed(d);

// demo seed (keeps UI useful for onboarding)
const DEMO_SEED = [
  {
    id: "sheet-1",
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "2025-10-09",
    deliveryDate: null,
    invoiceNo: null,
    clientName: "RAJ",
    status: "draft",
    tctn: 42,
    tpcs: 1300,
    tcbm: 4.585,
    twt: 414,
    transporter: "SAMEER ROADLINE",
    items: [
      { id: "i1", particular: "FOOTREST", mark: "BB-AMD", itemNo: "FOOTREST", ctn: 5, pcs: 100, tpcs: 500, cbm: 0.083, tcbm: 0.417, wt: 7, twt: 35, photo: null },
      { id: "i2", particular: "TELESCOPIC SHELF", mark: "SMWGC18,SMWINK,SMWRB163", itemNo: "TELESHELF", ctn: 12, pcs: 25, tpcs: 300, cbm: 0.113, tcbm: 1.356, wt: 17, twt: 204, photo: null },
      { id: "i3", particular: "PET STORAGE BAG", mark: "KD", itemNo: "PETBAG", ctn: 25, pcs: 20, tpcs: 500, cbm: 0.112, tcbm: 2.812, wt: 7, twt: 175, photo: null },
    ],
  },
  {
    id: "sheet-2",
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "2025-10-09",
    deliveryDate: null,
    invoiceNo: "643",
    clientName: "RAJ",
    status: "draft",
    tctn: 171,
    tpcs: 4200,
    tcbm: 26.21,
    twt: 3726,
    transporter: "SAMEER ROADLINE",
    items: [
      { id: "i4", particular: "STORAGE BOX", mark: "KD", itemNo: "BOX-1", ctn: 171, pcs: 24, tpcs: 4104, cbm: 0.153, tcbm: 26.21, wt: 21.8, twt: 3726, photo: null },
    ],
  },
  // add more demo rows as needed
];

/* ---------------- main component ----------------- */

export default function WarehousePlanPage() {
  const [loading, setLoading] = useState(true);
  const [sheets, setSheets] = useState([]);
  const [overrides, setOverrides] = useState(() =>
    readLocal("igpl_bifurcation_overrides") || {}
  );

  // UI state
  const [q, setQ] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null); // { key, draft }

  // seed local if empty (keeps new users happy)
  useEffect(() => {
    const existing = readLocal("igpl_packing_v1") || readLocal("igpl_loading");
    if (!existing || !Array.isArray(existing) || existing.length === 0) {
      writeLocal("igpl_packing_v1", DEMO_SEED);
      setSheets(DEMO_SEED);
      setTimeout(() => setLoading(false), 150);
      return;
    }
    // else we will load below
    setLoading(true);
    const t = setTimeout(() => {
      // normalize sheet shapes
      const normalized = (existing || []).map((s) => ({
        id: s.id || `sheet-${Math.random().toString(36).slice(2, 8)}`,
        containerCode: s.containerCode || s.meta?.containerCode || "UNKNOWN",
        origin: s.origin || s.meta?.origin || "",
        loadingDate: s.loadingDate || s.meta?.loadingDate || null,
        deliveryDate: s.deliveryDate || null,
        invoiceNo: s.invoiceNo || s.meta?.invoiceNo || null,
        clientName:
          s.clientName ||
          s.client ||
          s.items?.[0]?.mark ||
          s.rows?.[0]?.mark ||
          "UNKNOWN",
        tctn: s.tctn ?? s.totals?.ctn ?? (s.rows || []).reduce((a, b) => a + (b.ctn || 0), 0),
        tcbm: s.tcbm ?? s.totals?.tcbm ?? (s.rows || []).reduce((a, b) => a + (b.tcbm || 0), 0),
        twt: s.twt ?? s.totals?.twt ?? (s.rows || []).reduce((a, b) => a + (b.twt || 0), 0),
        transporter: s.transporter || s.meta?.transporter || "",
        items: s.items || s.rows || [],
        status: s.status || "draft",
      }));
      setSheets(normalized);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, []);

  // persist overrides when changed
  useEffect(() => {
    writeLocal("igpl_bifurcation_overrides", overrides);
  }, [overrides]);

  // aggregated groups: group by clientName, then container rows in group
  const groups = useMemo(() => {
    if (loading) return [];
    const ql = q.trim().toLowerCase();

    const map = new Map();
    for (const s of sheets) {
      if (originFilter && s.origin && !s.origin.toLowerCase().includes(originFilter.toLowerCase())) continue;
      if (statusFilter && s.status && s.status.toLowerCase() !== statusFilter.toLowerCase()) continue;

      // search match
      if (ql) {
        const hay = `${s.containerCode} ${s.clientName} ${s.id} ${s.origin} ${s.invoiceNo || ""} ${s.tctn || ""}`.toLowerCase();
        let match = hay.includes(ql);
        if (!match && Array.isArray(s.items)) {
          for (const it of s.items) {
            if (((it.particular || "") + " " + (it.mark || "") + " " + (it.itemNo || "")).toLowerCase().includes(ql)) { match = true; break; }
          }
        }
        if (!match) continue;
      }

      const client = s.clientName || "UNKNOWN";
      if (!map.has(client)) {
        map.set(client, { clientName: client, rows: [], totals: { tctn: 0, tcbm: 0, twt: 0 } });
      }
      const g = map.get(client);
      g.rows.push(s);
      g.totals.tctn += Number(s.tctn || 0);
      g.totals.tcbm += Number(s.tcbm || 0);
      g.totals.twt += Number(s.twt || 0);
    }
    // convert and sort clients alphabetically
    const arr = Array.from(map.values()).map((g) => {
      // apply overrides (per container inside)
      const rows = g.rows.map((r) => {
        const key = `${r.containerCode}__${r.clientName}`;
        const ov = overrides[key] || {};
        return {
          ...r,
          deliveryDate: ov.deliveryDate ?? r.deliveryDate ?? null,
          invoiceNo: ov.invoiceNo ?? r.invoiceNo ?? null,
          gst: ov.gst ?? r.gst ?? null,
          transporter: ov.transporter ?? r.transporter ?? "",
          editedAt: ov.editedAt ?? null,
          product: ov.product ?? (r.items && r.items.length ? r.items.map(it => it.particular).slice(0, 3).join(", ") : "MIX ITEM"),
        };
      });
      return { ...g, rows };
    });
    arr.sort((a, b) => a.clientName.localeCompare(b.clientName));
    return arr;
  }, [sheets, q, originFilter, statusFilter, overrides, loading]);

  // pagination over groups for large lists
  const visibleGroups = useMemo(() => groups.slice(0, page * PAGE_SIZE), [groups, page]);

  // CSV export for what you see
  function exportCSV() {
    const headers = ["CODE","MARK","CTN","PRODUCT","TOTAL CBM","T CBM","TOTAL WEIGHT","T WT","LOADING DATE","DELIVERY DATE","INV NO.","GST","TRANSPORTER","CLIENT"];
    const rowsOut = [];
    for (const g of visibleGroups) {
      for (const r of g.rows) {
        rowsOut.push([
          r.containerCode || "",
          r.clientName || "",
          r.tctn || 0,
          `"${(r.product || "").replace(/"/g, '""')}"`,
          fmt(r.tcbm || 0,3),
          fmt((r.tcbm || 0) * 14,3), // example T CBM placeholder (adapt formula as needed)
          fmt(r.twt || 0,1),
          fmt((r.twt || 0) * 29,1), // placeholder T WT if needed
          r.loadingDate || "",
          r.deliveryDate || "",
          r.invoiceNo || "",
          r.gst || "",
          r.transporter || "",
          g.clientName || ""
        ]);
      }
    }
    const csv = [headers.join(","), ...rowsOut.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `warehouse_plan_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  }

  // open edit modal for a container row
  function openEdit(row) {
    const key = `${row.containerCode}__${row.clientName}`;
    setEditing({ key, draft: { deliveryDate: row.deliveryDate || "", invoiceNo: row.invoiceNo || "", gst: row.gst || "", transporter: row.transporter || "", product: row.product || "" }, row });
  }

  function saveEdit() {
    if (!editing) return;
    const key = editing.key;
    const now = new Date().toISOString();
    const next = { ...(overrides || {}) };
    next[key] = { product: editing.draft.product || null, deliveryDate: editing.draft.deliveryDate || null, invoiceNo: editing.draft.invoiceNo || null, gst: editing.draft.gst || null, transporter: editing.draft.transporter || null, editedAt: now };
    setOverrides(next);
    setEditing(null);
    toast.success("Saved");
  }

  // assign transporter in bulk (example quick action)
  function bulkAssignTransporter(clientName, transporter) {
    const next = { ...(overrides || {}) };
    const client = groups.find(g => g.clientName === clientName);
    if (!client) return;
    for (const r of client.rows) {
      const key = `${r.containerCode}__${r.clientName}`;
      next[key] = { ...(next[key] || {}), transporter, editedAt: new Date().toISOString() };
    }
    setOverrides(next);
    toast.success(`Assigned transporter "${transporter}" for ${clientName}`);
  }

  // mark a container as "hold" (example status)
  function toggleHold(row) {
    const key = `${row.containerCode}__${row.clientName}`;
    const next = { ...(overrides || {}) };
    next[key] = { ...(next[key] || {}), transporter: (next[key] && next[key].transporter === "HOLD") ? "" : "HOLD", editedAt: new Date().toISOString() };
    setOverrides(next);
    toast.success("Toggled HOLD");
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Warehouse Plan — Container Wise</h1>
            <p className="text-sm text-slate-500">Auto-list from loadings. Click a container row to inspect items or edit delivery / invoice / GST / transporter.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 text-slate-400" />
              <input className="pl-10 pr-3 py-2 border rounded-md w-72" placeholder="Search client, product, container..." value={q} onChange={e => setQ(e.target.value)} />
            </div>

            <button onClick={()=> document.getElementById('wf-filters')?.classList.toggle('hidden')} className="px-3 py-2 rounded bg-sky-50 text-sky-700 inline-flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</button>

            <button onClick={exportCSV} className="px-3 py-2 rounded bg-slate-800 text-white inline-flex items-center gap-2"><Download className="w-4 h-4" /> Export visible</button>
          </div>
        </div>

        <div id="wf-filters" className="mb-4 hidden">
          <div className="bg-white border rounded p-3 grid grid-cols-1 md:grid-cols-4 gap-2">
            <input placeholder="Origin..." value={originFilter} onChange={e=>setOriginFilter(e.target.value)} className="py-2 px-3 border rounded" />
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="py-2 px-3 border rounded">
              <option value="">All status</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
            <div className="flex items-center gap-2">
              <button onClick={() => { setOriginFilter(""); setStatusFilter(""); setQ(""); }} className="px-3 py-2 bg-slate-100 rounded">Reset</button>
            </div>
          </div>
        </div>

        {/* Groups */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading…</div>
          ) : visibleGroups.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No data</div>
          ) : visibleGroups.map((g) => (
            <div key={g.clientName} className="bg-white border rounded-lg overflow-hidden">
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">Client</div>
                  <div className="text-lg font-semibold text-slate-900">{g.clientName}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-600 text-right">
                    <div>CTN <div className="font-semibold text-slate-900 text-lg">{g.totals.tctn}</div></div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={()=>bulkAssignTransporter(g.clientName, "SAMEER ROADLINE")} className="px-2 py-1 rounded bg-sky-50 text-sky-700 text-xs">Assign SAMEER</button>
                    <button onClick={()=>bulkAssignTransporter(g.clientName, "VRL LOGISTICS")} className="px-2 py-1 rounded bg-sky-50 text-sky-700 text-xs">Assign VRL</button>
                    <button onClick={()=> setExpanded(expanded === g.clientName ? null : g.clientName)} className="px-2 py-1 rounded bg-slate-100 text-xs inline-flex items-center gap-1">
                      {expanded === g.clientName ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>} Details
                    </button>
                  </div>
                </div>
              </div>

              {/* rows */}
              <div className="border-t">
                <div className="px-3 py-2 bg-slate-50 text-xs text-slate-600 uppercase flex items-center gap-3">
                  <div className="w-36">CODE</div>
                  <div className="w-44">MARK</div>
                  <div className="flex-1">PRODUCT</div>
                  <div className="w-20 text-right">CTN</div>
                  <div className="w-28 text-right">TOTAL CBM</div>
                  <div className="w-28 text-right">TOTAL WT</div>
                  <div className="w-28">LOADING DATE</div>
                  <div className="w-28">DELIVERY DATE</div>
                  <div className="w-28">INV NO.</div>
                  <div className="w-32">TRANSPORTER</div>
                  <div className="w-24 text-right">ACTION</div>
                </div>

                {g.rows.map((r) => (
                  <div key={r.id} className="px-3 py-3 border-b flex items-center gap-3">
                    <div className="w-36 text-sky-700 font-semibold">{r.containerCode}</div>
                    <div className="w-44 text-sm text-slate-900 truncate">{r.clientName}</div>
                    <div className="flex-1 text-sm text-slate-700 truncate">{r.product || (r.items && r.items.length ? r.items.map(it=>it.particular).slice(0,3).join(", ") : "MIX ITEM")}</div>
                    <div className="w-20 text-right font-semibold">{r.tctn || 0}</div>
                    <div className="w-28 text-right">{fmt(r.tcbm || 0,3)}</div>
                    <div className="w-28 text-right">{fmt(r.twt || 0,1)}</div>
                    <div className="w-28 text-sm">{r.loadingDate || ""}</div>
                    <div className="w-28 text-sm">{r.deliveryDate || <span className="text-xs text-slate-400">System generated</span>}</div>
                    <div className="w-28 text-sm">{r.invoiceNo || ""}</div>
                    <div className="w-32 text-sm">{r.transporter || ""}</div>
                    <div className="w-24 text-right flex items-center justify-end gap-1">
                      <button onClick={()=>openEdit(r)} className="px-2 py-1 rounded bg-sky-50 text-sky-700 text-xs inline-flex items-center gap-1"><Edit3 className="w-3 h-3"/>Edit</button>
                      <button onClick={()=>toggleHold(r)} className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs">Hold</button>
                    </div>
                  </div>
                ))}

                {/* expanded container-level details */}
                {expanded === g.clientName && (
                  <div className="p-3 bg-white">
                    <div className="text-sm text-slate-600 mb-2">Detailed items for {g.clientName}</div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border">
                        <thead className="text-xs text-slate-600 uppercase bg-slate-50">
                          <tr>
                            <th className="px-2 py-2 text-left">S.N.</th>
                            <th className="px-2 py-2 text-left">Item Number</th>
                            <th className="px-2 py-2 text-left">Photo</th>
                            <th className="px-2 py-2 text-left">Descriptions</th>
                            <th className="px-2 py-2 text-right">Ctn.</th>
                            <th className="px-2 py-2 text-right">Qty/Ctn</th>
                            <th className="px-2 py-2 text-left">Unit</th>
                            <th className="px-2 py-2 text-right">T-QTY</th>
                            <th className="px-2 py-2 text-right">KG</th>
                            <th className="px-2 py-2 text-right">T.KG</th>
                            <th className="px-2 py-2 text-left">MIX</th>
                            <th className="px-2 py-2 text-left">HSN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.rows.flatMap(r => r.items || []).map((it, idx) => (
                            <tr key={it.id || idx} className="border-t">
                              <td className="px-2 py-2 text-sm">{idx+1}</td>
                              <td className="px-2 py-2 text-sm">{it.itemNo || it.mark || ""}</td>
                              <td className="px-2 py-2 text-sm">
                                {it.photo ? <img src={it.photo} alt="thumb" className="w-12 h-8 object-cover rounded" /> : <div className="w-12 h-8 border rounded flex items-center justify-center text-slate-400">No</div>}
                              </td>
                              <td className="px-2 py-2 text-sm">{it.particular}</td>
                              <td className="px-2 py-2 text-sm text-right">{it.ctn || 0}</td>
                              <td className="px-2 py-2 text-sm text-right">{it.pcs || 0}</td>
                              <td className="px-2 py-2 text-sm">{it.unit || "PCS"}</td>
                              <td className="px-2 py-2 text-sm text-right">{it.tpcs || 0}</td>
                              <td className="px-2 py-2 text-sm text-right">{fmt(it.wt || 0,2)}</td>
                              <td className="px-2 py-2 text-sm text-right">{fmt(it.twt || 0,2)}</td>
                              <td className="px-2 py-2 text-sm">{it.mix || ""}</td>
                              <td className="px-2 py-2 text-sm">{it.hsn || ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* pagination */}
        {groups.length > visibleGroups.length && (
          <div className="mt-6 flex justify-center">
            <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded bg-sky-600 text-white">Load more</button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-md shadow-lg w-full max-w-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-lg font-semibold">{editing.row.containerCode} — {editing.row.clientName}</div>
                <div className="text-sm text-slate-500">Edit delivery / invoice / gst / transporter / product summary</div>
              </div>
              <button onClick={()=>setEditing(null)} className="px-2 py-1 rounded bg-slate-100">Close</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600">Delivery date</label>
                <input type="date" value={editing.draft.deliveryDate || ""} onChange={e=>setEditing(st=>({...st, draft:{...st.draft, deliveryDate:e.target.value}}))} className="w-full border px-3 py-2 rounded mt-1" />
              </div>

              <div>
                <label className="text-xs text-slate-600">Invoice no</label>
                <input value={editing.draft.invoiceNo || ""} onChange={e=>setEditing(st=>({...st, draft:{...st.draft, invoiceNo:e.target.value}}))} className="w-full border px-3 py-2 rounded mt-1" />
              </div>

              <div>
                <label className="text-xs text-slate-600">GST</label>
                <input value={editing.draft.gst || ""} onChange={e=>setEditing(st=>({...st, draft:{...st.draft, gst:e.target.value}}))} className="w-full border px-3 py-2 rounded mt-1" />
              </div>

              <div>
                <label className="text-xs text-slate-600">Transporter</label>
                <input value={editing.draft.transporter || ""} onChange={e=>setEditing(st=>({...st, draft:{...st.draft, transporter:e.target.value}}))} className="w-full border px-3 py-2 rounded mt-1" />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-slate-600">Product summary</label>
                <input value={editing.draft.product || ""} onChange={e=>setEditing(st=>({...st, draft:{...st.draft, product:e.target.value}}))} className="w-full border px-3 py-2 rounded mt-1" />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-3 py-2 rounded bg-slate-100">Cancel</button>
              <button onClick={saveEdit} className="px-3 py-2 rounded bg-sky-600 text-white inline-flex items-center gap-2"><Download className="w-4 h-4" /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
