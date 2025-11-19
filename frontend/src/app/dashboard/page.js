"use client";
import React from "react";
import {
  Ship,
  Box,
  CreditCard,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  Calendar,
  Activity,
  Plus,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Divide,
  ArrowRight,
  Users,
  Warehouse,
  BarChart3,
  Zap,
} from "lucide-react";

/* ------------------- MOCK DATA ------------------- */
const statusMap = {
  IN_TRANSIT: {
    label: "In Transit",
    classes: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Truck,
    color: "#f59e0b",
  },
  ARRIVED: {
    label: "Arrived",
    classes: "bg-rose-100 text-rose-700 border-rose-200",
    icon: MapPin,
    color: "#f43f5e",
  },
  WAREHOUSE: {
    label: "In Warehouse",
    classes: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: Box,
    color: "#6366f1",
  },
  AVAILABLE: {
    label: "Available",
    classes: "bg-teal-100 text-teal-700 border-teal-200",
    icon: CheckCircle,
    color: "#14b8a6",
  },
  COMPLETED: {
    label: "Completed",
    classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle,
    color: "#059669",
  },
  OVERDUE: {
    label: "Overdue",
    classes: "bg-red-100 text-red-700 border-red-200",
    icon: Clock,
    color: "#ef4444",
  },
  PENDING: {
    label: "Pending",
    classes: "bg-amber-100 text-amber-700 border-amber-200",
    icon: CreditCard,
    color: "#f59e0b",
  },
  PAID: {
    label: "Paid",
    classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle,
    color: "#10b981",
  },
  OUT_OF_STOCK: {
    label: "Out of Stock",
    classes: "bg-red-100 text-red-700 border-red-200",
    icon: AlertTriangle,
    color: "#ef4444",
  },
};

const dashboardData = {
  stats: [
    {
      title: "Total Shipments",
      value: "64",
      change: "+12%",
      trend: "up",
      icon: Ship, // This is the actual icon component
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
    },
    {
      title: "Inventory Units",
      value: "45.8K",
      change: "+5%",
      trend: "up",
      icon: Box,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
    {
      title: "Overdue Invoices",
      value: "4",
      change: "-2",
      trend: "down",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    {
      title: "Revenue YTD",
      value: "₹4.5Cr",
      change: "+18%",
      trend: "up",
      icon: TrendingUp,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
  ],
  operationalFunnel: [
    { status: "IN_TRANSIT", count: 18 },
    { status: "ARRIVED", count: 5 },
    { status: "WAREHOUSE", count: 22 },
    { status: "AVAILABLE", count: 14 },
    { status: "COMPLETED", count: 5 },
  ],
  financialSummary: {
    totalReceivable: "₹1.25 Cr",
    counts: [
      { status: "PAID", count: 25 },
      { status: "PENDING", count: 9 },
      { status: "OVERDUE", count: 4 },
    ],
  },
  inventoryHealth: [
    {
      itemName: "LED Strip Lights",
      stock: 5,
      min: 10,
      status: "OUT_OF_STOCK",
      urgency: "high",
    },
    {
      itemName: "Folding Chair Assy",
      stock: 15,
      min: 20,
      status: "LOW_STOCK",
      urgency: "medium",
    },
    {
      itemName: "Table Runner Pro",
      stock: 0,
      min: 5,
      status: "OUT_OF_STOCK",
      urgency: "high",
    },
    {
      itemName: "Glass Decor Items",
      stock: 8,
      min: 15,
      status: "LOW_STOCK",
      urgency: "medium",
    },
  ],
  recentActivity: [
    {
      id: 1,
      action: "New Sheet PSDH-91 created",
      module: "LoadingSheet",
      user: "Admin User",
      time: "5 minutes ago",
      icon: Ship,
      status: "IN_TRANSIT",
    },
    {
      id: 2,
      action: "Invoice #INV-204 marked OVERDUE",
      module: "Invoice",
      user: "System",
      time: "1 hour ago",
      icon: CreditCard,
      status: "OVERDUE",
    },
    {
      id: 3,
      action: "100 units moved OUTWARD",
      module: "StockMovement",
      user: "Warehouse Mgr",
      time: "2 hours ago",
      icon: Truck,
      status: "WAREHOUSE",
    },
    {
      id: 4,
      action: "Bifurcation #12 PENDING approval",
      module: "Bifurcation",
      user: "Sales",
      time: "1 day ago",
      icon: Divide,
      status: "PENDING",
    },
    {
      id: 5,
      action: "Stock alert: LED Strips low",
      module: "Inventory",
      user: "System",
      time: "1 day ago",
      icon: AlertTriangle,
      status: "OUT_OF_STOCK",
    },
  ],
};

const mockUser = { name: "Operations Manager", role: "Admin" };

/* ------------------- HELPER COMPONENTS ------------------- */
const StatusTag = ({ status }) => {
  const meta = statusMap[status] || {
    label: status,
    classes: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Box,
  };
  const IconComponent = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.classes}`}
    >
      <IconComponent className="w-3 h-3" />
      <span>{meta.label}</span>
    </span>
  );
};

// FIXED: StatCard component with proper Icon handling
const StatCard = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  bgColor,
  borderColor,
}) => (
  <div
    className={`bg-white rounded-2xl p-6 border ${borderColor} shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 group`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {title}
        </p>
        <div className="flex items-end gap-2 mt-2">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <span
            className={`text-sm font-semibold ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            {change}
          </span>
        </div>
      </div>
      <div
        className={`rounded-2xl ${bgColor} p-3 group-hover:scale-110 transition-transform duration-300`}
      >
        {Icon && <Icon className={`w-6 h-6 ${color}`} />}
      </div>
    </div>
  </div>
);

const ActivityItem = ({ action, user, time, icon: Icon, status }) => {
  const meta = statusMap[status] || statusMap["IN_TRANSIT"];
  return (
    <li className="flex items-center gap-4 p-4 hover:bg-gray-50/50 rounded-xl transition-all duration-200 group">
      <div
        className={`p-2 rounded-lg ${
          meta.classes.split(" ")[0]
        } bg-opacity-20 group-hover:scale-110 transition-transform duration-200`}
      >
        {Icon && <Icon className={`w-4 h-4 ${meta.classes.split(" ")[1]}`} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{action}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          by {user} · {time}
        </p>
      </div>
      <StatusTag status={status} />
    </li>
  );
};

/* ------------------- MAIN COMPONENT ------------------- */
export default function ModernERPDashboard() {
  const user = mockUser;

  const navigateTo = (path) => console.log(`Navigating to: ${path}`);

  // Modern Operational Funnel with improved design
  const OperationalFunnel = ({ data }) => {
    const maxCount = Math.max(...data.map((d) => d.count));

    return (
      <div className="space-y-4">
        {data.map((d) => {
          const meta = statusMap[d.status];
          const widthPercent = (d.count / maxCount) * 85; // Cap at 85% for better visual

          return (
            <div key={d.status} className="flex items-center gap-4 group">
              <div className="w-28 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full`}
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {meta.label}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      style={{ width: `${widthPercent}%` }}
                      className={`h-full rounded-full transition-all duration-1000 group-hover:scale-105`}
                    />
                  </div>
                  <div className="w-12 text-right">
                    <span className="text-sm font-bold text-gray-900">
                      {d.count}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Modern Financial Chart
  const FinancialStatusChart = ({ data }) => {
    const total = data.counts.reduce((sum, item) => sum + item.count, 0);
    let cumulativePercentage = 0;

    const conicStyle = data.counts
      .map((item) => {
        const percentage = item.count / total;
        const start = cumulativePercentage;
        cumulativePercentage += percentage;
        return `${statusMap[item.status].color} ${start * 360}deg ${
          cumulativePercentage * 360
        }deg`;
      })
      .join(", ");

    return (
      <div className="flex items-center gap-8">
        <div className="relative">
          <div
            className="w-32 h-32 rounded-full"
            style={{
              background: `conic-gradient(${conicStyle})`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          <div className="absolute inset-4 bg-white rounded-full shadow-inner flex items-center justify-center">
            <span className="text-lg font-bold text-gray-700">{total}</span>
          </div>
        </div>

        <div className="space-y-3 flex-1">
          {data.counts.map((item) => {
            const meta = statusMap[item.status];
            const percentage = ((item.count / total) * 100).toFixed(0);

            return (
              <div
                key={item.status}
                className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl hover:bg-white transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {meta.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    {item.count}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Operations Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back,{" "}
                  <span className="font-semibold text-gray-700">
                    {user.name}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-blue-700">
                  System Online
                </span>
              </div>

              <button
                onClick={() => console.log("Refresh data")}
                className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1. KPI STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {dashboardData.stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              trend={stat.trend}
              icon={stat.icon} // Pass the actual icon component
              color={stat.color}
              bgColor={stat.bgColor}
              borderColor={stat.borderColor}
            />
          ))}
        </div>

        {/* 2. MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Operational Funnel - 2/3 width */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50">
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Ship className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Operational Funnel
                    </h3>
                    <p className="text-sm text-gray-500">
                      Shipment status breakdown
                    </p>
                  </div>
                </div>
                <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1">
                  View Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <OperationalFunnel data={dashboardData.operationalFunnel} />
            </div>
          </div>

          {/* Quick Actions & Activity - 1/3 width */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigateTo("add_loading_sheet")}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl flex items-center justify-between hover:shadow-lg transition-all duration-200 hover:scale-105 group"
                >
                  <span className="font-semibold">New Loading Sheet</span>
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>

                {["Loading Sheets", "Manage Invoices", "Warehouse"].map(
                  (item, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        navigateTo(item.toLowerCase().replace(" ", "_"))
                      }
                      className="w-full py-3 px-4 bg-gray-50 text-gray-700 rounded-xl flex items-center justify-between hover:bg-white hover:shadow-md transition-all duration-200 border border-gray-200/50"
                    >
                      <span className="font-medium">{item}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50">
              <div className="p-6 border-b border-gray-200/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    Recent Activity
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {dashboardData.recentActivity.length} items
                  </span>
                </div>
              </div>
              <ul className="divide-y divide-gray-200/50 max-h-80 overflow-y-auto">
                {dashboardData.recentActivity.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    action={activity.action}
                    user={activity.user}
                    time={activity.time}
                    icon={activity.icon}
                    status={activity.status}
                  />
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 3. FINANCIAL & INVENTORY ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Financial Summary */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50">
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Financial Summary
                    </h3>
                    <p className="text-sm text-gray-500">
                      Invoice status overview
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-gray-900">
                  {dashboardData.financialSummary.totalReceivable}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Total Receivable
                </div>
              </div>
              <FinancialStatusChart data={dashboardData.financialSummary} />
            </div>
          </div>

          {/* Inventory Health */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-200/50">
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Inventory Alerts
                    </h3>
                    <p className="text-sm text-gray-500">
                      Items below minimum stock levels
                    </p>
                  </div>
                </div>
                <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-medium border border-red-200">
                  {dashboardData.inventoryHealth.length} Alerts
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.inventoryHealth.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200/50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-xl ${
                          item.urgency === "high"
                            ? "bg-red-100 text-red-600"
                            : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {item.itemName}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Minimum: {item.min} units
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          item.urgency === "high"
                            ? "text-red-600"
                            : "text-amber-600"
                        }`}
                      >
                        {item.stock} units
                      </div>
                      <div className="text-xs text-gray-500">remaining</div>
                    </div>
                  </div>
                ))}
              </div>

              {dashboardData.inventoryHealth.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-500">All stock levels are healthy!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
