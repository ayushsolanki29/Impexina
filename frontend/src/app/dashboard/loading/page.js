"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { Search, Filter, Plus, ChevronRight } from "lucide-react";

/*
ContainersOverviewPage — bluish SaaS UI
- Loads sheets from localStorage (key: igpl_loading). If not found, seeds demo rows.
- Aggregates by containerCode (single-pass reduce).
- Search, origin, status filters.
- Pagination (Load more). For millions: move aggregation/filtering to server and fetch only aggregates.
- Improved UI with sky-blue accents and clear badges.
*/

const DEMO_SEED = [
  {
    id: "demo-1",
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "2025-10-09",
    status: "draft",
    tctn: 42,
    tpcs: 1300,
    tcbm: 4.585,
    twt: 414,
  },
  {
    id: "demo-2",
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "2025-10-09",
    status: "completed",
    tctn: 170,
    tpcs: 5000,
    tcbm: 11.2,
    twt: 1200,
  },
  {
    id: "demo-3",
    containerCode: "ABC-22",
    origin: "SHANGHAI",
    loadingDate: "2025-09-15",
    status: "draft",
    tctn: 10,
    tpcs: 400,
    tcbm: 1.11,
    twt: 90,
  },
];

function SkeletonItem() {
  return (
    <div className="animate-pulse p-4 border-b bg-white/40">
      <div className="flex justify-between items-center gap-4">
        <div className="w-60 h-4 bg-slate-200 rounded" />
        <div className="flex gap-3">
          <div className="w-20 h-4 bg-slate-200 rounded" />
          <div className="w-20 h-4 bg-slate-200 rounded" />
          <div className="w-20 h-4 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ContainersOverviewPage() {
  const router = useRouter();

  // UI state
  const [sheets, setSheets] = useState([]); // raw sheets loaded from localStorage or API
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // seed demo data into localStorage if not present (so Save from form will also be visible)
  useEffect(() => {
    setLoading(true);
    // Simulate network latency a bit
    const t = setTimeout(() => {
      try {
        const raw = JSON.parse(localStorage.getItem("igpl_loading") || "null");
        if (!raw || !Array.isArray(raw) || raw.length === 0) {
          // seed using DEMO_SEED: convert each sample "sheet" into the same shape our app uses
          // Real-world: backend will store sheets; don't seed in production
          localStorage.setItem("igpl_loading", JSON.stringify(DEMO_SEED));
          setSheets(DEMO_SEED);
        } else {
          // prefer the stored sheets
          setSheets(raw);
        }
      } catch (err) {
        // fallback seed
        localStorage.setItem("igpl_loading", JSON.stringify(DEMO_SEED));
        setSheets(DEMO_SEED);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, []);

  // AGGREGATION: combine sheets by containerCode in a single pass (fast)
  // For huge datasets (millions) you must do this on the server and fetch only aggregates.
  const containerAggregates = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < sheets.length; i++) {
      const s = sheets[i];
      if (!s || !s.containerCode) continue;
      const key = s.containerCode;
      if (!map.has(key)) {
        map.set(key, {
          containerCode: key,
          origin: s.origin || "-",
          lastLoadingDate: s.loadingDate || "",
          sheets: 0,
          tctn: 0,
          tpcs: 0,
          tcbm: 0,
          twt: 0,
          statusSummary: new Set(),
        });
      }
      const g = map.get(key);
      g.sheets += 1;
      g.tctn += Number(s.tctn || 0);
      g.tpcs += Number(s.tpcs || 0);
      g.tcbm += Number(s.tcbm || 0);
      g.twt += Number(s.twt || 0);
      if (s.status) g.statusSummary.add(s.status);
      if (
        s.loadingDate &&
        new Date(s.loadingDate) > new Date(g.lastLoadingDate)
      ) {
        g.lastLoadingDate = s.loadingDate;
      }
    }

    // convert to array and finalize status string
    const arr = Array.from(map.values()).map((g) => ({
      ...g,
      status:
        g.statusSummary.size === 1 ? Array.from(g.statusSummary)[0] : "mixed",
    }));

    // sort by lastLoadingDate desc, then by containerCode
    arr.sort((a, b) => {
      const da = a.lastLoadingDate ? new Date(a.lastLoadingDate).getTime() : 0;
      const db = b.lastLoadingDate ? new Date(b.lastLoadingDate).getTime() : 0;
      if (da !== db) return db - da;
      return a.containerCode.localeCompare(b.containerCode);
    });

    return arr;
  }, [sheets]);

  // client-side filtering (demo). In production, send filters to server to reduce payload.
  const filteredContainers = useMemo(() => {
    if (!containerAggregates || containerAggregates.length === 0) return [];
    const qLower = q.trim().toLowerCase();
    return containerAggregates.filter((c) => {
      const matchesQ =
        !qLower || c.containerCode.toLowerCase().includes(qLower);
      const matchesOrigin =
        !originFilter ||
        (c.origin || "").toLowerCase().includes(originFilter.toLowerCase());
      const matchesStatus =
        !statusFilter ||
        (c.status || "").toLowerCase() === statusFilter.toLowerCase();
      return matchesQ && matchesOrigin && matchesStatus;
    });
  }, [containerAggregates, q, originFilter, statusFilter]);

  // pagination / load-more
  const paginated = useMemo(() => {
    return filteredContainers.slice(0, page * PAGE_SIZE);
  }, [filteredContainers, page]);
  const hasMore = filteredContainers.length > paginated.length;

  // UX helpers
  function goToContainer(code) {
    router.push(`/dashboard/loading/${encodeURIComponent(code)}`);
  }
  function handleNewLoading() {
    router.push("/dashboard/loading/new");
  }

  // quick "refresh" (re-read localStorage)
  function refreshFromStorage() {
    setLoading(true);
    setTimeout(() => {
      try {
        const raw = JSON.parse(localStorage.getItem("igpl_loading") || "[]");
        setSheets(raw || []);
        toast.success("Loaded latest from localStorage");
      } catch {
        toast.error("Failed to parse localStorage");
      } finally {
        setLoading(false);
      }
    }, 200);
  }

  // UI
  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto">
        {/* header */}
        <header className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Containers Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              High-level aggregated view of containers. Click a container to
              view its sheets. For best performance with millions of records,
              aggregate on the server and fetch only container rows.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleNewLoading}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded shadow"
            >
              <Plus className="w-4 h-4" /> New Loading
            </button>

            <button
              onClick={refreshFromStorage}
              className="px-3 py-2 rounded border bg-white text-slate-700"
              title="Reload from localStorage"
            >
              Refresh
            </button>
          </div>
        </header>

        <div className="bg-white border rounded-lg shadow overflow-hidden">
          {/* filters */}
          <div className="p-4 border-b flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-3 w-full md:w-2/3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-3 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Find container code (e.g. PSDH-86)..."
                  className="pl-10 pr-4 py-2 border rounded-md w-full focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <input
                value={originFilter}
                onChange={(e) => {
                  setOriginFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Origin (optional)"
                className="py-2 px-3 border rounded-md"
              />

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="py-2 px-3 border rounded-md"
                aria-label="Filter by status"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setQ("");
                  setOriginFilter("");
                  setStatusFilter("");
                  setPage(1);
                }}
                className="px-3 py-1 rounded bg-slate-100"
              >
                Reset
              </button>
              <button className="px-3 py-1 rounded bg-slate-50 text-slate-600 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Advanced
              </button>
            </div>
          </div>

          {/* list header (sticky feel) */}
          <div className="px-4 py-3 border-b flex items-center justify-between bg-white/70">
            <div className="text-sm text-slate-600">
              Showing{" "}
              <strong className="text-slate-800">{paginated.length}</strong> of{" "}
              <strong className="text-slate-800">
                {filteredContainers.length}
              </strong>{" "}
              containers
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500">
                Totals across visible containers
              </div>
              {/* aggregate totals for visible page */}
              <div className="px-3 py-2 bg-sky-50 rounded text-sky-700">
                CTN {paginated.reduce((a, c) => a + (c.tctn || 0), 0)}
              </div>
              <div className="px-3 py-2 bg-sky-100 rounded text-sky-800">
                PCS {paginated.reduce((a, c) => a + (c.tpcs || 0), 0)}
              </div>
              <div className="px-3 py-2 bg-slate-50 rounded text-slate-800">
                CBM{" "}
                {paginated.reduce((a, c) => a + (c.tcbm || 0), 0).toFixed(3)}
              </div>
            </div>
          </div>

          {/* list */}
          <div>
            {loading ? (
              <div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonItem key={i} />
                ))}
              </div>
            ) : (
              <div>
                {paginated.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No containers found — change filters or add a new loading
                    sheet.
                  </div>
                ) : (
                  paginated.map((c) => (
                    <div
                      key={c.containerCode}
                      className="p-4 border-b hover:bg-slate-50 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className="w-14 h-14 rounded-md bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center text-white font-semibold text-sm shrink-0"
                          aria-hidden
                        >
                          {c.containerCode.split("-")[0]}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => goToContainer(c.containerCode)}
                              className="text-lg font-semibold text-slate-900 hover:underline truncate"
                              title={`Open ${c.containerCode}`}
                            >
                              {c.containerCode}
                            </button>

                            <div className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {c.status}
                            </div>
                          </div>

                          <div className="text-sm text-slate-500 truncate">
                            Origin{" "}
                            <strong className="text-slate-800 ml-1">
                              {c.origin}
                            </strong>{" "}
                            • Last loading: {c.lastLoadingDate || "—"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-500 text-right">
                          <div>
                            Sheets{" "}
                            <div className="font-semibold text-slate-900">
                              {c.sheets}
                            </div>
                          </div>
                        </div>

                        <div className="text-sm">
                          <div className="bg-sky-50 px-3 py-1 rounded text-sky-800">
                            CTN {c.tctn}
                          </div>
                        </div>

                        <div className="text-sm">
                          <div className="bg-sky-100 px-3 py-1 rounded text-sky-900">
                            PCS {c.tpcs}
                          </div>
                        </div>

                        <div className="text-sm">
                          <button
                            onClick={() => goToContainer(c.containerCode)}
                            className="px-3 py-2 rounded bg-white border text-slate-700 inline-flex items-center gap-2"
                          >
                            Details <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* pagination / footer */}
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {paginated.length} of {filteredContainers.length}{" "}
              containers
            </div>

            <div>
              {hasMore ? (
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded bg-sky-600 text-white"
                >
                  Load more
                </button>
              ) : (
                <div className="text-sm text-slate-500">End of list</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
