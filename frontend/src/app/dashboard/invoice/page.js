"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import {
  Search,
  Download,
  Filter,
  ChevronLeft,
  Plus,
  FileText,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  Building,
  Package,
  Scale,
  DollarSign,
  ChevronDown,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

const INVOICE_KEY = "igpl_invoices_v1";
const OLD_INVOICE_KEY = "igpl_commercial_invoice_v1";

// Demo invoices with enhanced data
const DEMO_INVOICES = [
  {
    id: "inv-1",
    meta: {
      companyName: "YIWU ZHOULAI TRADING CO., LIMITED",
      buyerName: "IMPEXINA GLOBAL PVT LTD",
      invNo: "ICPLEY86",
      date: "2025-10-09",
    },
    origin: "YIWU",
    status: "completed",
    tctn: 649,
    tQty: 56343.8,
    tAmount: 9010,
    createdAt: "2025-10-05",
    items: [],
  },
  {
    id: "inv-2",
    meta: {
      companyName: "YIWU ZHOULAI TRADING CO., LIMITED",
      buyerName: "SOME OTHER BUYER",
      invNo: "ICPLX22",
      date: "2025-09-20",
    },
    origin: "YIWU",
    status: "draft",
    tctn: 120,
    tQty: 3500,
    tAmount: 4200,
    createdAt: "2025-09-15",
    items: [],
  },
  {
    id: "inv-3",
    meta: {
      companyName: "SHANGHAI TRADING CO.",
      buyerName: "GLOBAL IMPORTS LTD",
      invNo: "ICPLZ99",
      date: "2025-10-15",
      from: "SHANGHAI",
      to: "MUMBAI INDIA",
      poNo: "PO-2025-003",
      currency: "USD",
      terms: "EXW",
    },
    origin: "SHANGHAI",
    status: "pending",
    tctn: 85,
    tQty: 2100,
    tAmount: 3250,
    createdAt: "2025-10-10",
    items: [],
  },
  {
    id: "inv-4",
    meta: {
      companyName: "GUANGZHOU EXPORT LTD",
      buyerName: "INDIAN TRADERS PVT",
      invNo: "ICPLA45",
      date: "2025-10-12",
    },
    origin: "GUANGZHOU",
    status: "completed",
    tctn: 320,
    tQty: 12800,
    tAmount: 6850,
    createdAt: "2025-10-08",
    items: [],
  },
];

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
  } catch {
    // ignore
  }
}

function normalizeInvoice(inv) {
  const items = Array.isArray(inv.items) ? inv.items : [];
  let tctn = Number(inv.tctn || 0);
  let tQty = Number(inv.tQty || 0);
  let tAmount = Number(inv.tAmount || 0);

  if ((!tctn || !tQty || !tAmount) && items.length) {
    for (const it of items) {
      tctn += Number(it.ctn || 0);
      tQty += Number(it.tQty || 0);
      tAmount += Number(it.amountUsd || 0);
    }
  }

  return {
    ...inv,
    id: inv.id || `inv-${Math.random().toString(36).slice(2, 8)}`,
    meta: inv.meta || {},
    origin: inv.origin || inv.meta?.from || "",
    status: inv.status || "draft",
    tctn,
    tQty,
    tAmount,
    items,
  };
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  // Load invoices on mount
  useEffect(() => {
    setLoading(true);
    try {
      let stored = readLocal(INVOICE_KEY);
      if (stored && !Array.isArray(stored)) {
        stored = [stored];
      }
      if (!stored || !Array.isArray(stored) || stored.length === 0) {
        const legacy = readLocal(OLD_INVOICE_KEY);
        if (legacy) {
          stored = Array.isArray(legacy) ? legacy : [legacy];
        } else {
          stored = DEMO_INVOICES;
        }
        writeLocal(INVOICE_KEY, stored);
      }
      setInvoices(stored.map(normalizeInvoice));
    } catch (e) {
      setInvoices(DEMO_INVOICES.map(normalizeInvoice));
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    if (loading) return [];

    return invoices
      .filter((inv) => {
        // Status filter
        if (statusFilter !== "all" && inv.status !== statusFilter) {
          return false;
        }

        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const searchable = [
            inv.meta?.invNo,
            inv.meta?.buyerName,
            inv.meta?.companyName,
            inv.meta?.poNo,
            inv.origin,
            inv.meta?.from,
            inv.meta?.to,
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(query);
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by date (newest first)
        const dateA = new Date(a.meta?.date || a.createdAt);
        const dateB = new Date(b.meta?.date || b.createdAt);
        return dateB - dateA;
      });
  }, [invoices, searchQuery, statusFilter, loading]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalInvoices = filteredInvoices.length;
    const totalAmount = filteredInvoices.reduce(
      (sum, inv) => sum + (inv.tAmount || 0),
      0
    );
    const totalCTN = filteredInvoices.reduce(
      (sum, inv) => sum + (inv.tctn || 0),
      0
    );
    const totalQty = filteredInvoices.reduce(
      (sum, inv) => sum + (inv.tQty || 0),
      0
    );
    const completed = filteredInvoices.filter(
      (inv) => inv.status === "completed"
    ).length;

    return {
      totalInvoices,
      totalAmount,
      totalCTN,
      totalQty,
      completed,
      pending: totalInvoices - completed,
    };
  }, [filteredInvoices]);

  const handleOpenInvoice = (invoice) => {
    router.push(`/dashboard/invoice/${encodeURIComponent(invoice.id)}`);
  };

  const handleCreateInvoice = () => {
    router.push("/dashboard/invoice/new");
  };

  const handleDeleteInvoice = (id) => {
    const updatedInvoices = invoices.filter((inv) => inv.id !== id);
    setInvoices(updatedInvoices);
    writeLocal(INVOICE_KEY, updatedInvoices);
    setShowDeleteModal(null);
    toast.success("Invoice deleted successfully");
  };

  const handleExportAll = () => {
    // Simple CSV export
    const headers = [
      "Invoice No",
      "Buyer",
      "Company",
      "Date",
      "CTN",
      "Quantity",
      "Amount",
      "Status",
    ];
    const rows = filteredInvoices.map((inv) => [
      inv.meta?.invNo || "",
      inv.meta?.buyerName || "",
      inv.meta?.companyName || "",
      inv.meta?.date || "",
      inv.tctn || 0,
      inv.tQty || 0,
      inv.tAmount || 0,
      inv.status || "",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    toast.success("All invoices exported as CSV");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "draft":
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "draft":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Commercial Invoices
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and track all commercial invoices
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCreateInvoice}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </button>
            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              <Download className="w-4 h-4" />
              Export All
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <FileText className="w-4 h-4" />
            Total Invoices
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summaryStats.totalInvoices}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Package className="w-4 h-4" />
            Total CTN
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summaryStats.totalCTN}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Scale className="w-4 h-4" />
            Total Quantity
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summaryStats.totalQty.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <DollarSign className="w-4 h-4" />
            Total Amount
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ${summaryStats.totalAmount.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Completed
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summaryStats.completed}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            Pending
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summaryStats.pending}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoices by invoice no, buyer, PO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? (
                  <ChevronDown className="w-4 h-4 rotate-180" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-2 text-sm rounded ${
                      statusFilter === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter("completed")}
                    className={`px-3 py-2 text-sm rounded ${
                      statusFilter === "completed"
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => setStatusFilter("pending")}
                    className={`px-3 py-2 text-sm rounded ${
                      statusFilter === "pending"
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setStatusFilter("draft")}
                    className={`px-3 py-2 text-sm rounded ${
                      statusFilter === "draft"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    Draft
                  </button>
                </div>
              </div>

              {/* Origin Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origin
                </label>
                <select
                  className="w-full p-2 border rounded"
                  onChange={(e) => {
                    if (e.target.value) {
                      setSearchQuery(e.target.value);
                    }
                  }}
                >
                  <option value="">All Origins</option>
                  <option value="YIWU">YIWU</option>
                  <option value="SHANGHAI">SHANGHAI</option>
                  <option value="GUANGZHOU">GUANGZHOU</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="w-1/2 p-2 border rounded"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    className="w-1/2 p-2 border rounded"
                    placeholder="To"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold">{filteredInvoices.length}</span> of{" "}
          <span className="font-semibold">{invoices.length}</span> invoices
        </div>
        <div className="text-sm text-gray-600">
          {statusFilter !== "all" && `Filtered by: ${statusFilter}`}
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        {loading ? (
          // Skeleton Loaders
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-4">No invoices found</div>
            <button
              onClick={handleCreateInvoice}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Your First Invoice
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice.status)}
                        <h3 className="font-semibold text-gray-900">
                          {invoice.meta?.invNo || "No Invoice No"}
                        </h3>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(
                          invoice.status
                        )}`}
                      >
                        {invoice.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{invoice.meta?.buyerName || "No Buyer"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>{invoice.meta?.companyName || "No Company"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{invoice.meta?.date || "No Date"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Section - Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">CTN</div>
                      <div className="font-semibold text-gray-900">
                        {invoice.tctn || 0}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Quantity</div>
                      <div className="font-semibold text-gray-900">
                        {invoice.tQty?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Amount</div>
                      <div className="font-semibold text-gray-900">
                        ${invoice.tAmount?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenInvoice(invoice)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      title="Open Invoice"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    <button
                      onClick={() => handleOpenInvoice(invoice)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      title="Edit Invoice"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowDeleteModal(invoice.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold">Delete Invoice</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this invoice? This action cannot
              be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteInvoice(showDeleteModal)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          Total Invoices: {invoices.length} • Storage: Local Storage
        </div>
        <div className="text-sm text-gray-600">
          Last Updated: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
