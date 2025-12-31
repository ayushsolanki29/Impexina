"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Folder,
  FileText,
  Calendar,
  Download,
  MoreVertical,
  Trash2,
  Edit,
  Copy,
  Filter,
  ChevronRight,
  Loader2,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Archive,
  Share2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";

export default function PaymentCollectionList() {
  const router = useRouter();
  const [sheets, setSheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, paid, overdue
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [stats, setStats] = useState({
    total24_25: 0,
    totalAddCompany: 0,
    total25_26: 0,
    totalAdvance: 0,
    totalBalance: 0,
  });

  useEffect(() => {
    fetchSheets();
    fetchDashboardStats();
  }, [currentPage, search, filter]);

  const fetchSheets = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        search: search,
        ...(filter !== "all" && { status: filter.toUpperCase() }),
      });

      const response = await API.get(`/accounts/collection?${params}`);
      if (response.data.success) {
        setSheets(response.data.data.sheets || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching sheets:", error);
      toast.error("Failed to load payment collection sheets");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await API.get("/accounts/collection/dashboard/overview");
      if (response.data.success) {
        setStats(response.data.data.overallTotals || {});
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const createNewSheet = async () => {
    try {
      const response = await API.post("/accounts/collection/", {
        name: `Payment Collection - ${new Date().toLocaleDateString()}`,
        description: "",
        fiscalYear: "2024-2025",
        tags: ["payment", "collection"],
      });

      if (response.data.success) {
        toast.success("New payment collection sheet created");
        router.push(`/dashboard/accounts/collection/${response.data.data.id}`);
      }
    } catch (error) {
      console.error("Error creating sheet:", error);
      toast.error("Failed to create sheet");
    }
  };

  const duplicateSheet = async (sheetId, sheetName) => {
    try {
      const response = await API.post("/accounts/collection/", {
        name: `${sheetName} (Copy)`,
        description: "",
        fiscalYear: "2024-2025",
        tags: ["payment", "collection", "copy"],
      });

      if (response.data.success) {
        const newSheet = response.data.data;

        // Load original sheet to duplicate entries
        const originalSheet = await API.get(`/accounts/collection/${sheetId}`);
        if (originalSheet.data.success && originalSheet.data.data.entries) {
          await API.put(
            `/accounts/collection/${newSheet.id}/bulk-entries`,
            originalSheet.data.data.entries.map((entry) => ({
              clientName: entry.clientName,
              expectedDate: entry.expectedDate,
              amount24_25: entry.amount24_25 || 0,
              addCompany: entry.addCompany || 0,
              amount25_26: entry.amount25_26 || 0,
              advance: entry.advance || 0,
              isHighlighted: entry.isHighlighted || false,
              notes: entry.notes || "",
            }))
          );
        }

        toast.success("Sheet duplicated successfully");
        fetchSheets();
      }
    } catch (error) {
      console.error("Error duplicating sheet:", error);
      toast.error("Failed to duplicate sheet");
    }
  };

  const archiveSheet = async (sheetId, archive = true) => {
    try {
      const response = await API.put(`/accounts/collection/${sheetId}`, {
        status: archive ? "CANCELLED" : "ACTIVE",
      });

      if (response.data.success) {
        toast.success(`Sheet ${archive ? "archived" : "restored"}`);
        fetchSheets();
      }
    } catch (error) {
      console.error("Error archiving sheet:", error);
      toast.error("Failed to update sheet");
    }
  };

  const exportSheet = async (sheetId, sheetName) => {
    try {
      window.open(
        `${process.env.NEXT_PUBLIC_API_URL}/accounts/collection/${sheetId}/export`,
        "_blank"
      );
      toast.success("Export started");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Failed to export sheet");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: {
        color: "bg-green-100 text-green-800",
        label: "Active",
        icon: TrendingUp,
      },
      PAID: {
        color: "bg-blue-100 text-blue-800",
        label: "Paid",
        icon: DollarSign,
      },
      OVERDUE: {
        color: "bg-red-100 text-red-800",
        label: "Overdue",
        icon: AlertCircle,
      },
      CANCELLED: {
        color: "bg-gray-100 text-gray-800",
        label: "Archived",
        icon: Archive,
      },
    };
    const config = statusConfig[status] || statusConfig.ACTIVE;
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleSelectSheet = (sheetId) => {
    setSelectedSheets((prev) =>
      prev.includes(sheetId)
        ? prev.filter((id) => id !== sheetId)
        : [...prev, sheetId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSheets.length === sheets.length) {
      setSelectedSheets([]);
    } else {
      setSelectedSheets(sheets.map((sheet) => sheet.id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              {/* add back button */}
              <button
                onClick={() => router.push("/dashboard/accounts/")}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                title="Back to Accounts"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-3xl font-bold text-slate-900">
                Payment Collection
              </h1>
              <p className="text-slate-600 mt-2">
                Track client dues, company adds, and advances across multiple
                collection sheets
              </p>
            </div>
            <button
              onClick={createNewSheet}
              className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 shadow-md transition-all hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              New Collection Sheet
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              24-25 Total
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ₹{formatCurrency(stats.total24_25)}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">
              Add Company
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ₹{formatCurrency(stats.totalAddCompany)}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-purple-200 bg-purple-50/30 shadow-sm">
            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
              25-26 Total
            </div>
            <div className="text-2xl font-bold text-purple-700">
              ₹{formatCurrency(stats.total25_26)}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">
              Total Advance
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              ₹{formatCurrency(stats.totalAdvance)}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
              Total Balance
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ₹{formatCurrency(stats.totalBalance)}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-64"
                  placeholder="Search collection sheets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === "all"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("active")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilter("overdue")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === "overdue"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Overdue
                </button>
                <button
                  onClick={() => setFilter("cancelled")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === "cancelled"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Archived
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedSheets.length > 0 && (
                <div className="text-sm text-slate-600">
                  {selectedSheets.length} selected
                </div>
              )}
              <button
                onClick={handleSelectAll}
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                {selectedSheets.length === sheets.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
          </div>
        </div>

        {/* Sheets Grid/Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-3 text-slate-600">
                Loading collection sheets...
              </span>
            </div>
          ) : sheets.length === 0 ? (
            <div className="text-center py-16">
              <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No collection sheets found
              </h3>
              <p className="text-slate-600 mb-6">
                {search
                  ? "Try a different search term"
                  : "Create your first payment collection sheet"}
              </p>
              <button
                onClick={createNewSheet}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Create New Sheet
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4">
                      <input
                        type="checkbox"
                        checked={
                          selectedSheets.length === sheets.length &&
                          sheets.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Collection Sheet
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Entries
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Total 25-26
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Advance
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Balance
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Due Date
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sheets.map((sheet) => (
                    <tr
                      key={sheet.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedSheets.includes(sheet.id)}
                          onChange={() => handleSelectSheet(sheet.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="p-4">
                        <div
                          className="font-medium text-slate-900 hover:text-purple-600 cursor-pointer"
                          onClick={() =>
                            router.push(
                              `/dashboard/accounts/collection/${sheet.id}`
                            )
                          }
                        >
                          {sheet.name}
                        </div>
                        {sheet.description && (
                          <div className="text-sm text-slate-500 mt-1">
                            {sheet.description}
                          </div>
                        )}
                        <div className="text-xs text-slate-400 mt-1">
                          FY: {sheet.fiscalYear}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">
                            {sheet.summary?.entryCount || 0}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono font-medium text-purple-700">
                          ₹{formatCurrency(sheet.summary?.total25_26 || 0)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono font-medium text-emerald-600">
                          ₹{formatCurrency(sheet.summary?.totalAdvance || 0)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div
                          className={`font-mono font-bold ${
                            (sheet.summary?.totalBalance || 0) < 0
                              ? "text-red-600"
                              : "text-slate-900"
                          }`}
                        >
                          ₹{formatCurrency(sheet.summary?.totalBalance || 0)}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(sheet.status)}</td>
                      <td className="p-4 text-sm text-slate-600">
                        {sheet.dueDate ? formatDate(sheet.dueDate) : "-"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/accounts/collection/${sheet.id}`
                              )
                            }
                            className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Open"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => duplicateSheet(sheet.id, sheet.name)}
                            className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => exportSheet(sheet.id, sheet.name)}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Export"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              archiveSheet(
                                sheet.id,
                                sheet.status !== "CANCELLED"
                              )
                            }
                            className="p-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                            title={
                              sheet.status === "CANCELLED"
                                ? "Restore"
                                : "Archive"
                            }
                          >
                            {sheet.status === "CANCELLED" ? (
                              <Share2 className="w-4 h-4" />
                            ) : (
                              <Archive className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={createNewSheet}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              + New Collection Sheet
            </button>
            <button
              onClick={() => toast.info("Coming soon!")}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              Bulk Import
            </button>
            <button
              onClick={() => toast.info("Coming soon!")}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
