"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Download,
  FileText,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  History,
  ChevronsUpDown,
  Check,
  X,
} from "lucide-react";
import API from "@/lib/api";

// Reusable Combobox Component
const Combobox = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full md:w-64" ref={wrapperRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all text-sm shadow-sm"
      >
        <span className={value ? "text-gray-900 font-medium" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              className="w-full px-2 py-1 text-sm outline-none placeholder:text-slate-300"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${value === opt ? 'bg-slate-50 font-bold text-blue-600' : 'text-slate-700'
                  }`}
              >
                {opt}
                {value === opt && <Check className="w-3 h-3" />}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-400 text-center">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ContainerSummaryList() {
  const router = useRouter();

  // State
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [origins, setOrigins] = useState([]);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [showLogs, setShowLogs] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Statistics
  const [statistics, setStatistics] = useState({
    totalSummaries: 0,
    totalContainers: 0,
    totalCTN: 0,
    totalDollar: 0,
    totalFinalAmount: 0,
    draftCount: 0,
    activeCount: 0,
    archivedCount: 0,
  });

  // Load summaries on component mount
  useEffect(() => {
    loadSummaries();
    loadStatistics();
  }, [pagination.page, searchTerm, statusFilter, originFilter, dateRange.from, dateRange.to]);

  useEffect(() => {
    if (showLogs) fetchLogs();
  }, [showLogs]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      // Get all activities (both global and summary-specific)
      const res = await API.get('/container-summaries/activities/global'); // We'll update the backend to return ALL activities if needed, or stick to global.
      // Actually, let's create a better endpoint for ALL activities.
      // For now, let's use the one we just made.
      if (res.data.success) {
        setActivities(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchOrigins();
  }, []);

  const fetchOrigins = async () => {
    try {
      const response = await API.get('/containers/origins');
      if (response.data.success) {
        setOrigins(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch origins");
    }
  };

  // Load summaries from API
  const loadSummaries = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(originFilter && { origin: originFilter }),
        ...(dateRange.from && { dateFrom: dateRange.from }),
        ...(dateRange.to && { dateTo: dateRange.to }),
      };
      // In loadSummaries function, after getting response:
      const response = await API.get("/container-summaries", params);


      if (response.data.success) {
        // Transform the data to match frontend expectations
        const transformedSummaries = response.data.data.summaries.map((summary) => ({
          ...summary,
          totalContainers: summary.containerCount || 0,
          // Make sure totals are properly formatted
          totals: {
            totalContainers: summary.containerCount || 0,
            totalCTN: summary.totalCTN || 0,
            totalDollar: summary.totalDollar || 0,
            totalINR: summary.totalINR || 0,
            totalFinalAmount: summary.totalFinalAmount || 0,
          },
        }));


        setSummaries(transformedSummaries);
        setPagination(
          response.data.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }
        );
      }
    } catch (error) {
      console.error("Error loading summaries:", error);
      toast.error("Failed to load summaries");
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics from API
  const loadStatistics = async () => {
    try {
      const response = await API.get("/container-summaries/statistics");

      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  // Delete summary
  const deleteSummary = async (id, e) => {
    e.stopPropagation();

    if (
      !confirm(
        "Are you sure you want to delete this summary? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await API.delete(`/container-summaries/${id}`);

      if (response.data.success) {
        toast.success(response.message || "Summary deleted successfully");
        // Reload summaries and statistics
        loadSummaries();
        loadStatistics();
      } else {
        toast.error(response.message || "Failed to delete summary");
      }
    } catch (error) {
      console.error("Error deleting summary:", error);
      toast.error("Failed to delete summary");
    } finally {
      setDeletingId(null);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status) {
      case "ACTIVE":
        return "Active";
      case "DRAFT":
        return "Draft";
      case "ARCHIVED":
        return "Archived";
      default:
        return status;
    }
  };

  // Export all summaries to CSV
  const exportAllToCSV = async () => {
    setExporting(true);

    try {
      const response = await API.download(
        "/container-summaries/export/all/csv",
        {},
        `all_summaries_${new Date().toISOString().slice(0, 10)}.csv`
      );

      toast.success("Export completed successfully");
    } catch (error) {
      console.error("Error exporting summaries:", error);
      toast.error("Failed to export summaries");
    } finally {
      setExporting(false);
    }
  };

  // Export single summary to CSV
  const exportSummary = async (id, month, e) => {
    e.stopPropagation();

    try {
      const response = await API.download(
        `/container-summaries/${id}/export/csv`,
        {},
        `${month.replace(/\s+/g, "_")}_summary_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`
      );

      toast.success("Summary exported successfully");
    } catch (error) {
      console.error("Error exporting summary:", error);
      toast.error("Failed to export summary");
    }
  };

  // Export single summary to Excel
  const exportSummaryExcel = async (id, month, e) => {
    e.stopPropagation();

    try {
      const response = await API.download(
        `/container-summaries/${id}/export/excel`,
        {},
        `${month.replace(/\s+/g, "_")}_summary_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`
      );

      toast.success("Excel export completed successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export to Excel");
    }
  };

  // Handle search with debounce
  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setOriginFilter("");
    setDateRange({ from: "", to: "" });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const goToPage = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // Format number for display
  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Loading state
  if (loading && pagination.page === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading summaries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Container Summaries
              </h1>
              <p className="text-gray-600 mt-1">
                Manage all your monthly container summaries
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportAllToCSV}
                disabled={exporting || summaries.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 disabled:bg-green-400 text-white rounded-lg hover:bg-green-700 disabled:cursor-not-allowed transition-colors"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export All
                  </>
                )}
              </button>
              <button
                onClick={() =>
                  router.push("/dashboard/container-summary/create")
                }
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New
              </button>
              <button
                onClick={loadSummaries}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={() => setShowLogs(true)}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <History className="w-4 h-4" />
                Logs
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow border p-4">
              <div className="text-sm text-gray-600">Total Summaries</div>
              <div className="text-2xl font-bold text-gray-900">
                {statistics.totalSummaries}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-500">
                    {statistics.draftCount} Draft
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-500">
                    {statistics.activeCount} Active
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow border p-4">
              <div className="text-sm text-gray-600">Total Containers</div>
              <div className="text-2xl font-bold text-gray-900">
                {statistics.totalContainers}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Across all summaries
              </div>
            </div>
            <div className="bg-white rounded-lg shadow border p-4">
              <div className="text-sm text-gray-600">Total CTN</div>
              <div className="text-2xl font-bold text-gray-900">
                {statistics.totalCTN}
              </div>
              <div className="text-xs text-gray-500 mt-2">Total cartons</div>
            </div>
            <div className="bg-white rounded-lg shadow border p-4">
              <div className="text-sm text-gray-600">Final Amount</div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{formatNumber(statistics.totalFinalAmount)}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                ${formatNumber(statistics.totalDollar)}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow border p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by month..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>

              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-4 pt-4 border-t border-gray-100">
              <Combobox
                options={origins}
                value={originFilter}
                onChange={(val) => {
                  setOriginFilter(val);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                placeholder="All Origins"
              />

              <div className="flex items-center gap-3 bg-white border border-gray-200 px-4 py-2.5 rounded-xl group focus-within:ring-2 focus-within:ring-blue-500 transition-all w-full md:w-auto shadow-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                  value={dateRange.from}
                  onChange={(e) => {
                    setDateRange(prev => ({ ...prev, from: e.target.value }));
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                />
                <span className="text-slate-200 font-black">/</span>
                <input
                  type="date"
                  className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                  value={dateRange.to}
                  onChange={(e) => {
                    setDateRange(prev => ({ ...prev, to: e.target.value }));
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                />
              </div>

              {(searchTerm || statusFilter || originFilter || dateRange.from || dateRange.to) && (
                <button
                  onClick={clearFilters}
                  className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm bg-white border border-red-100 self-start md:self-auto"
                  title="Clear all filters"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {(searchTerm || statusFilter || originFilter || dateRange.from || dateRange.to) && (
              <div className="mt-3 text-sm text-gray-600">
                Found {pagination.total} results
                {searchTerm && ` for "${searchTerm}"`}
                {statusFilter && ` with status "${getStatusText(statusFilter)}"`}
                {originFilter && ` from "${originFilter}"`}
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {summaries.length === 0 ? (
          <div className="bg-white rounded-lg shadow border p-8 md:p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {loading ? "Loading..." : "No summaries found"}
            </h3>
            <p className="text-gray-600 mb-6">
              {loading
                ? "Fetching your summaries..."
                : searchTerm || statusFilter
                  ? "No summaries match your search criteria"
                  : "Get started by creating your first summary"}
            </p>
            {!loading && (
              <button
                onClick={() =>
                  router.push("/dashboard/container-summary/create")
                }
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First Summary
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {summaries.map((summary) => (
                <div
                  key={summary.id}
                  className="bg-white rounded-lg shadow border hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/dashboard/container-summary/${summary.id}`
                    )
                  }
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 truncate max-w-[160px]">
                            {summary.month}
                          </h3>
                          <div
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                              summary.status
                            )}`}
                          >
                            {getStatusText(summary.status)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteSummary(summary.id, e)}
                        disabled={deletingId === summary.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        title="Delete summary"
                      >
                        {deletingId === summary.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-600">Containers</div>
                        <div className="text-xl font-bold text-gray-900">
                          {summary.totalContainers || 0}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-600">Total CTN</div>
                        <div className="text-xl font-bold text-gray-900">
                          {summary.totalCTN || 0}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-600">
                          Total Dollar
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          ${formatNumber(summary.totalDollar || 0)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-600">
                          Final Amount
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          ₹{formatNumber(summary.totalFinalAmount || 0)}
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="text-sm text-gray-600 space-y-1 border-t pt-4">
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="text-gray-900">
                          {formatDate(summary.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Updated:</span>
                        <span className="text-gray-900">
                          {formatDate(summary.updatedAt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>By:</span>
                        <span className="text-gray-900 font-medium">
                          {summary.createdBy}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/dashboard/container-summary/${summary.id}`
                          );
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View & Edit
                      </button>
                    </div>

                    {/* Quick Export */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) =>
                          exportSummary(summary.id, summary.month, e)
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        CSV
                      </button>
                      <button
                        onClick={(e) =>
                          exportSummaryExcel(summary.id, summary.month, e)
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        Excel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          disabled={loading}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg ${pagination.page === pageNum
                            ? "bg-blue-600 text-white"
                            : "border hover:bg-gray-50"
                            } transition-colors`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>

                <div className="text-sm text-gray-600 ml-4">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
              </div>
            )}

            {/* Summary Info */}
            <div className="mt-6 text-sm text-gray-600 text-center">
              Showing {summaries.length} of {pagination.total} summaries
            </div>
          </>
        )}



      </div>

      {/* Create Button (Fixed for mobile) */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <button
          onClick={() => router.push("/dashboard/container-summary/create")}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          title="Create new summary"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
