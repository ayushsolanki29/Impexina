"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Package, Search, Calendar, CheckCircle2, Circle, Plus, ChevronRight, LayoutGrid, Sparkles, ArrowRight, ChevronsUpDown, Check, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { get } from "@/lib/api";

// Reusable Combobox Component
const Combobox = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full md:w-64" ref={wrapperRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all text-sm shadow-sm"
      >
        <span className={value ? "text-slate-900 font-medium" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              className="w-full px-2 py-1 text-sm outline-none placeholder:text-slate-300 font-medium"
              placeholder="Search origin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="overflow-y-auto flex-1">
            {filteredOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${
                  value === opt ? 'bg-slate-50 font-bold text-blue-600' : 'text-slate-700'
                }`}
              >
                {opt}
                {value === opt && <Check className="w-3 h-3" />}
              </button>
            ))}
            
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-400 text-center font-medium uppercase tracking-widest">
                No Ports found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ClientContainersPage() {
  const { id } = useParams();
  const router = useRouter();
  const [containers, setContainers] = useState([]);
  const [blankSheets, setBlankSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");
  const [search, setSearch] = useState("");
  const [origin, setOrigin] = useState("");
  const [origins, setOrigins] = useState([]);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  useEffect(() => {
    fetchContainers();
  }, [id, origin, dateRange.from, dateRange.to]);

  useEffect(() => {
    fetchOrigins();
  }, []);

  const fetchOrigins = async () => {
    try {
      const res = await get('/containers/origins');
      if (res.success) {
        setOrigins(res.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch origins", error);
    }
  };

  const fetchContainers = async () => {
    try {
      setLoading(true);
      // Fetch containers
      const params = new URLSearchParams({
        ...(origin && { origin }),
        ...(dateRange.from && { dateFrom: dateRange.from }),
        ...(dateRange.to && { dateTo: dateRange.to }),
      });
      const res = await get(`/accounts/clts/${id}/containers?${params.toString()}`);
      if (res.success) {
        setContainers(res.data.containers || []);
        setBlankSheets(res.data.blankSheets || []);
      }
      
      // Also fetch client name for header
      const clientRes = await get(`/accounts/clts/${id}`); // Assuming this endpoint returns client details too
      if (clientRes.success) {
          setClientName(clientRes.data.name);
      }
      
    } catch (error) {
      toast.error("Failed to load containers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const allItems = useMemo(() => {
    const combined = [
      ...containers.map(c => ({ ...c, type: 'CONTAINER', sheetName: c.sheetName || `${clientName} ${c.containerCode} ${new Date().toLocaleString('en-US', { month: 'long' })}`.toUpperCase() })),
      ...blankSheets.map(bs => ({ ...bs, type: 'CUSTOM_SHEET' }))
    ];

    if (!search) {
      return combined;
    }

    const lowercasedSearch = search.toLowerCase();
    return combined.filter(item => {
      const name = item.sheetName || item.containerCode; // Use sheetName for custom, containerCode for container
      return name.toLowerCase().includes(lowercasedSearch);
    });
  }, [containers, blankSheets, search, clientName]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push(`/dashboard/accounts/clients`)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                title="Back to Clients"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <LayoutGrid className="w-6 h-6 text-blue-600" />
                  {clientName || 'Select Workspace'}
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Select a workspace to manage client financial records
                </p>
              </div>
            </div>
            <div className="w-full md:w-72">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Find workspace..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Primary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Full Ledger Card */}
          <div 
            onClick={() => router.push(`/dashboard/accounts/clients/${id}`)}
            className="group bg-white p-6 rounded-xl border shadow-sm transition-all hover:shadow-md border-blue-200 cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 group-hover:text-blue-700">View Entire Ledger</h2>
                <p className="text-sm text-slate-500 mt-1">Unified view of all transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-blue-600 text-sm font-medium group-hover:gap-3 transition-all">
              <span>Access</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* New Sheet Card */}
          <div 
            onClick={() => {
              const monthStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
              router.push(`/dashboard/accounts/clients/${id}?sheetName=${encodeURIComponent(monthStr)}`);
            }}
            className="group bg-white p-6 rounded-xl border shadow-sm transition-all hover:shadow-md border-emerald-200 cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 group-hover:text-emerald-700">Start New Sheet</h2>
                <p className="text-sm text-slate-500 mt-1">Begin a fresh blank ledger</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium group-hover:gap-3 transition-all">
              <span>Create</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Find in current results..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-transparent focus-within:border-blue-200 transition-all">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              className="bg-transparent text-xs font-bold text-slate-600 outline-none hover:text-blue-600 transition-colors"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({...prev, from: e.target.value}))}
            />
            <span className="text-slate-300 font-bold px-1">/</span>
            <input 
              type="date" 
              className="bg-transparent text-xs font-bold text-slate-600 outline-none hover:text-blue-600 transition-colors"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({...prev, to: e.target.value}))}
            />
          </div>

          <Combobox 
            options={origins}
            value={origin}
            onChange={(val) => setOrigin(val)}
            placeholder="All Origins"
          />

          {(search || origin || dateRange.from || dateRange.to) && (
             <button 
                onClick={() => {
                  setSearch("");
                  setOrigin("");
                  setDateRange({ from: "", to: "" });
                }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Clear all filters"
             >
                <X className="w-5 h-5" />
             </button>
          )}
        </div>

        {/* Workspaces List */}
        {allItems.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recent Workspaces</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allItems.map((item, idx) => {
                const isContainer = item.type === 'CONTAINER';
                const containerCode = item.containerCode;
                const sheetName = item.sheetName;
                
                const path = isContainer 
                  ? `/dashboard/accounts/clients/${id}?containerCode=${encodeURIComponent(containerCode)}`
                  : `/dashboard/accounts/clients/${id}?sheetName=${encodeURIComponent(sheetName)}`;

                return (
                  <div 
                    key={idx}
                    onClick={() => router.push(path)}
                    className="group bg-white p-5 rounded-xl border shadow-sm transition-all hover:shadow-md cursor-pointer border-blue-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                        isContainer ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-purple-50 text-purple-600 border border-purple-100"
                      }`}>
                        {isContainer ? "Container" : "Custom Sheet"}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-700 mb-2">
                      {isContainer ? `Container: ${containerCode}` : sheetName}
                    </h4>
                    
                    {isContainer && sheetName && sheetName !== containerCode && (
                      <p className="text-xs text-slate-500 line-clamp-1 mb-4">
                        Sheet: {sheetName}
                      </p>
                    )}

                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Open Ledger</span>
                        <ChevronRight className="w-4 h-4 text-blue-600 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {allItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No Workspaces Found</h3>
            <p className="text-slate-500 text-sm mb-4">
              {search ? "Try adjusting your search" : "Create a new sheet or container to get started"}
            </p>
            {search && (
              <button 
                onClick={() => setSearch("")} 
                className="text-xs font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
