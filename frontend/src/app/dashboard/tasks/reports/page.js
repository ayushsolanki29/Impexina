"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Users,
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Filter,
  Download,
  User,
  Target,
  Award,
  Repeat,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function TaskReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("performance");
  
  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [period, setPeriod] = useState("weekly");
  
  // Data
  const [users, setUsers] = useState([]);
  const [performanceData, setPerformanceData] = useState({ users: [], overallStats: {} });
  const [summaryData, setSummaryData] = useState({ data: [] });
  const [completions, setCompletions] = useState([]);
  const [completionsPagination, setCompletionsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  // Load users for filter
  const loadUsers = useCallback(async () => {
    try {
      const response = await API.get("/tasks/assignable-users");
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }, []);

  // Load performance data
  const loadPerformance = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(selectedUser !== "ALL" && { userId: selectedUser }),
      };

      const response = await API.get("/tasks/admin/performance", { params });
      if (response.data.success) {
        setPerformanceData(response.data.data);
      }
    } catch (error) {
      console.error("Error loading performance:", error);
      toast.error("Failed to load performance data");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, selectedUser]);

  // Load summary data
  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        period,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      };

      const response = await API.get("/tasks/admin/performance-summary", { params });
      if (response.data.success) {
        setSummaryData(response.data.data);
      }
    } catch (error) {
      console.error("Error loading summary:", error);
      toast.error("Failed to load summary data");
    } finally {
      setLoading(false);
    }
  }, [period, dateFrom, dateTo]);

  // Load completions
  const loadCompletions = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(selectedUser !== "ALL" && { userId: selectedUser }),
      };

      const response = await API.get("/tasks/admin/completions", { params });
      if (response.data.success) {
        setCompletions(response.data.data.completions);
        setCompletionsPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error("Error loading completions:", error);
      toast.error("Failed to load completions");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, selectedUser]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (activeTab === "performance") {
      loadPerformance();
    } else if (activeTab === "summary") {
      loadSummary();
    } else if (activeTab === "history") {
      loadCompletions();
    }
  }, [activeTab, loadPerformance, loadSummary, loadCompletions]);

  const applyFilters = () => {
    if (activeTab === "performance") {
      loadPerformance();
    } else if (activeTab === "summary") {
      loadSummary();
    } else if (activeTab === "history") {
      loadCompletions(1);
    }
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedUser("ALL");
  };

  // Quick date filters
  const setQuickDateRange = (range) => {
    const now = new Date();
    let start = new Date();
    
    switch (range) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        start.setMonth(now.getMonth() - 3);
        break;
      default:
        return;
    }
    
    setDateFrom(start.toISOString().split("T")[0]);
    setDateTo(now.toISOString().split("T")[0]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScheduleBadgeColor = (schedule) => {
    switch (schedule) {
      case "DAILY":
        return "bg-blue-100 text-blue-700";
      case "WEEKLY":
        return "bg-purple-100 text-purple-700";
      case "MONTHLY":
        return "bg-indigo-100 text-indigo-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-700";
      case "EMPLOYEE":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard/tasks")}
                className="hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                  Performance Reports
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  Track team performance and task completion metrics
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={applyFilters}
              className="border-slate-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{performanceData.overallStats?.totalUsers || 0}</p>
                <p className="text-xs text-slate-500">Active Users</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{performanceData.overallStats?.totalCompletions || 0}</p>
                <p className="text-xs text-slate-500">Total Completions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{performanceData.overallStats?.totalOnTime || 0}</p>
                <p className="text-xs text-slate-500">On Time</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{performanceData.overallStats?.totalLate || 0}</p>
                <p className="text-xs text-slate-500">Late</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{performanceData.overallStats?.averageOnTimeRate || 0}%</p>
                <p className="text-xs text-slate-500">Avg On-Time Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col gap-4">
            {/* Quick Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Quick:</span>
              <div className="flex gap-2">
                {[
                  { label: "Today", value: "today" },
                  { label: "Last 7 Days", value: "week" },
                  { label: "Last Month", value: "month" },
                  { label: "Last Quarter", value: "quarter" },
                ].map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => setQuickDateRange(btn.value)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} (@{user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
              <Button onClick={applyFilters} className="bg-indigo-600 hover:bg-indigo-700">
                <Filter className="w-4 h-4 mr-2" />
                Apply
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1">
            <TabsTrigger value="performance" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              User Performance
            </TabsTrigger>
            <TabsTrigger value="summary" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Period Summary
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-2" />
              Completion History
            </TabsTrigger>
          </TabsList>

          {/* User Performance Tab */}
          <TabsContent value="performance">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : performanceData.users?.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900">No data found</h3>
                  <p className="text-slate-500">Try adjusting your filters</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">User</TableHead>
                      <TableHead className="text-center">Assigned</TableHead>
                      <TableHead className="text-center">Completed</TableHead>
                      <TableHead className="text-center">On Time</TableHead>
                      <TableHead className="text-center">Late</TableHead>
                      <TableHead className="text-center">On-Time Rate</TableHead>
                      <TableHead className="text-center">Daily</TableHead>
                      <TableHead className="text-center">Weekly</TableHead>
                      <TableHead className="text-center">Monthly</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceData.users?.map((item) => (
                      <TableRow key={item.user.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-slate-600">
                                {item.user.name?.charAt(0)?.toUpperCase() || "U"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{item.user.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">@{item.user.username}</span>
                                <Badge className={`text-xs ${getRoleBadgeColor(item.user.role)}`}>
                                  {item.user.role}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{item.stats.totalAssignments}</TableCell>
                        <TableCell className="text-center font-medium text-emerald-600">{item.stats.totalCompletions}</TableCell>
                        <TableCell className="text-center font-medium text-green-600">{item.stats.onTimeCompletions}</TableCell>
                        <TableCell className="text-center font-medium text-red-600">{item.stats.lateCompletions}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.stats.onTimeRate >= 80
                                    ? "bg-emerald-500"
                                    : item.stats.onTimeRate >= 50
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${item.stats.onTimeRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{item.stats.onTimeRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-blue-100 text-blue-700">{item.stats.dailyCompletions}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-purple-100 text-purple-700">{item.stats.weeklyCompletions}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-indigo-100 text-indigo-700">{item.stats.monthlyCompletions}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Period Summary Tab */}
          <TabsContent value="summary">
            <div className="space-y-4">
              {/* Period Selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600">View by:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPeriod("weekly")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      period === "weekly"
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setPeriod("monthly")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      period === "monthly"
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                ) : summaryData.data?.length === 0 ? (
                  <div className="text-center py-16">
                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900">No data found</h3>
                    <p className="text-slate-500">Try adjusting your filters</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Period</TableHead>
                        <TableHead className="text-center">Total Completions</TableHead>
                        <TableHead className="text-center">On Time</TableHead>
                        <TableHead className="text-center">Late</TableHead>
                        <TableHead className="text-center">Active Users</TableHead>
                        <TableHead className="text-center">On-Time Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summaryData.data?.map((item, index) => (
                        <TableRow key={index} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {period === "weekly" ? (
                                <Calendar className="w-4 h-4 text-purple-500" />
                              ) : (
                                <Repeat className="w-4 h-4 text-indigo-500" />
                              )}
                              <span className="font-medium text-slate-900">{item.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">{item.totalCompletions}</TableCell>
                          <TableCell className="text-center font-medium text-green-600">{item.onTimeCompletions}</TableCell>
                          <TableCell className="text-center font-medium text-red-600">{item.lateCompletions}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{item.activeUsers}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    item.onTimeRate >= 80
                                      ? "bg-emerald-500"
                                      : item.onTimeRate >= 50
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${item.onTimeRate}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{item.onTimeRate}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Completion History Tab - Grouped by User */}
          <TabsContent value="history">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : completions.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm text-center py-16">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">No completions found</h3>
                <p className="text-slate-500">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Group completions by user */}
                {(() => {
                  const groupedByUser = completions.reduce((acc, completion) => {
                    const userId = completion.completedBy?.id;
                    if (!acc[userId]) {
                      acc[userId] = {
                        user: completion.completedBy,
                        completions: [],
                        onTime: 0,
                        late: 0,
                      };
                    }
                    acc[userId].completions.push(completion);
                    if (completion.isOnTime) {
                      acc[userId].onTime++;
                    } else {
                      acc[userId].late++;
                    }
                    return acc;
                  }, {});

                  return Object.values(groupedByUser).map((group) => (
                    <div key={group.user?.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      {/* User Header */}
                      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-lg font-bold text-indigo-600">
                                {group.user?.name?.charAt(0)?.toUpperCase() || "U"}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{group.user?.name}</h3>
                              <p className="text-sm text-slate-500">@{group.user?.username}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-slate-900">{group.completions.length}</p>
                              <p className="text-xs text-slate-500">Total</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-emerald-600">{group.onTime}</p>
                              <p className="text-xs text-slate-500">On Time</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-red-600">{group.late}</p>
                              <p className="text-xs text-slate-500">Late</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      group.completions.length > 0 && (group.onTime / group.completions.length) * 100 >= 80
                                        ? "bg-emerald-500"
                                        : (group.onTime / group.completions.length) * 100 >= 50
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{ width: `${group.completions.length > 0 ? (group.onTime / group.completions.length) * 100 : 0}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold">
                                  {group.completions.length > 0 ? Math.round((group.onTime / group.completions.length) * 100) : 0}%
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">Rate</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* User's Completions */}
                      <div className="divide-y divide-slate-100">
                        {group.completions.map((completion) => (
                          <div key={completion.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-medium text-slate-900">{completion.assignment?.title}</h4>
                                  <Badge className={getScheduleBadgeColor(completion.assignment?.scheduleType)}>
                                    {completion.assignment?.scheduleType?.replace(/_/g, " ")}
                                  </Badge>
                                  {completion.assignment?.category && (
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                      {completion.assignment.category}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border-l-4 border-slate-300">
                                  "{completion.completionNote}"
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="mb-2">
                                  {completion.isOnTime ? (
                                    <Badge className="bg-emerald-100 text-emerald-700">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      On Time
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-700">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Late
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">
                                  {new Date(completion.completedAt).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {new Date(completion.completedAt).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}

                {/* Pagination */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                      Showing {(completionsPagination.page - 1) * completionsPagination.limit + 1} to{" "}
                      {Math.min(completionsPagination.page * completionsPagination.limit, completionsPagination.total)} of{" "}
                      {completionsPagination.total} completions
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadCompletions(completionsPagination.page - 1)}
                        disabled={completionsPagination.page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadCompletions(completionsPagination.page + 1)}
                        disabled={completionsPagination.page >= completionsPagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
