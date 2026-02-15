"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, Search, Calendar, MapPin, Loader2,
  ChevronRight, ArrowRight, CheckCircle2, Circle,
  ChevronsUpDown, Check, X, FileSpreadsheet
} from 'lucide-react';
import API from '@/lib/api';
import { toast } from 'sonner';

// Reusable Combobox Component
const Combobox = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
              className="w-full px-2 py-1 text-sm outline-none placeholder:text-slate-300"
              placeholder="Search..."
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
                  setSearch('');
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${value === opt ? 'bg-slate-50 font-bold text-blue-600' : 'text-slate-700'
                  }`}
              >
                {opt}
                {value === opt && <Check className="w-3 h-3" />}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-400 text-center">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function PackingListDashboard() {
  const router = useRouter();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [origin, setOrigin] = useState('');
  const [origins, setOrigins] = useState([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalPages: 1 });

  useEffect(() => {
    fetchContainers();
  }, [pagination.page, search, origin, dateRange.from, dateRange.to]);

  useEffect(() => {
    fetchOrigins();
  }, []);

  const fetchOrigins = async () => {
    try {
      const response = await API.get('/containers/origins');
      if (response.data.success) {
        setOrigins(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch origins");
    }
  };

  const fetchContainers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search,
        origin,
        dateFrom: dateRange.from,
        dateTo: dateRange.to
      });
      const response = await API.get(`/packing-list?${params.toString()}`);
      if (response.data.success) {
        setContainers(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching containers:', error);
      toast.error('Failed to load containers');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async () => {
    try {
      toast.info("Preparing Excel export...");
      const response = await API.get("/packing-list/export/all", {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `all_packing_lists_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Excel");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-700 border-green-200';
      case 'PRINTED': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Packing List</h1>
            <p className="text-slate-500 mt-1">Manage and generate packing lists for your containers</p>
          </div>

          <button
            onClick={handleExportAll}
            className="flex items-center gap-2.5 bg-emerald-50 text-emerald-700 px-5 py-3 rounded-2xl hover:bg-emerald-100 transition-all border border-emerald-200 shadow-sm font-semibold text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export All (Excel)
          </button>
        </div>
        <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search container code..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm font-medium"
              />
            </div>

            <Combobox
              options={origins}
              value={origin}
              onChange={(val) => {
                setOrigin(val);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              placeholder="All Origins"
            />

            <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-xl group focus-within:ring-2 focus-within:ring-blue-500 transition-all w-full lg:w-auto shadow-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                value={dateRange.from}
                onChange={(e) => {
                  setDateRange(prev => ({ ...prev, from: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              />
              <span className="text-slate-200 font-black">/</span>
              <input
                type="date"
                className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                value={dateRange.to}
                onChange={(e) => {
                  setDateRange(prev => ({ ...prev, to: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              />
            </div>

            {(search || origin || dateRange.from || dateRange.to) && (
              <button
                onClick={() => {
                  setSearch('');
                  setOrigin('');
                  setDateRange({ from: '', to: '' });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm bg-white"
                title="Clear all filters"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Containers Grid */}
        {loading && containers.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse shadow-sm"></div>
            ))}
          </div>
        ) : containers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No containers found</h3>
            <p className="text-slate-500">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {containers.map((container) => (
              <div
                key={container.id}
                onClick={() => router.push(`/dashboard/packing/${container.id}`)}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer overflow-hidden flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                      <Package className="w-6 h-6" />
                    </div>
                    {container.packingList ? (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(container.packingList.status)}`}>
                        {container.packingList.status}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-slate-100 text-slate-500 border-slate-200">
                        PENDING
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">{container.containerCode}</h3>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{container.origin}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{new Date(container.loadingDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    {container.packingList ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="font-bold text-slate-700">{container.packingList.invNo}</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 text-slate-300" />
                        <span>Ready for setup</span>
                      </>
                    )}
                  </div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 group-hover:text-blue-600 group-hover:border-blue-200 shadow-sm transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                className={`w-10 h-10 rounded-xl font-bold transition-all ${pagination.page === i + 1
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
