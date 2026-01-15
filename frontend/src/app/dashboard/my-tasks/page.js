"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Clock,
  Calendar,
  CalendarDays,
  Repeat,
  AlertCircle,
  RefreshCw,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckSquare,
  Target,
  History,
  CalendarRange,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MyTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleFilter, setScheduleFilter] = useState("ALL");
  const [expandedTask, setExpandedTask] = useState(null);
  const [completionNote, setCompletionNote] = useState("");
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [minChars, setMinChars] = useState(30);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    scheduleType: "DAILY",
    category: "PERSONAL",
  });
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (scheduleFilter !== "ALL") {
        params.scheduleType = scheduleFilter;
      }

      const response = await API.get("/tasks/my-assignments", { params });
      if (response.data.success) {
        setTasks(response.data.data);
        
        // Calculate stats
        const taskList = response.data.data;
        setStats({
          totalTasks: taskList.length,
          pendingTasks: taskList.filter((t) => t.currentStatus?.status === "PENDING").length,
          completedTasks: taskList.filter((t) => t.currentStatus?.status === "COMPLETED").length,
          overdueTasks: taskList.filter((t) => t.currentStatus?.status === "OVERDUE").length,
        });
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error(error.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [scheduleFilter]);

  const loadMinChars = useCallback(async () => {
    try {
      const response = await API.get("/tasks/settings/min-chars");
      if (response.data.success) {
        setMinChars(response.data.data.minChars);
      }
    } catch (error) {
      console.error("Error loading min chars:", error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadMinChars();
  }, [loadTasks, loadMinChars]);

  const openCompleteDialog = (task) => {
    setSelectedTask(task);
    setCompletionNote("");
    setShowCompleteDialog(true);
  };

  const handleCompleteTask = async () => {
    if (!completionNote || completionNote.trim().length < minChars) {
      toast.error(`Completion note must be at least ${minChars} characters`);
      return;
    }

    try {
      setCompleting(true);
      const response = await API.post(`/tasks/assignments/${selectedTask.id}/complete`, {
        completionNote: completionNote.trim(),
      });

      if (response.data.success) {
        toast.success("Task completed successfully!");
        setShowCompleteDialog(false);
        setSelectedTask(null);
        setCompletionNote("");
        loadTasks();
      }
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error(error.response?.data?.message || "Failed to complete task");
    } finally {
      setCompleting(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      setAddingTask(true);
      const response = await API.post("/tasks/self-task", newTask);

      if (response.data.success) {
        toast.success("Task created successfully!");
        setShowAddDialog(false);
        setNewTask({
          title: "",
          description: "",
          scheduleType: "DAILY",
          category: "PERSONAL",
        });
        loadTasks();
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(error.response?.data?.message || "Failed to create task");
    } finally {
      setAddingTask(false);
    }
  };

  const getScheduleIcon = (scheduleType) => {
    switch (scheduleType) {
      case "DAILY":
        return CalendarDays;
      case "WEEKLY":
        return Calendar;
      case "MONTHLY":
        return Repeat;
      case "DATE_RANGE":
        return CalendarRange;
      case "SPECIFIC_DATE":
        return CalendarCheck;
      default:
        return Clock;
    }
  };

  const getScheduleBadgeColor = (scheduleType) => {
    switch (scheduleType) {
      case "DAILY":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "WEEKLY":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "MONTHLY":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "DATE_RANGE":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "SPECIFIC_DATE":
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "COMPLETED":
        return { color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle, label: "Completed" };
      case "OVERDUE":
        return { color: "text-red-600", bg: "bg-red-50", icon: AlertCircle, label: "Overdue" };
      case "PENDING":
      default:
        return { color: "text-amber-600", bg: "bg-amber-50", icon: Clock, label: "Pending" };
    }
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

  const groupedTasks = {
    DAILY: tasks.filter((t) => t.scheduleType === "DAILY"),
    WEEKLY: tasks.filter((t) => t.scheduleType === "WEEKLY"),
    MONTHLY: tasks.filter((t) => t.scheduleType === "MONTHLY"),
    OTHER: tasks.filter((t) => !["DAILY", "WEEKLY", "MONTHLY"].includes(t.scheduleType)),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-6 h-6 text-emerald-600" />
                My Tasks
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Complete your daily, weekly, and monthly tasks
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/my-tasks/history")}
                className="border-slate-200"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button
                variant="outline"
                onClick={() => loadTasks()}
                className="border-slate-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add My Task
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalTasks}</p>
                <p className="text-xs text-slate-500">Total Tasks</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.pendingTasks}</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.completedTasks}</p>
                <p className="text-xs text-slate-500">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.overdueTasks}</p>
                <p className="text-xs text-slate-500">Overdue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "ALL", label: "All Tasks" },
                { value: "DAILY", label: "Daily" },
                { value: "WEEKLY", label: "Weekly" },
                { value: "MONTHLY", label: "Monthly" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setScheduleFilter(filter.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    scheduleFilter === filter.value
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : tasks.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No tasks assigned</h3>
            <p className="text-slate-500 mb-6">You don't have any tasks assigned yet. Create your own task to get started.</p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add My Task
            </Button>
          </div>
        ) : (
          /* Task List */
          <div className="space-y-8">
            {scheduleFilter === "ALL" ? (
              // Grouped view
              Object.entries(groupedTasks).map(([type, typeTasks]) => {
                if (typeTasks.length === 0) return null;
                
                const typeLabels = {
                  DAILY: { label: "Daily Tasks", icon: CalendarDays, color: "text-blue-600" },
                  WEEKLY: { label: "Weekly Tasks", icon: Calendar, color: "text-purple-600" },
                  MONTHLY: { label: "Monthly Tasks", icon: Repeat, color: "text-indigo-600" },
                  OTHER: { label: "Other Tasks", icon: Clock, color: "text-slate-600" },
                };
                
                const TypeIcon = typeLabels[type]?.icon || Clock;
                
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-4">
                      <TypeIcon className={`w-5 h-5 ${typeLabels[type]?.color}`} />
                      <h2 className="text-lg font-semibold text-slate-900">{typeLabels[type]?.label}</h2>
                      <Badge variant="outline" className="ml-2">{typeTasks.length}</Badge>
                    </div>
                    <div className="grid gap-4">
                      {typeTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          expanded={expandedTask === task.id}
                          onToggle={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                          onComplete={() => openCompleteDialog(task)}
                          getScheduleIcon={getScheduleIcon}
                          getScheduleBadgeColor={getScheduleBadgeColor}
                          getStatusInfo={getStatusInfo}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              // Flat list view
              <div className="grid gap-4">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    expanded={expandedTask === task.id}
                    onToggle={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    onComplete={() => openCompleteDialog(task)}
                    getScheduleIcon={getScheduleIcon}
                    getScheduleBadgeColor={getScheduleBadgeColor}
                    getStatusInfo={getStatusInfo}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Task Completion Notes</h4>
              <p className="text-sm text-blue-700 mt-1">
                When completing a task, you must provide a note with at least {minChars} characters 
                describing what you did. This helps track progress and maintain accountability.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Task Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Complete Task
            </DialogTitle>
            <DialogDescription>
              {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Completion Note <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder={`Describe what you did (minimum ${minChars} characters)...`}
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between mt-2">
              <p className={`text-xs ${completionNote.length >= minChars ? "text-emerald-600" : "text-slate-500"}`}>
                {completionNote.length} / {minChars} characters minimum
              </p>
              {completionNote.length >= minChars && (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCompleteTask}
              disabled={completing || completionNote.trim().length < minChars}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {completing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              Add My Task
            </DialogTitle>
            <DialogDescription>
              Create a personal task for yourself
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Task Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter task title..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <Textarea
                placeholder="Enter task description..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Schedule Type
              </label>
              <Select
                value={newTask.scheduleType}
                onValueChange={(value) => setNewTask({ ...newTask, scheduleType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="AS_PER_REQUIREMENT">As Needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTask}
              disabled={addingTask || !newTask.title.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {addingTask ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  expanded,
  onToggle,
  onComplete,
  getScheduleIcon,
  getScheduleBadgeColor,
  getStatusInfo,
  formatDate,
}) {
  const ScheduleIcon = getScheduleIcon(task.scheduleType);
  const statusInfo = getStatusInfo(task.currentStatus?.status);
  const StatusIcon = statusInfo.icon;
  const isCompleted = task.currentStatus?.status === "COMPLETED";
  const isOverdue = task.currentStatus?.status === "OVERDUE";

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
        isCompleted
          ? "border-emerald-200 bg-emerald-50/30"
          : isOverdue
          ? "border-red-200 bg-red-50/30"
          : "border-slate-200"
      }`}
    >
      {/* Main Row */}
      <div className="p-4 flex items-center gap-4">
        {/* Status Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${statusInfo.bg}`}
        >
          <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
        </div>

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold truncate ${isCompleted ? "text-slate-500 line-through" : "text-slate-900"}`}>
              {task.title}
            </h3>
            {task.isSelfCreated && (
              <Badge variant="outline" className="text-xs bg-slate-50">Personal</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Badge className={`${getScheduleBadgeColor(task.scheduleType)} border`}>
              <ScheduleIcon className="w-3 h-3 mr-1" />
              {task.scheduleType?.replace(/_/g, " ")}
            </Badge>
            {task.category && (
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{task.category}</span>
            )}
            {task.timeline && (
              <span className="text-xs text-slate-400">{task.timeline}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isCompleted && (
            <Button
              size="sm"
              onClick={onComplete}
              className={`${
                isOverdue
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Complete
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onToggle}>
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100">
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Status</p>
              <p className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Due Date</p>
              <p className="font-medium text-slate-900">
                {formatDate(task.currentStatus?.dueDate)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Assigned By</p>
              <p className="font-medium text-slate-900">{task.assignedBy?.name || "Self"}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Last Completed</p>
              <p className="font-medium text-slate-900">
                {task.lastCompletion ? formatDate(task.lastCompletion.completedAt) : "Never"}
              </p>
            </div>
          </div>

          {task.description && (
            <div className="mt-4">
              <p className="text-slate-500 text-sm mb-1">Description</p>
              <p className="text-slate-700">{task.description}</p>
            </div>
          )}

          {task.lastCompletion?.completionNote && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-slate-500 text-sm mb-1">Last Completion Note</p>
              <p className="text-slate-700">{task.lastCompletion.completionNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
