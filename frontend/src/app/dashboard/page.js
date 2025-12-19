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
  Briefcase
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
  Cell
} from "recharts";
import { Toaster } from "sonner";

// --- Constants & Mock Data (Replace with your actual imports/API calls) ---
const CONTAINER_KEY = "igpl_container_summary_v1";
const TASK_KEY_PREFIX = "igpl_tasks_";

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

export default function AdvancedDashboard() {
  const router = useRouter();
  const [containers, setContainers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Data Loading Logic ---
  useEffect(() => {
    // 1. Load Containers
    const rawContainers = JSON.parse(localStorage.getItem(CONTAINER_KEY) || "[]");
    const flatContainers = rawContainers.flatMap(summary => 
      (summary.containers || []).map(c => ({
        ...c,
        month: summary.month,
        summaryId: summary.id
      }))
    );
    setContainers(flatContainers);

    // 2. Load Tasks (Today's)
    const today = new Date().toISOString().split('T')[0];
    const todaysTasks = JSON.parse(localStorage.getItem(`${TASK_KEY_PREFIX}${today}`) || "[]");
    setTasks(todaysTasks);

    setLoading(false);
  }, []);

  // --- Computed Metrics ---
  const containerStats = useMemo(() => {
    const now = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(now.getDate() + 2);
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (6 - now.getDay()));

    let arrivingSoon = 0;
    let arrivingThisWeek = 0;
    let totalValue = 0;
    let statusCounts = { Loaded: 0, Insea: 0, Delivered: 0 };

    containers.forEach(c => {
      const eta = new Date(c.eta);
      if (eta >= now && eta <= twoDaysFromNow) arrivingSoon++;
      if (eta >= startOfWeek && eta <= endOfWeek) arrivingThisWeek++;
      
      totalValue += parseFloat(c.finalAmount || 0);
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });

    return { arrivingSoon, arrivingThisWeek, totalValue, statusCounts };
  }, [containers]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "Done").length;
    const pending = total - completed;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    // Group by Assignee for the chart
    const byEmployee = tasks.reduce((acc, t) => {
      acc[t.assignee] = (acc[t.assignee] || 0) + 1;
      return acc;
    }, {});
    
    const chartData = Object.keys(byEmployee).map(key => ({
      name: key,
      tasks: byEmployee[key]
    }));

    return { total, completed, pending, progress, chartData };
  }, [tasks]);

  const financialsData = [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 2000 },
    { name: 'Thu', value: 2780 },
    { name: 'Fri', value: 1890 },
    { name: 'Sat', value: 2390 },
    { name: 'Sun', value: 3490 },
  ];

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6 pb-20">
      <Toaster position="top-right" />

      {/* --- Top Bar --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Overview</h1>
          <p className="text-slate-500 text-sm">Real-time snapshot of logistics, finance, and operations.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 shadow-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* --- Section 1: High Priority Alerts (Arrivals) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Urgent Arrivals */}
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Ship className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 px-2 py-1 rounded text-xs font-semibold backdrop-blur-sm">Logistics Alert</span>
                <span className="text-indigo-200 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> ETA Updates</span>
              </div>
              <h2 className="text-3xl font-bold mb-1">{containerStats.arrivingSoon} Containers</h2>
              <p className="text-indigo-100 text-sm">Arriving within the next 48 hours</p>
            </div>
            
            <div className="mt-6 flex gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 flex-1 border border-white/10">
                <div className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">This Week</div>
                <div className="text-xl font-bold">{containerStats.arrivingThisWeek} <span className="text-xs font-normal opacity-70">Total</span></div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 flex-1 border border-white/10">
                <div className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">In Transit</div>
                <div className="text-xl font-bold">{containerStats.statusCounts.Insea || 0} <span className="text-xs font-normal opacity-70">Active</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Quick View (Accounts) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Estimated Payables</h3>
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
                <AreaChart data={financialsData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#10B981" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-slate-400 text-center">7 Day Projection based on ETA</div>
        </div>
      </div>

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
              <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-600">{taskStats.progress}% Done</span>
            </div>
            
            <div className="p-5">
              {/* Donut Chart for Tasks */}
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
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      />
                    </PieChart>
                 </ResponsiveContainer>
                 {/* Center Text */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-slate-800">{taskStats.total}</span>
                    <span className="text-xs text-slate-400 uppercase font-bold">Tasks</span>
                 </div>
              </div>

              {/* Today's Priority Tasks List */}
              <div className="mt-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Priority Action Items</h4>
                {tasks.filter(t => t.priority === "High" && t.status !== "Done").slice(0, 4).map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/tasks')}>
                    <div className="mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex justify-between">
                        <span>{task.assignee}</span>
                        <span className="text-red-500 font-medium">High Priority</span>
                      </p>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.priority === "High" && t.status !== "Done").length === 0 && (
                   <div className="text-center py-4 text-slate-400 text-sm">No high priority tasks pending.</div>
                )}
              </div>
              
              <button 
                onClick={() => router.push('/dashboard/tasks')}
                className="w-full mt-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                View Task Board <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Operations (Containers Table) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                Live Shipments
              </h3>
              <button onClick={() => router.push('/dashboard/containers')} className="text-xs font-medium text-slate-500 hover:text-indigo-600">View All</button>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Container</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">ETA</th>
                    <th className="px-6 py-4">Line</th>
                    <th className="px-6 py-4 text-right">Duty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {containers.slice(0, 6).map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-900">
                        {c.containerCode || `CNT-${c.no}`}
                        <div className="text-[10px] text-slate-400 font-normal">{c.month}</div>
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-6 py-3">
                        {c.eta ? (
                           <div className="flex items-center gap-2">
                              <span className={new Date(c.eta) <= new Date(new Date().setDate(new Date().getDate() + 2)) ? "text-red-600 font-bold" : ""}>
                                {new Date(c.eta).toLocaleDateString()}
                              </span>
                              {new Date(c.eta) <= new Date(new Date().setDate(new Date().getDate() + 2)) && <AlertCircle className="w-3 h-3 text-red-500" />}
                           </div>
                        ) : "-"}
                      </td>
                      <td className="px-6 py-3">{c.shippingLine || "N/A"}</td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900">
                        ₹{(parseFloat(c.totalDuty) || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {containers.length === 0 && (
                <div className="p-10 text-center text-slate-400">No active shipments found.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Components ---

function StatusBadge({ status }) {
  const styles = {
    Loaded: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Insea: "bg-blue-100 text-blue-700 border-blue-200",
    Delivered: "bg-slate-100 text-slate-600 border-slate-200",
    Pending: "bg-amber-100 text-amber-700 border-amber-200"
  };

  const icons = {
    Loaded: CheckCircle2,
    Insea: Ship,
    Delivered: Package,
    Pending: Clock
  };

  const Icon = icons[status] || Users;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.Delivered}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}