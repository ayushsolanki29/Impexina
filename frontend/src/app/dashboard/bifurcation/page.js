"use client";

import React, { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
    Loader2, RefreshCw, Settings, ChevronLeft, ChevronRight,
    Search, Calendar, ChevronDown, ChevronUp, ExternalLink, History,
    Users, ChevronsUpDown, Check, X
} from 'lucide-react';
import Link from 'next/link';

// Reusable Combobox Component
const Combobox = ({ value, onChange, options, placeholder, onAddNew }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const wrapperRef = React.useRef(null);

    React.useEffect(() => {
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer bg-white hover:border-blue-400 transition-all text-sm"
            >
                <span className={value ? "text-slate-600 font-medium" : "text-slate-300"}>
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

// Enhanced editable cell component with Tab support
// Suggestion Editable Cell Component
const SuggestionEditableCell = ({ value, onSave, suggestions = [], placeholder = "Add...", tabIndex }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value || '');
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        setCurrentValue(value || '');
    }, [value]);

    const filteredSuggestions = suggestions.filter(s =>
        s?.toLowerCase().includes(currentValue?.toLowerCase())
    );

    const handleBlur = () => {
        setTimeout(() => {
            setIsEditing(false);
            setShowSuggestions(false);
            if (currentValue !== (value || '')) {
                onSave(currentValue);
            }
        }, 200);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    if (isEditing) {
        return (
            <div className="relative w-full">
                <input
                    type="text"
                    className="w-full px-2 py-1 text-xs border border-blue-400 rounded outline-none bg-white font-medium text-slate-700 focus:ring-4 focus:ring-blue-500/5 transition-all"
                    value={currentValue}
                    onChange={(e) => {
                        setCurrentValue(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    autoFocus
                    tabIndex={tabIndex}
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
                        {filteredSuggestions.map((s, idx) => (
                            <div
                                key={idx}
                                className="px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50 cursor-pointer font-medium flex items-center justify-between group"
                                onClick={() => {
                                    setCurrentValue(s);
                                    onSave(s);
                                    setIsEditing(false);
                                    setShowSuggestions(false);
                                }}
                            >
                                {s}
                                <Check className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className="w-full h-full min-h-[32px] cursor-pointer hover:bg-slate-50 transition-all flex items-center px-2 rounded-md border border-transparent hover:border-slate-200 group/cell"
            tabIndex={tabIndex}
            onFocus={() => setIsEditing(true)}
        >
            {value ? (
                <span className="truncate font-normal text-slate-700">
                    {value}
                </span>
            ) : (
                <span className="text-slate-300 italic text-[10px] uppercase tracking-wider font-medium group-hover/cell:text-slate-400">{placeholder}</span>
            )}
        </div>
    );
};

const EditableCell = ({ value, type = "text", onSave, tabIndex, className = "" }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleBlur = () => {
        setIsEditing(false);
        if (currentValue !== value) {
            onSave(currentValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    if (isEditing) {
        return (
            <input
                type={type}
                className={`w-full bg-white border border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none p-2 text-sm font-normal rounded shadow-sm transition-all ${className}`}
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                autoFocus
                tabIndex={tabIndex}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`w-full h-full min-h-[32px] cursor-pointer hover:bg-slate-50 transition-all flex items-center px-2 rounded-md border border-transparent hover:border-slate-200 group/cell ${className}`}
            tabIndex={tabIndex}
            onFocus={() => setIsEditing(true)}
        >
            {value ? (
                <span className="truncate font-normal text-slate-700">
                    {type === 'date' ? new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : value}
                </span>
            ) : (
                <span className="text-slate-300 italic text-[10px] uppercase tracking-wider font-medium group-hover/cell:text-slate-400">Click to edit</span>
            )}
        </div>
    );
};

export default function BifurcationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [showSettings, setShowSettings] = useState(false);
    const [mixLimit, setMixLimit] = useState(5);
    const [weightVeryHighThreshold, setWeightVeryHighThreshold] = useState(69);
    const [weightHighThreshold, setWeightHighThreshold] = useState(75);
    const [savingSettings, setSavingSettings] = useState(false);

    // UI State
    const [expandedContainers, setExpandedContainers] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [origin, setOrigin] = useState('');
    const [origins, setOrigins] = useState([]);
    const [locationSuggestions, setLocationSuggestions] = useState({ froms: [], tos: [] });

    // Grouping helper
    const groupByContainer = (list) => {
        const groups = {};
        list.forEach(item => {
            if (!groups[item.containerCode]) {
                groups[item.containerCode] = [];
            }
            groups[item.containerCode].push(item);
        });
        return groups;
    };

    const fetchData = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page,
                limit: 10,
                search: searchTerm,
                dateFrom: dateRange.from,
                dateTo: dateRange.to,
                origin: origin
            });
            const response = await API.get(`/bifurcation?${params.toString()}`);
            if (response.data.success) {
                setData(response.data.data);
                setPagination(response.data.pagination);
                if (response.data.settings) {
                    setMixLimit(response.data.settings.mixLimit);
                    setWeightVeryHighThreshold(response.data.settings.weightVeryHighThreshold);
                    setWeightHighThreshold(response.data.settings.weightHighThreshold);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load bifurcation report");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, dateRange, origin, pagination.page]);

    // Handle Ctrl+S for global refresh/save trigger
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                fetchData(pagination.page);
                toast.success("Data refreshed");
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [fetchData, pagination.page]);

    const handleUpdate = async (sheetId, field, value) => {
        const oldData = [...data];
        const newData = data.map(item => {
            if (item.id === sheetId) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setData(newData);

        try {
            const item = newData.find(i => i.id === sheetId);
            const payload = {
                gst: item.gst,
                gstAmount: item.gstAmount,
                deliveryDate: item.deliveryDate,
                from: item.from,
                to: item.to,
                lrNo: item.lrNo,
                invoiceNo: item.invoiceNo
            };

            await API.post(`/bifurcation/${sheetId}`, payload);
            toast.success("Field updated");
            fetchLocations(); // Refresh suggestions if new one added
        } catch (error) {
            toast.error("Failed to save field");
            setData(oldData);
        }
    };

    const handleUpdateSetting = async () => {
        try {
            setSavingSettings(true);
            await API.post('/settings/bifurcation/update', {
                mixLimit: parseInt(mixLimit),
                weightVeryHighThreshold: parseFloat(weightVeryHighThreshold),
                weightHighThreshold: parseFloat(weightHighThreshold)
            });
            toast.success("Settings updated");
            setShowSettings(false);
            fetchData(pagination.page);
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setSavingSettings(false);
        }
    };

    const toggleContainer = (code) => {
        setExpandedContainers(prev => ({
            ...prev,
            [code]: !prev[code]
        }));
    };

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
            console.error(error);
        }
    };

    const fetchLocations = async () => {
        try {
            const response = await API.get('/bifurcation/locations');
            if (response.data.success) {
                setLocationSuggestions(response.data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchLocations();
    }, [searchTerm, dateRange.from, dateRange.to, origin]);

    const groupedData = groupByContainer(data);
    const containerCodes = Object.keys(groupedData).sort();

    return (
        <div className="p-4 2xl:p-8 bg-slate-50 min-h-screen font-sans antialiased text-slate-900">
            <div className="max-w-[1700px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            Bifurcation Report
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                                {data.length} MARKS
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Bifurcate and manage post-loading details for confirmed containers.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href="/dashboard/bifurcation/activities"
                            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all shadow-sm group"
                        >
                            <History className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                            <span className="text-sm font-semibold text-slate-600">Activities</span>
                        </Link>

                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm text-slate-400"
                        >
                            <Settings className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => fetchData(pagination.page)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 group"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            <span className="text-sm font-semibold">Sync</span>
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 mb-8 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search container or shipping mark..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all text-sm font-medium text-slate-600 placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <Combobox
                            options={origins}
                            value={origin}
                            onChange={(val) => setOrigin(val)}
                            placeholder="All Origins"
                        />

                        <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-xl group focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-400 transition-all">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                                value={dateRange.from}
                                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                            />
                            <span className="text-slate-200 font-black">/</span>
                            <input
                                type="date"
                                className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                                value={dateRange.to}
                                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                            />
                        </div>

                        {(searchTerm || origin || dateRange.from || dateRange.to) && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setOrigin('');
                                    setDateRange({ from: '', to: '' });
                                }}
                                className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Clear all filters"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content: Accordions */}
                <div className="space-y-4 min-h-[400px]">
                    {loading && data.length === 0 ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                <span className="text-sm text-slate-400 font-semibold animate-pulse">Loading report...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {containerCodes.map(code => {
                                const items = groupedData[code];
                                const containerId = items[0].containerId;
                                const containerTotalCbm = items[0]?.containerTotalCbm || 0;
                                const containerTotalWt = items[0]?.containerTotalWt || 0;
                                const totalCtn = items.reduce((sum, i) => sum + i.ctn, 0);
                                const isExpanded = expandedContainers[code] !== false; // Default expanded

                                return (
                                    <div key={code} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
                                        {/* Accordion Header */}
                                        <div
                                            className={`px-6 py-5 flex flex-wrap justify-between items-center cursor-pointer select-none transition-all duration-300 ${isExpanded ? 'bg-slate-50/80 border-b border-slate-100' : 'bg-white hover:bg-slate-50/50'}`}
                                            onClick={() => toggleContainer(code)}
                                        >
                                            <div className="flex items-center gap-8">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">Container</span>
                                                    <div className="flex items-center gap-2.5 group/code">
                                                        <h2 className="text-xl font-bold text-slate-900 leading-none tracking-tight">{code}</h2>
                                                        <Link
                                                            href={`/dashboard/loading/${containerId}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="p-1 opacity-0 group-hover/code:opacity-100 transition-all text-blue-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-blue-100 rounded-lg"
                                                            title="View details"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </div>

                                                <div className="h-10 w-px bg-slate-200/60 hidden sm:block"></div>

                                                <div className="flex flex-col hidden lg:flex">
                                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mb-1.5">Loading Date</span>
                                                    <div className="text-sm font-bold text-slate-800 tracking-tight">
                                                        {new Date(items[0].loadingDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 sm:gap-12">
                                                <div className="flex gap-6 sm:gap-10">
                                                    <div className="flex flex-col items-end px-3 border-r border-slate-100">
                                                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none mb-2">CTN</div>
                                                        <div className="text-lg font-bold text-slate-900 leading-none">{totalCtn}</div>
                                                    </div>
                                                    <div className="flex flex-col items-end px-3 border-r border-slate-100">
                                                        <div className="text-[10px] text-emerald-500/60 font-medium uppercase tracking-widest leading-none mb-2">CBM</div>
                                                        <div className="text-lg font-bold text-emerald-600 leading-none">{containerTotalCbm.toFixed(3)}</div>
                                                    </div>
                                                    <div className="flex flex-col items-end px-3">
                                                        <div className="text-[10px] text-amber-500/60 font-medium uppercase tracking-widest leading-none mb-2">WT</div>
                                                        <div className="text-lg font-bold text-amber-600 leading-none">{containerTotalWt.toFixed(2)}</div>
                                                    </div>
                                                </div>
                                                <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-white shadow-sm rotate-180' : 'bg-slate-50'}`}>
                                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Accordion Content */}
                                        {isExpanded && (
                                            <div className="animate-in slide-in-from-top-1 duration-200">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-left uppercase text-[10px] font-medium tracking-widest">
                                                                <th className="px-5 py-4 min-w-[50px] text-center">#</th>
                                                                <th className="px-5 py-4 min-w-[150px]">Shipping Mark</th>
                                                                <th className="px-5 py-4 min-w-[100px] text-center">CTN</th>
                                                                <th className="px-5 py-4 min-w-[250px]">Product Detail</th>
                                                                <th className="px-5 py-4 min-w-[100px] text-right">CBM</th>
                                                                <th className="px-5 py-4 min-w-[100px] text-right">WT</th>
                                                                <th className="px-5 py-4 min-w-[120px] border-l border-slate-100">From</th>
                                                                <th className="px-5 py-4 min-w-[120px]">To</th>
                                                                <th className="px-5 py-4 min-w-[140px] border-l border-slate-100 text-amber-600/60">Delivery</th>
                                                                <th className="px-5 py-4 min-w-[120px] text-amber-600/60">Inv No</th>
                                                                <th className="px-5 py-4 min-w-[120px] text-amber-600/60 text-right">GST</th>
                                                                <th className="px-5 py-4 min-w-[80px] text-amber-600/60 text-center">LR</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {(() => {
                                                                const groups = {};
                                                                items.forEach(it => {
                                                                    const c = it.clientName || '';
                                                                    if (!groups[c]) groups[c] = [];
                                                                    groups[c].push(it);
                                                                });

                                                                const groupEntries = Object.entries(groups).sort(([a], [b]) => {
                                                                    if (!a) return -1;
                                                                    if (!b) return 1;
                                                                    return a.localeCompare(b);
                                                                });

                                                                return groupEntries.map(([client, clientItems], gIdx) => (
                                                                    <React.Fragment key={client || 'none'}>
                                                                        {client && (
                                                                            <tr className="bg-slate-50/50">
                                                                                <td colSpan="11" className="px-5 py-2.5">
                                                                                    <div className="flex items-center gap-3 group/client">
                                                                                        <Users className="w-3.5 h-3.5 text-blue-500/60" />
                                                                                        <Link
                                                                                            href={`/dashboard/loading/${clientItems[0].containerId}?client=${encodeURIComponent(client)}`}
                                                                                            className="text-[11px] font-bold text-slate-800 uppercase tracking-tight hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-2 group-hover/client:underline"
                                                                                        >
                                                                                            {client}
                                                                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover/client:opacity-100 transition-opacity text-blue-500" />
                                                                                        </Link>
                                                                                        <span className="text-[10px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                                                                            {clientItems.length} {clientItems.length === 1 ? 'mark' : 'marks'}
                                                                                        </span>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                        {clientItems.map((item, iIdx) => (
                                                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-all group border-b border-slate-50 last:border-0 font-sans">
                                                                                <td className="px-5 py-4 text-center text-slate-300 font-medium text-[10px]">
                                                                                    {client ? `${gIdx}.${iIdx + 1}` : iIdx + 1}
                                                                                </td>
                                                                                <td className="px-5 py-4 font-normal text-slate-900 tracking-tight">{item.mark}</td>
                                                                                <td className="px-5 py-4 text-center font-normal text-slate-600">{item.ctn}</td>
                                                                                <td className="px-5 py-4 text-slate-500 max-w-[250px] truncate font-normal text-[11px]" title={item.product}>
                                                                                    {item.product}
                                                                                </td>
                                                                                <td className="px-5 py-4 text-right text-emerald-600 font-normal">{item.totalCbm.toFixed(3)}</td>
                                                                                <td className={`px-5 py-4 text-right transition-all font-sans ${parseFloat(item.totalWt) < weightVeryHighThreshold
                                                                                    ? 'text-red-600 font-black bg-red-50/50 rounded-lg'
                                                                                    : parseFloat(item.totalWt) < weightHighThreshold
                                                                                        ? 'text-amber-600 font-black bg-amber-50/50 rounded-lg'
                                                                                        : 'text-amber-600 font-normal'
                                                                                    }`}>
                                                                                    {item.totalWt.toFixed(2)}
                                                                                </td>

                                                                                <td className="px-2 py-2 border-l border-slate-50">
                                                                                    <SuggestionEditableCell
                                                                                        value={item.from}
                                                                                        suggestions={locationSuggestions.froms}
                                                                                        placeholder="From..."
                                                                                        onSave={(val) => handleUpdate(item.id, 'from', val)}
                                                                                        tabIndex={(gIdx * 100) + (iIdx * 5) + 1}
                                                                                    />
                                                                                </td>
                                                                                <td className="px-2 py-2">
                                                                                    <SuggestionEditableCell
                                                                                        value={item.to}
                                                                                        suggestions={locationSuggestions.tos}
                                                                                        placeholder="To..."
                                                                                        onSave={(val) => handleUpdate(item.id, 'to', val)}
                                                                                        tabIndex={(gIdx * 100) + (iIdx * 5) + 2}
                                                                                    />
                                                                                </td>

                                                                                <td className="px-2 py-2 border-l border-slate-50">
                                                                                    <EditableCell
                                                                                        value={item.deliveryDate}
                                                                                        type="date"
                                                                                        onSave={(val) => handleUpdate(item.id, 'deliveryDate', val)}
                                                                                        tabIndex={(gIdx * 100) + (iIdx * 5) + 3}
                                                                                        className="text-amber-700 font-normal"
                                                                                    />
                                                                                </td>
                                                                                <td className="px-2 py-2">
                                                                                    <EditableCell
                                                                                        value={item.invoiceNo}
                                                                                        onSave={(val) => handleUpdate(item.id, 'invoiceNo', val)}
                                                                                        tabIndex={(gIdx * 100) + (iIdx * 5) + 4}
                                                                                        className="text-amber-700 font-normal"
                                                                                    />
                                                                                </td>
                                                                                <td className="px-2 py-2 text-right">
                                                                                    <div className="flex items-center justify-end gap-1 px-1">
                                                                                        <span className="text-slate-300 font-medium text-[10px]">₹</span>
                                                                                        <EditableCell
                                                                                            value={item.gstAmount || 0}
                                                                                            type="number"
                                                                                            onSave={(val) => handleUpdate(item.id, 'gstAmount', val)}
                                                                                            tabIndex={(gIdx * 100) + (iIdx * 5) + 5}
                                                                                            className="text-amber-700 font-normal text-right"
                                                                                        />
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-2 py-2 text-center">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all"
                                                                                        checked={item.lrNo}
                                                                                        onChange={(e) => handleUpdate(item.id, 'lrNo', e.target.checked)}
                                                                                        tabIndex={(gIdx * 100) + (iIdx * 5) + 6}
                                                                                    />
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </React.Fragment>
                                                                ));
                                                            })()}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {containerCodes.length === 0 && (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-20 text-center">
                                    <div className="max-w-xs mx-auto flex flex-col items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                            <Search className="w-6 h-6 text-slate-200" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-800">No report data</h3>
                                            <p className="text-slate-400 text-xs">Try adjusting your filters or sync data.</p>
                                        </div>
                                        <button
                                            onClick={() => { setSearchTerm(''); setDateRange({ from: '', to: '' }) }}
                                            className="text-xs text-blue-500 font-bold hover:text-blue-700 transition-colors"
                                        >
                                            Clear filters
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-between items-center bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm mt-8">
                                    <span className="text-xs font-semibold text-slate-400">
                                        Page <span className="text-slate-700">{pagination.page}</span> / {pagination.totalPages}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => fetchData(pagination.page - 1)}
                                            disabled={pagination.page <= 1}
                                            className="p-2 border border-slate-100 rounded-xl disabled:opacity-20 hover:bg-slate-50 transition-all font-bold text-slate-600"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center gap-1 mx-1">
                                            {[...Array(pagination.totalPages)].map((_, i) => (
                                                <button
                                                    key={i + 1}
                                                    onClick={() => fetchData(i + 1)}
                                                    className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${pagination.page === i + 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-50' : 'text-slate-400 hover:bg-slate-50'}`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => fetchData(pagination.page + 1)}
                                            disabled={pagination.page >= pagination.totalPages}
                                            className="p-2 border border-slate-100 rounded-xl disabled:opacity-20 hover:bg-slate-50 transition-all font-bold text-slate-600"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Report Settings</h3>
                            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <ChevronDown className="w-4 h-4 rotate-90 text-slate-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Product Layout Limit
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700"
                                    value={mixLimit}
                                    onChange={(e) => setMixLimit(e.target.value)}
                                />
                                <p className="text-[10px] text-slate-400 mt-3 font-medium leading-relaxed">
                                    Collapses descriptions to "MIX ITEM" for marks exceeding this limit.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-red-50/50 p-3 rounded-2xl border border-red-100">
                                    <label className="block text-[9px] font-bold text-red-500 uppercase tracking-widest mb-2">
                                        Very High <span className="text-[8px] opacity-70">(Red)</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-400 transition-all font-bold text-red-700"
                                        value={weightVeryHighThreshold}
                                        onChange={(e) => setWeightVeryHighThreshold(e.target.value)}
                                    />
                                    <p className="text-[8px] text-red-400 mt-2 font-medium">Highlight if Weight &lt; limit</p>
                                </div>

                                <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
                                    <label className="block text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-2">
                                        High <span className="text-[8px] opacity-70">(Yellow)</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400 transition-all font-bold text-amber-700"
                                        value={weightHighThreshold}
                                        onChange={(e) => setWeightHighThreshold(e.target.value)}
                                    />
                                    <p className="text-[8px] text-amber-400 mt-2 font-medium">Highlight if Weight &lt; limit</p>
                                </div>
                            </div>

                            <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                                <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Normal Stage</p>
                                <p className="text-[9px] text-emerald-400 mt-1 font-medium italic">Weight &ge; {weightHighThreshold} kg will remain normal.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-8">
                            <button
                                onClick={handleUpdateSetting}
                                disabled={savingSettings}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-50 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                                Save Changes
                            </button>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="w-full py-2 text-slate-400 font-semibold text-xs hover:text-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
