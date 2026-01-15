"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  ArrowLeft,
  ArrowRight,
  LayoutTemplate,
  UserCheck,
  Shield,
  RefreshCw,
  Users,
  Target,
  CheckSquare,
  Calendar,
  CalendarDays,
  Repeat,
  Clock,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import API from "@/lib/api";

export default function TaskManagementPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalTemplates: 0,
    totalAssignments: 0,
    activeAssignments: 0,
    todayCompletions: 0,
    dailyTasks: 0,
    weeklyTasks: 0,
    monthlyTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get stats
      const statsRes = await API.get("/tasks/v2/stats");
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const adminModules = [
    {
      title: "Task Templates",
      description: "Create and manage reusable task templates. Templates can be quickly assigned to team members.",
      icon: LayoutTemplate,
      href: "/dashboard/tasks/templates",
      color: "from-blue-500 to-indigo-600",
      stats: [
        { label: "Templates", value: stats.totalTemplates || 0 },
      ],
    },
    {
      title: "Task Assignment",
      description: "Assign tasks to employees. Set schedules, deadlines, and track their progress.",
      icon: UserCheck,
      href: "/dashboard/tasks/assignments",
      color: "from-violet-500 to-purple-600",
      stats: [
        { label: "Active", value: stats.activeAssignments || 0 },
        { label: "Total", value: stats.totalAssignments || 0 },
      ],
    },
    {
      title: "Performance Reports",
      description: "View user-wise performance, completion history, and track team productivity with custom filters.",
      icon: BarChart3,
      href: "/dashboard/tasks/reports",
      color: "from-amber-500 to-orange-600",
      stats: [
        { label: "Today", value: stats.todayCompletions || 0 },
      ],
    },
  ];

  const quickStats = [
    { label: "Templates", value: stats.totalTemplates || 0, icon: LayoutTemplate, color: "text-blue-600 bg-blue-50" },
    { label: "Total Assignments", value: stats.totalAssignments || 0, icon: UserCheck, color: "text-violet-600 bg-violet-50" },
    { label: "Active Tasks", value: stats.activeAssignments || 0, icon: Target, color: "text-emerald-600 bg-emerald-50" },
    { label: "Today's Completions", value: stats.todayCompletions || 0, icon: CheckSquare, color: "text-amber-600 bg-amber-50" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
                onClick={() => router.push("/dashboard")}
                className="hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-blue-600" />
                    Task Management
                  </h1>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                </div>
                <p className="text-slate-500 text-sm mt-0.5">
                  Manage templates, assign tasks, and track team progress
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/tasks/reports")}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Reports
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/tasks/templates")}
              >
                <LayoutTemplate className="w-4 h-4 mr-2" />
                Templates
              </Button>
              <Button
                onClick={() => router.push("/dashboard/tasks/assignments")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Assign Task
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Admin Modules */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Admin Controls</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminModules.map((card, index) => (
              <div
                key={index}
                onClick={() => router.push(card.href)}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className={`bg-gradient-to-r ${card.color} p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <card.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{card.title}</h3>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 text-sm mb-4">{card.description}</p>
                  {card.stats && card.stats.length > 0 && (
                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                      {card.stats.map((stat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-900">{stat.value}</span>
                          <span className="text-xs text-slate-500">{stat.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Task Distribution by Schedule</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <CalendarDays className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.dailyTasks || 0}</p>
              <p className="text-sm text-slate-500">Daily Tasks</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.weeklyTasks || 0}</p>
              <p className="text-sm text-slate-500">Weekly Tasks</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-xl">
              <Repeat className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.monthlyTasks || 0}</p>
              <p className="text-sm text-slate-500">Monthly Tasks</p>
            </div>
          </div>
        </div>

        {/* Schedule Legend */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Task Schedule Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Daily", desc: "Complete once per day", color: "bg-blue-100 text-blue-700" },
              { name: "Weekly", desc: "Complete once per week", color: "bg-purple-100 text-purple-700" },
              { name: "Monthly", desc: "Complete once per month", color: "bg-indigo-100 text-indigo-700" },
              { name: "Date Range", desc: "Specific period", color: "bg-amber-100 text-amber-700" },
              { name: "Specific Date", desc: "One-time task", color: "bg-rose-100 text-rose-700" },
              { name: "As Required", desc: "When needed", color: "bg-slate-100 text-slate-700" },
            ].map((type, idx) => (
              <div key={idx} className="text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${type.color}`}>
                  {type.name}
                </span>
                <p className="text-xs text-slate-500 mt-1">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Task Completion Notes</h4>
              <p className="text-sm text-blue-700 mt-1">
                When employees complete a task, they must provide a note with at least 30 characters 
                describing what they did. This helps track progress and maintain accountability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
