"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {  toast } from "sonner";
import {
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  Package,
  Ship,
  FileText,
  Eye,
  Edit,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Grid,
  List,
  RefreshCw,
  Loader2,
  Users,
  Box,
  Truck,
  Waves,
  X,
  ChevronRight,
  Home,
  BarChart,
  Percent,
  Layers,
  Database,
  MoreVertical,
} from "lucide-react";
import API from "@/lib/api";

// Define types for better type safety


export default function ContainerDashboard() {
  const router = useRouter();
  const [containers, setContainers] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [sortConfig, setSortConfig] = useState({
    key: "loadingDate",
    direction: "desc" 
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    month: "",
    shippingLine: "",
    containerCode: "",
  });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [stats, setStats] = useState({
    totalContainers: 0,
    totalValue: 0,
    totalFinalAmount: 0,
    loadedCount: 0,
    inseaCount: 0,
    deliveredCount: 0,
    uniqueMonths: 0,
    uniqueShippingLines: 0,
    totalCTN: 0,
    totalDuty: 0,
    totalGST: 0,
    averageDollar: 0,
    averageFinalAmount: 0,
  });
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const summariesResponse = await API.get("/container-summaries", {
        page: 1,
        limit: 100,
      });

      if (summariesResponse.data.success) {
        const summariesData = summariesResponse.data.data.summaries || [];
        setSummaries(summariesData);
        
        const allContainers = [];
        const containerPromises = summariesData.map(async (summary) => {
          try {
            const summaryDetail = await API.get(`/container-summaries/${summary.id}`);
            if (summaryDetail.data.success && summaryDetail.data.data.containers) {
              summaryDetail.data.data.containers.forEach((container) => {
                allContainers.push({
                  ...container,
                  month: summary.month,
                  monthId: summary.id,
                  summaryStatus: summary.status,
                  summaryCreated: summary.createdAt,
                  summaryUpdated: summary.updatedAt,
                  summaryCreatedBy: summary.createdBy,
                });
              });
            }
          } catch (error) {
            console.error(`Error loading summary ${summary.id}:`, error);
          }
        });

        await Promise.all(containerPromises);

        allContainers.sort(
          (a, b) => new Date(b.loadingDate || 0).getTime() - new Date(a.loadingDate || 0).getTime()
        );

        setContainers(allContainers);
        calculateStats(allContainers);
      } else {
        toast.error("Failed to load summaries");
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const calculateStats = (containerList) => {
    if (!containerList || containerList.length === 0) {
      setStats({
        totalContainers: 0,
        totalValue: 0,
        totalFinalAmount: 0,
        loadedCount: 0,
        inseaCount: 0,
        deliveredCount: 0,
        uniqueMonths: 0,
        uniqueShippingLines: 0,
        totalCTN: 0,
        totalDuty: 0,
        totalGST: 0,
        averageDollar: 0,
        averageFinalAmount: 0,
      });
      return;
    }

    const uniqueMonths = [...new Set(containerList.map((c) => c.month))].filter(Boolean);
    const uniqueShippingLines = [...new Set(containerList.map((c) => c.shippingLine))].filter(Boolean);

    const newStats = containerList.reduce(
      (acc, container) => {
        const dollar = parseFloat(container.dollar?.toString() || "0");
        const finalAmount = parseFloat(container.finalAmount?.toString() || "0");
        const ctn = parseInt(container.ctn?.toString() || "0");
        const duty = parseFloat(container.duty?.toString() || "0");
        const gst = parseFloat(container.gst?.toString() || "0");

        return {
          totalContainers: acc.totalContainers + 1,
          totalValue: acc.totalValue + dollar,
          totalFinalAmount: acc.totalFinalAmount + finalAmount,
          loadedCount: acc.loadedCount + (container.status === "Loaded" ? 1 : 0),
          inseaCount: acc.inseaCount + (container.status === "Insea" ? 1 : 0),
          deliveredCount: acc.deliveredCount + (container.status === "Delivered" ? 1 : 0),
          totalCTN: acc.totalCTN + ctn,
          totalDuty: acc.totalDuty + duty,
          totalGST: acc.totalGST + gst,
        };
      },
      {
        totalContainers: 0,
        totalValue: 0,
        totalFinalAmount: 0,
        loadedCount: 0,
        inseaCount: 0,
        deliveredCount: 0,
        totalCTN: 0,
        totalDuty: 0,
        totalGST: 0,
      }
    );

    setStats({
      ...newStats,
      uniqueMonths: uniqueMonths.length,
      uniqueShippingLines: uniqueShippingLines.length,
      averageDollar: newStats.totalContainers > 0 ? newStats.totalValue / newStats.totalContainers : 0,
      averageFinalAmount: newStats.totalContainers > 0 ? newStats.totalFinalAmount / newStats.totalContainers : 0,
    });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Loaded":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Insea":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Delivered":
        return "bg-violet-50 text-violet-700 border-violet-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Loaded":
        return <CheckCircle className="w-4 h-4" />;
      case "Insea":
        return <Waves className="w-4 h-4" />;
      case "Delivered":
        return <Truck className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Insea":
        return "In Sea";
      default:
        return status;
    }
  };

  // Memoized filtered and sorted containers
  const { filteredContainers, sortedContainers } = useMemo(() => {
    const filtered = containers.filter((container) => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        !filters.search ||
        container.containerCode?.toLowerCase().includes(searchLower) ||
        container.bl?.toLowerCase().includes(searchLower) ||
        container.containerNoField?.toLowerCase().includes(searchLower) ||
        container.shippingLine?.toLowerCase().includes(searchLower) ||
        container.month?.toLowerCase().includes(searchLower);

      const matchesStatus = !filters.status || container.status === filters.status;
      const matchesMonth = !filters.month || container.month === filters.month;
      const matchesShippingLine = !filters.shippingLine || container.shippingLine === filters.shippingLine;
      const matchesContainerCode = !filters.containerCode || container.containerCode === filters.containerCode;

      return matchesSearch && matchesStatus && matchesMonth && matchesShippingLine && matchesContainerCode;
    });

    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "loadingDate" || sortConfig.key === "eta") {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      if (["dollar", "inr", "finalAmount", "ctn", "totalDuty", "gst"].includes(sortConfig.key)) {
        aValue = parseFloat(String(aValue || "0"));
        bValue = parseFloat(String(bValue || "0"));
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return { filteredContainers: filtered, sortedContainers: sorted };
  }, [containers, filters, sortConfig]);

  // Memoized unique values for filters
  const uniqueValues = useMemo(() => {
    const months = [...new Set(containers.map((c) => c.month))].filter(Boolean);
    months.sort((a, b) => {
      const [monthA, yearA] = a.split(" ");
      const [monthB, yearB] = b.split(" ");
      const dateA = new Date(`${monthA} 1, ${yearA}`).getTime();
      const dateB = new Date(`${monthB} 1, ${yearB}`).getTime();
      return dateB - dateA;
    });

    const shippingLines = [...new Set(containers.map((c) => c.shippingLine).filter(Boolean))].sort();
    const containerCodes = [...new Set(containers.map((c) => c.containerCode).filter(Boolean))].sort();

    return { months, shippingLines, containerCodes };
  }, [containers]);

  const exportToCSV = async () => {
    if (sortedContainers.length === 0) {
      toast.error("No data to export");
      return;
    }

    setExporting(true);
    try {
      const headers = [
        "Month",
        "Container No",
        "Container Code",
        "Status",
        "Loading Date",
        "ETA",
        "CTN",
        "Shipping Line",
        "BL No",
        "Dollar Amount",
        "Dollar Rate",
        "INR",
        "Duty (16.5%)",
        "GST (18%)",
        "Total Duty",
        "DO Charge",
        "CFS",
        "Final Amount",
        "Container No.",
        "SIMS",
        "Created By",
      ];

      const rows = sortedContainers.map((container) => [
        `"${container.month}"`,
        container.containerNo || "-",
        `"${container.containerCode || ""}"`,
        container.status,
        container.loadingDate ? new Date(container.loadingDate).toISOString().split("T")[0] : "",
        container.eta || "",
        container.ctn || 0,
        `"${container.shippingLine || ""}"`,
        `"${container.bl || ""}"`,
        container.dollar || 0,
        container.dollarRate || 89.7,
        container.inr || 0,
        container.duty || 0,
        container.gst || 0,
        container.totalDuty || 0,
        container.doCharge || 58000,
        container.cfs || 21830,
        container.finalAmount || 0,
        `"${container.containerNoField || ""}"`,
        `"${container.sims || ""}"`,
        `"${container.summaryCreatedBy || ""}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `containers_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${sortedContainers.length} containers successfully`);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };

  const toggleRowExpand = (index) => {
    setExpandedRows((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(index)) {
        newExpanded.delete(index);
      } else {
        newExpanded.add(index);
      }
      return newExpanded;
    });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      month: "",
      shippingLine: "",
      containerCode: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading container dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching your container data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Home className="w-4 h-4" />
            <ChevronRight className="w-3 h-3" />
            <span className="font-medium">Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600">Container Overview</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Container Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Master view of all containers • {stats.totalContainers} containers across {stats.uniqueMonths} months
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => loadDashboardData()}
                disabled={loadingStats}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${loadingStats ? "animate-spin" : ""}`} />
                Refresh Data
              </button>
              <button
                onClick={exportToCSV}
                disabled={exporting || sortedContainers.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export CSV
              </button>
              <button
                onClick={() => router.push("/dashboard/container-summary/create")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
              >
                <Package className="w-4 h-4" />
                New Summary
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Containers Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Containers</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalContainers}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">{stats.uniqueMonths} months</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{stats.uniqueShippingLines} shipping lines</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Financial Overview Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">${formatCurrency(stats.totalValue)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">
                      Avg: ${formatCurrency(stats.averageDollar)} per container
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Final Amount Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Final Amount</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₹{formatCurrency(stats.totalFinalAmount)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">
                      Avg: ₹{formatCurrency(stats.averageFinalAmount)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-violet-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-violet-600" />
                </div>
              </div>
            </div>

            {/* Status Overview Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status Distribution</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs text-gray-600">Loaded: {stats.loadedCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                      <span className="text-xs text-gray-600">In Sea: {stats.inseaCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                      <span className="text-xs text-gray-600">Delivered: {stats.deliveredCount}</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <BarChart className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <Box className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total CTN</p>
                  <p className="text-lg font-semibold text-gray-900">{formatNumber(stats.totalCTN)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Percent className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Duty</p>
                  <p className="text-lg font-semibold text-gray-900">₹{formatCurrency(stats.totalDuty)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total GST</p>
                  <p className="text-lg font-semibold text-gray-900">₹{formatCurrency(stats.totalGST)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-50 rounded-lg">
                  <Ship className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Shipping Lines</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.uniqueShippingLines}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Filter Containers</h2>
              <p className="text-sm text-gray-600">Refine your container view</p>
            </div>
            
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "table"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by container code, BL, container no, shipping line..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">All Status</option>
                <option value="Loaded">Loaded</option>
                <option value="Insea">In Sea</option>
                <option value="Delivered">Delivered</option>
              </select>

              <select
                value={filters.month}
                onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">All Months</option>
                {uniqueValues.months.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>

              <select
                value={filters.shippingLine}
                onChange={(e) => setFilters(prev => ({ ...prev, shippingLine: e.target.value }))}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">All Shipping Lines</option>
                {uniqueValues.shippingLines.map((line) => (
                  <option key={line} value={line}>{line}</option>
                ))}
              </select>

              <select
                value={filters.containerCode}
                onChange={(e) => setFilters(prev => ({ ...prev, containerCode: e.target.value }))}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">All Container Codes</option>
                {uniqueValues.containerCodes.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                More Filters
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm">
              <span className="text-gray-900 font-medium">{sortedContainers.length}</span>
              <span className="text-gray-600"> containers found • </span>
              <span className="text-gray-900 font-medium">{filteredContainers.length}</span>
              <span className="text-gray-600"> match your filters</span>
            </div>
            
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Content Section */}
        {sortedContainers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {containers.length === 0 ? "No containers found" : "No matching containers"}
              </h3>
              <p className="text-gray-600 mb-6">
                {containers.length === 0 
                  ? "Start by creating your first container summary to see data here." 
                  : "Try adjusting your filters or search terms to find what you're looking for."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => router.push("/dashboard/container-summary/create")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create New Summary
                </button>
              </div>
            </div>
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {[
                      { key: "containerNo", label: "#" },
                      { key: "month", label: "Month" },
                      { key: "containerCode", label: "Container" },
                      { key: "status", label: "Status" },
                      { key: "loadingDate", label: "Loading Date" },
                      { key: "eta", label: "ETA" },
                      { key: "ctn", label: "CTN" },
                      { key: "shippingLine", label: "Shipping Line" },
                      { key: "dollar", label: "Dollar" },
                      { key: "finalAmount", label: "Final Amount" },
                      { key: "actions", label: "" },
                    ].map((col) => (
                      <th key={col.key} className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {col.key !== "actions" ? (
                          <button
                            onClick={() => handleSort(col.key)}
                            className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                          >
                            {col.label}
                            {sortConfig.key === col.key && (
                              sortConfig.direction === "asc" ? 
                                <ChevronUp className="w-3 h-3" /> : 
                                <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        ) : (
                          col.label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedContainers.map((container, index) => (
                    <React.Fragment key={`${container.id}-${index}`}>
                      <tr className={`hover:bg-gray-50 transition-colors ${expandedRows.has(index) ? "bg-blue-50" : ""}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {container.containerNo || index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{container.month}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {container.containerCode || `Container ${container.containerNo || index + 1}`}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {container.containerNoField || container.bl || "-"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(container.status)}`}>
                            {getStatusIcon(container.status)}
                            {getStatusText(container.status)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(container.loadingDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(container.eta)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {container.ctn || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {container.shippingLine || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-emerald-600" />
                            {formatCurrency(container.dollar || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₹{formatCurrency(container.finalAmount || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleRowExpand(index)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                              title={expandedRows.has(index) ? "Collapse" : "Expand"}
                            >
                              {expandedRows.has(index) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard/container-summary/${container.monthId}/view`)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 transition-colors"
                              title="View Summary"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedRows.has(index) && (
                        <tr className="bg-blue-50">
                          <td colSpan={11} className="px-6 py-4">
                            <div className="bg-white rounded-lg border p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Financial Details</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">Dollar Rate:</span>
                                      <span className="text-gray-900 font-medium">{container.dollarRate || 89.7}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">INR:</span>
                                      <span className="text-gray-900 font-medium">₹{formatCurrency(container.inr || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">Duty (16.5%):</span>
                                      <span className="text-gray-900 font-medium">₹{formatCurrency(container.duty || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">GST (18%):</span>
                                      <span className="text-gray-900 font-medium">₹{formatCurrency(container.gst || 0)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Charges</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">DO Charge:</span>
                                      <span className="text-gray-900 font-medium">₹{formatCurrency(container.doCharge || 58000)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">CFS:</span>
                                      <span className="text-gray-900 font-medium">₹{formatCurrency(container.cfs || 21830)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">Total Duty:</span>
                                      <span className="text-gray-900 font-semibold">₹{formatCurrency(container.totalDuty || 0)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Documents</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">BL No:</span>
                                      <span className="text-gray-900 font-medium">{container.bl || "-"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">SIMS:</span>
                                      <span className="text-gray-900 font-medium">{container.sims || "-"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">Created By:</span>
                                      <span className="text-gray-900 font-medium">{container.summaryCreatedBy || "-"}</span>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Actions</h4>
                                  <div className="space-y-2">
                                    <button
                                      onClick={() => router.push(`/dashboard/container-summary/${container.monthId}/view`)}
                                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                      <Eye className="w-3 h-3" />
                                      View Full Summary
                                    </button>
                                    <button
                                      onClick={() => router.push(`/dashboard/container-summary/${container.monthId}/edit`)}
                                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                      <Edit className="w-3 h-3" />
                                      Edit Summary
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(container.containerCode || "");
                                        toast.success("Container code copied to clipboard!");
                                      }}
                                      className="w-full px-4 py-2.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                      Copy Container Code
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedContainers.map((container, index) => (
              <div
                key={`${container.id}-${index}`}
                className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${
                          container.status === "Loaded" ? "bg-emerald-500" :
                          container.status === "Insea" ? "bg-sky-500" :
                          "bg-violet-500"
                        }`}></div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {getStatusText(container.status)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {container.containerCode || `Container ${container.containerNo || index + 1}`}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        #{container.containerNo || index + 1}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {container.month}
                    <span className="text-gray-400">•</span>
                    <Ship className="w-4 h-4" />
                    {container.shippingLine || "No line"}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Loading Date</div>
                      <div className="text-sm font-medium text-gray-900">{formatDate(container.loadingDate)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">ETA</div>
                      <div className="text-sm font-medium text-gray-900">{formatDate(container.eta)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">CTN</div>
                      <div className="text-sm font-semibold text-gray-900">{container.ctn || 0}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Container No.</div>
                      <div className="text-sm font-medium text-gray-900 truncate">{container.containerNoField || "-"}</div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">Dollar Amount</div>
                        <div className="flex items-center justify-center gap-1">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(container.dollar || 0)}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">Final Amount</div>
                        <div className="text-lg font-bold text-gray-900">₹{formatCurrency(container.finalAmount || 0)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">BL No:</span>
                      <span className="text-gray-900 font-medium truncate max-w-[120px]">{container.bl || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Created By:</span>
                      <span className="text-gray-900 font-medium">{container.summaryCreatedBy || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/container-summary/${container.monthId}/view`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/container-summary/${container.monthId}/edit`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {sortedContainers.length > 0 && (
          <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{sortedContainers.length}</span> containers shown • 
              <span className="mx-2">Total:</span>
              <span className="font-medium text-gray-900">${formatCurrency(stats.totalValue)}</span>
              <span className="mx-2">•</span>
              <span className="font-medium text-gray-900">₹{formatCurrency(stats.totalFinalAmount)}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Back to Top
              </button>
              <div className="text-sm text-gray-500">
                Data refreshed at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}