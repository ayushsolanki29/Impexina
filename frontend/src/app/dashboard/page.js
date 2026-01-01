"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Package,
  Clock,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  Ship,
  Calendar,
  ArrowRight,
  DollarSign,
  Activity,
  Users,
  Briefcase,
  Box,
  Target,
  Loader2,
  TrendingDown,
  User,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Toaster } from "sonner";
import API from "@/lib/api"; // Your API helper

// --- Constants ---
const COLORS = [
  "#4F46E5",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

export default function AdvancedDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Loading Logic ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all dashboard data in parallel
        const [
          overviewRes,
          monthlyStatsRes,
          quickStatsRes,
          upcomingRes,
          userPerformanceRes,
        ] = await Promise.allSettled([
          API.get("/dashboard/overview"),
          API.get("/dashboard/monthly-stats"),
          API.get("/dashboard/quick-stats"),
          API.get("/dashboard/upcoming-deadlines"),
          API.get("/dashboard/user-performance"),
        ]);

        const data = {
          overview:
            overviewRes.status === "fulfilled"
              ? overviewRes.value.data?.data
              : null,
          monthlyStats:
            monthlyStatsRes.status === "fulfilled"
              ? monthlyStatsRes.value.data?.data
              : null,
          quickStats:
            quickStatsRes.status === "fulfilled"
              ? quickStatsRes.value.data?.data
              : null,
          upcoming:
            upcomingRes.status === "fulfilled"
              ? upcomingRes.value.data?.data
              : null,
          userPerformance:
            userPerformanceRes.status === "fulfilled"
              ? userPerformanceRes.value.data?.data
              : null,
        };

        setDashboardData(data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- Computed Metrics ---
  const containerStats = useMemo(() => {
    if (!dashboardData?.overview) return null;

    const { orderStatus, activeContainers } = dashboardData.overview;
    const upcomingOrders = dashboardData.upcoming?.orders || [];
    const now = new Date();
    const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Calculate arriving soon (next 48 hours)
    const arrivingSoon = upcomingOrders.filter((o) => {
      if (!o.dates?.arrival) return false;
      const arrival = new Date(o.dates.arrival);
      return arrival >= now && arrival <= next48Hours;
    }).length;

    // Calculate arriving this week
    const arrivingThisWeek = upcomingOrders.filter((o) => {
      if (!o.dates?.arrival) return false;
      const arrival = new Date(o.dates.arrival);
      return arrival >= now && arrival <= next7Days;
    }).length;

    // Get total value from pending payments
    const totalValue = dashboardData.overview.summary?.pendingPayments || 0;

    return {
      arrivingSoon,
      arrivingThisWeek,
      totalValue,
      activeContainers: activeContainers || 0,
      statusCounts: {
        Loaded: orderStatus?.loaded || 0,
        Insea: orderStatus?.inTransit || 0,
        Delivered: orderStatus?.delivered || 0,
        Pending: orderStatus?.pending || 0,
      },
    };
  }, [dashboardData]);

  const taskStats = useMemo(() => {
    if (!dashboardData?.overview) return null;

    const { taskStatus, summary } = dashboardData.overview;
    const total = summary?.totalTasks || 0;
    const completed = taskStatus?.completed || 0;
    const pending = taskStatus?.pending || 0;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    // Use usage performance data for chart
    const employeeTaskData = (dashboardData.userPerformance || [])
      .slice(0, 4)
      .map((user) => ({
        name: user.name,
        tasks: user.tasks?.completed || 0,
      }));

    return {
      total,
      completed,
      pending,
      progress,
      chartData: employeeTaskData,
    };
  }, [dashboardData]);

  const financialData = useMemo(() => {
    if (!dashboardData?.monthlyStats?.orders) return [];

    // Use monthly order totals for financial data
    return dashboardData.monthlyStats.orders.slice(-7).map((item, index) => ({
      name: item.month?.substring(0, 3) || `Day ${index}`,
      value: item.total || 0,
    }));
  }, [dashboardData]);

  const recentOrders = useMemo(() => {
    if (!dashboardData?.overview?.recentData?.orders) return [];

    return dashboardData.overview.recentData.orders
      .slice(0, 6)
      .map((order) => ({
        id: order.id,
        containerCode: order.shippingMark || `ORD-${order.id}`,
        status: order.status,
        eta: order.arrivalDate,
        shippingLine: order.supplier || "N/A",
        totalDuty: order.totalAmount || 0,
        month: new Date(order.createdAt).toLocaleDateString("en-US", {
          month: "short",
        }),
      }));
  }, [dashboardData]);

  const priorityTasks = useMemo(() => {
    if (!dashboardData?.upcoming?.tasks) return [];

    return dashboardData.upcoming.tasks
      .filter((task) => task.priority === "HIGH")
      .slice(0, 4);
  }, [dashboardData]);

  const quickStats = useMemo(() => {
    if (!dashboardData?.quickStats) return null;

    const { orders, tasks, revenue, shipments } = dashboardData.quickStats;

    return {
      ordersToday: orders?.today || 0,
      ordersChange: parseFloat(orders?.change || 0),
      tasksToday: tasks?.today || 0,
      tasksChange: parseFloat(tasks?.change || 0),
      revenueToday: revenue?.today || 0,
      revenueChange: parseFloat(revenue?.change || 0),
      pendingShipments: shipments?.pending || 0,
      completedShipments: shipments?.completed || 0,
    };
  }, [dashboardData]);

  const userPerformance = useMemo(() => {
    if (!dashboardData?.userPerformance) return [];

    const raw = dashboardData.userPerformance;
    const list = Array.isArray(raw) ? raw : raw?.data ?? (raw ? [raw] : []);

    return list.slice(0, 5).map((user) => ({
      name: user.name,
      role: user.role,
      tasksCompleted: user.tasks?.completed || 0,
      tasksPending: user.tasks?.pending || 0,
      completionRate: parseFloat(user.tasks?.completionRate || 0),
      ordersCreated: user.orders?.total || 0,
      productivityScore: parseFloat(user.productivity?.score || 0),
    }));
  }, [dashboardData]);

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-600" />
        <p>Loading Dashboard...</p>
      </div>
    );

  if (error)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );

  if (!dashboardData) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6 pb-20">
      <Toaster position="top-right" />

      {/* --- Top Bar: Greeting & Context --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {(() => {
              const hour = new Date().getHours();
              if (hour < 12) return "Good Morning";
              if (hour < 18) return "Good Afternoon";
              return "Good Evening";
            })()}
            , {dashboardData.currentUser?.name || "Admin"}
          </h1>
          <p className="text-slate-500 mt-1">
            Here's what's happening with your logistics today.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 shadow-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* --- Quick Stats Row (Now Top) --- */}
      {quickStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Orders Today */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Orders Today
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {quickStats.ordersToday}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  quickStats.ordersChange >= 0
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <Box className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm">
              {quickStats.ordersChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`font-semibold ${
                  quickStats.ordersChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {Math.abs(quickStats.ordersChange)}%
              </span>
              <span className="text-slate-400 ml-1">vs yesterday</span>
            </div>
          </div>

          {/* Tasks Today */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Tasks Today
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {quickStats.tasksToday}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  quickStats.tasksChange >= 0
                    ? "bg-blue-50 text-blue-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <Target className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm">
              {quickStats.tasksChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-blue-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`font-semibold ${
                  quickStats.tasksChange >= 0
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
              >
                {Math.abs(quickStats.tasksChange)}%
              </span>
              <span className="text-slate-400 ml-1">vs yesterday</span>
            </div>
          </div>

          {/* Revenue Today */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Revenue Today
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  ₹{(quickStats.revenueToday / 1000).toFixed(1)}K
                </p>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  quickStats.revenueChange >= 0
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm">
              {quickStats.revenueChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`font-semibold ${
                  quickStats.revenueChange >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {Math.abs(quickStats.revenueChange)}%
              </span>
              <span className="text-slate-400 ml-1">vs yesterday</span>
            </div>
          </div>

          {/* Active Shipments */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active Shipments
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {quickStats.pendingShipments}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                <Ship className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-500 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                {quickStats.completedShipments} Done
              </span>
              <span>this month</span>
            </div>
          </div>
        </div>
      )}

      {/* --- Section: My Workspace (My Tasks & Efficiency) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Assigned Tasks - Premium Redesign */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-200">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              My Priority Tasks
            </h3>
            <button
              onClick={() => router.push("/dashboard/my-tasks")}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              View Board <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.myAssignedTasks?.length > 0 ? (
              dashboardData.myAssignedTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="group relative bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          task.priority === "HIGH"
                            ? "bg-rose-50 text-rose-600 ring-1 ring-rose-100"
                            : "bg-slate-50 text-slate-600 ring-1 ring-slate-100"
                        }`}
                      >
                        {task.priority || "NORMAL"}
                      </span>
                      <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {task.dueDate}
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors mb-2">
                       {task.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {task.description || "No additional details provided for this task."}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                     <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-500 transition-colors">
                        #TASK-{task.id}
                     </span>
                     <button 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-105 active:scale-95"
                     >
                        Mark Done
                     </button>
                  </div>
                </div>
              ))
            ) : (
                <div className="col-span-2 bg-white rounded-2xl border border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-slate-300" />
                    </div>
                    <h4 className="text-slate-900 font-semibold">All Caught Up!</h4>
                    <p className="text-slate-500 text-sm mt-1 max-w-xs">You have zero pending tasks. Enjoy your day or pick up something new.</p>
                </div>
            )}
            
            {/* Add New Task Placeholder Card */}
             {dashboardData.myAssignedTasks?.length > 0 && (
                <button 
                    onClick={() => router.push("/dashboard/tasks")}
                    className="group flex flex-col items-center justify-center p-5 rounded-2xl border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-300"
                >
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-indigo-100 text-slate-400 group-hover:text-indigo-600 flex items-center justify-center transition-colors mb-2">
                        <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-700">View All Tasks</span>
                </button>
             )}
          </div>
        </div>

        {/* System Efficiency Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
          <div className="relative z-10 text-center w-full">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-6">
              System Efficiency
            </h3>
            <div className="relative w-48 h-48 mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Done", value: 85 },
                      { name: "Remaining", value: 15 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={180}
                    endAngle={0}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/3 text-center">
                <span className="text-4xl font-bold text-slate-900 block">
                  85%
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Optimized
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-[-40px]">
              Operations are running smoothly. System load is within optimal
              range.
            </p>
          </div>
        </div>
      </div>

      {/* --- Section 1: High Priority Alerts (Arrivals) --- */}
      {containerStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Urgent Arrivals */}
          <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Ship className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-white/20 px-2 py-1 rounded text-xs font-semibold backdrop-blur-sm">
                    Logistics Alert
                  </span>
                  <span className="text-indigo-200 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ETA Updates
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-1">
                  {containerStats.arrivingSoon} Containers
                </h2>
                <p className="text-indigo-100 text-sm">
                  Arriving within the next 48 hours
                </p>
              </div>

              <div className="mt-6 flex gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 flex-1 border border-white/10">
                  <div className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">
                    This Week
                  </div>
                  <div className="text-xl font-bold">
                    {containerStats.arrivingThisWeek}{" "}
                    <span className="text-xs font-normal opacity-70">
                      Expected
                    </span>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 flex-1 border border-white/10">
                  <div className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">
                    In Transit
                  </div>
                  <div className="text-xl font-bold">
                    {containerStats.activeContainers}{" "}
                    <span className="text-xs font-normal opacity-70">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Quick View */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
                  Estimated Payables
                </h3>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  ₹{(containerStats.totalValue / 100000).toFixed(2)} L
                </div>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 min-h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorVal)"
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `₹${value.toLocaleString()}`,
                      "Value",
                    ]}
                    labelFormatter={(label) => `Week: ${label}`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-slate-400 text-center">
              7 Day Financial Trend
            </div>
          </div>
        </div>
      )}

      {/* --- Section 2: Detailed Grids --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Task Force (Employee Status) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-500" />
                Task Velocity
              </h3>
              {taskStats && (
                <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                  {taskStats.progress}% Done
                </span>
              )}
            </div>

            <div className="p-5">
              {/* Donut Chart for Tasks */}
              {taskStats && (
                <>
                  <div className="h-[180px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskStats.chartData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="tasks"
                        >
                          {taskStats.chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => [
                            `${value} tasks`,
                            props.payload.name,
                          ]}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-bold text-slate-800">
                        {taskStats.total}
                      </span>
                      <span className="text-xs text-slate-400 uppercase font-bold">
                        Tasks
                      </span>
                    </div>
                  </div>

                  {/* Today's Priority Tasks List */}
                  <div className="mt-6 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Priority Action Items
                    </h4>
                    {priorityTasks.length > 0 ? (
                      priorityTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer"
                          onClick={() => router.push("/dashboard/tasks")}
                        >
                          <div className="mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {task.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 flex justify-between">
                              <span>{task.assignee}</span>
                              <span className="text-red-500 font-medium">
                                High Priority
                              </span>
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-slate-400 text-sm">
                        No high priority tasks pending.
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => router.push("/dashboard/tasks")}
                    className="w-full mt-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    View Task Board <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Performance Widget */}
          {userPerformance.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-500" />
                Top Performers
              </h3>
              <div className="space-y-4">
                {userPerformance.map((user, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500">{user.role}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-800">
                        {user.completionRate}%
                      </div>
                      <div className="text-xs text-slate-400">Completion</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Operations (Orders Table) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                Live Orders
              </h3>
              <button
                onClick={() => router.push("/dashboard/orders")}
                className="text-xs font-medium text-slate-500 hover:text-indigo-600"
              >
                View All
              </button>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">ETA</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-3 font-medium text-slate-900">
                          {order.containerCode}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {order.month}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-3">
                          {order.eta ? (
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  new Date(order.eta) <=
                                  new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                    ? "text-red-600 font-bold"
                                    : ""
                                }
                              >
                                {new Date(order.eta).toLocaleDateString()}
                              </span>
                              {new Date(order.eta) <=
                                new Date(
                                  Date.now() + 2 * 24 * 60 * 60 * 1000
                                ) && (
                                <AlertCircle className="w-3 h-3 text-red-500" />
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-3">{order.shippingLine}</td>
                        <td className="px-6 py-3 text-right font-medium text-slate-900">
                          ₹{(order.totalDuty || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-8 text-center text-slate-400"
                      >
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p>No active orders found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Container Status Summary */}
          {containerStats && (
            <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-4">
                Container Status Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(containerStats.statusCounts).map(
                  ([status, count]) => (
                    <div
                      key={status}
                      className="text-center p-4 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <div className="text-2xl font-bold text-slate-900">
                        {count}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {status}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Components ---
function StatusBadge({ status }) {
  const statusMap = {
    PENDING: {
      color: "bg-amber-100 text-amber-700 border-amber-200",
      icon: Clock,
      label: "Pending",
    },
    LOADED: {
      color: "bg-blue-100 text-blue-700 border-blue-200",
      icon: Ship,
      label: "Loaded",
    },
    IN_TRANSIT: {
      color: "bg-indigo-100 text-indigo-700 border-indigo-200",
      icon: Ship,
      label: "In Transit",
    },
    ARRIVED: {
      color: "bg-purple-100 text-purple-700 border-purple-200",
      icon: Package,
      label: "Arrived",
    },
    DELIVERED: {
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      label: "Delivered",
    },
    COMPLETED: {
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      label: "Completed",
    },
    FAILED: {
      color: "bg-red-100 text-red-700 border-red-200",
      icon: AlertTriangle,
      label: "Failed",
    },
  };

  const config = statusMap[status] || {
    color: "bg-slate-100 text-slate-600 border-slate-200",
    icon: Package,
    label: status,
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
