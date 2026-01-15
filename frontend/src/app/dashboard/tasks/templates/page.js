"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  LayoutTemplate,
  Calendar,
  CalendarDays,
  Repeat,
  Clock,
  MoreVertical,
  Eye,
  Copy,
  Filter,
  ChevronDown,
  Users,
  CheckCircle,
  X,
  FileText,
  Layers,
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

export default function TaskTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [categories, setCategories] = useState([]);
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
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    defaultSchedule: "DAILY",
    defaultDeadlineDay: "",
    defaultDeadlineWeekday: "",
  });

  const loadTemplates = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(search && { search }),
        ...(categoryFilter !== "ALL" && { category: categoryFilter }),
      };

      const response = await API.get("/tasks/templates", { params });
      if (response.data.success) {
        setTemplates(response.data.data.templates);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error(error.response?.data?.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await API.get("/tasks/templates/categories");
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, [loadTemplates, loadCategories]);

  const handleCreateTemplate = async () => {
    if (!formData.title.trim()) {
      toast.error("Template title is required");
      return;
    }

    try {
      setSaving(true);
      const response = await API.post("/tasks/templates", formData);

      if (response.data.success) {
        toast.success("Template created successfully!");
        setShowCreateDialog(false);
        resetForm();
        loadTemplates();
        loadCategories();
      }
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error(error.response?.data?.message || "Failed to create template");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!formData.title.trim()) {
      toast.error("Template title is required");
      return;
    }

    try {
      setSaving(true);
      const response = await API.put(`/tasks/templates/${selectedTemplate.id}`, formData);

      if (response.data.success) {
        toast.success("Template updated successfully!");
        setShowEditDialog(false);
        resetForm();
        loadTemplates();
        loadCategories();
      }
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error(error.response?.data?.message || "Failed to update template");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    try {
      setSaving(true);
      const response = await API.delete(`/tasks/templates/${selectedTemplate.id}`);

      if (response.data.success) {
        toast.success("Template deleted successfully!");
        setShowDeleteDialog(false);
        setSelectedTemplate(null);
        loadTemplates();
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error(error.response?.data?.message || "Failed to delete template");
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (template) => {
    setSelectedTemplate(template);
    setFormData({
      title: template.title,
      description: template.description || "",
      category: template.category || "",
      defaultSchedule: template.defaultSchedule,
      defaultDeadlineDay: template.defaultDeadlineDay?.toString() || "",
      defaultDeadlineWeekday: template.defaultDeadlineWeekday?.toString() || "",
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (template) => {
    setSelectedTemplate(template);
    setShowViewDialog(true);
  };

  const openDeleteDialog = (template) => {
    setSelectedTemplate(template);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      defaultSchedule: "DAILY",
      defaultDeadlineDay: "",
      defaultDeadlineWeekday: "",
    });
    setSelectedTemplate(null);
  };

  const getScheduleIcon = (schedule) => {
    switch (schedule) {
      case "DAILY":
        return CalendarDays;
      case "WEEKLY":
        return Calendar;
      case "MONTHLY":
        return Repeat;
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
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const formatDate = (dateString) => {
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
                  <LayoutTemplate className="w-6 h-6 text-blue-600" />
                  Task Templates
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  Create and manage reusable task templates
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
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
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
                <p className="text-xs text-slate-500">Total Templates</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {templates.filter((t) => t.defaultSchedule === "DAILY").length}
                </p>
                <p className="text-xs text-slate-500">Daily Templates</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {templates.filter((t) => t.defaultSchedule === "MONTHLY").length}
                </p>
                <p className="text-xs text-slate-500">Monthly Templates</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
                <p className="text-xs text-slate-500">Categories</p>
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
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => loadTemplates()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Templates Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <LayoutTemplate className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No templates found</h3>
              <p className="text-slate-500 mb-6">
                {search || categoryFilter !== "ALL"
                  ? "Try adjusting your filters"
                  : "Create your first template to get started"}
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setShowCreateDialog(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Template</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Default Schedule</TableHead>
                  <TableHead>Assignments</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => {
                  const ScheduleIcon = getScheduleIcon(template.defaultSchedule);
                  return (
                    <TableRow key={template.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <LayoutTemplate className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{template.title}</p>
                            {template.description && (
                              <p className="text-sm text-slate-500 truncate max-w-[250px]">
                                {template.description}
                              </p>
                            )}
                          </div>
                          {template.isSystemTemplate && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                              System
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.category ? (
                          <Badge variant="outline" className="bg-slate-50">
                            {template.category}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getScheduleBadgeColor(template.defaultSchedule)}>
                          <ScheduleIcon className="w-3 h-3 mr-1" />
                          {template.defaultSchedule?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{template._count?.assignments || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDate(template.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openViewDialog(template)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {!template.isSystemTemplate && (
                              <>
                                <DropdownMenuItem onClick={() => openEditDialog(template)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Template
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(template)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/dashboard/tasks/assignments?templateId=${template.id}`
                                )
                              }
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Assign to Users
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
          {!loading && templates.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <div className="text-sm text-slate-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} templates
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplates(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplates(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Template Dialog */}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-blue-600" />
              {showEditDialog ? "Edit Template" : "Create Template"}
            </DialogTitle>
            <DialogDescription>
              {showEditDialog
                ? "Update the template details below"
                : "Create a new reusable task template"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Template Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter template title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <Textarea
                placeholder="Enter template description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
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
                  Default Schedule
                </label>
                <Select
                  value={formData.defaultSchedule}
                  onValueChange={(value) => setFormData({ ...formData, defaultSchedule: value })}
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

            {formData.defaultSchedule === "MONTHLY" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Default Deadline Day (1-31)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="e.g., 15"
                  value={formData.defaultDeadlineDay}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultDeadlineDay: e.target.value })
                  }
                />
              </div>
            )}

            {formData.defaultSchedule === "WEEKLY" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Default Deadline Day
                </label>
                <Select
                  value={formData.defaultDeadlineWeekday}
                  onValueChange={(value) =>
                    setFormData({ ...formData, defaultDeadlineWeekday: value })
                  }
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
              onClick={showEditDialog ? handleUpdateTemplate : handleCreateTemplate}
              disabled={saving || !formData.title.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {showEditDialog ? "Update Template" : "Create Template"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Template Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-blue-600" />
              Template Details
            </DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <div className="py-4 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Title</p>
                <p className="font-medium text-slate-900">{selectedTemplate.title}</p>
              </div>

              {selectedTemplate.description && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Description</p>
                  <p className="text-slate-700">{selectedTemplate.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Category</p>
                  <Badge variant="outline">{selectedTemplate.category || "None"}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Default Schedule</p>
                  <Badge className={getScheduleBadgeColor(selectedTemplate.defaultSchedule)}>
                    {selectedTemplate.defaultSchedule?.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Assignments</p>
                  <p className="text-slate-900">{selectedTemplate._count?.assignments || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Created By</p>
                  <p className="text-slate-900">{selectedTemplate.createdBy?.name || "System"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Created</p>
                <p className="text-slate-900">{formatDate(selectedTemplate.createdAt)}</p>
              </div>

              {selectedTemplate.isSystemTemplate && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-700">
                    This is a system template and cannot be modified or deleted.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            {selectedTemplate && !selectedTemplate.isSystemTemplate && (
              <Button onClick={() => {
                setShowViewDialog(false);
                openEditDialog(selectedTemplate);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Template
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Template
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTemplate?.title}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTemplate}
              disabled={saving}
            >
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
