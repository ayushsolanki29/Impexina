"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import { toast } from 'sonner';
import {
  Loader2, ArrowLeft, History, Calendar,
  User, ChevronLeft, ChevronRight, Search,
  Filter, RefreshCw, FileText, Package,
  Edit, CheckCircle, XCircle, Clock, Palette
} from 'lucide-react';

const TYPE_LABELS = {
  'CREATED': { label: 'Created', icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-200' },
  'UPDATED': { label: 'Updated', icon: Edit, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'STATUS_CHANGE': { label: 'Status Changed', icon: Clock, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  'DELETED': { label: 'Deleted', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
  'CONTAINER_ADDED': { label: 'Container Added', icon: Package, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'CONTAINER_REMOVED': { label: 'Container Removed', icon: Package, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  'THEME_UPDATED': { label: 'Theme Updated', icon: Palette, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
};

export default function ContainerSummaryAuditLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSummary, setSelectedSummary] = useState('');
  const [summaries, setSummaries] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all summaries for filter
  const fetchSummaries = async () => {
    try {
      const response = await API.get("/container-summaries", { limit: 100 });
      if (response.data.success) {
        setSummaries(response.data.data.summaries || []);
      }
    } catch (error) {
      console.error("Error fetching summaries:", error);
    }
  };

  const fetchActivities = useCallback(async (page = 1) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: 50,
        ...(selectedType && { type: selectedType }),
        ...(selectedSummary && { summaryId: selectedSummary }),
        ...(searchTerm && { search: searchTerm }),
      };

      const res = await API.get('/container-summaries/activities/all', params);

      if (res.data.success) {
        setActivities(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedSummary, searchTerm]);

  useEffect(() => {
    fetchSummaries();
  }, []);

  useEffect(() => {
    if (summaries.length > 0) {
      fetchActivities(1);
    }
  }, [summaries, fetchActivities]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchActivities(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getTypeInfo = (type) => {
    return TYPE_LABELS[type] || { label: type, icon: Clock, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === 'null') {
      return <span className="text-slate-400 italic text-[10px] uppercase font-bold tracking-widest">Empty</span>;
    }
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-2 py-1">
          {value.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.1)]" style={{ backgroundColor: item.color }} />
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">{item.role || item.field}</span>
            </div>
          ))}
        </div>
      );
    }
    if (typeof value === 'object') {
      return (
        <div className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1.5 py-1">
          {Object.entries(value).map(([key, val]) => (
            <React.Fragment key={key}>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] text-right">{key}</span>
              <span className="text-[10px] font-bold text-slate-800 tabular-nums">
                {typeof val === 'number' && key.toLowerCase().includes('amount') ? `₹${val.toLocaleString()}` : String(val)}
              </span>
            </React.Fragment>
          ))}
        </div>
      );
    }
    return <span className="text-[10px] font-bold text-slate-800">{String(value)}</span>;
  };

  return (
    <div className="p-4 2xl:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/container-summary")}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <History className="w-6 h-6 text-indigo-600" />
                Container Summary Audit Logs
              </h1>
              <p className="text-slate-500 text-sm mt-1">Complete audit trail of all changes made to container summaries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={() => fetchActivities(pagination.page)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by user, field, or summary..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              >
                <option value="">All Types</option>
                {Object.keys(TYPE_LABELS).map(type => (
                  <option key={type} value={type}>{TYPE_LABELS[type].label}</option>
                ))}
              </select>

              <select
                value={selectedSummary}
                onChange={(e) => setSelectedSummary(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              >
                <option value="">All Summaries</option>
                {summaries.map(summary => (
                  <option key={summary.id} value={summary.id}>{summary.month}</option>
                ))}
              </select>

            </div>
            {(searchTerm || selectedType || selectedSummary) && (
              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('');
                    setSelectedSummary('');
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Audit Logs List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No audit logs found</p>
              <p className="text-sm mt-1">Audit logs will appear here as changes are made</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {activities.map((activity) => {
                  const typeInfo = getTypeInfo(activity.type);
                  const TypeIcon = typeInfo.icon;

                  return (
                    <div key={activity.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl border ${typeInfo.color} flex-shrink-0`}>
                          <TypeIcon className="w-6 h-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-semibold border ${typeInfo.color}`}>
                                  {typeInfo.label}
                                </span>
                                {(activity.summaryMonth || (activity.summary && activity.summary.month)) && (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                    {activity.summaryMonth || activity.summary.month}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <span className="font-medium text-slate-900">
                                    {activity.user?.name || 'Unknown User'}
                                  </span>
                                  {activity.user?.role && (
                                    <span className="text-slate-400">• {activity.user.role}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatDate(activity.createdAt)}</span>
                                </div>
                              </div>

                              {activity.description && (
                                <p className="text-sm text-slate-900 mb-2 font-medium">
                                  {activity.description}
                                </p>
                              )}

                              {activity.note && (
                                <p className="text-sm text-slate-600 mb-2">
                                  <span className="font-medium">Note:</span> {activity.note}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Field Changes */}
                          {(activity.field || activity.oldValue !== undefined || activity.newValue !== undefined) && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {activity.field && (
                                  <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                                      Field
                                    </label>
                                    <div className="text-sm font-medium text-slate-900 bg-slate-50 p-2 rounded">
                                      {activity.field}
                                    </div>
                                  </div>
                                )}
                                {activity.oldValue !== undefined && (
                                  <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                                      Old Value
                                    </label>
                                    <div className="text-sm text-slate-700 bg-red-50 p-2 rounded border border-red-200">
                                      {formatValue(activity.oldValue)}
                                    </div>
                                  </div>
                                )}
                                {activity.newValue !== undefined && (
                                  <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                                      New Value
                                    </label>
                                    <div className="text-sm text-slate-700 bg-green-50 p-2 rounded border border-green-200">
                                      {formatValue(activity.newValue)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          {(activity.ipAddress || activity.userAgent) && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <details className="text-xs">
                                <summary className="cursor-pointer text-slate-600 hover:text-slate-900 font-medium">
                                  View Technical Details
                                </summary>
                                <div className="mt-2 p-3 bg-slate-50 rounded-lg space-y-1">
                                  {activity.ipAddress && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-600">IP Address:</span>
                                      <span className="text-slate-900 font-medium">{activity.ipAddress}</span>
                                    </div>
                                  )}
                                  {activity.userAgent && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-600">User Agent:</span>
                                      <span className="text-slate-900 font-medium text-xs">{activity.userAgent}</span>
                                    </div>
                                  )}
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Showing {((pagination.page - 1) * 50) + 1} to {Math.min(pagination.page * 50, pagination.total)} of {pagination.total} audit logs
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 text-sm text-slate-600 font-medium">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    </div>
  );
}
