"use client";
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  RefreshCw,
  FileText,
  CheckSquare,
  CalendarDays,
  Filter,
  CheckCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myTotalTasks: 0,
    myPendingTasks: 0,
    myCompletedTasks: 0,
    myTodayTasks: 0,
    myDailyTasks: 0,
    myWeeklyTasks: 0
  });
  const [frequencyFilter, setFrequencyFilter] = useState("ALL");

  // Load user's tasks
  const loadMyTasks = async () => {
    try {
      setLoading(true);
      const params = frequencyFilter !== "ALL" ? { frequency: frequencyFilter } : {};
      
      const response = await API.get("/tasks/my-tasks", { params });

      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error(error.message || "Failed to load your tasks");
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const response = await API.get("/tasks/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  useEffect(() => {
    loadMyTasks();
    loadStats();
  }, [frequencyFilter]);

  // Mark task as complete
  const markComplete = async (taskId) => {
    try {
      const response = await API.post(`/tasks/${taskId}/complete`);
      if (response.data.success) {
        toast.success(response.data.message || "Task marked as complete");
        loadMyTasks();
        loadStats();
      }
    } catch (error) {
      console.error("Error marking task complete:", error);
      const isForbidden = error.response?.status === 403 || error.message?.includes("403");
      const msg = error.response?.data?.message || 
                 (isForbidden ? "Permission denied: You can only mark your own tasks as complete." : null) ||
                 error.message || 
                 "Failed to mark task as complete";
      toast.error(msg);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="outline" className="border-amber-200 text-amber-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get frequency badge
  const getFrequencyBadge = (frequency) => {
    switch (frequency) {
      case "DAILY":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Daily</Badge>;
      case "WEEKLY":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Weekly</Badge>;
      case "MONTHLY":
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Monthly</Badge>;
      case "AS_PER_REQUIREMENT":
        return <Badge variant="outline">As Required</Badge>;
      default:
        return <Badge variant="outline">{frequency}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">My Tasks</h1>
            <p className="text-slate-600 mt-1">
              View and manage your assigned tasks
            </p>
          </div>

          {/* Stats Cards - Consolidated to 4 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Tasks</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.myTotalTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.myPendingTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.myCompletedTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <CheckCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Today's Tasks</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.myTodayTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Filter by frequency:</span>
            </div>
            <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
              <SelectTrigger className="w-40 border-slate-200">
                <SelectValue placeholder="All tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Tasks</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="AS_PER_REQUIREMENT">As Required</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tasks List - Card Based */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900">No tasks assigned</h3>
              <p className="text-slate-500 mt-1">You don't have any tasks assigned to you yet.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
                      {getStatusBadge(task.status)}
                      {getFrequencyBadge(task.frequency)}
                    </div>
                    {task.description && (
                      <p className="text-sm text-slate-600 mb-3">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span>Assigned by: {task.assignedBy?.name || "Unknown"}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Created: {formatDate(task.createdAt)}</span>
                      </div>
                      {task.timeline && (
                        <>
                          <span>•</span>
                          <span>Timeline: {task.timeline}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {task.status === "PENDING" && (
                    <Button
                      onClick={() => markComplete(task.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}