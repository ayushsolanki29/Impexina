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
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  User,
  Building,
  Box,
  FileText,
  Eye,
} from "lucide-react";

// Sample data based on your spreadsheet
const DEMO_ORDERS = [
  {
    id: "order-1",
    shippingMark: "BHK - 328",
    supplier: "SS Supplier",
    product: "SS HEAVY FLOWER CUTTER",
    quantity: 3600,
    cartons: 50,
    shippingMode: "Sea Freight",
    status: "Loaded",
    paymentDate: "25-09-25",
    deliveryDateExpected: "26-09-25",
    loadingDate: "29-09-25",
    arrivalDate: "29-10-25",
    shippingCode: "PSDE-83",
    totalAmount: 27000,
    balanceAmount: 0,
    deposit: 27000,
    mainClient: "MELISSAYU",
    subClient: "BHK - 328",
  },
  {
    id: "order-2",
    shippingMark: "BHK - 19",
    supplier: "MELISSAYU",
    product: "ANGLE GRINDING BRACKET STAND",
    quantity: 560,
    cartons: 10,
    shippingMode: "Sea Freight",
    status: "Loaded",
    paymentDate: "11-10-28",
    deliveryDateExpected: "13-10-25",
    loadingDate: "17-10-25",
    arrivalDate: "17-11-25",
    shippingCode: "PSDL-90",
    totalAmount: 18566,
    balanceAmount: 0,
    deposit: 18566,
    mainClient: "MELISSAYU",
    subClient: "BHK - 19",
  },
  {
    id: "order-3",
    shippingMark: "BHK - 319",
    supplier: "Tool Master",
    product: "SLIDING GRINDING STAND",
    quantity: 90,
    cartons: 15,
    shippingMode: "Sea Freight",
    status: "Loaded",
    paymentDate: "",
    deliveryDateExpected: "17-10-25",
    loadingDate: "17-10-25",
    arrivalDate: "17-11-25",
    shippingCode: "PSDL-90",
    totalAmount: 4500,
    balanceAmount: 4500,
    deposit: 0,
    mainClient: "MELISSAYU",
    subClient: "BHK - 319",
  },
  {
    id: "order-4",
    shippingMark: "BHK - 320",
    supplier: "Hardware Co",
    product: "ANGLE GRINDING STAND",
    quantity: 80,
    cartons: 10,
    shippingMode: "Sea Freight",
    status: "Loaded",
    paymentDate: "",
    deliveryDateExpected: "17-10-25",
    loadingDate: "17-10-25",
    arrivalDate: "17-11-25",
    shippingCode: "PSDL-90",
    totalAmount: 3200,
    balanceAmount: 3200,
    deposit: 0,
    mainClient: "MELISSAYU",
    subClient: "BHK - 320",
  },
  {
    id: "order-5",
    shippingMark: "BHK - 322",
    supplier: "Metal Works",
    product: "ADJUSTABLE PRESS VICE",
    quantity: 150,
    cartons: 5,
    shippingMode: "Sea Freight",
    status: "Loaded",
    paymentDate: "",
    deliveryDateExpected: "17-10-25",
    loadingDate: "17-10-25",
    arrivalDate: "17-11-25",
    shippingCode: "PSDL-90",
    totalAmount: 7500,
    balanceAmount: 7500,
    deposit: 0,
    mainClient: "MELISSAYU",
    subClient: "BHK - 322",
  },
  {
    id: "order-6",
    shippingMark: "BHK - 324",
    supplier: "Tooling Inc",
    product: "90 DEGREE ANGLE CORNER CLAMP SET OF 4",
    quantity: 500,
    cartons: 10,
    shippingMode: "Sea Freight",
    status: "Loaded",
    paymentDate: "",
    deliveryDateExpected: "17-10-25",
    loadingDate: "17-10-25",
    arrivalDate: "17-11-25",
    shippingCode: "PSDL-90",
    totalAmount: 25000,
    balanceAmount: 25000,
    deposit: 0,
    mainClient: "MELISSAYU",
    subClient: "BHK - 324",
  },
  {
    id: "order-7",
    shippingMark: "BHK - 99",
    supplier: "Precision Tools",
    product: "360 UNIVERSAL ROTATING VICE",
    quantity: 48,
    cartons: 2,
    shippingMode: "Sea Freight",
    status: "Loaded",
    paymentDate: "",
    deliveryDateExpected: "17-10-25",
    loadingDate: "17-10-25",
    arrivalDate: "17-11-25",
    shippingCode: "PSDL-90",
    totalAmount: 4800,
    balanceAmount: 4800,
    deposit: 0,
    mainClient: "MELISSAYU",
    subClient: "BHK - 99",
  },
  {
    id: "order-8",
    shippingMark: "BHK - 91",
    supplier: "14117",
    product: "VIKTA TOP CUTTING WHEEL",
    quantity: 500,
    cartons: 1,
    shippingMode: "Sea Freight",
    status: "Pending",
    paymentDate: "11-Oct",
    deliveryDateExpected: "09-10-25",
    loadingDate: "17-10-25",
    arrivalDate: "17-11-25",
    shippingCode: "PSDL-90",
    totalAmount: 55250,
    balanceAmount: 55250,
    deposit: 0,
    mainClient: "VIKTA",
    subClient: "BHK - 91",
  },
  {
    id: "order-9",
    shippingMark: "BHK - 158",
    supplier: "BRAVEMAN",
    product: "5 IN 1 SILICON CAULKING TOOL KIT",
    quantity: 600,
    cartons: 3,
    shippingMode: "Air Freight",
    status: "Processing",
    paymentDate: "09-10-25",
    deliveryDateExpected: "09-Oct",
    loadingDate: "",
    arrivalDate: "",
    shippingCode: "AIR-123",
    totalAmount: 13170,
    balanceAmount: 13170,
    deposit: 0,
    mainClient: "BRAVEMAN",
    subClient: "BHK - 158",
  },
];

function OrderSkeleton() {
  return (
    <div className="animate-pulse p-4 border-b bg-white/40">
      <div className="flex justify-between items-center gap-4">
        <div className="w-40 h-4 bg-slate-200 rounded" />
        <div className="flex gap-3">
          <div className="w-20 h-4 bg-slate-200 rounded" />
          <div className="w-20 h-4 bg-slate-200 rounded" />
          <div className="w-20 h-4 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ClientOrderTrackerPage() {
  const router = useRouter();

  // UI state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [shippingModeFilter, setShippingModeFilter] = useState("");
  const [mainClientFilter, setMainClientFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Load data from localStorage
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      try {
        const raw = JSON.parse(localStorage.getItem("igpl_orders") || "null");
        if (!raw || !Array.isArray(raw) || raw.length === 0) {
          localStorage.setItem("igpl_orders", JSON.stringify(DEMO_ORDERS));
          setOrders(DEMO_ORDERS);
        } else {
          setOrders(raw);
        }
      } catch (err) {
        localStorage.setItem("igpl_orders", JSON.stringify(DEMO_ORDERS));
        setOrders(DEMO_ORDERS);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, []);

  // Get unique values for filters
  const uniqueStatuses = ["Loaded", "Pending", "Processing", "Delivered", "In Transit"];
  const uniqueShippingModes = useMemo(() => {
    const modes = new Set();
    orders.forEach((order) => {
      if (order.shippingMode) modes.add(order.shippingMode);
    });
    return Array.from(modes).sort();
  }, [orders]);

  const uniqueMainClients = useMemo(() => {
    const clients = new Set();
    orders.forEach((order) => {
      if (order.mainClient) clients.add(order.mainClient);
    });
    return Array.from(clients).sort();
  }, [orders]);

  // Group orders by shipping code (container)
  const groupedByShippingCode = useMemo(() => {
    const map = new Map();
    
    orders.forEach((order) => {
      if (!order.shippingCode) return;
      
      const key = order.shippingCode;
      if (!map.has(key)) {
        map.set(key, {
          shippingCode: key,
          mainClients: new Set(),
          subClients: new Set(),
          shippingMode: order.shippingMode || "",
          loadingDate: order.loadingDate || "",
          arrivalDate: order.arrivalDate || "",
          status: order.status || "Pending",
          totalOrders: 0,
          totalQuantity: 0,
          totalCartons: 0,
          totalAmount: 0,
          orders: [],
        });
      }
      
      const group = map.get(key);
      group.totalOrders += 1;
      group.totalQuantity += Number(order.quantity || 0);
      group.totalCartons += Number(order.cartons || 0);
      group.totalAmount += Number(order.totalAmount || 0);
      
      if (order.mainClient) group.mainClients.add(order.mainClient);
      if (order.subClient) group.subClients.add(order.subClient);
      group.orders.push(order);
      
      // Set latest status if multiple orders have different statuses
      if (order.status === "Loaded" && group.status !== "Loaded") {
        group.status = "Loaded";
      }
    });

    // Convert to array
    const arr = Array.from(map.values()).map((group) => ({
      ...group,
      mainClientCount: group.mainClients.size,
      subClientCount: group.subClients.size,
      mainClients: Array.from(group.mainClients),
      subClients: Array.from(group.subClients),
    }));

    // Sort by loading date desc
    arr.sort((a, b) => {
      const da = a.loadingDate ? new Date(a.loadingDate).getTime() : 0;
      const db = b.loadingDate ? new Date(b.loadingDate).getTime() : 0;
      return db - da;
    });

    return arr;
  }, [orders]);

  // Filter shipping code groups
  const filteredGroups = useMemo(() => {
    if (!groupedByShippingCode || groupedByShippingCode.length === 0) return [];

    const qLower = searchQuery.trim().toLowerCase();
    return groupedByShippingCode.filter((group) => {
      // Search by shipping code or product
      const matchesSearch =
        !qLower ||
        group.shippingCode.toLowerCase().includes(qLower) ||
        group.orders.some(order => 
          order.product?.toLowerCase().includes(qLower) ||
          order.shippingMark?.toLowerCase().includes(qLower)
        );

      // Filter by status
      const matchesStatus = !statusFilter || group.status === statusFilter;

      // Filter by shipping mode
      const matchesShippingMode = 
        !shippingModeFilter || group.shippingMode === shippingModeFilter;

      // Filter by main client
      const matchesMainClient = 
        !mainClientFilter || 
        group.mainClients.includes(mainClientFilter);

      // Filter by date range (loading date)
      let matchesDate = true;
      if (dateFrom && group.loadingDate) {
        matchesDate = matchesDate && new Date(group.loadingDate) >= new Date(dateFrom);
      }
      if (dateTo && group.loadingDate) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59);
        matchesDate = matchesDate && new Date(group.loadingDate) <= toDate;
      }

      return matchesSearch && matchesStatus && matchesShippingMode && 
             matchesMainClient && matchesDate;
    });
  }, [groupedByShippingCode, searchQuery, statusFilter, shippingModeFilter, mainClientFilter, dateFrom, dateTo]);

  // Pagination
  const paginated = useMemo(() => {
    return filteredGroups.slice(0, page * PAGE_SIZE);
  }, [filteredGroups, page]);
  const hasMore = filteredGroups.length > paginated.length;

  // Navigation to order details
  function goToOrderDetails(shippingCode) {
    router.push(`/dashboard/order-tracker/${encodeURIComponent(shippingCode)}`);
  }

  function handleNewOrder() {
    router.push("/dashboard/order-tracker/new");
  }

  // Refresh data
  function refreshData() {
    setLoading(true);
    setTimeout(() => {
      try {
        const raw = JSON.parse(localStorage.getItem("igpl_orders") || "[]");
        setOrders(raw || []);
        toast.success("Data refreshed");
      } catch {
        toast.error("Failed to refresh data");
      } finally {
        setLoading(false);
      }
    }, 200);
  }

  // Export data
  function exportToCSV() {
    const headers = [
      "Shipping Code",
      "Shipping Mode",
      "Status",
      "Main Clients",
      "Sub Clients",
      "Total Orders",
      "Total Quantity",
      "Total Cartons",
      "Total Amount",
      "Loading Date",
      "Arrival Date",
    ];
    
    const csvData = filteredGroups.map((group) => [
      group.shippingCode,
      group.shippingMode,
      group.status,
      group.mainClients.join(", "),
      group.subClients.join(", "),
      group.totalOrders,
      group.totalQuantity,
      group.totalCartons,
      group.totalAmount,
      group.loadingDate,
      group.arrivalDate,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("CSV exported successfully");
  }

  // Get status badge color and icon
  function getStatusInfo(status) {
    switch (status) {
      case "Loaded":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <Truck className="w-4 h-4" />,
        };
      case "Pending":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Clock className="w-4 h-4" />,
        };
      case "Processing":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <Package className="w-4 h-4" />,
        };
      case "Delivered":
        return {
          color: "bg-purple-100 text-purple-800 border-purple-200",
          icon: <CheckCircle className="w-4 h-4" />,
        };
      case "In Transit":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: <Truck className="w-4 h-4" />,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <AlertCircle className="w-4 h-4" />,
        };
    }
  }

  // Clear all filters
  function clearAllFilters() {
    setSearchQuery("");
    setStatusFilter("");
    setShippingModeFilter("");
    setMainClientFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start justify-between mb-8 gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Client Order Tracker
            </h1>
            <p className="text-sm text-gray-600">
              Track all client orders grouped by shipping containers. Each container can have multiple clients.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded hover:bg-gray-50"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>

            <button
              onClick={refreshData}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>

            <button
              onClick={handleNewOrder}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded shadow"
            >
              <Plus className="w-4 h-4" /> New Order
            </button>
          </div>
        </header>

        {/* Main Container */}
        <div className="bg-white border rounded-lg shadow overflow-hidden">
          {/* Filters Section */}
          <div className="p-5 border-b bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Filters & Search
              </h2>
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded border"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Search Orders
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Shipping code, product..."
                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded w-full focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">All Status</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shipping Mode Filter */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Shipping Mode
                </label>
                <select
                  value={shippingModeFilter}
                  onChange={(e) => {
                    setShippingModeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">All Modes</option>
                  {uniqueShippingModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Main Client Filter */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Main Client
                </label>
                <select
                  value={mainClientFilter}
                  onChange={(e) => {
                    setMainClientFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">All Clients</option>
                  {uniqueMainClients.map((client) => (
                    <option key={client} value={client}>
                      {client}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="md:col-span-2 lg:col-span-4 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Loading Date From
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10 pr-3 py-2.5 border border-gray-300 rounded w-full focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Loading Date To
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10 pr-3 py-2.5 border border-gray-300 rounded w-full focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Header */}
          <div className="px-5 py-4 border-b bg-white/70">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <strong className="text-gray-900">{paginated.length}</strong>{" "}
                of <strong className="text-gray-900">{filteredGroups.length}</strong>{" "}
                shipping containers
              </div>
              <div className="text-xs text-gray-500">
                <Filter className="w-3 h-3 inline mr-1" />
                {filteredGroups.length === groupedByShippingCode.length
                  ? "No filters applied"
                  : `${filteredGroups.length} results after filtering`}
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div>
            {loading ? (
              <div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <OrderSkeleton key={i} />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-gray-400 mb-3 text-lg">
                  No orders found
                </div>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Try adjusting your filters or create a new order.
                </p>
                <button
                  onClick={handleNewOrder}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded"
                >
                  <Plus className="w-4 h-4" /> Create First Order
                </button>
              </div>
            ) : (
              <div>
                {paginated.map((group) => {
                  const statusInfo = getStatusInfo(group.status);
                  return (
                    <div
                      key={group.shippingCode}
                      className="p-5 border-b hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* Left Section: Shipping Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-4 mb-3">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                              {group.shippingCode.split("-")[0]}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <button
                                  onClick={() => goToOrderDetails(group.shippingCode)}
                                  className="text-xl font-bold text-gray-900 hover:text-blue-700 hover:underline truncate"
                                  title={`Open ${group.shippingCode}`}
                                >
                                  {group.shippingCode}
                                </button>

                                <span
                                  className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border ${statusInfo.color} font-medium`}
                                >
                                  {statusInfo.icon}
                                  {group.status}
                                </span>
                              </div>

                              <div className="text-sm text-gray-600 mb-3">
                                <span className="font-medium text-gray-800">
                                  {group.shippingMode}
                                </span>
                                {" • "}
                                Loading: {group.loadingDate || "—"}
                                {" • "}
                                Arrival: {group.arrivalDate || "—"}
                              </div>

                              {/* Clients Info */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Building className="w-4 h-4 text-gray-500" />
                                  <span className="text-xs font-medium text-gray-700">
                                    Main Clients ({group.mainClientCount}):
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {group.mainClients.slice(0, 3).map((client, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                                      >
                                        {client}
                                      </span>
                                    ))}
                                    {group.mainClientCount > 3 && (
                                      <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">
                                        +{group.mainClientCount - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span className="text-xs font-medium text-gray-700">
                                    Sub Clients ({group.subClientCount}):
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {group.subClients.slice(0, 3).map((sub, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                                      >
                                        {sub}
                                      </span>
                                    ))}
                                    {group.subClientCount > 3 && (
                                      <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">
                                        +{group.subClientCount - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Section: Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Orders</div>
                            <div className="text-lg font-bold text-gray-900 bg-blue-50 px-3 py-1.5 rounded flex items-center justify-center gap-1">
                              <FileText className="w-4 h-4" />
                              {group.totalOrders}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Quantity</div>
                            <div className="text-lg font-bold text-gray-900 bg-green-50 px-3 py-1.5 rounded flex items-center justify-center gap-1">
                              <Package className="w-4 h-4" />
                              {group.totalQuantity.toLocaleString()}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Cartons</div>
                            <div className="text-lg font-bold text-gray-900 bg-purple-50 px-3 py-1.5 rounded flex items-center justify-center gap-1">
                              <Box className="w-4 h-4" />
                              {group.totalCartons}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Amount</div>
                            <div className="text-lg font-bold text-gray-900 bg-yellow-50 px-3 py-1.5 rounded flex items-center justify-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {group.totalAmount.toLocaleString()}
                            </div>
                          </div>

                          <div className="md:col-span-4 text-center">
                            <button
                              onClick={() => goToOrderDetails(group.shippingCode)}
                              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 w-full justify-center"
                            >
                              <Eye className="w-4 h-4" />
                              View Details <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Page {page} • {paginated.length} containers shown •{" "}
                {filteredGroups.length} total after filters
              </div>

              <div className="flex items-center gap-3">
                {page > 1 && (
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
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
                  <div className="text-sm text-gray-500">
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