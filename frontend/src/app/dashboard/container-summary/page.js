"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { Plus, Eye, Edit, Trash2, Calendar, Download, FileText, Search, Filter } from "lucide-react";

const CONTAINER_SUMMARY_KEY = "igpl_container_summary_v1";

export default function ContainerSummaryList() {
  const router = useRouter();
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadSummaries();
  }, []);

  const loadSummaries = () => {
    try {
      const data = JSON.parse(localStorage.getItem(CONTAINER_SUMMARY_KEY) || "[]");
      
      // Ensure unique IDs by adding index if duplicates exist
      const uniqueData = data.map((summary, index) => {
        // Create a unique identifier for React keys
        const uniqueKey = `${summary.id}-${summary.createdAt}-${index}`;
        return {
          ...summary,
          _uniqueKey: uniqueKey // Add a unique key for React
        };
      });
      
      setSummaries(uniqueData);
    } catch (error) {
      console.error("Error loading summaries:", error);
      toast.error("Failed to load summaries");
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteSummary = (id, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this summary?")) {
      const updated = summaries.filter(s => s.id !== id);
      localStorage.setItem(CONTAINER_SUMMARY_KEY, JSON.stringify(updated));
      setSummaries(updated);
      toast.success("Summary deleted successfully");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const exportAllToCSV = () => {
    const headers = ["Month", "Status", "Containers", "Total CTN", "Total Dollar", "Total INR", "Final Amount", "Created", "Updated"];
    
    const rows = summaries.map(summary => [
      `"${summary.month}"`,
      summary.status,
      summary.totals?.totalContainers || 0,
      summary.totals?.totalCTN || 0,
      `$${summary.totals?.totalDollar?.toFixed(2) || 0}`,
      `₹${summary.totals?.totalINR?.toFixed(2) || 0}`,
      `₹${summary.totals?.totalFinalAmount?.toFixed(2) || 0}`,
      summary.createdAt,
      summary.updatedAt
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all_container_summaries_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("All summaries exported");
  };

  const filteredSummaries = summaries.filter(summary => {
    const matchesSearch = summary.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         summary.status.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || summary.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading summaries...</div>
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
                Container Summaries
              </h1>
              <p className="text-gray-600 mt-1">
                Manage all your monthly container summaries
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportAllToCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export All
              </button>
              <button
                onClick={() => router.push("/dashboard/container-summary/create")}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow border p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by month or status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
                
                <button
                  onClick={clearFilters}
                  className="px-4 py-2.5 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>
            
            {(searchTerm || statusFilter) && (
              <div className="mt-3 text-sm text-gray-600">
                Showing {filteredSummaries.length} of {summaries.length} summaries
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {filteredSummaries.length === 0 ? (
          <div className="bg-white rounded-lg shadow border p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {summaries.length === 0 ? "No summaries yet" : "No matching summaries"}
            </h3>
            <p className="text-gray-600 mb-6">
              {summaries.length === 0 
                ? "Get started by creating your first summary" 
                : "Try a different search term or filter"}
            </p>
            <button
              onClick={() => router.push("/dashboard/container-summary/create")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Summary
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSummaries.map((summary, index) => (
              <div
                key={summary._uniqueKey || `${summary.id}-${index}`}
                className="bg-white rounded-lg shadow border hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 truncate max-w-[180px]">{summary.month}</h3>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(summary.status)}`}>
                          {summary.status.charAt(0).toUpperCase() + summary.status.slice(1)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteSummary(summary.id, e)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete summary"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">Containers</div>
                      <div className="text-xl font-bold text-gray-900">
                        {summary.totals?.totalContainers || 0}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">Total CTN</div>
                      <div className="text-xl font-bold text-gray-900">
                        {summary.totals?.totalCTN || 0}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">Total Dollar</div>
                      <div className="text-xl font-bold text-gray-900">
                        ${summary.totals?.totalDollar?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">Final Amount</div>
                      <div className="text-xl font-bold text-gray-900">
                        ₹{summary.totals?.totalFinalAmount?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="text-sm text-gray-600 space-y-1 border-t pt-4">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span className="text-gray-900">{summary.createdAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Updated:</span>
                      <span className="text-gray-900">{summary.updatedAt}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => router.push(`/dashboard/container-summary/${summary.id}/view`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/container-summary/${summary.id}/edit`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Bar */}
        {summaries.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Total Months</div>
                <div className="text-2xl font-bold text-gray-900">{summaries.length}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600">Total Containers</div>
                <div className="text-2xl font-bold text-gray-900">
                  {summaries.reduce((acc, s) => acc + (s.totals?.totalContainers || 0), 0)}
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600">Total Dollar Value</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${summaries.reduce((acc, s) => acc + (s.totals?.totalDollar || 0), 0).toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="text-sm text-gray-600">Total Final Amount</div>
                <div className="text-2xl font-bold text-gray-900">
                  ₹{summaries.reduce((acc, s) => acc + (s.totals?.totalFinalAmount || 0), 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}