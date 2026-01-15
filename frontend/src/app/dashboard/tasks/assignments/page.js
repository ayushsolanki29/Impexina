"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  UserCheck,
  Calendar,
  CalendarDays,
  Repeat,
  Clock,
  MoreVertical,
  Eye,
  Filter,
  Users,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  CalendarRange,
  CalendarCheck,
  User,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TaskAssignmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("templateId");

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    templateId: "",
    title: "",
    description: "",
    category: "",
    scheduleType: "DAILY",
    timeline: "",
    assigneeId: "",
    startDate: "",
    endDate: "",
    deadlineDay: "",
    deadlineWeekday: "",
  });

  const loadAssignments = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(search && { search }),
        ...(scheduleFilter !== "ALL" && { scheduleType: scheduleFilter }),
        ...(assigneeFilter !== "ALL" && { assigneeId: assigneeFilter }),
      };

      const response = await API.get("/tasks/assignments", { params });
      if (response.data.success) {
        setAssignments(response.data.data.assignments);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error("Error loading assignments:", error);
      toast.error(error.response?.data?.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, [search, scheduleFilter, assigneeFilter]);

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

  const loadTemplates = useCallback(async () => {
    try {
      const response = await API.get("/tasks/templates", { params: { limit: 100 } });
      if (response.data.success) {
        setTemplates(response.data.data.templates);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
    loadUsers();
    loadTemplates();
  }, [loadAssignments, loadUsers, loadTemplates]);

  useEffect(() => {
    if (templateIdParam) {
      setFormData((prev) => ({ ...prev, templateId: templateIdParam }));
      setShowCreateDialog(true);
    }
  }, [templateIdParam]);

  const handleTemplateChange = (templateId) => {
    if (templateId === "CUSTOM") {
      // Custom task - clear template-related fields
      setFormData({ 
        ...formData, 
        templateId: "",
        title: "",
        description: "",
        category: "",
        scheduleType: "DAILY",
        deadlineDay: "",
        deadlineWeekday: "",
      });
      return;
    }
    
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        templateId,
        title: template.title,
        description: template.description || "",
        category: template.category || "",
        scheduleType: template.defaultSchedule,
        deadlineDay: template.defaultDeadlineDay?.toString() || "",
        deadlineWeekday: template.defaultDeadlineWeekday?.toString() || "",
      });
    }
  };

  const handleCreateAssignment = async () => {
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    if (!formData.assigneeId) {
      toast.error("Please select an assignee");
      return;
    }

    try {
      setSaving(true);
      const response = await API.post("/tasks/assignments", formData);

      if (response.data.success) {
        toast.success("Task assigned successfully!");
        setShowCreateDialog(false);
        resetForm();
        loadAssignments();
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error(error.response?.data?.message || "Failed to assign task");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAssignment = async () => {
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      setSaving(true);
      const response = await API.put(`/tasks/assignments/${selectedAssignment.id}`, formData);

      if (response.data.success) {
        toast.success("Assignment updated successfully!");
        setShowEditDialog(false);
        resetForm();
        loadAssignments();
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error(error.response?.data?.message || "Failed to update assignment");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async () => {
    try {
      setSaving(true);
      const response = await API.delete(`/tasks/assignments/${selectedAssignment.id}`);

      if (response.data.success) {
        toast.success("Assignment deleted successfully!");
        setShowDeleteDialog(false);
        setSelectedAssignment(null);
        loadAssignments();
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error(error.response?.data?.message || "Failed to delete assignment");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePause = async (assignment) => {
    try {
      const response = await API.put(`/tasks/assignments/${assignment.id}`, {
        isPaused: !assignment.isPaused,
      });

      if (response.data.success) {
        toast.success(assignment.isPaused ? "Task resumed!" : "Task paused!");
        loadAssignments();
      }
    } catch (error) {
      console.error("Error toggling pause:", error);
      toast.error(error.response?.data?.message || "Failed to update task");
    }
  };

  const openEditDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      templateId: assignment.templateId || "",
      title: assignment.title,
      description: assignment.description || "",
      category: assignment.category || "",
      scheduleType: assignment.scheduleType,
      timeline: assignment.timeline || "",
      assigneeId: assignment.assigneeId.toString(),
      startDate: assignment.startDate ? new Date(assignment.startDate).toISOString().split("T")[0] : "",
      endDate: assignment.endDate ? new Date(assignment.endDate).toISOString().split("T")[0] : "",
      deadlineDay: assignment.deadlineDay?.toString() || "",
      deadlineWeekday: assignment.deadlineWeekday?.toString() || "",
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setShowViewDialog(true);
  };

  const openDeleteDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      templateId: "",
      title: "",
      description: "",
      category: "",
      scheduleType: "DAILY",
      timeline: "",
      assigneeId: "",
      startDate: "",
      endDate: "",
      deadlineDay: "",
      deadlineWeekday: "",
    });
    setSelectedAssignment(null);
  };

  const getScheduleIcon = (schedule) => {
    switch (schedule) {
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

  const getScheduleBadgeColor = (schedule) => {
    switch (schedule) {
      case "DAILY":
        return "bg-blue-100 text-blue-700";
      case "WEEKLY":
        return "bg-purple-100 text-purple-700";
      case "MONTHLY":
        return "bg-indigo-100 text-indigo-700";
      case "DATE_RANGE":
        return "bg-amber-100 text-amber-700";
      case "SPECIFIC_DATE":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.status) {
      case "COMPLETED":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
                  <UserCheck className="w-6 h-6 text-violet-600" />
                  Task Assignments
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  Assign tasks to team members and track progress
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Assign Task
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
                <p className="text-xs text-slate-500">Total Assignments</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {assignments.filter((a) => a.currentStatus?.status === "PENDING").length}
                </p>
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
                <p className="text-2xl font-bold text-slate-900">
                  {assignments.filter((a) => a.currentStatus?.status === "COMPLETED").length}
                </p>
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
                <p className="text-2xl font-bold text-slate-900">
                  {assignments.filter((a) => a.currentStatus?.status === "OVERDUE").length}
                </p>
                <p className="text-xs text-slate-500">Overdue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search assignments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={scheduleFilter} onValueChange={setScheduleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Schedule Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Schedules</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="AS_PER_REQUIREMENT">As Needed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Assignees</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => loadAssignments()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No assignments found</h3>
              <p className="text-slate-500 mb-6">
                {search || scheduleFilter !== "ALL" || assigneeFilter !== "ALL"
                  ? "Try adjusting your filters"
                  : "Assign your first task to a team member"}
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setShowCreateDialog(true);
                }}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign Task
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Task</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => {
                  const ScheduleIcon = getScheduleIcon(assignment.scheduleType);
                  return (
                    <TableRow
                      key={assignment.id}
                      className={`hover:bg-slate-50 ${assignment.isPaused ? "opacity-60" : ""}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              assignment.currentStatus?.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-600"
                                : assignment.currentStatus?.status === "OVERDUE"
                                ? "bg-red-50 text-red-600"
                                : "bg-violet-50 text-violet-600"
                            }`}
                          >
                            <UserCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{assignment.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {assignment.category && (
                                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                                  {assignment.category}
                                </span>
                              )}
                              {assignment.isSelfCreated && (
                                <Badge variant="outline" className="text-xs">Self</Badge>
                              )}
                              {assignment.isPaused && (
                                <Badge className="bg-slate-100 text-slate-600 text-xs">
                                  <Pause className="w-3 h-3 mr-1" />
                                  Paused
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {assignment.assignee?.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              @{assignment.assignee?.username}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge className={getScheduleBadgeColor(assignment.scheduleType)}>
                            <ScheduleIcon className="w-3 h-3 mr-1" />
                            {assignment.scheduleType?.replace(/_/g, " ")}
                          </Badge>
                          {assignment.timeline && (
                            <p className="text-xs text-slate-500 mt-1">{assignment.timeline}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(assignment.currentStatus)}
                        {assignment.currentStatus?.dueDate && (
                          <p className="text-xs text-slate-500 mt-1">
                            Due: {formatDate(assignment.currentStatus.dueDate)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600">{assignment._count?.completions || 0}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openViewDialog(assignment)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(assignment)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Assignment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTogglePause(assignment)}>
                              {assignment.isPaused ? (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Resume Task
                                </>
                              ) : (
                                <>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pause Task
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(assignment)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!loading && assignments.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <div className="text-sm text-slate-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} assignments
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAssignments(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAssignments(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Assignment Dialog */}
      <Dialog
        open={showCreateDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setShowEditDialog(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-violet-600" />
              {showEditDialog ? "Edit Assignment" : "Assign Task"}
            </DialogTitle>
            <DialogDescription>
              {showEditDialog
                ? "Update the task assignment details"
                : "Assign a task to a team member"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Template Selection */}
            {!showEditDialog && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  From Template (Optional)
                </label>
                <Select value={formData.templateId || "CUSTOM"} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOM">Custom Task (No Template)</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title} ({template.defaultSchedule})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Task Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter task title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <Textarea
                placeholder="Enter task description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assignee <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.assigneeId}
                onValueChange={(value) => setFormData({ ...formData, assigneeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {user.name} ({user.role})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <Input
                  placeholder="e.g., ACCOUNTING"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value.toUpperCase() })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Schedule Type
                </label>
                <Select
                  value={formData.scheduleType}
                  onValueChange={(value) => setFormData({ ...formData, scheduleType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="DATE_RANGE">Date Range</SelectItem>
                    <SelectItem value="SPECIFIC_DATE">Specific Date</SelectItem>
                    <SelectItem value="AS_PER_REQUIREMENT">As Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Timeline / Notes
              </label>
              <Input
                placeholder="e.g., 5TH EVERY MONTH, DEADLINE DATE 28"
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
              />
            </div>

            {(formData.scheduleType === "DATE_RANGE" || formData.scheduleType === "SPECIFIC_DATE") && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                {formData.scheduleType === "DATE_RANGE" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                )}
              </div>
            )}

            {formData.scheduleType === "MONTHLY" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Deadline Day (1-31)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="e.g., 15"
                  value={formData.deadlineDay}
                  onChange={(e) => setFormData({ ...formData, deadlineDay: e.target.value })}
                />
              </div>
            )}

            {formData.scheduleType === "WEEKLY" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Deadline Day
                </label>
                <Select
                  value={formData.deadlineWeekday}
                  onValueChange={(value) => setFormData({ ...formData, deadlineWeekday: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={showEditDialog ? handleUpdateAssignment : handleCreateAssignment}
              disabled={saving || !formData.title.trim() || (!showEditDialog && !formData.assigneeId)}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {showEditDialog ? "Update" : "Assign Task"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Assignment Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-violet-600" />
              Assignment Details
            </DialogTitle>
          </DialogHeader>

          {selectedAssignment && (
            <div className="py-4 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Task Title</p>
                <p className="font-medium text-slate-900">{selectedAssignment.title}</p>
              </div>

              {selectedAssignment.description && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Description</p>
                  <p className="text-slate-700">{selectedAssignment.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Assignee</p>
                  <p className="text-slate-900">{selectedAssignment.assignee?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Assigned By</p>
                  <p className="text-slate-900">{selectedAssignment.assignedBy?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Schedule</p>
                  <Badge className={getScheduleBadgeColor(selectedAssignment.scheduleType)}>
                    {selectedAssignment.scheduleType?.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Current Status</p>
                  {getStatusBadge(selectedAssignment.currentStatus)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Completions</p>
                  <p className="text-slate-900">{selectedAssignment._count?.completions || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Created</p>
                  <p className="text-slate-900">{formatDate(selectedAssignment.createdAt)}</p>
                </div>
              </div>

              {selectedAssignment.timeline && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Timeline</p>
                  <p className="text-slate-900">{selectedAssignment.timeline}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowViewDialog(false);
                openEditDialog(selectedAssignment);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Assignment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task assignment? This will also delete all
              completion history for this task. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAssignment} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
