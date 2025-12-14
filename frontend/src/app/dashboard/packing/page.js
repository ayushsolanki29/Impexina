"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  Calendar,
  Download,
  RefreshCw,
  FileText,
} from "lucide-react";

const PACK_KEY = "igpl_packing_v1";
const OLD_KEY = "igpl_loading"; // fallback

const DEMO_SEED = [
  {
    id: "pack-1",
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "2025-10-09",
    status: "draft",
    tctn: 42,
    tQty: 1300,
    tKg: 414,
    meta: { companyName: "Demo Co.", invNo: "D-001" },
    items: [
      { particular: "LED Lights", mark: "ABC", itemNumber: "LED-001", ctn: 10, qty: 300, kg: 100 },
      { particular: "Power Banks", mark: "XYZ", itemNumber: "PB-002", ctn: 32, qty: 1000, kg: 314 }
    ],
    clients: ["BB-AMD", "RAJ"]
  },
  {
    id: "pack-2",
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "2025-10-09",
    status: "completed",
    tctn: 170,
    tQty: 5000,
    tKg: 1200,
    meta: { companyName: "Demo Co.", invNo: "D-002" },
    items: [
      { particular: "Solar Panels", mark: "SOLAR", itemNumber: "SP-100", ctn: 85, qty: 2500, kg: 600 },
      { particular: "Batteries", mark: "BATT", itemNumber: "BT-200", ctn: 85, qty: 2500, kg: 600 }
    ],
    clients: ["SMWINK", "KD"]
  },
  {
    id: "pack-3",
    containerCode: "ABC-22",
    origin: "SHANGHAI",
    loadingDate: "2025-09-15",
    status: "draft",
    tctn: 10,
    tQty: 400,
    tKg: 90,
    meta: { companyName: "Demo Co.", invNo: "D-003" },
    items: [
      { particular: "USB Cables", mark: "USB", itemNumber: "USB-001", ctn: 10, qty: 400, kg: 90 }
    ],
    clients: ["RAJ"]
  },
  {
    id: "pack-4",
    containerCode: "MSC-123",
    origin: "NINGBO",
    loadingDate: "2025-10-01",
    status: "completed",
    tctn: 85,
    tQty: 2500,
    tKg: 750,
    meta: { companyName: "Demo Co.", invNo: "D-004" },
    items: [
      { particular: "Wireless Mouse", mark: "WM", itemNumber: "WM-001", ctn: 85, qty: 2500, kg: 750 }
    ],
    clients: ["BB-AMD", "NEW-CLIENT"]
  },
];

function SkeletonItem() {
  return (
    <div className="animate-pulse p-5 border-b bg-white/40">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-slate-200 rounded-lg" />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-40 h-6 bg-slate-200 rounded" />
            <div className="w-20 h-6 bg-slate-200 rounded" />
          </div>
          <div className="flex gap-6">
            <div className="w-24 h-4 bg-slate-200 rounded" />
            <div className="w-24 h-4 bg-slate-200 rounded" />
            <div className="w-24 h-4 bg-slate-200 rounded" />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-20 h-8 bg-slate-200 rounded" />
          <div className="w-20 h-8 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // load on mount
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      try {
        let stored = readLocal(PACK_KEY);
        if (!stored || !Array.isArray(stored) || stored.length === 0) {
          const fallback = readLocal(OLD_KEY);
          if (fallback && Array.isArray(fallback) && fallback.length) {
            stored = fallback.map((s) => ({
              ...s,
              containerCode: s.containerCode || (s.meta && s.meta.containerCode) || "UNKNOWN",
              origin: s.origin || (s.meta && s.meta.origin) || "",
              loadingDate: s.loadingDate || "",
              status: s.status || "draft",
              tctn: s.tctn ?? s.totals?.ctn ?? s.rows?.reduce?.((a,b)=>a+(b.ctn||0),0) ?? 0,
              tQty: s.tpcs ?? s.totals?.tpcs ?? s.tQty ?? 0,
              tKg: s.twt ?? s.totals?.twt ?? s.tKg ?? 0,
              items: s.items || s.rows || [],
              clients: s.clients || (s.meta && s.meta.client ? [s.meta.client] : []),
              id: s.id || `sheet-${Math.random().toString(36).slice(2,8)}`,
              meta: s.meta || {}
            }));
            writeLocal(PACK_KEY, stored);
          } else {
            stored = DEMO_SEED;
            writeLocal(PACK_KEY, stored);
          }
        }
        setSheets(stored);
      } catch (e) {
        setSheets(DEMO_SEED);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, []);

  // Get unique values for filters
  const uniqueOrigins = useMemo(() => {
    const origins = new Set();
    sheets.forEach((sheet) => {
      if (sheet.origin) origins.add(sheet.origin);
    });
    return Array.from(origins).sort();
  }, [sheets]);

  const uniqueStatuses = ["draft", "completed"];

  // Aggregate containers
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
          clients: new Set(),
          tctn: 0,
          tQty: 0,
          tKg: 0,
          status: s.status || "draft",
          sheetCount: 0,
          itemsCount: 0,
        });
      }
      const g = map.get(key);
      g.sheetCount += 1;
      g.tctn += Number(s.tctn || 0);
      g.tQty += Number(s.tQty || s.tpcs || 0);
      g.tKg += Number(s.tKg || s.twt || 0);
      g.itemsCount += (s.items && Array.isArray(s.items)) ? s.items.length : 0;

      // Add clients from sheet
      if (s.clients && Array.isArray(s.clients)) {
        s.clients.forEach((client) => g.clients.add(client));
      } else if (s.meta && s.meta.companyName) {
        g.clients.add(s.meta.companyName);
      }

      // Take latest status
      if (
        s.loadingDate &&
        new Date(s.loadingDate) > new Date(g.lastLoadingDate)
      ) {
        g.lastLoadingDate = s.loadingDate;
        if (s.status) g.status = s.status;
      }
    }

    // Convert to array
    const arr = Array.from(map.values()).map((g) => ({
      ...g,
      clientCount: g.clients.size,
      clients: Array.from(g.clients).sort(),
    }));

    // Sort by last loading date desc
    arr.sort((a, b) => {
      const da = a.lastLoadingDate ? new Date(a.lastLoadingDate).getTime() : 0;
      const db = b.lastLoadingDate ? new Date(b.lastLoadingDate).getTime() : 0;
      return db - da;
    });

    return arr;
  }, [sheets]);

  // Filter containers
  const filteredContainers = useMemo(() => {
    if (!containerAggregates || containerAggregates.length === 0) return [];

    const qLower = q.trim().toLowerCase();
    return containerAggregates.filter((c) => {
      // Search by container code, origin, or client
      const matchesQ =
        !qLower ||
        c.containerCode.toLowerCase().includes(qLower) ||
        c.origin.toLowerCase().includes(qLower) ||
        c.clients.some(client => client.toLowerCase().includes(qLower));

      // Filter by origin
      const matchesOrigin = !originFilter || c.origin === originFilter;

      // Filter by status
      const matchesStatus = !statusFilter || c.status === statusFilter;

      // Filter by date range
      let matchesDate = true;
      if (dateFrom && c.lastLoadingDate) {
        matchesDate =
          matchesDate && new Date(c.lastLoadingDate) >= new Date(dateFrom);
      }
      if (dateTo && c.lastLoadingDate) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59);
        matchesDate = matchesDate && new Date(c.lastLoadingDate) <= toDate;
      }

      return matchesQ && matchesOrigin && matchesStatus && matchesDate;
    });
  }, [containerAggregates, q, originFilter, statusFilter, dateFrom, dateTo]);

  // Pagination
  const paginated = useMemo(() => {
    return filteredContainers.slice(0, page * PAGE_SIZE);
  }, [filteredContainers, page]);
  const hasMore = filteredContainers.length > paginated.length;

  // Navigation
  function goToContainer(code) {
    router.push(`/dashboard/packing/${encodeURIComponent(code)}`);
  }

  function handleNewPacking() {
    router.push("/dashboard/packing/new");
  }

  // Refresh data
  function refreshFromStorage() {
    setLoading(true);
    setTimeout(() => {
      try {
        let stored = readLocal(PACK_KEY);
        if (!stored || !Array.isArray(stored)) {
          stored = DEMO_SEED;
        }
        setSheets(stored);
        toast.success("Data refreshed from storage");
      } catch {
        toast.error("Failed to parse storage data");
      } finally {
        setLoading(false);
      }
    }, 200);
  }

  // Export data
  function exportToCSV() {
    const headers = [
      "Container Code",
      "Origin",
      "Status",
      "Loading Date",
      "CTN",
      "QTY",
      "Weight (kg)",
      "Sheets",
      "Items",
      "Clients",
      "Client Count",
    ];
    const csvData = filteredContainers.map((container) => [
      container.containerCode,
      container.origin,
      container.status,
      container.lastLoadingDate,
      container.tctn,
      container.tQty,
      container.tKg.toFixed(2),
      container.sheetCount,
      container.itemsCount,
      container.clients.join(", "),
      container.clientCount,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `packing_containers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("CSV exported successfully");
  }

  // Get status badge color
  function getStatusColor(status) {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  // Clear all filters
  function clearAllFilters() {
    setQ("");
    setOriginFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  // Quick export container CSV
  function exportContainerCSV(container) {
    const sheetsForContainer = sheets.filter(s => s.containerCode === container.containerCode);
    const rows = [];
    for (const s of sheetsForContainer) {
      rows.push([
        s.id || "",
        s.containerCode || "",
        s.origin || "",
        s.loadingDate || "",
        s.tctn || 0,
        s.tQty || 0,
        s.tKg || 0,
        s.status || "",
        s.meta?.companyName || "",
        s.meta?.invNo || "",
      ]);
    }
    const csv = ["id,container,origin,loadingDate,ctn,tQty,tKg,status,client,invoice", ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${container.containerCode}_packing_sheets.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Container CSV exported");
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start justify-between mb-8 gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Packing — Containers
            </h1>
            <p className="text-sm text-slate-600">
              Manage and track all packing containers. Click on any container to view detailed packing sheets and generate printable packing lists.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
          

            <button
              onClick={refreshFromStorage}
              className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
              <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded shadow"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </header>

        {/* Main Container */}
        <div className="bg-white border rounded-lg shadow overflow-hidden">
          {/* Filters Section */}
          <div className="p-5 border-b bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                Filters & Search
              </h2>
              <button
                onClick={clearAllFilters}
                className="text-sm text-slate-600 hover:text-slate-800 px-3 py-1 rounded border"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Search Container, Client, or Origin
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                  <input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Container, client, origin..."
                    className="pl-10 pr-4 py-2.5 border border-slate-300 rounded w-full focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>

              {/* Origin Filter */}
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Origin
                </label>
                <select
                  value={originFilter}
                  onChange={(e) => {
                    setOriginFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">All Origins</option>
                  {uniqueOrigins.map((origin) => (
                    <option key={origin} value={origin}>
                      {origin}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">All Status</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">
                    Date From
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10 pr-3 py-2.5 border border-slate-300 rounded w-full focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">
                    Date To
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10 pr-3 py-2.5 border border-slate-300 rounded w-full focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Header */}
          <div className="px-5 py-4 border-b bg-white/70">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Showing{" "}
                <strong className="text-slate-900">{paginated.length}</strong>{" "}
                of{" "}
                <strong className="text-slate-900">
                  {filteredContainers.length}
                </strong>{" "}
                containers
              </div>
              <div className="text-xs text-slate-500">
                <Filter className="w-3 h-3 inline mr-1" />
                {filteredContainers.length === containerAggregates.length
                  ? "No filters applied"
                  : `${filteredContainers.length} results after filtering`}
              </div>
            </div>
          </div>

          {/* Containers List */}
          <div>
            {loading ? (
              <div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonItem key={i} />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-slate-400 mb-3 text-lg">
                  No packing containers found
                </div>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Try adjusting your filters or create a new packing sheet.
                </p>
                <button
                  onClick={handleNewPacking}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded"
                >
                  <Plus className="w-4 h-4" /> Create First Packing Sheet
                </button>
              </div>
            ) : (
              <div>
                {paginated.map((container) => (
                  <div
                    key={container.containerCode}
                    className="p-5 border-b hover:bg-slate-50 transition-colors duration-150"
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Left Section: Container Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                            {container.containerCode.split("-")[0]}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <button
                                onClick={() =>
                                  goToContainer(container.containerCode)
                                }
                                className="text-xl font-bold text-slate-900 hover:text-blue-700 hover:underline truncate"
                                title={`Open ${container.containerCode}`}
                              >
                                {container.containerCode}
                              </button>

                              <span
                                className={`text-xs px-3 py-1.5 rounded-full border ${getStatusColor(
                                  container.status
                                )} font-medium`}
                              >
                                {container.status.charAt(0).toUpperCase() + container.status.slice(1)}
                              </span>
                            </div>

                            <div className="text-sm text-slate-600 mb-3">
                              <span className="font-medium text-slate-800">
                                {container.origin}
                              </span>
                              {" • "}
                              Last packing: {container.lastLoadingDate || "—"}
                              {" • "}
                              {container.sheetCount} sheet{container.sheetCount !== 1 ? "s" : ""}
                              {" • "}
                              {container.itemsCount} items
                            </div>

                            {/* Clients */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-slate-700">
                                Clients:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {container.clients
                                  .slice(0, 3)
                                  .map((client, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded"
                                    >
                                      {client}
                                    </span>
                                  ))}
                                {container.clientCount > 3 && (
                                  <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded">
                                    +{container.clientCount - 3} more
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 ml-1">
                                ({container.clientCount} total)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Section: Metrics */}
                      <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-start xl:items-center gap-4 lg:gap-3 xl:gap-6">
                        <div className="text-center">
                          <div className="text-xs text-slate-500 mb-1">CTN</div>
                          <div className="text-lg font-bold text-slate-900 bg-blue-50 px-3 py-1.5 rounded">
                            {container.tctn.toLocaleString()}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-xs text-slate-500 mb-1">QTY</div>
                          <div className="text-lg font-bold text-slate-900 bg-blue-50 px-3 py-1.5 rounded">
                            {container.tQty.toLocaleString()}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-xs text-slate-500 mb-1">
                            Weight
                          </div>
                          <div className="text-lg font-bold text-slate-900 bg-blue-50 px-3 py-1.5 rounded">
                            {container.tKg.toFixed(2)} kg
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              goToContainer(container.containerCode)
                            }
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                          >
                            <FileText className="w-4 h-4" /> Open
                          </button>
                          <button
                            onClick={() => exportContainerCSV(container)}
                            className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded hover:bg-slate-50"
                            title="Export container CSV"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                Page {page} • {paginated.length} containers shown •{" "}
                {filteredContainers.length} total after filters
              </div>

              <div className="flex items-center gap-3">
                {page > 1 && (
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50"
                  >
                    Previous
                  </button>
                )}

                {hasMore && (
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Load More Containers
                  </button>
                )}

                {!hasMore && paginated.length > 0 && (
                  <div className="text-sm text-slate-500">
                    All containers loaded
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}