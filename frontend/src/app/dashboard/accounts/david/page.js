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
  Share2,
  Copy,
  Filter,
  ChevronRight,
  Loader2,
  Archive,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";

export default function DavidSheetsList() {
  const router = useRouter();
  const [sheets, setSheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, archived
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSheets, setSelectedSheets] = useState([]);

  useEffect(() => {
    fetchSheets();
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

      const response = await API.get(`/accounts/david?${params}`);
      if (response.data.success) {
        setSheets(response.data.data.sheets || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching sheets:", error);
      toast.error("Failed to load sheets");
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSheet = async () => {
    try {
      const response = await API.post("/accounts/david/", {
        name: `New David Sheet ${new Date().toLocaleDateString()}`,
        description: "",
        tags: ["forex", "ledger"],
      });

      if (response.data.success) {
        toast.success("New sheet created");
        router.push(`/dashboard/accounts/david/${response.data.data.id}`);
      }
    } catch (error) {
      console.error("Error creating sheet:", error);
      toast.error("Failed to create sheet");
    }
  };

  const duplicateSheet = async (sheetId, sheetName) => {
    try {
      const response = await API.post("/accounts/david/", {
        name: `${sheetName} (Copy)`,
        description: "",
        tags: ["forex", "ledger", "copy"],
      });

      if (response.data.success) {
        const newSheet = response.data.data;

        // Load original sheet to duplicate entries
        const originalSheet = await API.get(`/accounts/david/${sheetId}`);
        if (originalSheet.data.success && originalSheet.data.data.entries) {
          await API.post(
            `/accounts/david/${newSheet.id}/import`,
            originalSheet.data.data.entries.map((entry) => ({
              date: entry.date,
              particulars: entry.particulars,
              debitRMB: entry.debitRMB || 0,
              creditRMB: entry.creditRMB || 0,
              debitUSD: entry.debitUSD || 0,
              creditUSD: entry.creditUSD || 0,
            }))
          );
        }

        toast.success("Sheet duplicated");
        fetchSheets();
      }
    } catch (error) {
      console.error("Error duplicating sheet:", error);
      toast.error("Failed to duplicate sheet");
    }
  };

  const archiveSheet = async (sheetId, archive = true) => {
    try {
      const response = await API.put(`/accounts/david/${sheetId}`, {
        status: archive ? "ARCHIVED" : "ACTIVE",
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
    //   window.open(
    //     `${process.env.NEXT_PUBLIC_API_URL}/accounts/david/${sheetId}/export`,
    //     "_blank"
    //   );
      toast.success("Export started");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Failed to export sheet");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { color: "bg-green-100 text-green-800", label: "Active" },
      ARCHIVED: { color: "bg-gray-100 text-gray-800", label: "Archived" },
      LOCKED: { color: "bg-red-100 text-red-800", label: "Locked" },
    };
    const config = statusConfig[status] || statusConfig.ACTIVE;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN").format(amount || 0);
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
                onClick={() => router.push("/dashboard/accounts/")}
                className="p-2 bg-slate-100 hover:bg-slate-200 flex justify-center items-center gap-4 text-slate-600 rounded-lg transition-colors"
                title="Back to Accounts"
              >
                <ArrowLeft className="w-5 h-5" /> Back to Accounts
              </button>
              <h1 className="text-3xl font-bold text-slate-900">
                David Forex Sheets
              </h1>
              <p className="text-slate-600 mt-2">
                Manage your forex ledger sheets for David Impex
              </p>
            </div>
            <button
              onClick={createNewSheet}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md transition-all hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              New Sheet
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
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
                      ? "bg-blue-100 text-blue-700"
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

        {/* Sheets Grid/Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-slate-600">Loading sheets...</span>
            </div>
          ) : sheets.length === 0 ? (
            <div className="text-center py-16">
              <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No sheets found
              </h3>
              <p className="text-slate-600 mb-6">
                {search
                  ? "Try a different search term"
                  : "Create your first forex sheet"}
              </p>
              <button
                onClick={createNewSheet}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                      Sheet Name
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Entries
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      RMB Balance
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      USD Balance
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="text-left p-4 font-semibold text-slate-700">
                      Last Updated
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
                          className="font-medium text-slate-900 hover:text-blue-600 cursor-pointer"
                          onClick={() =>
                            router.push(`/dashboard/accounts/david/${sheet.id}`)
                          }
                        >
                          {sheet.name}
                        </div>
                        {sheet.description && (
                          <div className="text-sm text-slate-500 mt-1">
                            {sheet.description}
                          </div>
                        )}
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
                        <div className="font-mono font-medium">
                          ¥{formatCurrency(sheet.summary?.netRMB || 0)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono font-medium">
                          ${formatCurrency(sheet.summary?.netUSD || 0)}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(sheet.status)}</td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(sheet.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/accounts/david/${sheet.id}`
                              )
                            }
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
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
                            className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
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
                            {sheet.status === "ARCHIVED" ? (
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

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-3xl font-bold text-slate-900">
              {sheets.length}
            </div>
            <div className="text-sm text-slate-600 mt-1">Total Sheets</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-3xl font-bold text-slate-900">
              {sheets.filter((s) => s.status === "ACTIVE").length}
            </div>
            <div className="text-sm text-slate-600 mt-1">Active Sheets</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-3xl font-bold text-slate-900">
              ¥
              {formatCurrency(
                sheets.reduce(
                  (sum, sheet) => sum + (sheet.summary?.netRMB || 0),
                  0
                )
              )}
            </div>
            <div className="text-sm text-slate-600 mt-1">Total RMB</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-3xl font-bold text-slate-900">
              $
              {formatCurrency(
                sheets.reduce(
                  (sum, sheet) => sum + (sheet.summary?.netUSD || 0),
                  0
                )
              )}
            </div>
            <div className="text-sm text-slate-600 mt-1">Total USD</div>
          </div>
        </div>
      </div>
    </div>
  );
}
