"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { Search as SearchIcon, Download, Filter } from "lucide-react";

/**
 * ContainersPackingPage
 * - reads `igpl_packing_v1` from localStorage (falls back to igpl_loading or demo)
 * - aggregates by containerCode
 * - click container -> router.push to container detail (packing detail)
 */

const PACK_KEY = "igpl_packing_v1";
const OLD_KEY = "igpl_loading"; // fallback if your other components stored here

// fallback demo if no storage (keeps UI non-empty for new users)
const DEMO = [
  {
    meta: { companyName: "Demo", invNo: "D-001" },
    items: [],
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "2025-10-09",
    status: "draft",
    tctn: 42,
    tQty: 1300,
    tKg: 414,
    id: "sheet-1",
  },
  {
    meta: { companyName: "Demo", invNo: "D-002" },
    items: [],
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "2025-10-09",
    status: "completed",
    tctn: 170,
    tQty: 5000,
    tKg: 1200,
    id: "sheet-2",
  },
  {
    meta: { companyName: "Demo", invNo: "D-003" },
    items: [],
    containerCode: "ABC-22",
    origin: "SHANGHAI",
    loadingDate: "2025-09-15",
    status: "draft",
    tctn: 10,
    tQty: 400,
    tKg: 90,
    id: "sheet-3",
  },
];

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || null;
  } catch {
    return null;
  }
}
function writeLocal(key, v) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}

export default function ContainersPackingPage() {
  const router = useRouter();

  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // load on mount
  useEffect(() => {
    setLoading(true);
    try {
      let stored = readLocal(PACK_KEY);
      if (!stored || !Array.isArray(stored) || stored.length === 0) {
        // try fallback key
        const fallback = readLocal(OLD_KEY);
        if (fallback && Array.isArray(fallback) && fallback.length) {
          // normalize: igpl_loading entries may have rows/items -> convert to packing-like sheet objects
          stored = fallback.map((s) => ({
            ...s,
            containerCode: s.containerCode || (s.meta && s.meta.containerCode) || "UNKNOWN",
            origin: s.origin || (s.meta && s.meta.origin) || "",
            loadingDate: s.loadingDate || "",
            status: s.status || "draft",
            tctn: s.tctn ?? s.totals?.ctn ?? s.rows?.reduce?.((a,b)=>a+(b.ctn||0),0) ?? 0,
            tQty: s.tpcs ?? s.totals?.tpcs ?? 0,
            tKg: s.twt ?? s.totals?.twt ?? 0,
            items: s.items || s.rows || [],
            id: s.id || `sheet-${Math.random().toString(36).slice(2,8)}`,
          }));
          // save normalized to PACK_KEY to unify
          writeLocal(PACK_KEY, stored);
        } else {
          stored = DEMO;
          writeLocal(PACK_KEY, stored);
        }
      }
      setSheets(stored);
    } catch (e) {
      setSheets(DEMO);
    } finally {
      setLoading(false);
    }
  }, []);

  // grouping by containerCode
  const groups = useMemo(() => {
    if (loading) return [];
    const ql = q.trim().toLowerCase();
    const map = new Map();
    for (const s of sheets) {
      // basic filters per-sheet before grouping (origin/status)
      if (originFilter && s.origin && !s.origin.toLowerCase().includes(originFilter.toLowerCase())) continue;
      if (statusFilter && s.status && s.status.toLowerCase() !== statusFilter.toLowerCase()) continue;

      // if search is present, filter to only groups that match: either container, origin, sheet id, client, item words
      if (ql) {
        const hay = `${s.containerCode || ""} ${s.origin || ""} ${s.id || ""} ${s.meta?.companyName || ""}`.toLowerCase();
        let match = hay.includes(ql);
        if (!match && Array.isArray(s.items)) {
          for (const it of s.items) {
            const itHay = `${it.particular || ""} ${it.mark || ""} ${it.itemNumber || ""}`.toLowerCase();
            if (itHay.includes(ql)) { match = true; break; }
          }
        }
        if (!match) continue;
      }

      const code = s.containerCode || "UNKNOWN";
      if (!map.has(code)) {
        map.set(code, {
          containerCode: code,
          origin: s.origin || "",
          sheets: [],
          totals: { tctn: 0, tQty: 0, tKg: 0 },
          lastLoading: s.loadingDate || null,
        });
      }
      const g = map.get(code);
      g.sheets.push(s);
      g.totals.tctn += Number(s.tctn || 0);
      g.totals.tQty += Number(s.tQty || s.tpcs || 0);
      g.totals.tKg += Number(s.tKg || s.twt || 0);
      if (!g.lastLoading || (s.loadingDate && new Date(s.loadingDate) > new Date(g.lastLoading))) g.lastLoading = s.loadingDate;
    }
    // convert to array and sort by lastLoading desc then CTN desc
    const arr = Array.from(map.values());
    arr.sort((a,b) => {
      if (a.lastLoading && b.lastLoading) return new Date(b.lastLoading) - new Date(a.lastLoading);
      if (b.totals.tctn !== a.totals.tctn) return b.totals.tctn - a.totals.tctn;
      return a.containerCode.localeCompare(b.containerCode);
    });
    return arr;
  }, [sheets, q, originFilter, statusFilter, loading]);

  function goToContainer(code) {
    // navigate to your packing detail page for that container
    // adjust path if your packing detail route differs
    router.push(`/dashboard/packing/${encodeURIComponent(code)}`);
  }

  function exportCsvVisible() {
    const headers = ["containerCode", "origin", "sheetsCount", "tctn", "tQty", "tKg", "lastLoading"];
    const rows = groups.map(g => [
      g.containerCode, g.origin, g.sheets.length, g.totals.tctn, g.totals.tQty, g.totals.tKg, g.lastLoading || ""
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `containers_packing_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Packing — Containers</h2>
            <div className="text-sm text-slate-500">Click a container to view its packing sheets & printable packing lists.</div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search container, item, origin..." className="pl-10 pr-3 py-2 border rounded-md w-72" />
            </div>

            <button onClick={() => document.getElementById("containers-filters")?.classList.toggle("hidden")} className="px-3 py-2 rounded bg-sky-50 text-sky-700 inline-flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</button>

            <button onClick={exportCsvVisible} className="px-3 py-2 rounded bg-slate-800 text-white inline-flex items-center gap-2"><Download className="w-4 h-4" /> Export</button>
          </div>
        </div>

        <div id="containers-filters" className="mb-4">
          <div className="bg-white border rounded p-3 grid grid-cols-1 md:grid-cols-4 gap-2">
            <input placeholder="Origin" value={originFilter} onChange={(e)=>setOriginFilter(e.target.value)} className="py-2 px-3 border rounded" />
            <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="py-2 px-3 border rounded">
              <option value="">All status</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
            <div className="flex items-center gap-2">
              <button onClick={() => { setOriginFilter(""); setStatusFilter(""); setQ(""); }} className="px-3 py-2 bg-slate-100 rounded">Reset</button>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded">
          <div className="px-4 py-3 flex items-center gap-3 text-xs text-slate-600 uppercase">
            <div className="w-44">Container</div>
            <div className="w-40">Origin</div>
            <div className="flex-1">Sheets / Notes</div>
            <div className="w-20 text-right">CTN</div>
            <div className="w-28 text-right">T.QTY</div>
            <div className="w-28 text-right">T.KG</div>
            <div className="w-32">Last loading</div>
            <div className="w-36 text-right">Action</div>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading…</div>
          ) : groups.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No containers found</div>
          ) : (
            groups.map((g) => (
              <div key={g.containerCode} className="px-4 py-3 border-t flex items-center gap-3 hover:bg-slate-50">
                <div className="w-44 text-sky-700 font-semibold">{g.containerCode}</div>
                <div className="w-40 text-sm text-slate-700">{g.origin || "-"}</div>
                <div className="flex-1 text-sm text-slate-600">
                  <div>{g.sheets.length} sheet(s)</div>
                  <div className="text-xs text-slate-400 mt-1">{g.sheets.slice(0,3).map(s=>s.id).join(", ")}{g.sheets.length>3?` +${g.sheets.length-3} more`:''}</div>
                </div>
                <div className="w-20 text-right font-semibold">{g.totals.tctn}</div>
                <div className="w-28 text-right">{g.totals.tQty}</div>
                <div className="w-28 text-right">{g.totals.tKg}</div>
                <div className="w-32 text-sm">{g.lastLoading || "-"}</div>
                <div className="w-36 text-right flex items-center justify-end gap-2">
                  <button onClick={() => goToContainer(g.containerCode)} className="px-3 py-1 rounded bg-sky-600 text-white text-sm">Open</button>
                  <button onClick={() => {
                    // quick export container CSV
                    const rows = [];
                    for (const s of g.sheets) {
                      rows.push([
                        s.id||"",
                        s.containerCode||"",
                        s.origin||"",
                        s.loadingDate||"",
                        s.tctn||0,
                        s.tQty||0,
                        s.tKg||0,
                      ]);
                    }
                    const csv = ["id,container,origin,loadingDate,ctn,tQty,tKg", ...rows.map(r=>r.join(","))].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${g.containerCode}_sheets.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Container CSV exported");
                  }} className="px-3 py-1 rounded bg-slate-50 text-slate-700 text-sm">Export</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
