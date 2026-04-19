"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Search, Calendar, DollarSign, Package, Ship, FileText, Eye,
  ChevronDown, ChevronUp, CheckCircle, Clock, TrendingUp, BarChart3,
  Grid, List, RefreshCw, Loader2, Users, Box, Truck, Waves, X,
  ChevronRight, Home, Percent, Database, ChevronsUpDown, Check,
  FileSpreadsheet, ChevronLeft, MoreHorizontal,
} from "lucide-react";
import API from "@/lib/api";

// Multi-select dropdown
const MultiSelect = ({ value = [], onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = (opt) => onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  const label = value.length === 0 ? placeholder : value.length === 1 ? value[0] : `${value.length} selected`;
  return (
    <div className="relative w-full" ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer bg-white hover:border-blue-400 transition-all text-sm">
        <span className={value.length > 0 ? "text-gray-900 font-medium truncate" : "text-gray-400"}>{label}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value.length > 0 && <button onClick={(e) => { e.stopPropagation(); onChange([]); }} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>}
          <ChevronsUpDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-56 overflow-y-auto">
          {options.map((opt) => (
            <button key={opt} onClick={() => toggle(opt)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between">
              <span className={value.includes(opt) ? "text-blue-600 font-semibold" : "text-gray-700"}>{opt}</span>
              {value.includes(opt) && <Check className="w-3 h-3 text-blue-600" />}
            </button>
          ))}
          {options.length === 0 && <div className="px-3 py-2 text-xs text-gray-400 text-center">No options</div>}
        </div>
      )}
    </div>
  );
};

// Pagination component
const Pagination = ({ pagination, onPageChange, onLimitChange }) => {
  const { page, totalPages, total, limit, hasNextPage, hasPrevPage } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) pages.push(i);

  const btnBase = "h-9 min-w-[36px] px-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed";
  const btnDefault = `${btnBase} border-gray-200 bg-white hover:bg-gray-50 text-gray-700`;
  const btnActive = `${btnBase} border-blue-600 bg-blue-600 text-white`;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-gray-100">
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>Showing <span className="font-semibold text-gray-900">{from}–{to}</span> of <span className="font-semibold text-gray-900">{total}</span></span>
        <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
          {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1">
        {/* First */}
        <button onClick={() => onPageChange(1)} disabled={!hasPrevPage} className={btnDefault}>
          <ChevronLeft className="w-3.5 h-3.5" /><ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {/* Prev */}
        <button onClick={() => onPageChange(page - 1)} disabled={!hasPrevPage} className={btnDefault}>
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages[0] > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className={btnDefault}>1</button>
            {pages[0] > 2 && <span className="px-1 text-gray-400 text-sm">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button key={p} onClick={() => onPageChange(p)} className={p === page ? btnActive : btnDefault}>{p}</button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-gray-400 text-sm">…</span>}
            <button onClick={() => onPageChange(totalPages)} className={btnDefault}>{totalPages}</button>
          </>
        )}

        {/* Next */}
        <button onClick={() => onPageChange(page + 1)} disabled={!hasNextPage} className={btnDefault}>
          <ChevronRight className="w-4 h-4" />
        </button>
        {/* Last */}
        <button onClick={() => onPageChange(totalPages)} disabled={!hasNextPage} className={btnDefault}>
          <ChevronRight className="w-3.5 h-3.5" /><ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default function ContainerDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [containers, setContainers] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ origins: [], shippingLines: [], containerCodes: [], statuses: [], months: [] });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [sortConfig, setSortConfig] = useState({ key: "loadingDate", direction: "desc" });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const [stats, setStats] = useState({ totalContainers: 0, totalValue: 0, totalFinalAmount: 0, totalCTN: 0, totalDuty: 0, totalGST: 0, statusBreakdown: {} });

  const parseArr = (key) => {
    const val = searchParams.get(key);
    return val ? val.split(",").map(decodeURIComponent).filter(Boolean) : [];
  };

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    status: parseArr("status"),
    month: parseArr("month"),
    shippingLine: parseArr("shippingLine"),
    containerCode: parseArr("containerCode"),
    origin: parseArr("origin"),
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
  });

  const syncURL = (f, p = 1) => {
    const params = new URLSearchParams();
    if (f.search) params.set("search", f.search);
    ["status", "month", "shippingLine", "containerCode", "origin"].forEach((k) => {
      if (f[k]?.length) params.set(k, f[k].map(encodeURIComponent).join(","));
    });
    if (f.dateFrom) params.set("dateFrom", f.dateFrom);
    if (f.dateTo) params.set("dateTo", f.dateTo);
    if (p > 1) params.set("page", p);
    window.history.replaceState(null, "", params.toString() ? `?${params}` : window.location.pathname);
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      syncURL(next, 1);
      return next;
    });
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const clearFilters = () => {
    const empty = { search: "", status: [], month: [], shippingLine: [], containerCode: [], origin: [], dateFrom: "", dateTo: "" };
    setFilters(empty);
    setPagination((p) => ({ ...p, page: 1 }));
    window.history.replaceState(null, "", window.location.pathname);
  };

  const hasActiveFilters = filters.search || filters.status.length || filters.month.length ||
    filters.shippingLine.length || filters.containerCode.length || filters.origin.length ||
    filters.dateFrom || filters.dateTo;

  const fetchContainers = useCallback(async (f, page, limit) => {
    setLoading(true);
    try {
      const params = {
        page, limit,
        search: f.search,
        status: f.status.join(","),
        month: f.month.join(","),
        shippingLine: f.shippingLine.join(","),
        containerCode: f.containerCode.join(","),
        origin: f.origin.join(","),
        dateFrom: f.dateFrom,
        dateTo: f.dateTo,
      };
      const res = await API.get("/container-summaries/containers/all", { params });
      if (res.data.success) {
        setContainers(res.data.data.containers || []);
        setPagination(res.data.data.pagination);
        setStats({
          totalContainers: res.data.data.stats.totalContainers,
          totalValue: res.data.data.stats.totalValue,
          totalFinalAmount: res.data.data.stats.totalFinalAmount,
          totalCTN: res.data.data.stats.totalCTN,
          totalDuty: res.data.data.stats.totalDuty,
          totalGST: res.data.data.stats.totalGST,
          statusBreakdown: res.data.data.stats.statusBreakdown || {},
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load containers");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await API.get("/container-summaries/containers/filter-options");
      if (res.data.success) setFilterOptions(res.data.data);
    } catch (err) {
      console.error("Failed to load filter options", err);
    }
  }, []);

  useEffect(() => { fetchFilterOptions(); }, [fetchFilterOptions]);
  useEffect(() => { fetchContainers(filters, pagination.page, pagination.limit); }, [filters, pagination.page, pagination.limit]);

  const handlePageChange = (p) => {
    setPagination((prev) => ({ ...prev, page: p }));
    syncURL(filters, p);
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    const main = document.querySelector("main");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLimitChange = (l) => {
    setPagination((prev) => ({ ...prev, limit: l, page: 1 }));
    syncURL(filters, 1);
  };

  const sortedContainers = useMemo(() => {
    return [...containers].sort((a, b) => {
      let aVal = a[sortConfig.key], bVal = b[sortConfig.key];
      if (["loadingDate", "eta"].includes(sortConfig.key)) { aVal = new Date(aVal || 0).getTime(); bVal = new Date(bVal || 0).getTime(); }
      if (["dollar", "finalAmount", "ctn", "totalDuty", "gst"].includes(sortConfig.key)) { aVal = parseFloat(aVal || 0); bVal = parseFloat(bVal || 0); }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [containers, sortConfig]);

  const handleSort = (key) => setSortConfig((p) => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));
  const toggleRowExpand = (id) => setExpandedRows((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const exportToExcel = async () => {
    setExporting(true);
    try {
      await API.download("/container-summaries/export/all/excel", {}, `containers_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Export completed");
    } catch { toast.error("Export failed"); } finally { setExporting(false); }
  };

  const fmt = (n) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  const fmtN = (n) => new Intl.NumberFormat("en-IN").format(n || 0);
  const fmtDate = (d) => { if (!d) return "-"; try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; } };

  const statusColor = (s) => ({ Loaded: "bg-emerald-50 text-emerald-700 border-emerald-200", Insea: "bg-sky-50 text-sky-700 border-sky-200", Delivered: "bg-violet-50 text-violet-700 border-violet-200" }[s] || "bg-gray-50 text-gray-700 border-gray-200");
  const statusIcon = (s) => ({ Loaded: <CheckCircle className="w-4 h-4" />, Insea: <Waves className="w-4 h-4" />, Delivered: <Truck className="w-4 h-4" /> }[s] || <Clock className="w-4 h-4" />);
  const statusText = (s) => s === "Insea" ? "In Sea" : s;

  const loadedCount = stats.statusBreakdown["Loaded"] || 0;
  const inseaCount = stats.statusBreakdown["Insea"] || 0;
  const deliveredCount = stats.statusBreakdown["Delivered"] || 0;
  const avgDollar = stats.totalContainers > 0 ? stats.totalValue / stats.totalContainers : 0;
  const avgFinal = stats.totalContainers > 0 ? stats.totalFinalAmount / stats.totalContainers : 0;

  if (loading && containers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading containers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Home className="w-4 h-4" /><ChevronRight className="w-3 h-3" />
            <span>Dashboard</span><ChevronRight className="w-3 h-3" />
            <span className="text-blue-600 font-medium">Containers</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Container Dashboard</h1>
              <p className="text-gray-500 mt-1 text-sm">
                {hasActiveFilters ? `Filtered view — ${stats.totalContainers} containers` : `All containers — ${stats.totalContainers} total`}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => fetchContainers(filters, pagination.page, pagination.limit)} disabled={loading} className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-500 p-3 rounded-2xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={exportToExcel} disabled={exporting} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-3 rounded-2xl hover:bg-emerald-100 border border-emerald-200 font-semibold text-sm disabled:opacity-50">
                {exporting ? <><Loader2 className="w-4 h-4 animate-spin" />Exporting...</> : <><FileSpreadsheet className="w-4 h-4" />Export Excel</>}
              </button>
              <button onClick={() => router.push("/dashboard/container-summary/create")} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl hover:bg-slate-800 font-semibold text-sm shadow-lg active:scale-95">
                <Package className="w-4 h-4" />New Summary
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Containers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{fmtN(stats.totalContainers)}</p>
                <p className="text-xs text-gray-400 mt-1">Page {pagination.page} of {pagination.totalPages}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl"><Database className="w-5 h-5 text-blue-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${fmt(stats.totalValue)}</p>
                <p className="text-xs text-gray-400 mt-1">Avg ${fmt(avgDollar)} / container</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Final Amount</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">&#8377;{fmt(stats.totalFinalAmount)}</p>
                <p className="text-xs text-gray-400 mt-1">Avg &#8377;{fmt(avgFinal)} / container</p>
              </div>
              <div className="p-3 bg-violet-50 rounded-xl"><TrendingUp className="w-5 h-5 text-violet-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Status Breakdown</p>
              <div className="p-3 bg-amber-50 rounded-xl"><BarChart3 className="w-5 h-5 text-amber-600" /></div>
            </div>
            <div className="space-y-2">
              {[["Loaded", loadedCount, "bg-emerald-500", "bg-emerald-50 text-emerald-700 border-emerald-100"],
                ["In Sea", inseaCount, "bg-sky-500", "bg-sky-50 text-sky-700 border-sky-100"],
                ["Delivered", deliveredCount, "bg-violet-500", "bg-violet-50 text-violet-700 border-violet-100"]].map(([label, count, dot, badge]) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${dot}`}></div><span className="text-xs text-gray-600 font-medium">{label}</span></div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badge}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total CTN", value: fmtN(stats.totalCTN), icon: <Box className="w-4 h-4 text-gray-600" />, bg: "bg-gray-50" },
            { label: "Total Duty", value: `\u20B9${fmt(stats.totalDuty)}`, icon: <Percent className="w-4 h-4 text-amber-600" />, bg: "bg-amber-50" },
            { label: "Total GST", value: `\u20B9${fmt(stats.totalGST)}`, icon: <Users className="w-4 h-4 text-purple-600" />, bg: "bg-purple-50" },
            { label: "Showing", value: `${sortedContainers.length} / ${pagination.total}`, icon: <Ship className="w-4 h-4 text-sky-600" />, bg: "bg-sky-50" },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${bg} rounded-lg`}>{icon}</div>
                <div><p className="text-xs text-gray-500">{label}</p><p className="text-base font-semibold text-gray-900">{value}</p></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Filters</h2>
              {hasActiveFilters && <p className="text-xs text-blue-600 mt-0.5">Active filters applied</p>}
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 border border-gray-200 rounded-lg hover:border-red-200 transition-colors">
                  <X className="w-3.5 h-3.5" />Clear
                </button>
              )}
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
                <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded transition-all ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}><Grid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode("table")} className={`p-1.5 rounded transition-all ${viewMode === "table" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}><List className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search container code, BL, shipping line, invoice..." value={filters.search} onChange={(e) => updateFilter("search", e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
            {/* Row 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MultiSelect value={filters.status} onChange={(v) => updateFilter("status", v)} options={filterOptions.statuses} placeholder="All Status" />
              <MultiSelect value={filters.month} onChange={(v) => updateFilter("month", v)} options={filterOptions.months} placeholder="All Months" />
              <MultiSelect value={filters.shippingLine} onChange={(v) => updateFilter("shippingLine", v)} options={filterOptions.shippingLines} placeholder="All Shipping Lines" />
              <MultiSelect value={filters.containerCode} onChange={(v) => updateFilter("containerCode", v)} options={filterOptions.containerCodes} placeholder="All Container Codes" />
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MultiSelect value={filters.origin} onChange={(v) => updateFilter("origin", v)} options={filterOptions.origins} placeholder="All Origins" />
              <div className="flex items-center gap-2 col-span-1 lg:col-span-3">
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input type="date" className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700" value={filters.dateFrom} onChange={(e) => updateFilter("dateFrom", e.target.value)} />
                </div>
                <span className="text-gray-400 flex-shrink-0">—</span>
                <div className="flex-1 relative">
                  <input type="date" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700" value={filters.dateTo} onChange={(e) => updateFilter("dateTo", e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading containers...</p>
            </div>
          </div>
        ) : sortedContainers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><FileText className="w-8 h-8 text-gray-400" /></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No containers found</h3>
            <p className="text-gray-500 text-sm mb-6">{hasActiveFilters ? "Try adjusting your filters." : "Create your first container summary."}</p>
            <div className="flex gap-3 justify-center">
              {hasActiveFilters && <button onClick={clearFilters} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Clear Filters</button>}
              <button onClick={() => router.push("/dashboard/container-summary/create")} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Create Summary</button>
            </div>
          </div>
        ) : viewMode === "table" ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {[["containerNo","#"],["month","Month"],["containerCode","Container"],["status","Status"],["loadingDate","Loading Date"],["eta","ETA"],["ctn","CTN"],["shippingLine","Shipping Line"],["dollar","Dollar"],["finalAmount","Final Amount"],["origin","Origin"],["location","Location"],["shipper","Shipper"],["invoiceNo","Invoice No"],["workflowStatus","Workflow"],["actions",""]].map(([key, label]) => (
                      <th key={key} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {key !== "actions" ? (
                          <button onClick={() => handleSort(key)} className="flex items-center gap-1 hover:text-gray-900">
                            {label}{sortConfig.key === key && (sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                          </button>
                        ) : label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedContainers.map((c, i) => (
                    <React.Fragment key={c.id}>
                      <tr className={`hover:bg-gray-50 transition-colors ${expandedRows.has(c.id) ? "bg-blue-50" : ""}`}>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{c.containerNo || i + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{c.month}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{c.containerCode || "-"}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[140px]">{c.containerNoField || c.bl || ""}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(c.status)}`}>{statusIcon(c.status)}{statusText(c.status)}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{fmtDate(c.loadingDate)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{fmtDate(c.eta)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{c.ctn || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{c.shippingLine || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"><span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-600" />{fmt(c.dollar)}</span></td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">&#8377;{fmt(c.finalAmount)}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{c.origin || "N/A"}</span></td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{c.location || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap truncate max-w-[120px]">{c.shipper || "-"}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap uppercase">{c.invoiceNo || "-"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{c.workflowStatus ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded font-bold uppercase">{c.workflowStatus}</span> : "-"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button onClick={() => toggleRowExpand(c.id)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">{expandedRows.has(c.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                            <button onClick={() => router.push(`/dashboard/container-summary/${c.monthId}?highlight=${encodeURIComponent(c.containerCode || c.id)}`)} className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"><Eye className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows.has(c.id) && (
                        <tr className="bg-blue-50"><td colSpan={16} className="px-6 py-4">
                          <div className="bg-white rounded-lg border p-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                            <div><h4 className="font-semibold text-gray-900 mb-2">Financial</h4><div className="space-y-1.5 text-gray-600">
                              <div className="flex justify-between"><span>Dollar Rate</span><span className="font-medium text-gray-900">{c.dollarRate || 89.7}</span></div>
                              <div className="flex justify-between"><span>INR</span><span className="font-medium text-gray-900">&#8377;{fmt(c.inr)}</span></div>
                              <div className="flex justify-between"><span>Duty</span><span className="font-medium text-gray-900">&#8377;{fmt(c.duty)}</span></div>
                              <div className="flex justify-between"><span>GST</span><span className="font-medium text-gray-900">&#8377;{fmt(c.gst)}</span></div>
                            </div></div>
                            <div><h4 className="font-semibold text-gray-900 mb-2">Charges</h4><div className="space-y-1.5 text-gray-600">
                              <div className="flex justify-between"><span>DO Charge</span><span className="font-medium text-gray-900">&#8377;{fmt(c.doCharge)}</span></div>
                              <div className="flex justify-between"><span>CFS</span><span className="font-medium text-gray-900">&#8377;{fmt(c.cfs)}</span></div>
                              <div className="flex justify-between"><span>Total Duty</span><span className="font-semibold text-gray-900">&#8377;{fmt(c.totalDuty)}</span></div>
                            </div></div>
                            <div><h4 className="font-semibold text-gray-900 mb-2">Documents</h4><div className="space-y-1.5 text-gray-600">
                              <div className="flex justify-between"><span>BL No</span><span className="font-medium text-gray-900">{c.bl || "-"}</span></div>
                              <div className="flex justify-between"><span>SIMS</span><span className="font-medium text-gray-900">{c.sims || "-"}</span></div>
                              <div className="flex justify-between"><span>Container No</span><span className="font-medium text-gray-900">{c.containerNoField || "-"}</span></div>
                            </div></div>
                            <div><h4 className="font-semibold text-gray-900 mb-2">Actions</h4>
                              <button onClick={() => router.push(`/dashboard/container-summary/${c.monthId}?highlight=${encodeURIComponent(c.containerCode || c.id)}`)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"><Eye className="w-3 h-3" />View Summary</button>
                            </div>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6"><Pagination pagination={pagination} onPageChange={handlePageChange} onLimitChange={handleLimitChange} /></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedContainers.map((c, i) => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${c.status === "Loaded" ? "bg-emerald-500" : c.status === "Insea" ? "bg-sky-500" : "bg-violet-500"}`}></div>
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{statusText(c.status)}</span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 truncate">{c.containerCode || `Container ${c.containerNo || i + 1}`}</h3>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded flex-shrink-0">#{c.containerNo || i + 1}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />{c.month}
                      <span>&bull;</span><Ship className="w-3.5 h-3.5" />{c.shippingLine || "No line"}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div><p className="text-xs text-gray-400">Loading Date</p><p className="font-medium text-gray-900">{fmtDate(c.loadingDate)}</p></div>
                      <div><p className="text-xs text-gray-400">ETA</p><p className="font-medium text-gray-900">{fmtDate(c.eta)}</p></div>
                      <div><p className="text-xs text-gray-400">CTN</p><p className="font-semibold text-gray-900">{c.ctn || 0}</p></div>
                      <div><p className="text-xs text-gray-400">Container No.</p><p className="font-medium text-gray-900 truncate">{c.containerNoField || "-"}</p></div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 grid grid-cols-2 gap-3 text-center">
                      <div><p className="text-xs text-gray-500 mb-0.5">Dollar</p><p className="font-bold text-gray-900 flex items-center justify-center gap-1"><DollarSign className="w-3.5 h-3.5 text-emerald-600" />{fmt(c.dollar)}</p></div>
                      <div><p className="text-xs text-gray-500 mb-0.5">Final Amount</p><p className="font-bold text-gray-900">&#8377;{fmt(c.finalAmount)}</p></div>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      {[["Origin", <span className="font-bold text-blue-600">{c.origin || "N/A"}</span>],["Location", c.location || "-"],["Invoice No", c.invoiceNo || "-"],["Shipper", c.shipper || "-"],["BL No", c.bl || "-"]].map(([label, val]) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-medium text-gray-900 truncate max-w-[140px] text-right">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <button onClick={() => router.push(`/dashboard/container-summary/${c.monthId}?highlight=${encodeURIComponent(c.containerCode || c.id)}`)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                      <Eye className="w-4 h-4" />View Summary
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 px-6 mt-4 shadow-sm">
              <Pagination pagination={pagination} onPageChange={handlePageChange} onLimitChange={handleLimitChange} />
            </div>
          </>
        )}

        {/* Footer summary */}
        {!loading && pagination.total > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 px-6 py-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span><span className="font-semibold text-gray-900">{pagination.total}</span> total containers</span>
                <span className="text-gray-300">|</span>
                <span>Value: <span className="font-semibold text-gray-900">${fmt(stats.totalValue)}</span></span>
                <span className="text-gray-300">|</span>
                <span>Final: <span className="font-semibold text-gray-900">&#8377;{fmt(stats.totalFinalAmount)}</span></span>
                <span className="text-gray-300">|</span>
                <span>CTN: <span className="font-semibold text-gray-900">{fmtN(stats.totalCTN)}</span></span>
              </div>
              <button
                onClick={() => {
                  document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
                  document.body.scrollTo({ top: 0, behavior: "smooth" });
                  const main = document.querySelector("main");
                  if (main) main.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1.5 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0">
                <ChevronUp className="w-4 h-4" />Back to top
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
