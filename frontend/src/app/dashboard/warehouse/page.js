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
} from "lucide-react";

const DEMO_SEED = [
  {
    id: "demo-1",
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "2025-10-09",
    status: "Loaded",
    tctn: 42,
    tpcs: 1300,
    tcbm: 4.585,
    twt: 414,
    clients: ["BB-AMD", "RAJ"],
  },
  {
    id: "demo-2",
    containerCode: "PSDH-86",
    origin: "YIWU",
    loadingDate: "2025-10-09",
    status: "Insea",
    tctn: 170,
    tpcs: 5000,
    tcbm: 11.2,
    twt: 1200,
    clients: ["SMWINK", "KD", "BB-AMD"],
  },
  {
    id: "demo-3",
    containerCode: "ABC-22",
    origin: "SHANGHAI",
    loadingDate: "2025-09-15",
    status: "Delivered",
    tctn: 10,
    tpcs: 400,
    tcbm: 1.11,
    twt: 90,
    clients: ["RAJ"],
  },
  {
    id: "demo-4",
    containerCode: "MSC-123",
    origin: "NINGBO",
    loadingDate: "2025-10-01",
    status: "Loaded",
    tctn: 85,
    tpcs: 2500,
    tcbm: 6.8,
    twt: 750,
    clients: ["BB-AMD", "SMWINK", "NEW-CLIENT"],
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

export default function WarehouseContainersPage() {
  const router = useRouter();

  // UI state
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Load data from localStorage
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      try {
        const raw = JSON.parse(localStorage.getItem("igpl_warehouse") || "null");
        if (!raw || !Array.isArray(raw) || raw.length === 0) {
          localStorage.setItem("igpl_warehouse", JSON.stringify(DEMO_SEED));
          setContainers(DEMO_SEED);
        } else {
          setContainers(raw);
        }
      } catch (err) {
        localStorage.setItem("igpl_warehouse", JSON.stringify(DEMO_SEED));
        setContainers(DEMO_SEED);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, []);

  // Get unique values for filters
  const uniqueOrigins = useMemo(() => {
    const origins = new Set();
    containers.forEach((container) => {
      if (container.origin) origins.add(container.origin);
    });
    return Array.from(origins).sort();
  }, [containers]);

  const uniqueStatuses = ["Loaded", "Insea", "Delivered"];

  // Filter containers
  const filteredContainers = useMemo(() => {
    if (!containers || containers.length === 0) return [];

    const query = searchQuery.trim().toLowerCase();
    return containers.filter((container) => {
      // Search by container code
      const matchesQuery =
        !query || container.containerCode.toLowerCase().includes(query);

      // Filter by origin
      const matchesOrigin = !originFilter || container.origin === originFilter;

      // Filter by status
      const matchesStatus = !statusFilter || container.status === statusFilter;

      // Filter by date range
      let matchesDate = true;
      if (dateFrom && container.loadingDate) {
        matchesDate =
          matchesDate && new Date(container.loadingDate) >= new Date(dateFrom);
      }
      if (dateTo && container.loadingDate) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59); // Include entire end day
        matchesDate = matchesDate && new Date(container.loadingDate) <= toDate;
      }

      return matchesQuery && matchesOrigin && matchesStatus && matchesDate;
    });
  }, [containers, searchQuery, originFilter, statusFilter, dateFrom, dateTo]);

  // Navigation
  function goToContainer(code) {
    router.push(`/dashboard/warehouse/${encodeURIComponent(code)}`);
  }

  // Refresh data
  function refreshFromStorage() {
    setLoading(true);
    setTimeout(() => {
      try {
        const raw = JSON.parse(localStorage.getItem("igpl_warehouse") || "[]");
        setContainers(raw || []);
        toast.success("Data refreshed");
      } catch {
        toast.error("Failed to load data");
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
      "PCS",
      "CBM",
      "Weight",
      "Clients",
      "Client Count",
    ];
    const csvData = filteredContainers.map((container) => [
      container.containerCode,
      container.origin,
      container.status,
      container.loadingDate,
      container.tctn,
      container.tpcs,
      container.tcbm.toFixed(3),
      container.twt.toFixed(2),
      container.clients.join(", "),
      container.clients.length,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `warehouse_containers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("CSV exported successfully");
  }

  // Get status badge color
  function getStatusColor(status) {
    switch (status) {
      case "Loaded":
        return "bg-green-100 text-green-800 border-green-200";
      case "Insea":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Delivered":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  // Clear all filters
  function clearAllFilters() {
    setSearchQuery("");
    setOriginFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start justify-between mb-8 gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Warehouse Containers
            </h1>
            <p className="text-sm text-slate-600">
              Overview of all containers in warehouse
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
                  Search Container
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Container code..."
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
                  onChange={(e) => setOriginFilter(e.target.value)}
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
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">All Status</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
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
                      onChange={(e) => setDateFrom(e.target.value)}
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
                      onChange={(e) => setDateTo(e.target.value)}
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
                <strong className="text-slate-900">{filteredContainers.length}</strong>{" "}
                of{" "}
                <strong className="text-slate-900">
                  {containers.length}
                </strong>{" "}
                containers
              </div>
              <div className="text-xs text-slate-500">
                <Filter className="w-3 h-3 inline mr-1" />
                {filteredContainers.length === containers.length
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
            ) : filteredContainers.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-slate-400 mb-3 text-lg">
                  No containers found
                </div>
              </div>
            ) : (
              <div>
                {filteredContainers.map((container) => (
                  <div
                    key={container.id}
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
                                {container.status}
                              </span>
                            </div>

                            <div className="text-sm text-slate-600 mb-3">
                              <span className="font-medium text-slate-800">
                                {container.origin}
                              </span>
                              {" • "}
                              Loading Date: {container.loadingDate || "—"}
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
                                {container.clients.length > 3 && (
                                  <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded">
                                    +{container.clients.length - 3} more
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 ml-1">
                                ({container.clients.length} total)
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
                          <div className="text-xs text-slate-500 mb-1">PCS</div>
                          <div className="text-lg font-bold text-slate-900 bg-blue-50 px-3 py-1.5 rounded">
                            {container.tpcs.toLocaleString()}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-xs text-slate-500 mb-1">CBM</div>
                          <div className="text-lg font-bold text-slate-900 bg-blue-50 px-3 py-1.5 rounded">
                            {container.tcbm.toFixed(3)}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-xs text-slate-500 mb-1">
                            Weight
                          </div>
                          <div className="text-lg font-bold text-slate-900 bg-blue-50 px-3 py-1.5 rounded">
                            {container.twt.toFixed(2)} kg
                          </div>
                        </div>

                        <div className="text-center">
                          <button
                            onClick={() =>
                              goToContainer(container.containerCode)
                            }
                            className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded hover:bg-slate-50"
                          >
                            Details <ChevronRight className="w-4 h-4" />
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
                Total: {filteredContainers.length} containers
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}