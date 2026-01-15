'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ArrowLeft, 
  User, 
  Calendar, 
  Layout, 
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Box,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

const LoadingActivitiesPage = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('sheets'); // 'containers' or 'sheets'
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContainer, setSelectedContainer] = useState('');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [containers, setContainers] = useState([]);

    const fetchContainers = async () => {
        try {
            const response = await API.get('/containers?limit=100');
            if (response.data?.success) {
                setContainers(response.data.data.containers);
            }
        } catch (error) {
            console.error('Fetch containers error:', error);
        }
    };

    const fetchActivities = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: 20,
                search: searchTerm,
            });

            if (selectedContainer) {
                params.append('containerId', selectedContainer);
            }

            const endpoint = activeTab === 'containers' 
                ? `/containers/activities?${params.toString()}`
                : `/loading-sheets/activities?${params.toString()}`;

            const response = await API.get(endpoint);
            if (response.data?.success) {
                setActivities(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Fetch activities error:', error);
            toast.error('Failed to load activities');
        } finally {
            setLoading(false);
        }
    }, [activeTab, searchTerm, selectedContainer]);

    useEffect(() => {
        fetchContainers();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchActivities(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedContainer, activeTab, fetchActivities]);

    const formatValue = (value, field) => {
        if (value === null || value === undefined) return 'None';
        if (field === 'loadingDate' && value) {
            try { return format(new Date(value), 'PPP'); } catch (e) { return value; }
        }
        return String(value);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                            <History className="w-8 h-8 text-blue-600" />
                            Loading Audit History
                        </h1>
                        <p className="text-gray-500 mt-1">Track all changes in containers and client sheets</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('sheets')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                            activeTab === 'sheets' 
                            ? 'bg-white text-blue-600 shadow-sm font-semibold' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Client Sheets
                    </button>
                    <button
                        onClick={() => setActiveTab('containers')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                            activeTab === 'containers' 
                            ? 'bg-white text-blue-600 shadow-sm font-semibold' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Box className="w-4 h-4" />
                        Containers
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search by user, field, or value..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-3 min-w-[200px]">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                        className="w-full py-2 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                        value={selectedContainer}
                        onChange={(e) => setSelectedContainer(e.target.value)}
                    >
                        <option value="">All Containers</option>
                        {containers.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.containerCode}
                            </option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={() => fetchActivities(pagination.page)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
                    title="Refresh"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {activities.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {activities.map((activity) => (
                            <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${
                                            activity.type === 'CREATE' ? 'bg-green-100 text-green-600' :
                                            activity.type === 'DELETE' ? 'bg-red-100 text-red-600' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                            {activity.type === 'CREATE' ? <History className="w-6 h-6" /> :
                                             activity.type === 'DELETE' ? <Box className="w-6 h-6" /> :
                                             <Layout className="w-6 h-6" />}
                                        </div>
                                        
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-gray-900 text-lg capitalize">
                                                    {activity.type.toLowerCase()} {activity.field || ''}
                                                </span>
                                                <span className="text-gray-400">•</span>
                                                <div className="flex items-center gap-1.5 text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-lg text-sm">
                                                    <Box className="w-3.5 h-3.5" />
                                                    {activeTab === 'containers' 
                                                        ? activity.container?.containerCode 
                                                        : activity.loadingSheet?.container?.containerCode}
                                                </div>
                                                {activeTab === 'sheets' && activity.loadingSheet?.shippingMark && (
                                                    <div className="flex items-center gap-1.5 text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-lg text-sm">
                                                        <FileText className="w-3.5 h-3.5" />
                                                        {activity.loadingSheet.shippingMark}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {activity.oldValue !== null && (
                                                    <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                                                        <div className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Before</div>
                                                        <div className="text-gray-700 font-medium">
                                                            {formatValue(activity.oldValue, activity.field)}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                                    <div className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-1">
                                                        {activity.type === 'CREATE' ? 'Initial Value' : 'After'}
                                                    </div>
                                                    <div className="text-gray-900 font-bold">
                                                        {formatValue(activity.newValue, activity.field)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2 text-gray-900 font-semibold bg-gray-100 px-3 py-1.5 rounded-xl">
                                            <User className="w-4 h-4 text-gray-500" />
                                            {activity.user?.name}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="w-4 h-4" />
                                            {format(new Date(activity.createdAt), 'MMM d, yyyy • hh:mm a')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="p-4 bg-gray-50 rounded-full mb-4">
                            <History className="w-12 h-12 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-500 italic">No activity logs found matching your criteria</h3>
                        <p className="text-gray-400 mt-1">Try adjusting your filters or search term</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between">
                    <p className="text-sm text-gray-500 font-medium">
                        Showing page <span className="text-gray-900 font-bold">{pagination.page}</span> of <span className="text-gray-900 font-bold">{pagination.totalPages}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchActivities(pagination.page - 1)}
                            disabled={pagination.page <= 1 || loading}
                            className="p-2 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(pagination.totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => fetchActivities(i + 1)}
                                    className={`w-10 h-10 rounded-xl font-bold transition-all ${
                                        pagination.page === i + 1 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'hover:bg-gray-100 text-gray-500'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => fetchActivities(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages || loading}
                            className="p-2 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoadingActivitiesPage;
