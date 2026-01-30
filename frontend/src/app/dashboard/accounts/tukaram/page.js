"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FolderOpen,
  Search,
  Filter,
  Calendar,
  Archive,
  Lock,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { tukaramAPI } from "@/services/tukaram.service";

export default function TukaramSheetsPage() {
  const router = useRouter();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dashboardStats, setDashboardStats] = useState(null);
  const [years, setYears] = useState([]);

  // Load data
  useEffect(() => {
    loadSheets();
    loadDashboardStats();
    loadYears();
  }, [search, yearFilter, statusFilter]);

  const loadSheets = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        year: yearFilter,
        status: statusFilter,
        page: 1,
        limit: 100,
      };
      const data = await tukaramAPI.getSheets(params);
      setSheets(data.data.data.sheets || []);
    } catch (error) {
      toast.error(error.message || "Failed to load sheets");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const data = await tukaramAPI.getDashboardOverview();
      setDashboardStats(data.data.data);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    }
  };

  const loadYears = async () => {
    try {
      const data = await tukaramAPI.getSheets({ limit: 1000 });
      const uniqueYears = [
        ...new Set(data.data.data.sheets.map((s) => s.year).filter(Boolean)),
      ].sort((a, b) => b - a);
      setYears(uniqueYears);
    } catch (error) {
      console.error("Failed to load years:", error);
    }
  };

  const handleCreateSheet = async () => {
    try {
      const titleData = await tukaramAPI.generateDefaultTitle();
      const defaultTitle = titleData.data.data.title;

      const sheet = await tukaramAPI.createSheet({
        title: defaultTitle,
      });

      toast.success("Sheet created successfully");
      router.push(`/dashboard/accounts/tukaram/${sheet.data.data.id}`);
    } catch (error) {
      toast.error(error.message || "Failed to create sheet");
    }
  };

  const handleDeleteSheet = async (sheetId, sheetTitle) => {
    if (!confirm(`Are you sure you want to archive "${sheetTitle}"?`)) return;

    try {
      await tukaramAPI.deleteSheet(sheetId);
      toast.success("Sheet archived successfully");
      loadSheets();
      loadDashboardStats();
    } catch (error) {
      toast.error(error.message || "Failed to archive sheet");
    }
  };

  const handleExportSheet = async (sheetId, sheetTitle) => {
    try {
      const blob = await tukaramAPI.exportSheet(sheetId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TUKARAM_JI_${sheetTitle.replace(/\s+/g, "_")}_export_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Sheet exported successfully");
    } catch (error) {
      toast.error(error.message || "Failed to export sheet");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => router.push("/dashboard/accounts")}
                className="mt-1 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Back to Accounts"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                  TukaramJI Account Sheets
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Manage container-wise account sheets with charges, scanning, and DC tracking.
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateSheet}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Sheet
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase">
                    Total Sheets
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {dashboardStats.totals.totalSheets}
                  </div>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Active: {dashboardStats.totals.activeSheets} • Archived:{" "}
                {dashboardStats.totals.archivedSheets}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase">
                    Total Entries
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {dashboardStats.totals.totalEntries}
                  </div>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            {dashboardStats.currentMonth.sheet && (
              <>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase">
                        Current Month Total
                      </div>
                      <div className="text-2xl font-bold text-slate-900 mt-1">
                        ₹{dashboardStats.currentMonth.total.toLocaleString()}
                      </div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Paid: ₹{dashboardStats.currentMonth.paid.toLocaleString()}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-amber-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-amber-700 uppercase">
                        Current Month Balance
                      </div>
                      <div className="text-2xl font-bold text-amber-700 mt-1">
                        ₹{dashboardStats.currentMonth.balance.toLocaleString()}
                      </div>
                    </div>
                    <TrendingDown className="w-8 h-8 text-amber-500" />
                  </div>
                  <div className="mt-2 text-xs text-amber-600">
                    Sheet: {dashboardStats.currentMonth.sheet.title}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sheets by title or description..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
                <option value="LOCKED">Locked</option>
              </select>
              <button
                onClick={loadSheets}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sheets Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-slate-100 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : sheets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">
              TukaramJI Account Sheets
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Create your first account sheet to get started
            </p>
            <button
              onClick={handleCreateSheet}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Create Sheet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sheets.map((sheet) => (
              <div
                key={sheet.id}
                className={`group bg-white p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${
                  sheet.status === "ARCHIVED"
                    ? "border-slate-200 opacity-80"
                    : sheet.status === "LOCKED"
                    ? "border-amber-200"
                    : "border-blue-200"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">
                        {sheet.title}
                      </h3>
                      {sheet.status === "LOCKED" && (
                        <Lock className="w-4 h-4 text-amber-500" />
                      )}
                      {sheet.status === "ARCHIVED" && (
                        <Archive className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {sheet.month && sheet.year && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(
                            sheet.year,
                            sheet.month - 1
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      {sheet.tags && sheet.tags.length > 0 && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {sheet.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <button className="p-1 text-slate-400 hover:text-slate-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {sheet.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {sheet.description}
                  </p>
                )}

                {/* Summary Stats */}
                <div className="mb-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Total
                      </div>
                      <div className="font-medium text-slate-900">
                        ₹{sheet.summary.totalPayable.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Paid
                      </div>
                      <div className="font-medium text-blue-700">
                        ₹{sheet.summary.totalPaid.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Balance
                      </div>
                      <div
                        className={`font-bold ${
                          sheet.summary.balance > 0
                            ? "text-amber-600"
                            : "text-blue-600"
                        }`}
                      >
                        ₹{sheet.summary.balance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-slate-400">
                      {sheet.summary.entryCount} entries
                    </span>
                    <div
                      className={`text-xs px-2 py-1 rounded-full ${
                        sheet.status === "ACTIVE"
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : sheet.status === "ARCHIVED"
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}
                    >
                      {sheet.status}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/accounts/tukaram/${sheet.id}`)
                      }
                      className="flex-1 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Open
                    </button>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleExportSheet(sheet.id, sheet.title)}
                        className="p-2 text-slate-400 hover:text-blue-600"
                        title="Export"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {sheet.status !== "ARCHIVED" && (
                        <>
                          <button
                            onClick={() => handleDeleteSheet(sheet.id, sheet.title)}
                            className="p-2 text-slate-400 hover:text-red-600"
                            title="Archive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
