"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Folder, Calendar, Download, 
  Copy, ChevronRight, Loader2, Archive, ArrowLeft, Globe, Share2
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";

export default function PartnerList({ partnerName = "David", prefix = "DAVID", themeColor = "blue" }) {
  const router = useRouter();
  const [sheets, setSheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
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
        // Filter ONLY this partner's sheets
        const allSheets = response.data.data.sheets || [];
        const filtered = allSheets.filter(s => s.name.toUpperCase().startsWith(prefix));
        setSheets(filtered);
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
      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const now = new Date();
      const sheetName = `${prefix} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

      const response = await API.post("/accounts/david/", {
        name: sheetName,
        description: `Monthly ledger for ${partnerName}`,
        tags: ["forex", "ledger", partnerName.toLowerCase()],
      });

      if (response.data.success) {
        toast.success(`${partnerName}'s sheet created`);
        router.push(`/dashboard/accounts/david/${response.data.data.id}`);
      }
    } catch (error) {
      console.error("Error creating sheet:", error);
      toast.error("Failed to create sheet");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN").format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { color: "bg-green-100 text-green-800", label: "Active" },
      ARCHIVED: { color: "bg-gray-100 text-gray-800", label: "Archived" },
      LOCKED: { color: "bg-red-100 text-red-800", label: "Locked" },
    };
    const config = statusConfig[status] || statusConfig.ACTIVE;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/accounts")}
            className="p-2 bg-slate-100 hover:bg-slate-200 flex items-center gap-2 text-slate-600 rounded-lg transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Accounts
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{partnerName} Ledgers</h1>
              <p className="text-slate-600 mt-2">Manage monthly forex ledger sheets for {partnerName}</p>
            </div>
            <button
              onClick={createNewSheet}
              className={`flex items-center gap-2 px-6 py-3 bg-${themeColor}-600 text-white font-bold rounded-xl hover:bg-${themeColor}-700 shadow-lg transition-all`}
            >
              <Plus className="w-5 h-5" /> New {partnerName} Sheet
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              className={`pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-${themeColor}-500 outline-none w-full`}
              placeholder="Search sheets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "archived"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  filter === f ? `bg-${themeColor}-100 text-${themeColor}-700` : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2 className={`w-10 h-10 animate-spin text-${themeColor}-600 mb-4`} />
              <span className="text-slate-600">Loading sheets...</span>
            </div>
          ) : sheets.length === 0 ? (
            <div className="text-center py-16">
              <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No sheets found</h3>
              <button onClick={createNewSheet} className={`text-${themeColor}-600 font-bold`}>Create one now</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-slate-500 font-bold text-xs uppercase tracking-widest">
                    <th className="p-4">Sheet Name</th>
                    <th className="p-4">Entries</th>
                    <th className="p-4 text-right">RMB Balance</th>
                    <th className="p-4 text-right">USD Balance</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sheets.map((sheet) => (
                    <tr key={sheet.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4">
                        <div 
                          className={`font-bold text-slate-900 cursor-pointer hover:text-${themeColor}-600`}
                          onClick={() => router.push(`/dashboard/accounts/david/${sheet.id}`)}
                        >
                          {sheet.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{new Date(sheet.updatedAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-slate-600">{sheet.summary?.entryCount || 0} items</span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-900">¥{formatCurrency(sheet.summary?.netRMB || 0)}</td>
                      <td className="p-4 text-right font-mono font-bold text-slate-900">${formatCurrency(sheet.summary?.netUSD || 0)}</td>
                      <td className="p-4">{getStatusBadge(sheet.status)}</td>
                      <td className="p-4">
                        <div className="flex justify-end">
                          <button 
                            onClick={() => router.push(`/dashboard/accounts/david/${sheet.id}`)}
                            className={`p-2 bg-white border border-slate-200 rounded-lg hover:border-${themeColor}-400 text-slate-400 hover:text-${themeColor}-600 transition-all`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
