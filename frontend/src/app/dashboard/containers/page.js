"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
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
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Grid,
  List,
  RefreshCw,
} from "lucide-react";

const CONTAINER_SUMMARY_KEY = "igpl_container_summary_v1";

export default function ContainerDashboard() {
  const router = useRouter();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
  const [sortConfig, setSortConfig] = useState({
    key: "loadingDate",
    direction: "desc",
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    month: "",
    shippingLine: "",
  });
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = () => {
    try {
      const summaries = JSON.parse(
        localStorage.getItem(CONTAINER_SUMMARY_KEY) || "[]"
      );
      const allContainers = [];

      summaries.forEach((summary) => {
        (summary.containers || []).forEach((container) => {
          allContainers.push({
            ...container,
            month: summary.month,
            monthId: summary.id,
            summaryStatus: summary.status,
            summaryCreated: summary.createdAt,
            summaryUpdated: summary.updatedAt,
          });
        });
      });

      // Sort by loading date by default
      allContainers.sort(
        (a, b) => new Date(b.loadingDate || 0) - new Date(a.loadingDate || 0)
      );

      setContainers(allContainers);
    } catch (error) {
      console.error("Error loading containers:", error);
      toast.error("Failed to load containers");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getStatusColor = (status) => {
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
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Loaded":
        return <CheckCircle className="w-4 h-4" />;
      case "Insea":
        return <Ship className="w-4 h-4" />;
      case "Delivered":
        return <Package className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredContainers = containers.filter((container) => {
    const matchesSearch =
      !filters.search ||
      container.containerCode
        ?.toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      container.bl?.toLowerCase().includes(filters.search.toLowerCase()) ||
      container.containerNo
        ?.toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      container.shippingLine
        ?.toLowerCase()
        .includes(filters.search.toLowerCase());

    const matchesStatus =
      !filters.status || container.status === filters.status;
    const matchesMonth = !filters.month || container.month === filters.month;
    const matchesShippingLine =
      !filters.shippingLine || container.shippingLine === filters.shippingLine;

    return (
      matchesSearch && matchesStatus && matchesMonth && matchesShippingLine
    );
  });

  // Apply sorting
  const sortedContainers = [...filteredContainers].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle dates
    if (sortConfig.key === "loadingDate" || sortConfig.key === "eta") {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    }

    // Handle numbers
    if (["dollar", "inr", "finalAmount", "ctn"].includes(sortConfig.key)) {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const getUniqueMonths = () => {
    const months = [...new Set(containers.map((c) => c.month))].filter(Boolean);
    return months.sort((a, b) => new Date(b) - new Date(a));
  };

  const getUniqueShippingLines = () => {
    return [
      ...new Set(containers.map((c) => c.shippingLine).filter(Boolean)),
    ].sort();
  };

  const exportToCSV = () => {
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
      "Total Duty",
      "DO Charge",
      "CFS",
      "Final Amount",
      "Container No.",
      "SIMS",
    ];

    const rows = sortedContainers.map((container) => [
      `"${container.month}"`,
      container.no,
      `"${container.containerCode || ""}"`,
      container.status,
      container.loadingDate || "",
      container.eta || "",
      container.ctn || 0,
      `"${container.shippingLine || ""}"`,
      `"${container.bl || ""}"`,
      container.dollar || 0,
      container.dollarRate || 89.7,
      container.inr || 0,
      container.totalDuty || 0,
      container.doCharge || 58000,
      container.cfs || 21830,
      container.finalAmount || 0,
      `"${container.containerNo || ""}"`,
      `"${container.sims || ""}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all_containers_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("All containers exported");
  };

  const toggleRowExpand = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const calculateStats = () => {
    const stats = {
      totalContainers: containers.length,
      totalValue: containers.reduce(
        (sum, c) => sum + (parseFloat(c.dollar) || 0),
        0
      ),
      totalFinalAmount: containers.reduce(
        (sum, c) => sum + (parseFloat(c.finalAmount) || 0),
        0
      ),
      loadedCount: containers.filter((c) => c.status === "Loaded").length,
      inseaCount: containers.filter((c) => c.status === "Insea").length,
      deliveredCount: containers.filter((c) => c.status === "Delivered").length,
      uniqueMonths: getUniqueMonths().length,
      uniqueShippingLines: getUniqueShippingLines().length,
    };

    return stats;
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">
          Loading container dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Container Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Master view of all containers across all months
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => loadContainers()}
                className="flex items-center gap-2 px-4 py-2.5 border rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export All
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            <div className="col-span-2 bg-white rounded-lg shadow border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Total Containers</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalContainers}
                  </div>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-4">
              <div className="text-sm text-gray-600">Loaded</div>
              <div className="text-xl font-bold text-green-600">
                {stats.loadedCount}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-4">
              <div className="text-sm text-gray-600">In Sea</div>
              <div className="text-xl font-bold text-blue-600">
                {stats.inseaCount}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-4">
              <div className="text-sm text-gray-600">Delivered</div>
              <div className="text-xl font-bold text-purple-600">
                {stats.deliveredCount}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-4">
              <div className="text-sm text-gray-600">Total Value</div>
              <div className="text-xl font-bold text-gray-900">
                ${stats.totalValue.toFixed(2)}
              </div>
            </div>

            <div className="col-span-2 bg-white rounded-lg shadow border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">
                    Total Final Amount
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{stats.totalFinalAmount.toFixed(2)}
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow border p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search containers, BL, container no..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Status</option>
                  <option value="Loaded">Loaded</option>
                  <option value="Insea">In Sea</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              <div>
                <select
                  value={filters.month}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, month: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Months</option>
                  {getUniqueMonths().map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={filters.shippingLine}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      shippingLine: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Shipping Lines</option>
                  {getUniqueShippingLines().map((line) => (
                    <option key={line} value={line}>
                      {line}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {sortedContainers.length} of {containers.length}{" "}
                containers
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">View:</span>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg ${
                    viewMode === "grid"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-lg ${
                    viewMode === "table"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                  title="Table view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === "table" ? (
          /* Table View */
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("no")}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        #
                        {sortConfig.key === "no" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          ))}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("month")}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Month
                        {sortConfig.key === "month" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          ))}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Container
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("loadingDate")}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Loading Date
                        {sortConfig.key === "loadingDate" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          ))}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ETA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("ctn")}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        CTN
                        {sortConfig.key === "ctn" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          ))}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shipping Line
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("dollar")}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Dollar
                        {sortConfig.key === "dollar" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          ))}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("finalAmount")}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Final Amount
                        {sortConfig.key === "finalAmount" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          ))}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedContainers.map((container, index) => (
                    <React.Fragment
                      key={`${container.monthId}-${container.no}-${index}`}
                    >
                      <tr
                        className={`hover:bg-gray-50 ${
                          expandedRows.has(index) ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {container.no}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {container.month}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {container.containerCode ||
                                `Container ${container.no}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {container.containerNo}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              container.status
                            )}`}
                          >
                            {getStatusIcon(container.status)}
                            {container.status}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {container.loadingDate || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {container.eta || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {container.ctn}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {container.shippingLine || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-green-600" />
                            {(parseFloat(container.dollar) || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-semibold">
                            ₹
                            {(parseFloat(container.finalAmount) || 0).toFixed(
                              2
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleRowExpand(index)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title={
                                expandedRows.has(index) ? "Collapse" : "Expand"
                              }
                            >
                              {expandedRows.has(index) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/container-summary/${container.monthId}/view`
                                )
                              }
                              className="p-1 text-blue-600 hover:text-blue-800"
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
                          <td colSpan="11" className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white rounded-lg border">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                  Financial Details
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Dollar Rate:
                                    </span>
                                    <span className="text-gray-900">
                                      {container.dollarRate || 89.7}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">INR:</span>
                                    <span className="text-gray-900">
                                      ₹
                                      {(parseFloat(container.inr) || 0).toFixed(
                                        2
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Total Duty:
                                    </span>
                                    <span className="text-gray-900">
                                      ₹
                                      {(
                                        parseFloat(container.totalDuty) || 0
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                  Charges
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      DO Charge:
                                    </span>
                                    <span className="text-gray-900">
                                      ₹
                                      {(
                                        parseFloat(container.doCharge) || 58000
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">CFS:</span>
                                    <span className="text-gray-900">
                                      ₹
                                      {(
                                        parseFloat(container.cfs) || 21830
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                  Documents
                                </h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      BL No:
                                    </span>
                                    <span className="text-gray-900">
                                      {container.bl || "-"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">SIMS:</span>
                                    <span className="text-gray-900">
                                      {container.sims || "-"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                  Actions
                                </h4>
                                <div className="space-y-2">
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/container-summary/${container.monthId}/view`
                                      )
                                    }
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View Full Summary
                                  </button>
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/container-summary/${container.monthId}/edit`
                                      )
                                    }
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                  >
                                    <Edit className="w-3 h-3" />
                                    Edit Summary
                                  </button>
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
                key={`${container.monthId}-${container.no}-${index}`}
                className="bg-white rounded-lg shadow border hover:shadow-lg transition-all duration-200"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(
                          container.status
                        )}`}
                      >
                        <span className="text-lg font-bold">
                          {container.no}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {container.containerCode ||
                            `Container ${container.no}`}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {container.month}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        container.status
                      )}`}
                    >
                      {getStatusIcon(container.status)}
                      {container.status}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-600">
                          Loading Date
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {container.loadingDate || "-"}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-600">ETA</div>
                        <div className="text-sm font-medium text-gray-900">
                          {container.eta || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-600">CTN</div>
                        <div className="text-sm font-medium text-gray-900">
                          {container.ctn}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-xs text-gray-600">
                          Shipping Line
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {container.shippingLine || "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-green-50 p-3 rounded">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <DollarSign className="w-3 h-3" />
                          Dollar Amount
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          ${(parseFloat(container.dollar) || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-xs text-gray-600">
                          Final Amount
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          ₹{(parseFloat(container.finalAmount) || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Container No:</span>
                        <span className="text-gray-900">
                          {container.containerNo || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>BL No:</span>
                        <span className="text-gray-900">
                          {container.bl || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/container-summary/${container.monthId}/view`
                        )
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm"
                    >
                      <Eye className="w-3 h-3" />
                      View Summary
                    </button>
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/container-summary/${container.monthId}/edit`
                        )
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {sortedContainers.length === 0 && (
          <div className="bg-white rounded-lg shadow border p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No containers found
            </h3>
            <p className="text-gray-600 mb-6">
              {containers.length === 0
                ? "Start by creating your first container summary"
                : "Try adjusting your filters"}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setFilters({
                    search: "",
                    status: "",
                    month: "",
                    shippingLine: "",
                  });
                }}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                Clear Filters
              </button>
              <button
                onClick={() =>
                  router.push("/dashboard/container-summary/create")
                }
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Summary
              </button>
            </div>
          </div>
        )}

        {/* Pagination (optional) */}
        {sortedContainers.length > 0 && (
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {Math.min(sortedContainers.length, 50)} containers
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Previous
              </button>
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
