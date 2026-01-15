"use client";

import React, { useState, useEffect, useCallback } from 'react';
import API from '@/lib/api';
import { toast } from 'sonner';
import { 
    Loader2, ArrowLeft, History, Calendar, 
    Container, Tag, FileEdit, ArrowRight,
    Search, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function BifurcationActivitiesPage() {
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [containers, setContainers] = useState([]);
    
    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContainer, setSelectedContainer] = useState('');

    const fetchContainers = async () => {
        try {
            const response = await API.get('/bifurcation/activities/containers');
            if (response.data.success) {
                setContainers(response.data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchActivities = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page,
                limit: 20,
                search: searchTerm,
                containerId: selectedContainer
            });
            const response = await API.get(`/bifurcation/activities?${params.toString()}`);
            if (response.data.success) {
                setActivities(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load activity logs");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedContainer]);

    useEffect(() => {
        fetchContainers();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchActivities(1);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedContainer, fetchActivities]);

    const formatField = (field) => {
        return field.replace(/([A-Z])/g, ' $1').toUpperCase();
    };

    const formatValue = (field, value) => {
        if (value === null || value === 'null' || value === undefined) return <span className="text-slate-400 italic font-medium">EMPTY</span>;
        if (field === 'lrNo') return value === 'true' || value === true ? 'YES' : 'NO';
        if (field === 'deliveryDate') return new Date(value).toLocaleDateString();
        if (field === 'gstAmount') return `₹${value}`;
        return value;
    };

    return (
        <div className="p-4 2xl:p-8 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/dashboard/bifurcation"
                            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm text-slate-600 group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <History className="w-6 h-6 text-blue-600" />
                                Audit History
                            </h1>
                            <p className="text-slate-500 font-medium text-sm">Review all changes made to Bifurcation report</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search by user, field, or value..."
                            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 sm:text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select 
                                className="pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-700 text-sm appearance-none cursor-pointer min-w-[180px]"
                                value={selectedContainer}
                                onChange={(e) => setSelectedContainer(e.target.value)}
                            >
                                <option value="">All Containers</option>
                                {containers.map(c => (
                                    <option key={c.containerId} value={c.containerId}>{c.containerCode}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                    {loading && activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                            <span className="text-slate-500 font-bold animate-pulse">Scanning Logs...</span>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="bg-white rounded-3xl p-20 border border-slate-200 text-center shadow-sm">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <History className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">No Logs Matching Filters</h3>
                            <p className="text-slate-500 font-medium mt-2">Try adjusting your search terms or container selection.</p>
                            <button 
                                onClick={() => {setSearchTerm(''); setSelectedContainer('')}}
                                className="mt-6 text-blue-600 font-bold hover:underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="relative before:absolute before:inset-0 before:ml-5 before:w-1 before:bg-slate-200 before:h-full pb-6">
                                {activities.map((activity, idx) => (
                                    <div key={activity.id} className="relative pl-12 pb-8 group">
                                        <div className={`absolute left-0 top-1.5 w-11 h-11 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm z-10 transition-transform group-hover:scale-110 ${
                                            activity.type === 'CREATE' ? 'bg-emerald-500' : 'bg-blue-600'
                                        }`}>
                                            <FileEdit className="w-5 h-5 text-white" />
                                        </div>

                                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-600 uppercase">
                                                        {activity.user?.name?.[0] || activity.user?.username?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-900">{activity.user?.name || activity.user?.username}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(activity.createdAt).toLocaleString(undefined, {
                                                                dateStyle: 'medium',
                                                                timeStyle: 'short'
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                    activity.type === 'CREATE' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                                                }`}>
                                                    {activity.type}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex flex-wrap gap-6 items-center">
                                                    <div className="flex items-center gap-2 group/meta">
                                                        <Container className="w-4 h-4 text-slate-400 group-hover/meta:text-slate-600" />
                                                        <span className="text-xs font-bold text-slate-700">{activity.bifurcation?.container?.containerCode || 'Unknown Container'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 group/meta">
                                                        <Tag className="w-4 h-4 text-slate-400 group-hover/meta:text-slate-600" />
                                                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{formatField(activity.field)}</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 text-center md:text-left">BEFORE</span>
                                                        <div className="text-sm font-bold text-slate-400 line-through truncate">
                                                            {formatValue(activity.field, activity.oldValue)}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex justify-center">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <ArrowRight className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col text-right overflow-hidden">
                                                        <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-1">AFTER</span>
                                                        <div className="text-sm font-black text-slate-900 truncate">
                                                            {formatValue(activity.field, activity.newValue)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row justify-between items-center bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm mt-4 gap-4">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        Page <span className="text-slate-900">{pagination.page}</span> / <span className="text-slate-900">{pagination.totalPages}</span>
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => fetchActivities(pagination.page - 1)}
                                            disabled={pagination.page <= 1 || loading}
                                            className="p-2 sm:px-4 sm:py-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-all font-bold text-slate-700 flex items-center gap-2 text-sm"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            <span className="hidden sm:inline">Prev</span>
                                        </button>
                                        
                                        <button
                                            onClick={() => fetchActivities(pagination.page + 1)}
                                            disabled={pagination.page >= pagination.totalPages || loading}
                                            className="p-2 sm:px-4 sm:py-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-all font-bold text-slate-700 flex items-center gap-2 text-sm"
                                        >
                                            <span className="hidden sm:inline">Next</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
