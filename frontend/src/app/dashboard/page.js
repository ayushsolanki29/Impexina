"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Clock,
  AlertCircle,
  CheckCircle2,
  Ship,
  Calendar,
  ArrowRight,
  DollarSign,
  Users,
  Box,
  Target,
  Loader2,
  TrendingUp,
  TrendingDown,
  User,
  CheckCircle,
  AlertTriangle,
  Bookmark,
  Plus,
  X,
  Pin,
  ListTodo,
  BarChart3,
  Zap,
  Award,
  FileText,
  Truck,
  Globe,
  Shield,
  Crown,
  Sparkles,
  ExternalLink,
  Settings,
  ClipboardList,
  Wallet,
  Building,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  ChevronsUpDown,
  Check,
  GripVertical,
  Settings2,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import API from "@/lib/api";
import { CustomizationProvider, useCustomization } from "./contexts/CustomizationContext";
import CustomizationPanel from "./components/shared/CustomizationPanel";
import CustomizableSection from "./components/shared/CustomizableSection";
import CustomizableWidget from "./components/shared/CustomizableWidget";
import DashboardHeader from "./components/shared/DashboardHeader";

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// ========================
// SHARED PERSONAL TODOS COMPONENT
// ========================
function PersonalTodos({ userId }) {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`personal_todos_${userId}`);
    if (saved) {
      setTodos(JSON.parse(saved));
    }
  }, [userId]);

  const saveTodos = (newTodos) => {
    localStorage.setItem(`personal_todos_${userId}`, JSON.stringify(newTodos));
    setTodos(newTodos);
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const todo = {
      id: Date.now(),
      text: newTodo,
      completed: false,
      createdAt: new Date().toISOString(),
      pinned: false,
    };
    saveTodos([todo, ...todos]);
    setNewTodo("");
    setShowInput(false);
  };

  const toggleTodo = (id) => {
    const updated = todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    saveTodos(updated);
  };

  const togglePin = (id) => {
    const updated = todos.map((t) =>
      t.id === id ? { ...t, pinned: !t.pinned } : t
    );
    updated.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    saveTodos(updated);
  };

  const deleteTodo = (id) => {
    saveTodos(todos.filter((t) => t.id !== id));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
          <Bookmark className="w-4 h-4 text-amber-600" />
          My Notes
        </h3>
        <button
          onClick={() => setShowInput(true)}
          className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <div className="p-3">
        {showInput && (
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTodo()}
              placeholder="Add a note..."
              className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
            <button
              onClick={addTodo}
              className="px-2 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowInput(false)}
              className="px-2 py-1.5 text-slate-500 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {todos.length === 0 ? (
          <div className="text-center py-4 text-slate-400">
            <Bookmark className="w-6 h-6 mx-auto mb-1 opacity-50" />
            <p className="text-xs">Add personal notes</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={`group flex items-start gap-2 p-2 rounded-lg text-sm ${todo.pinned ? "bg-amber-50 border border-amber-200" : "hover:bg-slate-50"
                  }`}
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${todo.completed
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-slate-300"
                    }`}
                >
                  {todo.completed && <CheckCircle className="w-3 h-3" />}
                </button>
                <p className={`flex-1 text-xs ${todo.completed ? "text-slate-400 line-through" : "text-slate-700"}`}>
                  {todo.text}
                </p>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                  <button
                    onClick={() => togglePin(todo.id)}
                    className={`p-0.5 rounded ${todo.pinned ? "text-amber-600" : "text-slate-400 hover:text-amber-600"}`}
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-0.5 text-slate-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========================
// REUSABLE COMBOBOX COMPONENT
// ========================
const Combobox = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    (opt || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer bg-white hover:border-indigo-400 transition-colors text-sm"
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              className="w-full px-2 py-1 text-sm outline-none placeholder:text-slate-400"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="overflow-y-auto flex-1">
            <button
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearch("");
              }}
              className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 flex items-center gap-2 italic"
            >
              All Origins
            </button>
            {filteredOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${value === opt ? "bg-indigo-50 font-medium text-indigo-600" : "text-slate-700"
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

// ========================
// ADMIN DASHBOARD COMPONENT
// ========================
function AdminDashboard({ user, dashboardData }) {
  const router = useRouter();
  const { setShowSettingsPanel, getVisibleSections, reorderSections } = useCustomization();

  const [containerStats, setContainerStats] = useState(null);
  const [upcomingContainers, setUpcomingContainers] = useState([]);
  const [userTaskSummary, setUserTaskSummary] = useState([]);
  const [loadingContainers, setLoadingContainers] = useState(true);

  // Advanced Container Dashboard State
  const [allContainers, setAllContainers] = useState([]);
  const [filteredContainers, setFilteredContainers] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [containerFilters, setContainerFilters] = useState({
    search: "",
    status: "",
    dateRange: "",
    workflowStatus: "",
    origin: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedDashboard, setShowAdvancedDashboard] = useState(false);
  const [origins, setOrigins] = useState([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const containersPerPage = 10;

  useEffect(() => {
    loadContainerData();
    loadUserTaskSummary();
    fetchOrigins();
  }, []);

  const fetchOrigins = async () => {
    try {
      const response = await API.get("/containers/origins");
      if (response.data.success) {
        setOrigins(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching origins:", error);
    }
  };

  const loadContainerData = async () => {
    try {
      // Load container summaries
      const summariesRes = await API.get("/container-summaries", { limit: 100 });
      if (summariesRes.data.success) {
        const summaries = summariesRes.data.data.summaries || [];

        // Get all containers from summaries (load all, not just first 10)
        const allContainersData = [];
        for (const summary of summaries) {
          try {
            const detailRes = await API.get(`/container-summaries/${summary.id}`);
            if (detailRes.data.success && detailRes.data.data.containers) {
              detailRes.data.data.containers.forEach((c) => {
                allContainersData.push({
                  ...c,
                  month: summary.month,
                  summaryId: summary.id,
                  arrivalDate: c.eta || c.loadingDate,
                });
              });
            }
          } catch (e) {
            console.error("Error loading summary detail:", e);
          }
        }

        setAllContainers(allContainersData);

        // Use allContainersData for calculations
        const allContainers = allContainersData;

        // Calculate stats
        const now = new Date();
        const next15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

        const arriving15Days = allContainers.filter((c) => {
          if (!c.arrivalDate) return false;
          const arrival = new Date(c.arrivalDate);
          return arrival >= now && arrival <= next15Days && c.status !== "Delivered";
        });

        const pendingDuty = allContainers.filter((c) =>
          c.status !== "Delivered" && (c.duty > 0 || c.finalAmount > 0)
        );

        const totalDutyPending = pendingDuty.reduce((sum, c) => sum + (parseFloat(c.duty) || 0), 0);
        const totalAmountPending = pendingDuty.reduce((sum, c) => sum + (parseFloat(c.finalAmount) || 0), 0);

        setContainerStats({
          total: allContainers.length,
          arriving15Days: arriving15Days.length,
          pendingDuty: pendingDuty.length,
          totalDutyPending,
          totalAmountPending,
          loaded: allContainers.filter((c) => c.status === "Loaded").length,
          insea: allContainers.filter((c) => c.status === "Insea").length,
          delivered: allContainers.filter((c) => c.status === "Delivered").length,
        });

        setUpcomingContainers(arriving15Days.slice(0, 6).sort((a, b) =>
          new Date(a.arrivalDate) - new Date(b.arrivalDate)
        ));
      }
    } catch (error) {
      console.error("Error loading container data:", error);
    } finally {
      setLoadingContainers(false);
    }
  };

  const loadUserTaskSummary = async () => {
    try {
      const res = await API.get("/tasks/admin/performance");
      if (res.data.success && res.data.data) {
        // Handle both array and users property
        const users = Array.isArray(res.data.data) ? res.data.data : res.data.data.users || [];
        // Filter out users with 0 tasks assigned (e.g., Super Admin, System Admin)
        const filteredUsers = users.filter((u) =>
          (u.stats?.totalAssignments || 0) > 0
        );
        setUserTaskSummary(filteredUsers.slice(0, 5));
      }
    } catch (error) {
      console.error("Error loading user task summary:", error);
    }
  };

  const getRoleColor = () => {
    if (user?.isSuper) return "from-slate-900 to-slate-800";
    return "from-blue-700 to-indigo-800";
  };

  const getRoleBadge = () => {
    if (user?.isSuper) return { label: "SUPER ADMIN", bg: "bg-slate-900", icon: Crown };
    return { label: "ADMIN", bg: "bg-blue-700", icon: Shield };
  };

  const badge = getRoleBadge();
  const BadgeIcon = badge.icon;

  // Task stats from dashboard data
  const taskStats = useMemo(() => {
    if (!dashboardData?.overview?.taskStatus) return { completed: 0, pending: 0, total: 0 };
    const { completed = 0, pending = 0 } = dashboardData.overview.taskStatus;
    return { completed, pending, total: completed + pending };
  }, [dashboardData]);

  // Status chart data
  const statusChartData = useMemo(() => {
    if (!containerStats) return [];
    return [
      { name: "Loaded", value: containerStats.loaded, color: "#6366f1" },
      { name: "In Sea", value: containerStats.insea, color: "#f59e0b" },
      { name: "Delivered", value: containerStats.delivered, color: "#10b981" },
    ].filter((d) => d.value > 0);
  }, [containerStats]);

  // Filter containers based on active filters
  useEffect(() => {
    let filtered = [...allContainers];

    // Apply active filter from card click
    if (activeFilter) {
      if (activeFilter.type === 'arriving') {
        const days = activeFilter.days || 15;
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((c) => {
          if (!c.arrivalDate) return false;
          const arrival = new Date(c.arrivalDate);
          return arrival >= now && arrival <= futureDate && c.status !== "Delivered";
        });
      } else if (activeFilter.type === 'status') {
        filtered = filtered.filter((c) => c.status === activeFilter.status);
      } else if (activeFilter.type === 'duty') {
        filtered = filtered.filter((c) =>
          c.status !== "Delivered" && (c.duty > 0 || c.finalAmount > 0)
        );
      }
    }

    // Apply manual filters
    if (containerFilters.search) {
      const searchLower = containerFilters.search.toLowerCase();
      filtered = filtered.filter((c) =>
        c.containerCode?.toLowerCase().includes(searchLower) ||
        c.bl?.toLowerCase().includes(searchLower) ||
        c.shippingLine?.toLowerCase().includes(searchLower) ||
        c.month?.toLowerCase().includes(searchLower)
      );
    }

    if (containerFilters.status) {
      filtered = filtered.filter((c) => c.status === containerFilters.status);
    }

    if (containerFilters.workflowStatus) {
      filtered = filtered.filter((c) => c.workflowStatus === containerFilters.workflowStatus);
    }

    if (containerFilters.origin) {
      filtered = filtered.filter((c) => c.origin === containerFilters.origin);
    }

    if (containerFilters.dateRange) {
      const now = new Date();
      let startDate, endDate;
      if (containerFilters.dateRange === 'next10') {
        startDate = now;
        endDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      } else if (containerFilters.dateRange === 'next15') {
        startDate = now;
        endDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      } else if (containerFilters.dateRange === 'thisMonth') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      if (startDate && endDate) {
        filtered = filtered.filter((c) => {
          if (!c.arrivalDate) return false;
          const arrival = new Date(c.arrivalDate);
          return arrival >= startDate && arrival <= endDate;
        });
      }
    }

    setFilteredContainers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [allContainers, activeFilter, containerFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredContainers.length / containersPerPage);
  const paginatedContainers = filteredContainers.slice(
    (currentPage - 1) * containersPerPage,
    currentPage * containersPerPage
  );

  const handleDragStart = (e, index) => {
    if (!isCustomizing) return;
    e.dataTransfer.setData('dragIndex', index);
    e.target.style.opacity = '0.4';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'));
    if (isNaN(dragIndex) || dragIndex === dropIndex) return;

    // Use the customization context to reorder sections
    reorderSections(dragIndex, dropIndex);
  };

  const renderSection = (id) => {
    switch (id) {
      case 'ALERTS':
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Containers Arriving - FIRST */}
            <div
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-indigo-300"
              onClick={() => {
                setShowAdvancedDashboard(true);
                setActiveFilter({ type: 'arriving', days: 15 });
                setContainerFilters({ search: "", status: "", dateRange: "next15", workflowStatus: "", origin: "" });
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-indigo-50">
                  <Ship className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                  Next 15 Days
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {loadingContainers ? "..." : containerStats?.arriving15Days || 0}
              </div>
              <p className="text-sm text-slate-500 mt-1">Containers Arriving</p>
            </div>

            <div
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-amber-300"
              onClick={() => {
                setShowAdvancedDashboard(true);
                setActiveFilter({ type: 'duty', status: 'pending' });
                setContainerFilters({ search: "", status: "", dateRange: "", workflowStatus: "", origin: "" });
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  Pending
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {loadingContainers ? "..." : containerStats?.pendingDuty || 0}
              </div>
              <p className="text-sm text-slate-500 mt-1">Duty Payments Due</p>
            </div>

            <div
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-amber-300"
              onClick={() => {
                setShowAdvancedDashboard(true);
                setActiveFilter({ type: 'duty', status: 'pending' });
                setContainerFilters({ search: "", status: "", dateRange: "", workflowStatus: "", origin: "" });
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                ₹{loadingContainers ? "..." : ((containerStats?.totalDutyPending || 0) / 100000).toFixed(1)}L
              </div>
              <p className="text-sm text-slate-500 mt-1">Total Duty Pending</p>
            </div>

            {/* Delivered This Month - LAST */}
            <div
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-emerald-300"
              onClick={() => {
                setShowAdvancedDashboard(true);
                setActiveFilter({ type: 'status', status: 'Delivered' });
                setContainerFilters({ search: "", status: "Delivered", dateRange: "thisMonth", workflowStatus: "", origin: "" });
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {loadingContainers ? "..." : containerStats?.delivered || 0}
              </div>
              <p className="text-sm text-slate-500 mt-1">Delivered This Month</p>
            </div>
          </div>
        );
      case 'CONTAINER_DB':
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Container Dashboard
              </h3>
              <button
                onClick={() => {
                  setShowAdvancedDashboard(!showAdvancedDashboard);
                  if (!showAdvancedDashboard) {
                    setActiveFilter(null);
                    setContainerFilters({ search: "", status: "", dateRange: "", workflowStatus: "", origin: "" });
                  }
                }}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                {showAdvancedDashboard ? "Hide" : "Show"} Dashboard <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {showAdvancedDashboard && (
              <div className="p-5 space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search containers..."
                      value={containerFilters.search}
                      onChange={(e) => setContainerFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>

                  <select
                    value={containerFilters.status}
                    onChange={(e) => setContainerFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="Loaded">Loaded</option>
                    <option value="Insea">In Sea</option>
                    <option value="Delivered">Delivered</option>
                  </select>

                  <select
                    value={containerFilters.workflowStatus}
                    onChange={(e) => setContainerFilters(prev => ({ ...prev, workflowStatus: e.target.value }))}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">All Workflow Status</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="MAIL">Mail</option>
                    <option value="SIMS">SIMS</option>
                    <option value="PIMS">PIMS</option>
                    <option value="CHECKLIST">Checklist</option>
                    <option value="LOADING SHEET">Loading Sheet</option>
                    <option value="BIFURCATION">Bifurcation</option>
                    <option value="PACKING LIST">Packing List</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="BOE">BOE</option>
                    <option value="DUTY CALCULATOR">Duty Calculator</option>
                    <option value="PURCHASE SELL">Purchase Sell</option>
                    <option value="WAREHOUSE PLAN">Warehouse Plan</option>
                    <option value="ACCOUNT">Account</option>
                  </select>

                  <Combobox
                    value={containerFilters.origin}
                    onChange={(val) => setContainerFilters((prev) => ({ ...prev, origin: val }))}
                    options={origins}
                    placeholder="All Origins"
                  />

                  <select
                    value={containerFilters.dateRange}
                    onChange={(e) => setContainerFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">All Dates</option>
                    <option value="next10">Next 10 Days</option>
                    <option value="next15">Next 15 Days</option>
                    <option value="thisMonth">This Month</option>
                  </select>

                  <button
                    onClick={() => {
                      setActiveFilter(null);
                      setContainerFilters({ search: "", status: "", dateRange: "", workflowStatus: "", origin: "" });
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Clear Filters
                  </button>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setActiveFilter({ type: 'arriving', days: 10 });
                      setContainerFilters(prev => ({ ...prev, dateRange: 'next10' }));
                    }}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                  >
                    Next 10 Days
                  </button>
                  <button
                    onClick={() => {
                      setActiveFilter({ type: 'arriving', days: 15 });
                      setContainerFilters(prev => ({ ...prev, dateRange: 'next15' }));
                    }}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                  >
                    Next 15 Days
                  </button>
                  <button
                    onClick={() => {
                      setActiveFilter({ type: 'status', status: 'Loaded' });
                      setContainerFilters(prev => ({ ...prev, status: 'Loaded' }));
                    }}
                    className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium"
                  >
                    Loaded Containers
                  </button>
                  <button
                    onClick={() => {
                      setActiveFilter({ type: 'status', status: 'Insea' });
                      setContainerFilters(prev => ({ ...prev, status: 'Insea' }));
                    }}
                    className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors text-sm font-medium"
                  >
                    In Sea Containers
                  </button>
                </div>

                {/* Container List */}
                <div className="space-y-3">
                  {loadingContainers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  ) : paginatedContainers.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No containers found</p>
                    </div>
                  ) : (
                    <>
                      {paginatedContainers.map((container, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                          onClick={() => router.push(`/dashboard/container-summary/${container.summaryId}`)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <Package className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-slate-900">{container.containerCode || "N/A"}</p>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${container.status === "Loaded" ? "bg-emerald-100 text-emerald-700" :
                                  container.status === "Insea" ? "bg-sky-100 text-sky-700" :
                                    "bg-violet-100 text-violet-700"
                                  }`}>
                                  {container.status || "N/A"}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span>{container.shippingLine || "N/A"}</span>
                                <span>•</span>
                                <span>{container.month || "N/A"}</span>
                              </div>
                            </div>
                          </div>
                          <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 'CONTENT_GRID':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Alerts & Tasks */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Arrivals */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Ship className="w-5 h-5 text-indigo-600" />
                    Upcoming Arrivals (15 Days)
                  </h3>
                  <button
                    onClick={() => router.push("/dashboard/containers")}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-4">
                  {loadingContainers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  ) : upcomingContainers.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Ship className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No containers arriving in next 15 days</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingContainers.map((container, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          onClick={() => router.push(`/dashboard/container-summary/${container.summaryId}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{container.containerCode}</p>
                              <p className="text-xs text-slate-500">{container.shippingLine || "N/A"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">
                              {new Date(container.arrivalDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </p>
                            <p className="text-xs text-amber-600">
                              ₹{((container.duty || 0) / 1000).toFixed(1)}K duty
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* User Task Status */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Team Task Status
                  </h3>
                  <button
                    onClick={() => router.push("/dashboard/tasks/reports")}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                  >
                    Reports <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-4">
                  {userTaskSummary.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No task data available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userTaskSummary.map((user, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                            {user.user?.name?.charAt(0) || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-slate-900 truncate">{user.user?.name}</p>
                              <span className="text-xs text-slate-500">
                                {user.stats?.totalCompletions || 0}/{user.stats?.totalAssignments || 0}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-purple-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${(user.stats?.totalCompletions / (user.stats?.totalAssignments || 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Notes & Links */}
            <div className="space-y-6">
              <PersonalTodos userId={user?.id} />

              {/* Quick Links */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-indigo-600" />
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push("/dashboard/tasks")}
                    className="w-full p-3 flex items-center gap-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    <ListTodo className="w-5 h-5" />
                    <span className="font-medium text-sm">My Tasks</span>
                  </button>
                  <button
                    onClick={() => router.push("/dashboard/tasks")}
                    className="w-full p-3 flex items-center gap-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <Clock className="w-5 h-5" />
                    <span className="font-medium text-sm">Task Hub</span>
                  </button>
                  <button
                    onClick={() => router.push("/dashboard/profile")}
                    className="w-full p-3 flex items-center gap-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium text-sm">My Profile</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6 pb-20">
      {/* Header with Admin Greeting */}
      <div className={`bg-gradient-to-r ${getRoleColor()} rounded-2xl p-6 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className={`${badge.bg} p-2 rounded-lg`}>
              <BadgeIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold tracking-wider opacity-80">{badge.label}</span>
          </div>
          <div className="flex items-center justify-between w-full">
            <h1 className="text-2xl md:text-3xl font-bold">
              {getGreeting()}, {user?.name || "Admin"}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCustomizing(!isCustomizing)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isCustomizing
                  ? "bg-amber-400 text-amber-900 shadow-lg scale-105"
                  : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
              >
                <Settings className={`w-3.5 h-3.5 ${isCustomizing ? "animate-spin" : ""}`} />
                {isCustomizing ? "DONE CUSTOMIZING" : "CUSTOMIZE LAYOUT"}
              </button>
              <button
                onClick={() => setShowSettingsPanel(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-2"
              >
                <Settings2 className="w-3.5 h-3.5" />
                WIDGET SETTINGS
              </button>
            </div>
          </div>
          <p className="text-white/70">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Draggable Sections Container */}
      <div className="space-y-6">
        {getVisibleSections().map((section, index) => (
          <div
            key={section.id}
            draggable={isCustomizing}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`relative transition-all duration-300 ${isCustomizing
              ? "cursor-move border-2 border-dashed border-amber-300 rounded-2xl p-2 bg-amber-50/30 hover:bg-amber-50/50"
              : ""
              }`}
          >
            {isCustomizing && (
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 z-50 bg-amber-500 text-white p-1.5 rounded-full shadow-lg">
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            {renderSection(section.id)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ========================
// EMPLOYEE DASHBOARD COMPONENT
// ========================
function EmployeeDashboard({ user, dashboardData }) {
  const router = useRouter();
  const [myTasks, setMyTasks] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [containerInfo, setContainerInfo] = useState({ arriving: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyTasks();
    loadPerformance();
    loadContainerInfo();
  }, []);

  const loadMyTasks = async () => {
    try {
      const res = await API.get("/tasks/my-assignments");
      if (res.data.success) {
        setMyTasks(res.data.data || []);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPerformance = async () => {
    try {
      const res = await API.get("/tasks/my-completions?limit=50");
      if (res.data.success) {
        const completions = res.data.data || [];
        const onTime = completions.filter((c) => c.status === "COMPLETED").length;
        const total = completions.length;

        // Weekly data
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
          const dayCompletions = completions.filter((c) => {
            const cDate = new Date(c.completedAt);
            return cDate.toDateString() === date.toDateString();
          }).length;
          weeklyData.push({ name: dayName, completed: dayCompletions });
        }

        setPerformance({
          total,
          onTime,
          rate: total > 0 ? Math.round((onTime / total) * 100) : 0,
          weeklyData,
        });
      }
    } catch (error) {
      console.error("Error loading performance:", error);
    }
  };

  const loadContainerInfo = async () => {
    try {
      const res = await API.get("/container-summaries/statistics");
      if (res.data.success) {
        const stats = res.data.data;
        setContainerInfo({
          total: stats.totalContainers || 0,
          arriving: stats.activeCount || 0,
        });
      }
    } catch (error) {
      console.error("Error loading container info:", error);
    }
  };

  const todayTasks = myTasks.filter((t) => t.scheduleType === "DAILY");
  const pendingTasks = myTasks.filter((t) => !t.completions?.some((c) => isCompletedToday(c)));
  const completedToday = myTasks.length - pendingTasks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 p-6 space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500 p-1.5 rounded-lg">
                <User className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold tracking-wider opacity-80">EMPLOYEE</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {getGreeting()}, {user?.name || "Team Member"}!
            </h1>
            <p className="text-white/70">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="text-right">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <p className="text-xs text-white/70">Your Performance</p>
              <p className="text-3xl font-bold">{performance?.rate || 0}%</p>
              <p className="text-xs text-white/70">On-time rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-emerald-50">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{completedToday}</div>
          <p className="text-sm text-slate-500">Completed Today</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-amber-50">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingTasks.length}</div>
          <p className="text-sm text-slate-500">Pending Tasks</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Ship className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{containerInfo.arriving}</div>
          <p className="text-sm text-slate-500">Active Containers</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-purple-50">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{performance?.total || 0}</div>
          <p className="text-sm text-slate-500">Tasks This Week</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-emerald-600" />
              Today&apos;s Tasks
            </h3>
            <button
              onClick={() => router.push("/dashboard/tasks")}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : todayTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No daily tasks assigned</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.slice(0, 5).map((task, index) => {
                  const isCompleted = task.completions?.some((c) => isCompletedToday(c));
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${isCompleted
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"
                        }`}>
                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${isCompleted ? "text-emerald-700 line-through" : "text-slate-900"}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-500">{task.category || "General"}</p>
                      </div>
                      {!isCompleted && (
                        <button
                          onClick={() => router.push("/dashboard/tasks")}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Performance & Quick Links */}
        <div className="space-y-6">
          {/* Performance Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Weekly Activity
            </h3>
            {performance?.weeklyData ? (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performance.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400">
                No data yet
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              Quick Access
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push("/dashboard/tasks")}
                className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold flex flex-col items-center gap-2 hover:bg-emerald-100 transition-colors"
              >
                <ListTodo className="w-5 h-5" />
                My Tasks
              </button>
              <button
                onClick={() => router.push("/dashboard/tasks")}
                className="p-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold flex flex-col items-center gap-2 hover:bg-indigo-100 transition-colors"
              >
                <Clock className="w-5 h-5" />
                Task Hub
              </button>
              <button
                onClick={() => router.push("/dashboard/containers")}
                className="p-3 bg-purple-50 text-purple-700 rounded-xl text-xs font-semibold flex flex-col items-center gap-2 hover:bg-purple-100 transition-colors"
              >
                <Ship className="w-5 h-5" />
                Containers
              </button>
              <button
                onClick={() => router.push("/dashboard/profile")}
                className="p-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex flex-col items-center gap-2 hover:bg-slate-200 transition-colors"
              >
                <User className="w-5 h-5" />
                Profile
              </button>
            </div>
          </div>

          {/* Personal Notes */}
          <PersonalTodos userId={user?.id} />
        </div>
      </div>
    </div>
  );
}

// ========================
// NEW JOINER DASHBOARD COMPONENT
// ========================
function NewJoinerDashboard({ user }) {
  const router = useRouter();
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState("");
  const [showTodoInput, setShowTodoInput] = useState(false);
  const [personalTodos, setPersonalTodos] = useState([]);

  useEffect(() => {
    loadMyTasks();
    loadPersonalTodos();
  }, []);

  const loadMyTasks = async () => {
    try {
      const res = await API.get("/tasks/my-assignments");
      if (res.data.success) {
        setMyTasks(res.data.data || []);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalTodos = () => {
    const saved = localStorage.getItem(`personal_todos_${user?.id}`);
    if (saved) {
      setPersonalTodos(JSON.parse(saved));
    }
  };

  const savePersonalTodos = (todos) => {
    localStorage.setItem(`personal_todos_${user?.id}`, JSON.stringify(todos));
    setPersonalTodos(todos);
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const todo = {
      id: Date.now(),
      text: newTodo,
      completed: false,
      createdAt: new Date().toISOString(),
      pinned: false,
    };
    savePersonalTodos([todo, ...personalTodos]);
    setNewTodo("");
    setShowTodoInput(false);
  };

  const toggleTodo = (id) => {
    const updated = personalTodos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    savePersonalTodos(updated);
  };

  const togglePin = (id) => {
    const updated = personalTodos.map((t) =>
      t.id === id ? { ...t, pinned: !t.pinned } : t
    );
    // Sort: pinned first
    updated.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    savePersonalTodos(updated);
  };

  const deleteTodo = (id) => {
    savePersonalTodos(personalTodos.filter((t) => t.id !== id));
  };

  const dailyTasks = myTasks.filter((t) => t.scheduleType === "DAILY");
  const completedCount = dailyTasks.filter((t) =>
    t.completions?.some((c) => isCompletedToday(c))
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 space-y-6 pb-20">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <Sparkles className="absolute top-4 right-4 w-8 h-8 text-amber-400 opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-slate-600 p-1.5 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold tracking-wider opacity-80">WELCOME ABOARD</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {getGreeting()}, {user?.name || "New Team Member"}! 👋
          </h1>
          <p className="text-white/70 max-w-md">
            We&apos;re excited to have you on the team. Here&apos;s your personal dashboard to help you get started.
          </p>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Sparkles className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 mb-1">Getting Started</h3>
            <p className="text-sm text-amber-700">
              Complete your daily tasks to build your track record. Your tasks are simple and designed to help you learn the system.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks - Left Side */}
        <div className="lg:col-span-2 order-2 lg:order-1 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-indigo-600" />
                My Tasks
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {completedCount}/{dailyTasks.length} completed today
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/tasks")}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : dailyTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No tasks assigned yet</p>
                <p className="text-sm mt-1">Your tasks will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dailyTasks.map((task, index) => {
                  const isCompleted = task.completions?.some((c) => isCompletedToday(c));
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-2 transition-all ${isCompleted
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-white border-slate-200 hover:border-indigo-300"
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
                          }`}>
                          {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold ${isCompleted ? "text-emerald-700" : "text-slate-900"}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${task.scheduleType === "DAILY"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                              }`}>
                              {task.scheduleType}
                            </span>
                            {task.category && (
                              <span className="text-xs text-slate-400">{task.category}</span>
                            )}
                          </div>
                        </div>
                        {!isCompleted && (
                          <button
                            onClick={() => router.push("/dashboard/tasks")}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Notes & Quick Links */}
        <div className="space-y-6 order-1 lg:order-2">
          {/* Personal Todo/Notes (Pinnable) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-600" />
                My Notes
              </h3>
              <button
                onClick={() => setShowTodoInput(true)}
                className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              {showTodoInput && (
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTodo()}
                    placeholder="Add a note..."
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                  <button
                    onClick={addTodo}
                    className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
                  >
                    Add
                  </button>
                </div>
              )}
              {personalTodos.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Add personal notes here</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {personalTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`group flex items-start gap-2 p-2 rounded-lg ${todo.pinned ? "bg-amber-50 border border-amber-200" : "hover:bg-slate-50"
                        }`}
                    >
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 ${todo.completed
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-slate-300"
                          }`}
                      >
                        {todo.completed && <CheckCircle className="w-3 h-3" />}
                      </button>
                      <p className={`flex-1 text-sm ${todo.completed ? "text-slate-400 line-through" : "text-slate-700"}`}>
                        {todo.text}
                      </p>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <button
                          onClick={() => togglePin(todo.id)}
                          className={`p-1 rounded ${todo.pinned ? "text-amber-600" : "text-slate-400 hover:text-amber-600"}`}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-indigo-600" />
              Quick Links
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/dashboard/tasks")}
                className="w-full p-3 flex items-center gap-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                <ListTodo className="w-5 h-5" />
                <span className="font-medium text-sm">My Tasks</span>
              </button>
              <button
                onClick={() => router.push("/dashboard/tasks")}
                className="w-full p-3 flex items-center gap-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Clock className="w-5 h-5" />
                <span className="font-medium text-sm">Task Hub</span>
              </button>
              <button
                onClick={() => router.push("/dashboard/profile")}
                className="w-full p-3 flex items-center gap-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="font-medium text-sm">My Profile</span>
              </button>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}

// ========================
// MAIN DASHBOARD COMPONENT
// ========================
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAndData();
  }, []);

  const loadUserAndData = async () => {
    try {
      // Load user info
      const userRes = await API.get("/auth/me");
      if (userRes.data.success) {
        setUser(userRes.data.data);
      }

      // Load basic dashboard data
      const [overviewRes] = await Promise.allSettled([
        API.get("/dashboard/overview"),
      ]);

      setDashboardData({
        overview: overviewRes.status === "fulfilled" ? overviewRes.value.data?.data : null,
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  // Determine which dashboard to show based on role
  const role = user?.role;
  const isSuper = user?.isSuper;

  return (
    <CustomizationProvider userId={user?.id}>
      {/* Global Customization Panel */}
      <CustomizationPanel />

      {/* Render appropriate dashboard based on role */}
      {(role === "ADMIN" || isSuper) && (
        <AdminDashboard user={user} dashboardData={dashboardData} />
      )}

      {role === "NEW_JOINNER" && (
        <NewJoinerDashboard user={user} />
      )}

      {role === "EMPLOYEE" && (
        <EmployeeDashboard user={user} dashboardData={dashboardData} />
      )}
    </CustomizationProvider>
  );
}

// ========================
// HELPER FUNCTIONS
// ========================
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function isCompletedToday(completion) {
  if (!completion?.completedAt) return false;
  const completedDate = new Date(completion.completedAt);
  const today = new Date();
  return completedDate.toDateString() === today.toDateString();
}
