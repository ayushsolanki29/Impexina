"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  CheckSquare,
  AlertCircle,
  FileText,
  Users,
  CalendarDays,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TaskManagement() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [frequencyFilter, setFrequencyFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [assignees, setAssignees] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    dailyTasks: 0,
    weeklyTasks: 0,
    monthlyTasks: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  // Load tasks
  const loadTasks = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(search && { search }),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
        ...(frequencyFilter !== "ALL" && { frequency: frequencyFilter }),
        ...(assigneeFilter !== "ALL" && { assigneeId: assigneeFilter }),
      };

      const response = await API.get("/tasks", { params });

      if (response.data.success) {
        setTasks(response.data.data.tasks);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error(error.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  // Load assignees
  const loadAssignees = async () => {
    try {
      const response = await API.get("/tasks/users/assignable");
      if (response.data.success) {
        setAssignees(response.data.data);
      }
    } catch (error) {
      console.error("Error loading assignees:", error);
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
    loadTasks();
    loadAssignees();
    loadStats();
  }, [search, statusFilter, frequencyFilter, assigneeFilter]);

  // Delete task
  const deleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await API.delete(`/tasks/${taskId}`);
      if (response.data.success) {
        toast.success(response.data.message || "Task deleted successfully");
        loadTasks();
        loadStats();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error(error.message || "Failed to delete task");
    }
  };

  // Mark task as complete
  const markComplete = async (taskId) => {
    try {
      const response = await API.post(`/tasks/${taskId}/complete`);
      if (response.data.success) {
        toast.success(response.data.message || "Task marked as complete");
        loadTasks();
        loadStats();
      }
    } catch (error) {
      console.error("Error marking task complete:", error);
      toast.error(error.message || "Failed to mark task as complete");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = (status, isOverdue = false) => {
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    }

    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
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
      case "OVERDUE":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
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

  // Pagination controls
  const PaginationControls = () => (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <div className="text-sm text-gray-500">
        Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
        {pagination.total} tasks
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadTasks(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadTasks(pagination.page + 1)}
          disabled={pagination.page >= pagination.pages}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Task Management
              </h1>
              <p className="text-slate-600 mt-1">
                Create, assign, and track tasks for employees
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/tasks/stats")}
                className="flex items-center gap-2 border-slate-200 hover:bg-slate-50"
              >
                <BarChart3 className="w-4 h-4" />
                Advanced Stats
              </Button>
              <Button
                onClick={() => router.push("/dashboard/tasks/create")}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Create New Task
              </Button>
            </div>
          </div>

          {/* Stats Cards - Consolidated to 4 main cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Tasks</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Pending Tasks</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.pendingTasks}</p>
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
                  <p className="text-2xl font-bold text-slate-900">{stats.completedTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <CheckCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Overdue</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.overdueTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by title or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Frequency</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="AS_PER_REQUIREMENT">As Required</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Assignees</SelectItem>
                  {assignees.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </div>

        {/* Task Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Task</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex justify-center">
                          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No tasks found</p>
                          {search ||
                          statusFilter !== "ALL" ||
                          frequencyFilter !== "ALL" ||
                          assigneeFilter !== "ALL" ? (
                            <Button
                              variant="link"
                              onClick={() => {
                                setSearch("");
                                setStatusFilter("ALL");
                                setFrequencyFilter("ALL");
                                setAssigneeFilter("ALL");
                              }}
                              className="mt-2"
                            >
                              Clear filters
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow
                        key={task.id}
                        className="hover:bg-gray-50"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {task.description.length > 100
                                  ? `${task.description.substring(0, 100)}...`
                                  : task.description}
                              </p>
                            )}
                            {task.timeline && (
                              <p className="text-xs text-gray-400 mt-1">
                                Timeline: {task.timeline}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{task.assignee.name}</p>
                              <p className="text-xs text-gray-500">@{task.assignee.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getFrequencyBadge(task.frequency)}
                          {task.deadlineDay && (
                            <p className="text-xs text-gray-500 mt-1">
                              Day {task.deadlineDay}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(task.status, task.isOverdue)}
                          {task.completedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Completed: {formatDate(task.completedAt)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(task.createdAt)}
                          <p className="text-xs mt-1">
                            By {task.assignedBy.name}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {task.status === "PENDING" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => markComplete(task.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Complete
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/dashboard/tasks/${task.id}/edit`)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Task
                                </DropdownMenuItem>
                                {task.status === "PENDING" && (
                                  <DropdownMenuItem
                                    onClick={() => markComplete(task.id)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark Complete
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deleteTask(task.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Task
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!loading && tasks.length > 0 && <PaginationControls />}
          </CardContent>
        </div>
      </div>
    </div>
  );
}