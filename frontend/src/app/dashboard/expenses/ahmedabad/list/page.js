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
            const now = new Date();
            const timestamp = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const response = await API.post("/expenses/ahmedabad-petty-cash", {
                name: `CPC - ${now.toLocaleDateString('en-IN')} ${timestamp}`,
                description: "New petty cash sheet initialized",
                openingBalance: 0,
                month: now.getMonth() + 1,
                year: now.getFullYear(),
            });

            if (response.data.success) {
                toast.success("New petty cash sheet created");
                router.push(`/dashboard/expenses/ahmedabad/${response.data.data.id}`);
            }
        } catch (error) {
            console.error("Error creating sheet:", error);
            const errorMsg = error.response?.data?.message || "Failed to create sheet";
            toast.error(errorMsg);
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
                                Manage daily petty cash and miscellaneous expenses in Ahmedabad
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

                {/* Dashboard Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Total Sheets
                        </div>
                        <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Folder className="w-6 h-6 text-emerald-500" />
                            {stats.totalSheets}
                        </div>
                        <div className="mt-2 text-sm text-slate-500">
                            {stats.activeSheets} active
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Total Entries
                        </div>
                        <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-blue-500" />
                            {stats.totalEntries}
                        </div>
                        <div className="mt-2 text-sm text-slate-500">Across all sheets</div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Recent Activity
                        </div>
                        <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-orange-500" />
                            {stats.recentEntries}
                        </div>
                        <div className="mt-2 text-sm text-slate-500">In last 7 days</div>
                    </div>

                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg flex flex-col justify-center">
                        <button
                            onClick={createNewSheet}
                            className="w-full py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-400 transition-colors"
                        >
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
                                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none w-64"
                                    placeholder="Search database..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilter("all")}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "all"
                                        ? "bg-emerald-100 text-emerald-700 font-bold"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter("active")}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "active"
                                        ? "bg-emerald-100 text-emerald-700 font-bold"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setFilter("archived")}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "archived"
                                        ? "bg-slate-200 text-slate-700 font-bold"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                >
                                    Archived
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchSheets}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sheets Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                            <span className="ml-3 text-slate-600">Syncing with server...</span>
                        </div>
                    ) : sheets.length === 0 ? (
                        <div className="text-center py-20">
                            <Wallet className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                No sheets found
                            </h3>
                            <p className="text-slate-600 mb-8 max-w-xs mx-auto">
                                {search
                                    ? "Adjust search or filters to find sheets"
                                    : "Create your first petty cash sheet to start tracking"}
                            </p>
                            <button
                                onClick={createNewSheet}
                                className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg"
                            >
                                Create First Sheet
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="p-4 text-left w-12">
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
                                        <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Sheet Name
                                        </th>
                                        <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Session
                                        </th>
                                        <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Credit (In)
                                        </th>
                                        <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Debit (Out)
                                        </th>
                                        <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Closing
                                        </th>
                                        <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Status
                                        </th>
                                        <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sheets.map((sheet) => (
                                        <tr
                                            key={sheet.id}
                                            className="hover:bg-slate-50 transition-colors group"
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
                                                    className="font-bold text-slate-900 group-hover:text-emerald-700 cursor-pointer text-base"
                                                    onClick={() =>
                                                        router.push(
                                                            `/dashboard/expenses/ahmedabad/${sheet.id}`
                                                        )
                                                    }
                                                >
                                                    {sheet.name}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                                                        <FileText className="w-3 h-3" />
                                                        {sheet._count?.entries || 0} entries
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(sheet.createdAt)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="text-sm font-bold text-slate-600">
                                                    {sheet.month && sheet.year ? (
                                                        <span className="uppercase">
                                                            {new Date(
                                                                sheet.year,
                                                                sheet.month - 1
                                                            ).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                year: "numeric",
                                                            })}
                                                        </span>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="font-mono font-bold text-emerald-600">
                                                    ₹{formatCurrency(sheet.totalCredit)}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="font-mono font-bold text-red-500">
                                                    ₹{formatCurrency(sheet.totalDebit)}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div
                                                    className={`font-mono font-black text-base ${sheet.closingBalance < 0
                                                        ? "text-red-700"
                                                        : "text-slate-900"
                                                        }`}
                                                >
                                                    ₹{formatCurrency(sheet.closingBalance)}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                {getStatusBadge(sheet.status)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() =>
                                                            router.push(
                                                                `/dashboard/expenses/ahmedabad/${sheet.id}`
                                                            )
                                                        }
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                        title="Open"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                    <div className="relative group/menu">
                                                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 hidden group-hover/menu:block z-10 p-1">
                                                            <button
                                                                onClick={() =>
                                                                    duplicateSheet(sheet.id, sheet.name)
                                                                }
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600 rounded-lg"
                                                            >
                                                                <Copy className="w-4 h-4" /> Duplicate
                                                            </button>
                                                            <button
                                                                onClick={() => exportSheet(sheet.id, sheet.name)}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg"
                                                            >
                                                                <Download className="w-4 h-4" /> Export
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    archiveSheet(
                                                                        sheet.id,
                                                                        sheet.status !== "ARCHIVED"
                                                                    )
                                                                }
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 rounded-lg"
                                                            >
                                                                <Archive className="w-4 h-4" />{" "}
                                                                {sheet.status === "ARCHIVED"
                                                                    ? "Restore"
                                                                    : "Archive"}
                                                            </button>
                                                            <div className="h-px bg-slate-100 my-1" />
                                                            <button
                                                                onClick={() => deleteSheet(sheet.id, sheet.name)}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                                                            >
                                                                <Trash2 className="w-4 h-4" /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
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
                        <div className="bg-slate-50 border-t border-slate-200 p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-600">
                                    Page <span className="font-bold">{currentPage}</span> of{" "}
                                    <span className="font-bold">{totalPages}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            setCurrentPage((prev) => Math.max(1, prev - 1))
                                        }
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() =>
                                            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                                        }
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
