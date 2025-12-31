"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Folder,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Edit,
  Copy,
  Trash2,
  Archive,
  Loader2,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";

export default function AhmedabadPettyCashList() {
  const router = useRouter();
  const [sheets, setSheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, archived
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [stats, setStats] = useState({
    totalSheets: 0,
    activeSheets: 0,
    totalEntries: 0,
    recentEntries: 0,
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

      const response = await API.get(
        `/expenses/ahmedabad-petty-cash?${params}`
      );
      if (response.data.success) {
        setSheets(response.data.data.sheets || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching sheets:", error);
      toast.error("Failed to load petty cash sheets");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await API.get(
        "/expenses/ahmedabad-petty-cash/dashboard/stats"
      );
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const createNewSheet = async () => {
    try {
      const response = await API.post("/expenses/ahmedabad-petty-cash", {
        name: `Ahmedabad Petty Cash - ${new Date().toLocaleDateString()}`,
        description: "",
        openingBalance: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });

      if (response.data.success) {
        toast.success("New petty cash sheet created");
        router.push(`/dashboard/expenses/ahmedabad/${response.data.data.id}`);
      }
    } catch (error) {
      console.error("Error creating sheet:", error);
      toast.error("Failed to create sheet");
    }
  };

  const duplicateSheet = async (sheetId, sheetName) => {
    try {
      const response = await API.post(
        `/expenses/ahmedabad-petty-cash/${sheetId}/duplicate`,
        {
          name: `${sheetName} (Copy)`,
        }
      );

      if (response.data.success) {
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
      const response = await API.put(
        `/expenses/ahmedabad-petty-cash/${sheetId}`,
        {
          status: archive ? "ARCHIVED" : "ACTIVE",
        }
      );

      if (response.data.success) {
        toast.success(`Sheet ${archive ? "archived" : "restored"}`);
        fetchSheets();
        fetchDashboardStats();
      }
    } catch (error) {
      console.error("Error archiving sheet:", error);
      toast.error("Failed to update sheet");
    }
  };

  const deleteSheet = async (sheetId, sheetName) => {
    if (
      !confirm(
        `Are you sure you want to delete "${sheetName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await API.delete(
        `/expenses/ahmedabad-petty-cash/${sheetId}`
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchSheets();
        fetchDashboardStats();
      }
    } catch (error) {
      console.error("Error deleting sheet:", error);
      toast.error("Failed to delete sheet");
    }
  };

  const exportSheet = async (sheetId, sheetName) => {
    try {
      window.open(
        `${process.env.NEXT_PUBLIC_API_URL}/expenses/ahmedabad-petty-cash/${sheetId}/export`,
        "_blank"
      );
      toast.success("Export started");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Failed to export sheet");
    }
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

  const getStatusBadge = (status) => {
    const config = {
      ACTIVE: {
        color: "bg-green-100 text-green-800",
        label: "Active",
        icon: TrendingUp,
      },
      ARCHIVED: {
        color: "bg-gray-100 text-gray-800",
        label: "Archived",
        icon: Archive,
      },
    };
    const statusConfig = config[status] || config.ACTIVE;
    const Icon = statusConfig.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
      >
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </span>
    );
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
              <button
                onClick={() => router.push("/dashboard/expenses/")}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-3xl font-bold text-slate-900">
                Ahmedabad Petty Cash
              </h1>
              <p className="text-slate-600 mt-2">
                Track daily office expenses, deposits, and cash flow in
                Ahmedabad
              </p>
            </div>
            <button
              onClick={createNewSheet}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium rounded-lg hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              New Cash Sheet
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Total Sheets
                </div>
                <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Folder className="w-6 h-6 text-blue-500" />
                  {stats.totalSheets}
                </div>
              </div>
              <div className="text-sm text-slate-500">
                {stats.activeSheets} active
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Total Transactions
                </div>
                <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-purple-500" />
                  {stats.totalEntries}
                </div>
              </div>
              <div className="text-sm text-slate-500">All entries</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Recent (7 days)
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {stats.recentEntries}
                </div>
              </div>
              <div className="text-sm text-slate-500">New transactions</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Quick Actions
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={createNewSheet}
                className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700"
              >
                + New
              </button>
              <button
                onClick={fetchSheets}
                className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
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
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none w-64"
                  placeholder="Search sheets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === "all"
                      ? "bg-emerald-100 text-emerald-700"
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
                  onClick={() => setFilter("archived")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === "archived"
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

        {/* Sheets Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-slate-600">
                Loading petty cash sheets...
              </span>
            </div>
          ) : sheets.length === 0 ? (
            <div className="text-center py-16">
              <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No petty cash sheets found
              </h3>
              <p className="text-slate-600 mb-6">
                {search
                  ? "Try a different search term"
                  : "Create your first petty cash sheet"}
              </p>
              <button
                onClick={createNewSheet}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Create New Sheet
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedSheets.length === sheets.length &&
                          sheets.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Sheet Name
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Transactions
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Opening
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Credit (In)
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Debit (Out)
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Closing
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Created
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
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-4">
                        <div
                          className="font-medium text-slate-900 hover:text-emerald-600 cursor-pointer"
                          onClick={() =>
                            router.push(
                              `/dashboard/expenses/ahmedabad/${sheet.id}`
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
                        {sheet.month && sheet.year && (
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(
                              sheet.year,
                              sheet.month - 1
                            ).toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric",
                            })}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">
                            {sheet._count?.entries || 0}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono font-medium text-slate-700">
                          ₹{formatCurrency(sheet.openingBalance)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono font-medium text-emerald-600 flex items-center gap-1">
                          <ArrowDownLeft className="w-3 h-3" />₹
                          {formatCurrency(sheet.totalCredit)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono font-medium text-red-600 flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" />₹
                          {formatCurrency(sheet.totalDebit)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div
                          className={`font-mono font-bold ${
                            sheet.closingBalance < 0
                              ? "text-red-600"
                              : sheet.closingBalance > sheet.openingBalance
                              ? "text-emerald-600"
                              : "text-slate-600"
                          }`}
                        >
                          ₹{formatCurrency(sheet.closingBalance)}
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(sheet.status)}
                        {sheet.isLocked && (
                          <div className="text-xs text-amber-600 mt-1">
                            Locked
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {formatDate(sheet.createdAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/expenses/ahmedabad/${sheet.id}`
                              )
                            }
                            className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
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
                                sheet.status !== "ARCHIVED"
                              )
                            }
                            className="p-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                            title={
                              sheet.status === "ARCHIVED"
                                ? "Restore"
                                : "Archive"
                            }
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSheet(sheet.id, sheet.name)}
                            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
            >
              + New Cash Sheet
            </button>
            {selectedSheets.length > 0 && (
              <>
                <button
                  onClick={() => {
                    selectedSheets.forEach((id) => archiveSheet(id, true));
                    setSelectedSheets([]);
                  }}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                >
                  Archive Selected ({selectedSheets.length})
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Export ${selectedSheets.length} selected sheets?`
                      )
                    ) {
                      selectedSheets.forEach((id) => exportSheet(id));
                    }
                  }}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                >
                  Export Selected
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
