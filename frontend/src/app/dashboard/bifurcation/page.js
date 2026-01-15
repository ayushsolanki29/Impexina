"use client";

import React, { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api';
import { toast } from 'sonner';
import { 
    Loader2, RefreshCw, Settings, ChevronLeft, ChevronRight, 
    Search, Calendar, ChevronDown, ChevronUp, ExternalLink, History
} from 'lucide-react';
import Link from 'next/link';

// Enhanced editable cell component with Tab support
const EditableCell = ({ value, type = "text", onSave, tabIndex }) => {
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
                className="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded-md outline-none bg-white shadow-sm font-medium"
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
            className="w-full h-full min-h-[32px] cursor-pointer hover:bg-white/80 transition-colors flex items-center px-1 rounded hover:shadow-sm"
            tabIndex={tabIndex}
            onFocus={() => setIsEditing(true)}
        >
            {value ? (
                <span className="truncate font-medium text-slate-700">
                    {type === 'date' ? new Date(value).toLocaleDateString() : value}
                </span>
            ) : (
                <span className="text-slate-300 italic text-xs">Click to edit</span>
            )}
        </div>
    );
};

export default function BifurcationPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [showSettings, setShowSettings] = useState(false);
    const [mixLimit, setMixLimit] = useState(5);
    const [savingSettings, setSavingSettings] = useState(false);
    
    // UI State
    const [expandedContainers, setExpandedContainers] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

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
                dateTo: dateRange.to
            });
            const response = await API.get(`/bifurcation?${params.toString()}`);
            if (response.data.success) {
                setData(response.data.data);
                setPagination(response.data.pagination);
                if (response.data.settings) {
                    setMixLimit(response.data.settings.mixLimit);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load bifurcation report");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, dateRange, pagination.page]);

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
        } catch (error) {
            toast.error("Failed to save field");
            setData(oldData);
        }
    };

    const handleUpdateSetting = async () => {
        try {
            setSavingSettings(true);
            await API.post('/bifurcation/settings', { key: 'BIFURCATION_ITEM_LIMIT', value: mixLimit });
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
        fetchData();
    }, [searchTerm, dateRange.from, dateRange.to]);

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
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 mb-8 items-center">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search container or shipping mark..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium text-slate-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <input 
                                type="date" 
                                className="bg-transparent text-xs font-semibold text-slate-600 outline-none"
                                value={dateRange.from}
                                onChange={(e) => setDateRange(prev => ({...prev, from: e.target.value}))}
                            />
                            <span className="text-slate-300 text-xs">to</span>
                            <input 
                                type="date" 
                                className="bg-transparent text-xs font-semibold text-slate-600 outline-none"
                                value={dateRange.to}
                                onChange={(e) => setDateRange(prev => ({...prev, to: e.target.value}))}
                            />
                        </div>
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
                                            className={`px-5 py-4 flex flex-wrap justify-between items-center cursor-pointer select-none transition-colors ${isExpanded ? 'bg-slate-50/50 border-b border-slate-200' : 'bg-white hover:bg-slate-50/30'}`}
                                            onClick={() => toggleContainer(code)}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Container</span>
                                                    <div className="flex items-center gap-2 group/code">
                                                        <h2 className="text-lg font-bold text-slate-800 leading-tight">{code}</h2>
                                                        <Link 
                                                            href={`/dashboard/loading/${containerId}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="p-1 opacity-0 group-hover/code:opacity-100 transition-opacity text-blue-500 hover:bg-blue-50 rounded"
                                                            title="View details"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </Link>
                                                    </div>
                                                </div>
                                                <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                                                <div className="flex flex-col hidden md:flex">
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Loading Date</span>
                                                    <div className="text-xs font-semibold text-blue-600">
                                                        {new Date(items[0].loadingDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 sm:gap-8">
                                                <div className="flex gap-4 sm:gap-8">
                                                    <div className="text-center">
                                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Total CTN</div>
                                                        <div className="text-sm font-bold text-slate-700 leading-none">{totalCtn}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-wider leading-none mb-1">Total CBM</div>
                                                        <div className="text-sm font-bold text-emerald-600 leading-none">{containerTotalCbm.toFixed(3)}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-[9px] text-amber-500/80 font-bold uppercase tracking-wider leading-none mb-1">Total WT</div>
                                                        <div className="text-sm font-bold text-amber-600 leading-none">{containerTotalWt.toFixed(2)}</div>
                                                    </div>
                                                </div>
                                                <div className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Accordion Content */}
                                        {isExpanded && (
                                            <div className="animate-in slide-in-from-top-1 duration-200">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="bg-slate-50/30 border-b border-slate-100 text-slate-400 text-left uppercase text-[10px] font-bold tracking-wider">
                                                                <th className="px-4 py-3 w-10 text-center">#</th>
                                                                <th className="px-4 py-3 w-40">Shipping Mark</th>
                                                                <th className="px-4 py-3 w-16 text-center">CTN</th>
                                                                <th className="px-4 py-3 min-w-[200px]">Product Detail</th>
                                                                <th className="px-4 py-3 w-20 text-right">CBM</th>
                                                                <th className="px-4 py-3 w-20 text-right">WT</th>
                                                                 <th className="px-4 py-3 w-24 border-l border-slate-50 bg-blue-50/10 text-blue-600/70">From</th>
                                                                 <th className="px-4 py-3 w-24 bg-blue-50/10 text-blue-600/70">To</th>
                                                                 <th className="px-4 py-3 w-28 border-l border-slate-50 bg-amber-50/10 text-amber-600/70">Delivery</th>
                                                                 <th className="px-4 py-3 w-28 bg-amber-50/10 text-amber-600/70">Inv No</th>
                                                                 <th className="px-4 py-3 w-16 bg-amber-50/10 text-amber-600/70 text-center">LR.No</th>
                                                                 <th className="px-4 py-3 w-24 bg-amber-50/10 text-amber-600/70 text-right">GST AMT</th>
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
                                                                            <tr className="bg-slate-50 border-y border-slate-100">
                                                                                <td colSpan="11" className="px-4 py-1.5">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                                                        <span className="text-[10px] font-bold text-slate-600">
                                                                                            Client: <span className="text-blue-700">{client}</span>
                                                                                        </span>
                                                                                        <span className="text-[10px] font-medium text-slate-400 ml-1">
                                                                                            ({clientItems.length} {clientItems.length === 1 ? 'mark' : 'marks'})
                                                                                        </span>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                        {clientItems.map((item, iIdx) => (
                                                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                                                                <td className="px-4 py-3 text-center text-slate-400 font-medium">
                                                                                    {client ? `${gIdx}.${iIdx + 1}` : iIdx + 1}
                                                                                </td>
                                                                                <td className="px-4 py-3 font-bold text-slate-800 border-r border-slate-50">{item.mark}</td>
                                                                                <td className="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/10">{item.ctn}</td>
                                                                                <td className="px-4 py-3 text-slate-500 max-w-xs truncate font-medium" title={item.product}>
                                                                                    {item.product}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{item.totalCbm.toFixed(3)}</td>
                                                                                <td className="px-4 py-3 text-right text-amber-600 font-semibold">{item.totalWt.toFixed(2)}</td>
                                                                                
                                                                                <td className="px-4 py-3 border-l border-slate-50 bg-blue-50/5 group-hover:bg-blue-50/10">
                                                                                    <EditableCell 
                                                                                        value={item.from} 
                                                                                        onSave={(val) => handleUpdate(item.id, 'from', val)} 
                                                                                        tabIndex={(gIdx * 100) + (iIdx * 5) + 1}
                                                                                    />
                                                                                </td>
                                                                                <td className="px-4 py-3 bg-blue-50/5 group-hover:bg-blue-50/10">
                                                                                    <EditableCell 
                                                                                        value={item.to} 
                                                                                        onSave={(val) => handleUpdate(item.id, 'to', val)} 
                                                                                        tabIndex={(gIdx * 100) + (iIdx * 5) + 2}
                                                                                    />
                                                                                </td>

                                                                                <td className="px-4 py-3 border-l border-slate-50 bg-amber-50/5 group-hover:bg-amber-50/10">
                                                                                    <EditableCell 
                                                                                        value={item.deliveryDate} 
                                                                                        type="date"
                                                                                        onSave={(val) => handleUpdate(item.id, 'deliveryDate', val)} 
                                                                                        tabIndex={(gIdx * 100) + (iIdx * 5) + 3}
                                                                                    />
                                                                                </td>
                                                                                <td className="px-4 py-3 bg-amber-50/5 group-hover:bg-amber-50/10">
                                                                                    <EditableCell 
                                                                                        value={item.invoiceNo} 
                                                                                        onSave={(val) => handleUpdate(item.id, 'invoiceNo', val)} 
                                                                                        tabIndex={(gIdx * 100) + (iIdx * 5) + 4}
                                                                                    />
                                                                                </td>
                                                                                <td className="px-4 py-3 bg-amber-50/5 group-hover:bg-amber-50/10 text-center">
                                                                                    <input 
                                                                                        type="checkbox"
                                                                                        className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500/10 cursor-pointer"
                                                                                        checked={item.lrNo}
                                                                                        onChange={(e) => handleUpdate(item.id, 'lrNo', e.target.checked)}
                                                                                        tabIndex={(gIdx * 100) + (iIdx * 5) + 4}
                                                                                    />
                                                                                </td>
                                                                                <td className="px-4 py-3 bg-amber-50/5 group-hover:bg-amber-50/10 text-right">
                                                                                    <div className="flex items-center justify-end gap-1">
                                                                                        <span className="text-slate-300 font-medium">₹</span>
                                                                                        <EditableCell 
                                                                                            value={item.gstAmount || 0} 
                                                                                            type="number"
                                                                                            onSave={(val) => handleUpdate(item.id, 'gstAmount', val)} 
                                                                                            tabIndex={(gIdx * 100) + (iIdx * 5) + 5}
                                                                                        />
                                                                                    </div>
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
                                            onClick={() => {setSearchTerm(''); setDateRange({from: '', to: ''})}}
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
