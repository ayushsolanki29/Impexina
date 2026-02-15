"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import API from "@/lib/api";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Calendar,
  RefreshCw,
  Filter,
  ChevronRight,
  User,
  Building2,
  MapPin,
  X,
  Check,
  Loader2,
  ArrowLeft,
  Keyboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Client Autocomplete Component
const ClientAutocomplete = ({ value, onChange, onClientSelect, onCreateNew }) => {
  const [search, setSearch] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.length >= 1) {
        setLoading(true);
        try {
          const res = await API.get(`/client-order-tracker/clients/suggestions?search=${encodeURIComponent(search)}`);
          if (res.data.success) {
            setSuggestions(res.data.data);
          }
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length)); // +1 for "Create new" option
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex === suggestions.length) {
        // Create new option selected
        onCreateNew(search);
        setShowDropdown(false);
      } else if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleSelect = (client) => {
    setSearch(client.name);
    onChange(client.name);
    onClientSelect(client);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearch(newValue);
    onChange(newValue);
    setShowDropdown(true);
    setSelectedIndex(-1);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search or type client name..."
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (search.length >= 1) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl max-h-80 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <>
              <div className="px-3 py-2 text-xs font-medium text-slate-500 bg-slate-50 border-b">
                Existing Clients
              </div>
              {suggestions.map((client, index) => (
                <button
                  key={client.id}
                  onClick={() => handleSelect(client)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left ${selectedIndex === index ? "bg-indigo-50" : ""
                    }`}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{client.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {client.companyName && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {client.companyName}
                        </span>
                      )}
                      {client.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {client.city}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${client.type === "CLIENT"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                    }`}>
                    {client.type}
                  </span>
                </button>
              ))}
            </>
          ) : !loading && (
            <div className="px-4 py-3 text-sm text-slate-500">
              No clients found matching &quot;{search}&quot;
            </div>
          )}

          {/* Create New Option */}
          {search.trim() && (
            <button
              onClick={() => {
                onCreateNew(search);
                setShowDropdown(false);
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 border-t border-slate-100 hover:bg-emerald-50 transition-colors text-left ${selectedIndex === suggestions.length ? "bg-emerald-50" : ""
                }`}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Plus className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-emerald-700">Create new client</p>
                <p className="text-xs text-slate-500">&quot;{search}&quot; will be added as a new client</p>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const SheetCard = ({ sheet, onViewDetails }) => {
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

              <div className="text-sm text-gray-600 mb-2 flex items-center gap-2 flex-wrap">
                <span>Created: {new Date(sheet.createdAt).toLocaleDateString()}</span>
                {sheet.client && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">
                      <User className="w-3 h-3" />
                      {sheet.client.name}
                    </span>
                  </>
                )}
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
              placeholder="Sheet name or client..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Month Filter */}
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
            <option value="March">March</option>
            <option value="April">April</option>
            <option value="May">May</option>
            <option value="June">June</option>
            <option value="July">July</option>
            <option value="August">August</option>
            <option value="September">September</option>
            <option value="October">October</option>
            <option value="November">November</option>
            <option value="December">December</option>
          </select>
        </div>
      </div>
    </div>
  );
};

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
  const [selectedClient, setSelectedClient] = useState(null);
  const [creatingSheet, setCreatingSheet] = useState(false);

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

  // Keyboard shortcut: Ctrl+N to create new sheet
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        setIsCreating(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCreateSheet = async (e) => {
    e.preventDefault();
    if (!newSheetName.trim()) {
      toast.error("Please enter a sheet name or select a client");
      return;
    }

    setCreatingSheet(true);
    try {
      const payload = {
        name: newSheetName,
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
      };

      if (selectedClient) {
        payload.clientId = selectedClient.id;
      }

      const res = await API.post("/client-order-tracker/sheets", payload);
      if (res.data.success) {
        toast.success("Sheet created successfully");
        setNewSheetName("");
        setSelectedClient(null);
        setIsCreating(false);
        fetchSheets();
        router.push(`/dashboard/client-order-tracker/${res.data.data.id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create sheet");
    } finally {
      setCreatingSheet(false);
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setNewSheetName(`${client.name} - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`);
  };

  const handleCreateNewClient = async (name) => {
    try {
      const res = await API.post("/client-order-tracker/clients/quick-create", { name });
      if (res.data.success) {
        toast.success("Client created successfully");
        setSelectedClient(res.data.data);
        setNewSheetName(`${name} - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create client");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: "", month: "" });
  };

  const filteredSheets = sheets.filter(sheet => {
    const searchLower = filters.search.toLowerCase();
    const matchesSearch = sheet.name.toLowerCase().includes(searchLower) ||
      (sheet.client?.name?.toLowerCase().includes(searchLower));
    const matchesMonth = filters.month ? sheet.month?.includes(filters.month) : true;
    return matchesSearch && matchesMonth;
  });

  const hasFilters = filters.search || filters.month;

  const handleExportAll = async () => {
    try {
      toast.info("Preparing Excel export...");
      const response = await API.get("/client-order-tracker/sheets/export/all", {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `all_sheets_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Excel");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-start justify-between mb-8 gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full h-10 w-10 bg-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Client Order Sheets</h1>
              <p className="text-sm text-gray-600">
                Manage client-based order tracking sheets. {sheets.length} sheets available.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportAll}
              className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export All (Excel)
            </button>
            <Button
              onClick={() => setIsCreating(true)}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4" />
              New Sheet
              <kbd className="hidden md:inline-flex ml-2 px-1.5 py-0.5 text-[10px] bg-indigo-500 rounded">Ctrl+N</kbd>
            </Button>
            <button
              onClick={fetchSheets}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </header>

        {/* Create Sheet Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Create New Order Sheet</h3>
                  <p className="text-sm text-gray-500">Select a client or create a new one</p>
                </div>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewSheetName("");
                    setSelectedClient(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleCreateSheet} className="p-6 space-y-5">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client <span className="text-gray-400">(Search or create new)</span>
                  </label>
                  <ClientAutocomplete
                    value={selectedClient?.name || ""}
                    onChange={(val) => {
                      if (!selectedClient) {
                        setNewSheetName(val ? `${val} - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}` : "");
                      }
                    }}
                    onClientSelect={handleClientSelect}
                    onCreateNew={handleCreateNewClient}
                  />
                </div>

                {/* Selected Client Badge */}
                {selectedClient && (
                  <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-indigo-900">{selectedClient.name}</p>
                      {selectedClient.companyName && (
                        <p className="text-xs text-indigo-600">{selectedClient.companyName}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClient(null);
                        setNewSheetName("");
                      }}
                      className="p-1 hover:bg-indigo-100 rounded-full"
                    >
                      <X className="w-4 h-4 text-indigo-500" />
                    </button>
                  </div>
                )}

                {/* Sheet Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sheet Name
                  </label>
                  <input
                    type="text"
                    value={newSheetName}
                    onChange={(e) => setNewSheetName(e.target.value)}
                    placeholder="e.g. Client Name - January 2026"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* Keyboard Hints */}
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <Keyboard className="w-4 h-4" />
                  <span>Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">↓</kbd> to navigate, <kbd className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">Enter</kbd> to select</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsCreating(false);
                      setNewSheetName("");
                      setSelectedClient(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    disabled={creatingSheet || !newSheetName.trim()}
                  >
                    {creatingSheet ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Create Sheet
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
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
              <div className="p-12 text-center text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
                Loading sheets...
              </div>
            ) : filteredSheets.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileSpreadsheet className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No sheets found</h3>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your filters or create a new sheet.</p>
                <Button onClick={() => setIsCreating(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Sheet
                </Button>
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

          {/* Footer */}
          {filteredSheets.length > 0 && (
            <div className="px-5 py-4 bg-gray-50 border-t flex items-center justify-between text-sm text-gray-600">
              <div>Showing {filteredSheets.length} of {sheets.length} sheets</div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Keyboard className="w-3 h-3" />
                <span>Press <kbd className="px-1 bg-gray-200 rounded">Ctrl+N</kbd> for new sheet</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
