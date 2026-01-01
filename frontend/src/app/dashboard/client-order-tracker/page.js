"use client";

import React, { useState, useEffect, useMemo } from "react";
import API from "@/lib/api";
import { toast } from "sonner";
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Calendar, 
  RefreshCw,
  Download,
  Filter,
  X,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// --- Components adapted from Loading module for consistent UI ---

const SheetCard = ({ sheet, onViewDetails, onDelete }) => {
  return (
    <div className="p-5 border-b hover:bg-gray-50 transition-colors duration-150">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
               <FileSpreadsheet className="w-8 h-8" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => onViewDetails(sheet.id)}
                  className="text-xl font-bold text-gray-900 hover:text-indigo-700 hover:underline truncate"
                >
                  {sheet.name}
                </button>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ACTIVE
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-2">
                Created: {new Date(sheet.createdAt).toLocaleDateString()}
                 {" • "}
                By {sheet.createdBy || "System"}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8 min-w-[500px]">
          <div className="text-center">
             <div className="text-sm text-gray-500 mb-1">Orders</div>
             <div className="text-2xl font-bold text-gray-900">{sheet._count?.orders || 0}</div>
          </div>
          <div className="text-center">
             <div className="text-sm text-gray-500 mb-1">Items</div>
             <div className="text-2xl font-bold text-gray-900">{sheet.totalItems || 0}</div>
          </div>
          <div className="text-center">
             <div className="text-sm text-gray-500 mb-1">Total Amount</div>
             <div className="text-2xl font-bold text-gray-900">₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(sheet.totalAmount || 0)}</div>
          </div>
          
           <div className="col-span-2 md:col-span-4 lg:col-span-1 flex items-center">
            <button
                onClick={() => onViewDetails(sheet.id)}
                className="w-full h-10 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-lg transition-colors"
                >
                View Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FiltersPanel = ({ filters, onFilterChange, onClearFilters }) => {
    return (
        <div className="p-5 border-b bg-white">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {(filters.search || filters.month) && (
                    <button 
                        onClick={onClearFilters}
                        className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                    >
                        Clear All
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 {/* Search */}
                 <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Search Sheet</label>
                    <div className="relative">
                        <input 
                            type="text"
                            placeholder="Sheet name..."
                            value={filters.search}
                            onChange={(e) => onFilterChange('search', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                 </div>

                 {/* Month Filter (Mock for now) */}
                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Month</label>
                    <select 
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={filters.month}
                        onChange={(e) => onFilterChange('month', e.target.value)}
                    >
                        <option value="">All Months</option>
                        <option value="January">January</option>
                        <option value="February">February</option>
                        {/* Ideally distinct months from data */}
                    </select>
                 </div>
            </div>
        </div>
    );
}

const ResultsHeader = ({ count, total, hasFilters }) => {
    return (
      <div className="px-5 py-3 bg-gray-50/50 border-b flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{count}</span> of <span className="font-medium text-gray-900">{total}</span> sheets
        </div>
        {hasFilters && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Filter className="w-3 h-3" />
            Filters applied
          </div>
        )}
      </div>
    );
};

export default function ClientOrderSheets() {
  const router = useRouter();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  
  const [filters, setFilters] = useState({
      search: "",
      month: ""
  });

  const fetchSheets = async () => {
    setLoading(true);
    try {
      const res = await API.get("/client-order-tracker/sheets");
      if (res.data.success) {
        setSheets(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to load order sheets");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  const handleCreateSheet = async (e) => {
    e.preventDefault();
    if (!newSheetName.trim()) return;

    try {
      const res = await API.post("/client-order-tracker/sheets", {
        name: newSheetName,
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
      });
      if (res.data.success) {
        toast.success("Sheet created successfully");
        setNewSheetName("");
        setIsCreating(false);
        fetchSheets();
        router.push(`/dashboard/client-order-tracker/${res.data.data.id}`);
      }
    } catch (error) {
      toast.error("Failed to create sheet");
    }
  };

  const handleFilterChange = (key, value) => {
      setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
      setFilters({ search: "", month: "" });
  };

  const filteredSheets = sheets.filter(sheet => {
      const matchesSearch = sheet.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesMonth = filters.month ? sheet.month?.includes(filters.month) : true; // Assuming month is stored or derived
      return matchesSearch && matchesMonth;
  });

  const hasFilters = filters.search || filters.month;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start justify-between mb-8 gap-6">
            <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Order Sheets</h1>
                <p className="text-sm text-gray-600">
                    Manage monthly client order tracking sheets. {sheets.length} sheets available.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                 <Button 
                    onClick={() => setIsCreating(true)} 
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                 >
                    <Plus className="w-4 h-4" />
                    New Sheet
                 </Button>
                 <button 
                    onClick={fetchSheets}
                    className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50"
                 >
                    <RefreshCw className="w-4 h-4" /> Refresh
                 </button>
            </div>
        </header>

        {isCreating && (
             <div className="mb-6 bg-white p-6 rounded-lg border border-indigo-100 shadow-lg animate-in fade-in slide-in-from-top-2">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Sheet</h3>
                <form onSubmit={handleCreateSheet} className="flex gap-4">
                    <input
                        type="text"
                        value={newSheetName}
                        onChange={(e) => setNewSheetName(e.target.value)}
                        placeholder="e.g. November 2026 Orders"
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                    />
                    <Button type="submit">Create</Button>
                    <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                </form>
            </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <FiltersPanel 
                filters={filters} 
                onFilterChange={handleFilterChange} 
                onClearFilters={clearFilters} 
            />
            
            <ResultsHeader 
                count={filteredSheets.length} 
                total={sheets.length} 
                hasFilters={hasFilters} 
            />

            <div>
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading sheets...</div>
                ) : filteredSheets.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileSpreadsheet className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 font-medium mb-1">No sheets found</h3>
                        <p className="text-gray-500 text-sm">Try adjusting your filters or create a new sheet.</p>
                    </div>
                ) : (
                    <div>
                        {filteredSheets.map(sheet => (
                            <SheetCard 
                                key={sheet.id} 
                                sheet={sheet} 
                                onViewDetails={(id) => router.push(`/dashboard/client-order-tracker/${id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>

             {/* Footer - Simple Pagination (Mock) */}
             {filteredSheets.length > 0 && (
                <div className="px-5 py-4 bg-gray-50 border-t flex items-center justify-between text-sm text-gray-600">
                     <div>Page 1 of 1 • Showing {filteredSheets.length} of {sheets.length} sheets</div>
                     <div className="text-xs text-gray-400">All sheets loaded</div>
                </div>
             )}
        </div>

      </div>
    </div>
  );
}