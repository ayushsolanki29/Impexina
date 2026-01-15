"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Calendar, MapPin, Package, Loader2, Edit2, Trash2, X,
  ChevronsUpDown, Check, History
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import { toast } from 'sonner';

// Reusable Combobox Component
const Combobox = ({ value, onChange, options, placeholder, onAddNew }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

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
    <div className="relative" ref={wrapperRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg flex items-center justify-between cursor-pointer bg-white hover:border-blue-400 transition-colors"
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              className="w-full px-2 py-1 text-sm outline-none placeholder:text-slate-400"
              placeholder="Search or add new..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length === 0 && search.trim() !== '' && (
              <button
                onClick={() => {
                  onChange(search.toUpperCase()); // Auto uppercase for norms?
                  setIsOpen(false);
                  setSearch('');
                  if (onAddNew) onAddNew(search);
                }}
                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
              >
                <Plus className="w-3 h-3" /> Add "{search.toUpperCase()}"
              </button>
            )}

            {filteredOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${
                  value === opt ? 'bg-slate-50 font-medium text-blue-600' : 'text-slate-700'
                }`}
              >
                {opt}
                {value === opt && <Check className="w-3 h-3" />}
              </button>
            ))}
            
            {filteredOptions.length === 0 && !search && (
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

export default function LoadingPage() {
  const router = useRouter();
  const [containers, setContainers] = useState([]);
  const [aggregates, setAggregates] = useState({ totalCTN: 0, totalCBM: 0, totalWT: 0, totalContainers: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [origins, setOrigins] = useState([]);

  // Pagination & Filter state
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    origin: '',
    startDate: '',
    endDate: '',
    minCtn: '',
    maxCtn: ''
  });

  // Debounced Search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.search]);

  // Form state
  const [formData, setFormData] = useState({
    containerCode: '',
    origin: '',
    loadingDate: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchContainers();
  }, [pagination.page, debouncedSearch, filters.origin, filters.startDate, filters.endDate, filters.minCtn, filters.maxCtn]);

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
      const params = {
        page: pagination.page,
        limit: 20,
        search: debouncedSearch,
        origin: filters.origin,
        startDate: filters.startDate,
        endDate: filters.endDate,
        minCtn: filters.minCtn,
        maxCtn: filters.maxCtn
      };

      // Remove empty params
      Object.keys(params).forEach(key => !params[key] && delete params[key]);

      const response = await API.get('/containers', { params });
      
      if (response.data.success) {
        setContainers(response.data.data.containers || []);
        // Safely handle aggregates if backend doesn't return them yet (backward compatibility)
        setAggregates(response.data.data.aggregates || { totalCTN: 0, totalCBM: 0, totalWT: 0, totalContainers: 0 });
        setPagination(prev => ({ 
          ...prev, 
          ...response.data.data.pagination 
        }));
      }
    } catch (error) {
      console.error('Error fetching containers:', error);
      toast.error('Failed to load containers');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      origin: '',
      startDate: '',
      endDate: '',
      minCtn: '',
      maxCtn: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.containerCode.trim()) return toast.error('Container code is required');
    if (!formData.origin.trim()) return toast.error('Origin is required');

    try {
      setSubmitting(true);
      if (editingContainer) {
        const response = await API.patch(`/containers/${editingContainer.id}`, formData);
        if (response.data.success) {
          toast.success('Container updated successfully');
          fetchContainers();
          // Update origins list if new one added implicitly? Backend distinct handles it on refresh
          fetchOrigins();
          resetForm();
        }
      } else {
        const response = await API.post('/containers', formData);
        if (response.data.success) {
          toast.success('Container created successfully');
          fetchContainers();
          fetchOrigins();
          resetForm();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save container');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (container) => {
    setEditingContainer(container);
    setFormData({
      containerCode: container.containerCode,
      origin: container.origin,
      loadingDate: new Date(container.loadingDate).toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this container?')) return;
    try {
      const response = await API.delete(`/containers/${id}`);
      if (response.data.success) {
        toast.success('Container deleted successfully');
        fetchContainers();
        fetchOrigins(); // In case we deleted the last one of an origin
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete container');
    }
  };

  const resetForm = () => {
    setFormData({
      containerCode: '',
      origin: '',
      loadingDate: new Date().toISOString().split('T')[0],
    });
    setEditingContainer(null);
    setShowForm(false);
  };

  const formatDateTag = (dateString) => {
     const date = new Date(dateString);
     // Format: Jan-26
     return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', '-');
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
     const styles = {
       'OPEN': 'bg-blue-100 text-blue-700 border-blue-200',
       'CLOSED': 'bg-slate-100 text-slate-700 border-slate-200',
       'SHIPPED': 'bg-green-100 text-green-700 border-green-200',
       'ARRIVED': 'bg-purple-100 text-purple-700 border-purple-200'
     };
     const style = styles[status] || styles['OPEN'];
     return (
       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${style}`}>
         {status || 'OPEN'}
       </span>
     );
  };


  // Skeleton Components
  const TotalsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-slate-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );

  const CardSkeleton = () => (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 animate-pulse h-64">
      <div className="flex justify-between mb-4">
        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        <div className="h-6 bg-slate-200 rounded w-1/4"></div>
      </div>
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
      <div className="grid grid-cols-2 gap-3 mt-4">
         <div className="h-16 bg-slate-100 rounded"></div>
         <div className="h-16 bg-slate-100 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-none">Warehouse</h1>
            <p className="text-slate-500 mt-2 font-normal">Track containers, loading details and shipment stats</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/loading/activities')}
              className="flex items-center gap-2.5 bg-white text-slate-600 px-5 py-3 rounded-2xl hover:bg-slate-50 transition-all border border-slate-200 shadow-sm font-semibold text-sm"
            >
              <History className="w-4 h-4 text-blue-500" />
              Audit Logs
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2.5 bg-slate-900 text-white px-6 py-3 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 font-semibold text-sm active:scale-95"
            >
              {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {showForm ? 'Cancel' : 'New Container'}
            </button>
          </div>
        </div>

        {/* Totals Cards */}
        {loading && containers.length === 0 ? <TotalsSkeleton /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-all">
              <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-widest leading-none mb-3">Total Containers</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 tracking-tight">{aggregates.totalContainers.toLocaleString()}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-slate-400 transition-colors"></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-all">
              <span className="text-[10px] font-semibold uppercase text-blue-500/60 tracking-widest leading-none mb-3">Total CTN</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 tracking-tight">{aggregates.totalCTN.toLocaleString()}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-100 group-hover:bg-blue-400 transition-colors"></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-all">
              <span className="text-[10px] font-semibold uppercase text-emerald-500/60 tracking-widest leading-none mb-3">Total CBM</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 tracking-tight">{aggregates.totalCBM?.toLocaleString() || 0}</span>
                <span className="text-xs font-bold text-emerald-500/60 uppercase">m³</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-all">
              <span className="text-[10px] font-semibold uppercase text-amber-500/60 tracking-widest leading-none mb-3">Total Weight</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 tracking-tight">{aggregates.totalWT?.toLocaleString() || 0}</span>
                <span className="text-xs font-bold text-amber-500/60 uppercase">kg</span>
              </div>
            </div>
          </div>
        )}

        {/* Inline Form */}
        {showForm && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-10 border border-slate-100 animate-in fade-in slide-in-from-top-6 duration-500">
            <h3 className="text-xl font-bold mb-6 text-slate-900 tracking-tight">
              {editingContainer ? 'Edit Container' : 'New Container Registration'}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Container Code</label>
                <input
                  type="text"
                  value={formData.containerCode}
                  onChange={(e) => setFormData({ ...formData, containerCode: e.target.value.toUpperCase() })}
                  placeholder="e.g., ABCD123456"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 focus:bg-white outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Origin Port</label>
                <Combobox 
                   options={origins}
                   value={formData.origin}
                   onChange={(val) => setFormData({...formData, origin: val})}
                   placeholder="Select Origin"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Loading Date</label>
                <input
                  type="date"
                  value={formData.loadingDate}
                  onChange={(e) => setFormData({ ...formData, loadingDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 focus:bg-white outline-none transition-all font-bold text-slate-900"
                  disabled={submitting}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white px-6 py-4 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest shadow-lg shadow-blue-100 active:scale-95"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Container'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Advanced Filters */}
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200/60 p-5 mb-10 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search container code..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none transition-all font-medium text-slate-600 placeholder:text-slate-300"
              />
            </div>
            
             <Combobox 
                   options={origins}
                   value={filters.origin}
                   onChange={(val) => handleFilterChange('origin', val)}
                   placeholder="All Port Origins"
             />

            <div className="flex bg-white border border-slate-200 rounded-2xl p-1 gap-1 focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-400 transition-all">
               <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="flex-1 px-3 py-2 bg-transparent text-xs font-black text-slate-500 outline-none"
               />
               <span className="flex items-center text-slate-200 font-black">/</span>
               <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="flex-1 px-3 py-2 bg-transparent text-xs font-black text-slate-500 outline-none"
               />
            </div>

            <div className="flex bg-white border border-slate-200 rounded-2xl p-1 gap-1 focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-400 transition-all">
               <input
                type="number"
                value={filters.minCtn}
                onChange={(e) => handleFilterChange('minCtn', e.target.value)}
                placeholder="Min CTN"
                className="flex-1 px-3 py-2 bg-transparent text-xs font-black text-slate-500 outline-none placeholder:text-slate-300"
               />
               <span className="flex items-center text-slate-200 font-black">/</span>
               <input
                type="number"
                value={filters.maxCtn}
                onChange={(e) => handleFilterChange('maxCtn', e.target.value)}
                placeholder="Max CTN"
                className="flex-1 px-3 py-2 bg-transparent text-xs font-black text-slate-500 outline-none placeholder:text-slate-300"
               />
            </div>
          </div>
          
          {(filters.search || filters.origin || filters.startDate || filters.endDate || filters.minCtn || filters.maxCtn) && (
            <div className="mt-4 flex justify-end">
              <button 
                onClick={clearFilters}
                className="text-xs text-red-500 font-bold uppercase tracking-widest flex items-center gap-1.5 hover:text-red-600 transition-colors"
              >
                <X className="w-3 h-3" /> Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Container List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : containers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-16 text-center border border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Package className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Containers Found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              We couldn't find any containers matching your filters. Try adjusting your search or create a new one.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {containers.map((container) => (
                <div
                  key={container.id}
                  className="bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 border border-slate-100 overflow-hidden group flex flex-col h-full"
                >
                  <div className="p-8 flex-1">
                    <div className="flex items-start justify-between gap-6 mb-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col mb-2">
                             <div className="flex items-center justify-between mb-3">
                                {getStatusBadge(container.status)}
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                  {formatDateTag(container.loadingDate)}
                                </span>
                             </div>
                             <h3 className="text-2xl font-bold text-slate-900 truncate tracking-tight leading-none" title={container.containerCode}>
                              {container.containerCode}
                             </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                          <MapPin className="w-3.5 h-3.5 text-blue-500" />
                          <span className="truncate">{container.origin}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={() => handleEdit(container)}
                          className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-xl border border-transparent hover:border-blue-100 transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(container.id)}
                          className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-xl border border-transparent hover:border-red-100 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8 bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                      <Calendar className="w-3.5 h-3.5 text-slate-300" />
                      {new Date(container.loadingDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm group/stat hover:border-blue-200 transition-colors">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1 group-hover/stat:text-blue-500 transition-colors">Total CTN</div>
                        <div className="text-2xl font-bold text-slate-900 tracking-tight">{container.totalCtn || 0}</div>
                      </div>
                      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm group/stat hover:border-amber-200 transition-colors">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1 group-hover/stat:text-amber-500 transition-colors">Clients</div>
                        <div className="text-2xl font-bold text-slate-900 tracking-tight">{container.clientCount || 0}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 pt-0">
                    <button
                        onClick={() => window.location.href = `/dashboard/loading/${container.id}`}
                        className="w-full bg-slate-900 text-white py-4 rounded-[1.5rem] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 font-semibold uppercase text-xs tracking-widest active:scale-[0.98]"
                    >
                        <Package className="w-4 h-4" />
                        Manage Log
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pb-12">
                     <button
                        onClick={() => setPagination(prev => ({...prev, page: Math.max(1, prev.page - 1)}))}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                     >
                        Previous
                     </button>
                     <span className="text-sm text-slate-600 font-medium px-4">
                        Page {pagination.page} of {pagination.totalPages}
                     </span>
                     <button
                        onClick={() => setPagination(prev => ({...prev, page: Math.min(prev.totalPages, prev.page + 1)}))}
                        disabled={pagination.page >= pagination.totalPages}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                     >
                        Next
                     </button>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
