"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import { toast } from 'sonner';
import { 
  Loader2, ArrowLeft, History, Calendar, 
  Search, Filter, ChevronLeft, ChevronRight,
  Package, Ship, FileText, Container, Box,
  User, Clock, CheckCircle, XCircle, Edit,
  Eye, Download, RefreshCw, X
} from 'lucide-react';

const MODULE_LABELS = {
  'container-summary': { label: 'Container Summary', icon: Package, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'bifurcation': { label: 'Bifurcation', icon: FileText, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  'loading': { label: 'Loading Sheet', icon: Ship, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'containers': { label: 'Containers', icon: Container, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  'warehouse': { label: 'Warehouse', icon: Box, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  'packing': { label: 'Packing List', icon: Package, color: 'bg-pink-100 text-pink-700 border-pink-200' },
  'invoice': { label: 'Invoice', icon: FileText, color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  'clients': { label: 'Clients', icon: User, color: 'bg-violet-100 text-violet-700 border-violet-200' },
};

const TYPE_LABELS = {
  'CREATE': { label: 'Created', icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-200' },
  'CREATED': { label: 'Created', icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-200' },
  'UPDATE': { label: 'Updated', icon: Edit, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'UPDATED': { label: 'Updated', icon: Edit, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'DELETE': { label: 'Deleted', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
  'DELETED': { label: 'Deleted', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
  'STATUS_CHANGE': { label: 'Status Changed', icon: Clock, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  'CONTAINER_ADDED': { label: 'Container Added', icon: Package, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'CONTAINER_REMOVED': { label: 'Container Removed', icon: Package, color: 'bg-amber-100 text-amber-700 border-amber-200' },
};

export default function ActivitiesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch users for dropdown
  const fetchUsers = async () => {
    try {
      const response = await API.get("/users", { limit: 1000 });
      if (response.data.success) {
        // Handle both paginated and non-paginated responses
        const usersData = response.data.data;
        if (Array.isArray(usersData)) {
          setUsers(usersData);
        } else if (usersData?.users && Array.isArray(usersData.users)) {
          setUsers(usersData.users);
        } else if (usersData?.data && Array.isArray(usersData.data)) {
          setUsers(usersData.data);
        } else {
          setUsers([]);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]); // Set empty array on error
    }
  };

  const fetchActivities = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedModule && { module: selectedModule }),
        ...(selectedType && { type: selectedType }),
        ...(selectedUserId && { userId: selectedUserId }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      
      const response = await API.get(`/dashboard/activities?${params.toString()}`);
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
  }, [searchTerm, selectedModule, selectedType, selectedUserId, startDate, endDate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchActivities(1);
  }, [fetchActivities]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchActivities(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedModule('');
    setSelectedType('');
    setSelectedUserId('');
    setStartDate('');
    setEndDate('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getModuleInfo = (module) => {
    return MODULE_LABELS[module] || { label: module, icon: Box, color: 'bg-slate-100 text-slate-700' };
  };

  const getTypeInfo = (type) => {
    return TYPE_LABELS[type] || { label: type, icon: Clock, color: 'bg-slate-100 text-slate-700' };
  };

  return (
    <div className="p-4 2xl:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
       
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <History className="w-6 h-6 text-indigo-600" />
                Recent Activities
              </h1>
              <p className="text-slate-500 text-sm mt-1">Detailed logs of all system activities</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              >
                <option value="">All Modules</option>
                {Object.keys(MODULE_LABELS).map(module => (
                  <option key={module} value={module}>{MODULE_LABELS[module].label}</option>
                ))}
              </select>

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
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              >
                <option value="">All Users</option>
                {Array.isArray(users) && users.map(user => (
                  <option key={user.id} value={user.id}>{user.name || user.username}</option>
                ))}
              </select>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start Date"
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              <div className="relative flex items-center gap-2">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End Date"
                  className="flex-1 pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                />
                {(searchTerm || selectedModule || selectedType || selectedUserId || startDate || endDate) && (
                  <button
                    onClick={clearFilters}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Clear all filters"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {(searchTerm || selectedModule || selectedType || selectedUserId || startDate || endDate) && (
              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-600 font-medium">Active Filters:</span>
                  {selectedModule && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                      Module: {MODULE_LABELS[selectedModule]?.label}
                    </span>
                  )}
                  {selectedType && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      Type: {TYPE_LABELS[selectedType]?.label}
                    </span>
                  )}
                  {selectedUserId && Array.isArray(users) && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      User: {users.find(u => u.id.toString() === selectedUserId)?.name || users.find(u => u.id.toString() === selectedUserId)?.username || 'Unknown'}
                    </span>
                  )}
                  {startDate && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                      From: {new Date(startDate).toLocaleDateString()}
                    </span>
                  )}
                  {endDate && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                      To: {new Date(endDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activities List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No activities found</p>
              <p className="text-sm mt-1">Activities will appear here as they occur</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {activities.map((activity) => {
                  const ModuleIcon = getModuleInfo(activity.module).icon;
                  const moduleInfo = getModuleInfo(activity.module);
                  const typeInfo = getTypeInfo(activity.type);
                  const TypeIcon = typeInfo.icon;

                  return (
                    <div key={activity.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-3 rounded-xl ${moduleInfo.color}`}>
                            <ModuleIcon className="w-6 h-6" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${moduleInfo.color}`}>
                                {moduleInfo.label}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${typeInfo.color} flex items-center gap-1`}>
                                <TypeIcon className="w-3 h-3" />
                                {typeInfo.label}
                              </span>
                            </div>
                            
                            <p className="text-sm font-medium text-slate-900 mb-2">
                              {activity.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span className="font-medium">{activity.user?.name || activity.user?.username || 'Unknown User'}</span>
                                {activity.user?.role && (
                                  <span className="text-slate-400">• {activity.user.role}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(activity.createdAt)}</span>
                              </div>
                              {activity.entityName && (
                                <div className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  <span className="font-medium">{activity.entityName}</span>
                                </div>
                              )}
                            </div>

                            {/* Metadata */}
                            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-100">
                                <details className="text-xs">
                                  <summary className="cursor-pointer text-slate-600 hover:text-slate-900 font-medium">
                                    View Details
                                  </summary>
                                  <div className="mt-2 p-3 bg-slate-50 rounded-lg space-y-1">
                                    {Object.entries(activity.metadata).map(([key, value]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                        <span className="text-slate-900 font-medium ml-2">
                                          {value === null || value === undefined ? (
                                            <span className="text-slate-400 italic">N/A</span>
                                          ) : (
                                            String(value)
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
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
                    Showing {((pagination.page - 1) * 50) + 1} to {Math.min(pagination.page * 50, pagination.total)} of {pagination.total} activities
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
