"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Download, RefreshCw } from "lucide-react";
import api from "@/lib/api";

// Import reusable components
import ContainerCard from "../loading/_components/containers/ContainerCard";
import FiltersPanel from "../loading/_components/containers/FiltersPanel";
import PaginationFooter from "../loading/_components/containers/PaginationFooter";
import EmptyState from "../loading/_components/containers/EmptyState";
import ResultsHeader from "../loading/_components/containers/ResultsHeader";
import LoadingSkeleton from "../loading/_components/containers/LoadingSkeleton";

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
    search: searchParams.get("search") || "",
    origin: searchParams.get("origin") || "",
    status: searchParams.get("status") || "CONFIRMED",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const queryString = params.toString();
    const newUrl = queryString
      ? `/dashboard/packing?${queryString}`
      : "/dashboard/packing";
    window.history.replaceState(null, "", newUrl);
  }, [filters]);

  // Fetch containers
  const fetchContainers = async (page = 1, reset = false) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (params[key] === "") delete params[key];
      });

      const response = await api.get("/loading/containers", { params });

      if (response.data.success) {
        if (reset) {
          setContainers(response.data.data.containers);
        } else {
          setContainers((prev) => [...prev, ...response.data.data.containers]);
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
    setFilters((prev) => ({ ...prev, [key]: value }));
    setContainers([]);
  };

  // Update container status
  const handleStatusUpdate = async (containerCode, newStatus) => {
    try {
      setUpdatingStatus((prev) => ({ ...prev, [containerCode]: true }));

      const response = await api.patch(
        `/loading/containers/${containerCode}/status`,
        {
          status: newStatus,
        }
      );

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
      setUpdatingStatus((prev) => ({ ...prev, [containerCode]: false }));
    }
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const exportUrl = `/api/loading/containers/export/csv?${params.toString()}`;
      const link = document.createElement("a");
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
    router.push(`/dashboard/packing/${encodeURIComponent(containerCode)}`);
  };

  // Get unique origins from current containers
  const uniqueOrigins = useMemo(() => {
    const origins = new Set();
    containers.forEach((container) => {
      if (container.origin) origins.add(container.origin);
    });
    return Array.from(origins).sort();
  }, [containers]);

  const hasFilters = Object.values(filters).some((f) => f);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          {/* Header */}
          <header className="flex flex-col md:flex-row items-start justify-between mb-8 gap-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Packing List
              </h1>
              <p className="text-sm text-gray-600">
                Manage and track all packing containers. Currently, there are{" "}
                {pagination.total}{" "}
                {pagination.total === 1 ? "container" : "containers"} available.
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
            </div>
          </header>
          {/* Main Container */}
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            {/* Filters */}
            <FiltersPanel
              filters={filters}
              uniqueOrigins={uniqueOrigins}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              hideStatusFilter={true} // ADD THIS FLAG
            />

            {/* Results Header */}
            <ResultsHeader
              count={containers.length}
              total={pagination.total}
              hasFilters={hasFilters}
            />

            {/* Containers List */}
            <div>
              {loading && containers.length === 0 ? (
                <LoadingSkeleton count={6} />
              ) : containers.length === 0 ? (
                <EmptyState hasFilters={hasFilters} />
              ) : (
                <div>
                  {containers.map((container) => (
                    <ContainerCard
                      key={container.containerCode}
                      container={container}
                      onViewDetails={goToContainer}
                      onStatusUpdate={handleStatusUpdate}
                      updatingStatus={updatingStatus}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {containers.length > 0 && (
              <PaginationFooter
                pagination={pagination}
                containers={containers}
                loading={loading}
                onLoadMore={loadMore}
                onPreviousPage={() =>
                  fetchContainers(pagination.page - 1, true)
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
