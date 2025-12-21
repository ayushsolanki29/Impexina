"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {  toast } from "sonner";
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  Calendar,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import api from "@/lib/api";

function SkeletonItem() {
  return (
    <div className="animate-pulse p-5 border-b bg-white/40">
      <div className="flex justify-between items-center gap-4">
        <div className="w-60 h-6 bg-gray-200 rounded" />
        <div className="flex gap-3">
          <div className="w-20 h-6 bg-gray-200 rounded" />
          <div className="w-20 h-6 bg-gray-200 rounded" />
          <div className="w-20 h-6 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ContainersOverviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || "",
    origin: searchParams.get('origin') || "",
    status: searchParams.get('status') || "",
    dateFrom: searchParams.get('dateFrom') || "",
    dateTo: searchParams.get('dateTo') || "",
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const queryString = params.toString();
    const newUrl = queryString ? `/dashboard/loading?${queryString}` : '/dashboard/loading';
    window.history.replaceState(null, '', newUrl);
  }, [filters]);

  // Fetch containers
  const fetchContainers = async (page = 1, reset = false) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const response = await api.get("/loading/containers", { params });

      if (response.data.success) {
        if (reset) {
          setContainers(response.data.data.containers);
        } else {
          setContainers(prev => [...prev, ...response.data.data.containers]);
        }
        setPagination(response.data.data.pagination);
      } else {
        toast.error(response.data.message || "Failed to load containers");
      }
    } catch (error) {
      console.error("Error fetching containers:", error);
      toast.error("Failed to load containers");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchContainers(1, true);
  }, [filters]);

  // Load more
  const loadMore = () => {
    if (pagination.hasNextPage) {
      fetchContainers(pagination.page + 1);
    }
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setContainers([]);
  };

  // Update container status
  const handleStatusUpdate = async (containerCode, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [containerCode]: true }));
      
      const response = await api.patch(`/loading/containers/${containerCode}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        toast.success(`Status updated to ${newStatus}`);
        // Refresh the container list
        fetchContainers(pagination.page, true);
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [containerCode]: false }));
    }
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      // Build query params
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      // Create download link
      const exportUrl = `/api/loading/containers/export/csv?${params.toString()}`;
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `containers_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Export started. Check your downloads.");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export");
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      origin: "",
      status: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  // Navigation
  const goToContainer = (containerCode) => {
    router.push(`/dashboard/loading/${encodeURIComponent(containerCode)}`);
  };

  const goToNewLoading = () => {
    router.push("/dashboard/loading/new");
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const config = {
      DRAFT: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
      },
      CONFIRMED: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
      },
      CANCELLED: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
      },
    };

    const statusConfig = config[status] || {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: Clock,
    };

    const Icon = statusConfig.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-medium ${statusConfig.color}`}>
        <Icon className="w-4 h-4" />
        {status}
      </span>
    );
  };

  // Get unique origins from current containers
  const uniqueOrigins = useMemo(() => {
    const origins = new Set();
    containers.forEach(container => {
      if (container.origin) origins.add(container.origin);
    });
    return Array.from(origins).sort();
  }, [containers]);

  return (
    <div className="min-h-screen bg-gray-50">
   
      
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row items-start justify-between mb-8 gap-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Containers Overview
              </h1>
              <p className="text-sm text-gray-600">
                Track and manage all container shipments. {pagination.total} containers found.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExport}
                disabled={containers.length === 0}
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>

              <button
                onClick={() => fetchContainers(1, true)}
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>

              <button
                onClick={goToNewLoading}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow"
              >
                <Plus className="w-4 h-4" /> New Loading
              </button>
            </div>
          </header>

          {/* Main Container */}
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            {/* Filters */}
            <div className="p-5 border-b bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Filters
                </h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded-lg border border-gray-300 hover:border-gray-400"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Search Container
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Container code..."
                      className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Origin */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Origin
                  </label>
                  <select
                    value={filters.origin}
                    onChange={(e) => handleFilterChange('origin', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Origins</option>
                    {uniqueOrigins.map(origin => (
                      <option key={origin} value={origin}>{origin}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="IN_PORT">In Port</option>
                    <option value="IN_SEA">In Sea</option>
                    <option value="ARRIVED">Arrived</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      From Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        className="pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      To Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        min={filters.dateFrom}
                        className="pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Header */}
            <div className="px-5 py-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{containers.length}</span> of{" "}
                  <span className="font-semibold text-gray-900">{pagination.total}</span> containers
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  {Object.values(filters).some(f => f) ? "Filters applied" : "No filters"}
                </div>
              </div>
            </div>

            {/* Containers List */}
            <div>
              {loading && containers.length === 0 ? (
                <div>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonItem key={i} />
                  ))}
                </div>
              ) : containers.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-gray-400 mb-4 text-lg">
                    No containers found
                  </div>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {Object.values(filters).some(f => f) 
                      ? "Try adjusting your filters or create a new container loading."
                      : "Create your first container loading sheet to get started."}
                  </p>
                  <button
                    onClick={goToNewLoading}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" /> Create New Loading
                  </button>
                </div>
              ) : (
                <div>
                  {containers.map((container) => (
                    <div
                      key={container.containerCode}
                      className="p-5 border-b hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        {/* Left Section */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                   
                              {container.containerCode.slice(0, 3).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <button
                                  onClick={() => goToContainer(container.containerCode)}
                                  className="text-xl font-bold text-gray-900 hover:text-blue-700 hover:underline truncate"
                                  title={`View ${container.containerCode}`}
                                >
                                  {container.containerCode}
                                </button>
                                {getStatusBadge(container.status)}
                              </div>

                              <div className="text-sm text-gray-600 mb-4">
                                <span className="font-medium text-gray-800">{container.origin}</span>
                                {" • "}
                                Last loaded: {container.loadingDate 
                                  ? new Date(container.loadingDate).toLocaleDateString()
                                  : "—"}
                                {" • "}
                                {container.sheetCount} loading sheet{container.sheetCount !== 1 ? "s" : ""}
                              </div>

                              {/* Clients */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-gray-700">
                                  {container.clientCount} client{container.clientCount !== 1 ? "s" : ""}:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {container.clients.slice(0, 3).map((client, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                                    >
                                      {client}
                                    </span>
                                  ))}
                                  {container.clientCount > 3 && (
                                    <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">
                                      +{container.clientCount - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Status Toggle */}
                          <div className="flex items-center gap-3 mt-4">
                            <span className="text-sm text-gray-700">Container Status:</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleStatusUpdate(container.containerCode, "DRAFT")}
                                disabled={updatingStatus[container.containerCode] || container.status === "DRAFT"}
                                className={`px-3 py-1.5 rounded text-sm font-medium ${container.status === "DRAFT" 
                                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300" 
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                              >
                                {updatingStatus[container.containerCode] && container.status !== "DRAFT" 
                                  ? "Updating..." 
                                  : "Draft"}
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(container.containerCode, "CONFIRMED")}
                                disabled={updatingStatus[container.containerCode] || container.status === "CONFIRMED"}
                                className={`px-3 py-1.5 rounded text-sm font-medium ${container.status === "CONFIRMED" 
                                  ? "bg-green-100 text-green-800 border border-green-300" 
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                              >
                                {updatingStatus[container.containerCode] && container.status !== "CONFIRMED" 
                                  ? "Updating..." 
                                  : "Confirmed"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Right Section: Totals */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                          <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">CTN</div>
                            <div className="text-2xl font-bold text-gray-900">
                              {container.totalCTN.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">PCS</div>
                            <div className="text-2xl font-bold text-gray-900">
                              {container.totalPCS.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">CBM</div>
                            <div className="text-2xl font-bold text-gray-900">
                              {container.totalCBM.toFixed(3)}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">Weight</div>
                            <div className="text-2xl font-bold text-gray-900">
                              {container.totalWeight.toFixed(2)} kg
                            </div>
                          </div>

                          <div className="col-span-2 md:col-span-4">
                            <button
                              onClick={() => goToContainer(container.containerCode)}
                              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg mt-2"
                            >
                              View Details <ChevronRight className="w-4 h-4" />
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
            {containers.length > 0 && (
              <div className="p-5 border-t bg-white">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages} • 
                    Showing {containers.length} of {pagination.total} containers
                  </div>

                  <div className="flex items-center gap-3">
                    {pagination.hasPrevPage && (
                      <button
                        onClick={() => fetchContainers(pagination.page - 1, true)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Previous
                      </button>
                    )}

                    {pagination.hasNextPage && (
                      <button
                        onClick={loadMore}
                        disabled={loading}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? "Loading..." : "Load More"}
                      </button>
                    )}

                    {!pagination.hasNextPage && containers.length > 0 && (
                      <div className="text-sm text-gray-500">
                        All containers loaded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}