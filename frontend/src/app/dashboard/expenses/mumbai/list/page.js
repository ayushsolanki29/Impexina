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
    Users,
    AlertCircle,
    RefreshCw,
    ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";

export default function MumbaiLedgerList() {
    const router = useRouter();
    const [ledgers, setLedgers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all"); // all, active, archived
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedLedgers, setSelectedLedgers] = useState([]);
    const [stats, setStats] = useState({
        totalLedgers: 0,
        activeLedgers: 0,
        totalEntries: 0,
        expenseTotal: 0,
        advanceTotal: 0,
        balance: 0,
    });

    useEffect(() => {
        fetchLedgers();
        fetchDashboardStats();
    }, [currentPage, search, filter]);

    const fetchLedgers = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: 20,
                search: search,
                ...(filter !== "all" && { status: filter.toUpperCase() }),
            });

            const response = await API.get(`/expenses/mumbai-ledger?${params}`);
            if (response.data.success) {
                setLedgers(response.data.data.ledgers || []);
                setTotalPages(response.data.data.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error("Error fetching ledgers:", error);
            toast.error("Failed to load ledgers");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const response = await API.get("/expenses/mumbai-ledger/dashboard/stats");
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const createNewLedger = async () => {
        try {
            const now = new Date();
            const timestamp = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const response = await API.post("/expenses/mumbai-ledger", {
                name: `ML - ${now.toLocaleDateString('en-IN')} ${timestamp}`,
                description: "New ledger initialized",
                month: now.getMonth() + 1,
                year: now.getFullYear(),
            });

            if (response.data.success) {
                toast.success("New ledger created");
                router.push(`/dashboard/expenses/mumbai/${response.data.data.id}`);
            }
        } catch (error) {
            console.error("Error creating ledger:", error);
            const errorMsg = error.response?.data?.message || "Failed to create ledger";
            toast.error(errorMsg);
        }
    };

    const duplicateLedger = async (ledgerId, ledgerName) => {
        try {
            const response = await API.post(
                `/expenses/mumbai-ledger/${ledgerId}/duplicate`,
                {
                    name: `${ledgerName} (Copy)`,
                }
            );

            if (response.data.success) {
                toast.success("Ledger duplicated successfully");
                fetchLedgers();
            }
        } catch (error) {
            console.error("Error duplicating ledger:", error);
            toast.error("Failed to duplicate ledger");
        }
    };

    const archiveLedger = async (ledgerId, archive = true) => {
        try {
            const response = await API.put(`/expenses/mumbai-ledger/${ledgerId}`, {
                status: archive ? "ARCHIVED" : "ACTIVE",
            });

            if (response.data.success) {
                toast.success(`Ledger ${archive ? "archived" : "restored"}`);
                fetchLedgers();
                fetchDashboardStats();
            }
        } catch (error) {
            console.error("Error archiving ledger:", error);
            toast.error("Failed to update ledger");
        }
    };

    const deleteLedger = async (ledgerId, ledgerName) => {
        if (
            !confirm(
                `Are you sure you want to delete "${ledgerName}"? This action cannot be undone.`
            )
        ) {
            return;
        }

        try {
            const response = await API.delete(`/expenses/mumbai-ledger/${ledgerId}`);

            if (response.data.success) {
                toast.success(response.data.message);
                fetchLedgers();
                fetchDashboardStats();
            }
        } catch (error) {
            console.error("Error deleting ledger:", error);
            toast.error("Failed to delete ledger");
        }
    };

    const exportLedger = async (ledgerId, ledgerName) => {
        try {
            window.open(
                `${process.env.NEXT_PUBLIC_API_URL}/expenses/mumbai-ledger/${ledgerId}/export`,
                "_blank"
            );
            toast.success("Export started");
        } catch (error) {
            console.error("Error exporting:", error);
            toast.error("Failed to export ledger");
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

    const handleSelectLedger = (ledgerId) => {
        setSelectedLedgers((prev) =>
            prev.includes(ledgerId)
                ? prev.filter((id) => id !== ledgerId)
                : [...prev, ledgerId]
        );
    };

    const handleSelectAll = () => {
        if (selectedLedgers.length === ledgers.length) {
            setSelectedLedgers([]);
        } else {
            setSelectedLedgers(ledgers.map((ledger) => ledger.id));
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
                                Mumbai Ledger
                            </h1>
                            <p className="text-slate-600 mt-2">
                                Track container expenses and office advances in Mumbai
                            </p>
                        </div>
                        <button
                            onClick={createNewLedger}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:shadow-lg transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            New Ledger
                        </button>
                    </div>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Total Ledgers
                                </div>
                                <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <Folder className="w-6 h-6 text-blue-500" />
                                    {stats.totalLedgers}
                                </div>
                            </div>
                            <div className="text-sm text-slate-500">
                                {stats.activeLedgers} active
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Total Entries
                                </div>
                                <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <FileText className="w-6 h-6 text-purple-500" />
                                    {stats.totalEntries}
                                </div>
                            </div>
                            <div className="text-sm text-slate-500">Expenses & Advances</div>
                        </div>
                    </div>

                    <div
                        className={`bg-white p-5 rounded-xl border shadow-sm ${stats.balance < 0
                            ? "border-red-200 bg-red-50/30"
                            : "border-emerald-200 bg-emerald-50/30"
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Net Balance
                                </div>
                                <div
                                    className={`text-2xl font-bold flex items-center gap-2 ${stats.balance < 0 ? "text-red-600" : "text-emerald-600"
                                        }`}
                                >
                                    <DollarSign className="w-6 h-6" />₹
                                    {formatCurrency(stats.balance)}
                                </div>
                            </div>
                            {stats.balance < 0 ? (
                                <TrendingDown className="w-6 h-6 text-red-500" />
                            ) : (
                                <TrendingUp className="w-6 h-6 text-emerald-500" />
                            )}
                        </div>
                        <div className="mt-2 text-sm text-slate-500 flex justify-between">
                            <span>Exp: ₹{formatCurrency(stats.expenseTotal)}</span>
                            <span>Adv: ₹{formatCurrency(stats.advanceTotal)}</span>
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
                                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
                                    placeholder="Search ledgers..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilter("all")}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "all"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter("active")}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "active"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setFilter("archived")}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "archived"
                                        ? "bg-gray-100 text-gray-700"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                >
                                    Archived
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchLedgers}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Ledgers Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-3 text-slate-600">Loading ledgers...</span>
                        </div>
                    ) : ledgers.length === 0 ? (
                        <div className="text-center py-16">
                            <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">
                                No ledgers found
                            </h3>
                            <p className="text-slate-600 mb-6">
                                {search
                                    ? "Try a different search term"
                                    : "Create your first Mumbai ledger"}
                            </p>
                            <button
                                onClick={createNewLedger}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Create New Ledger
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
                                                    selectedLedgers.length === ledgers.length &&
                                                    ledgers.length > 0
                                                }
                                                onChange={handleSelectAll}
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </th>
                                        <th className="text-left p-4 font-semibold text-slate-700">
                                            Ledger Name
                                        </th>
                                        <th className="text-left p-4 font-semibold text-slate-700">
                                            Entries
                                        </th>
                                        <th className="text-left p-4 font-semibold text-slate-700">
                                            Total Expense
                                        </th>
                                        <th className="text-left p-4 font-semibold text-slate-700">
                                            Total Advance
                                        </th>
                                        <th className="text-left p-4 font-semibold text-slate-700">
                                            Balance
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
                                    {ledgers.map((ledger) => (
                                        <tr
                                            key={ledger.id}
                                            className="hover:bg-slate-50 transition-colors"
                                        >
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLedgers.includes(ledger.id)}
                                                    onChange={() => handleSelectLedger(ledger.id)}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div
                                                    className="font-medium text-slate-900 hover:text-blue-600 cursor-pointer"
                                                    onClick={() =>
                                                        router.push(
                                                            `/dashboard/expenses/mumbai/${ledger.id}`
                                                        )
                                                    }
                                                >
                                                    {ledger.name}
                                                </div>
                                                {ledger.description && (
                                                    <div className="text-sm text-slate-500 mt-1">
                                                        {ledger.description}
                                                    </div>
                                                )}
                                                {ledger.month && ledger.year && (
                                                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(
                                                            ledger.year,
                                                            ledger.month - 1
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
                                                        {ledger._count?.entries || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-mono font-medium text-red-600">
                                                    ₹{formatCurrency(ledger.totalExpense)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-mono font-medium text-emerald-600">
                                                    ₹{formatCurrency(ledger.totalAdvance)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div
                                                    className={`font-mono font-bold ${ledger.totalBalance < 0
                                                        ? "text-red-600"
                                                        : ledger.totalBalance > 0
                                                            ? "text-emerald-600"
                                                            : "text-slate-600"
                                                        }`}
                                                >
                                                    ₹{formatCurrency(ledger.totalBalance)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(ledger.status)}
                                                {ledger.isLocked && (
                                                    <div className="text-xs text-amber-600 mt-1">
                                                        Locked
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-slate-600">
                                                {formatDate(ledger.createdAt)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            router.push(
                                                                `/dashboard/expenses/mumbai/${ledger.id}`
                                                            )
                                                        }
                                                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="Open"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            duplicateLedger(ledger.id, ledger.name)
                                                        }
                                                        className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                                        title="Duplicate"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => exportLedger(ledger.id, ledger.name)}
                                                        className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                                                        title="Export"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            archiveLedger(
                                                                ledger.id,
                                                                ledger.status !== "ARCHIVED"
                                                            )
                                                        }
                                                        className="p-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                                                        title={
                                                            ledger.status === "ARCHIVED"
                                                                ? "Restore"
                                                                : "Archive"
                                                        }
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteLedger(ledger.id, ledger.name)}
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
                            onClick={createNewLedger}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                            + New Ledger
                        </button>
                        {selectedLedgers.length > 0 && (
                            <>
                                <button
                                    onClick={() => {
                                        selectedLedgers.forEach((id) => archiveLedger(id, true));
                                        setSelectedLedgers([]);
                                    }}
                                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                                >
                                    Archive Selected ({selectedLedgers.length})
                                </button>
                                <button
                                    onClick={() => {
                                        if (
                                            confirm(
                                                `Export ${selectedLedgers.length} selected ledgers?`
                                            )
                                        ) {
                                            selectedLedgers.forEach((id) => exportLedger(id));
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
