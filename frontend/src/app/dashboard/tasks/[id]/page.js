"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Edit,
  Trash2,
  CalendarDays,
  FileText,
  AlertCircle,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function TaskDetails() {
  const router = useRouter();
  const params = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (params.id) {
      loadTask();
    }
  }, [params.id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/tasks/${params.id}`);
      if (response.data.success) {
        setTask(response.data.data);
        setNotes(response.data.data.notes || "");
      }
    } catch (error) {
      console.error("Error loading task:", error);
      toast.error(error.message || "Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async () => {
    try {
      const response = await API.post(`/tasks/${params.id}/complete`, { notes });
      if (response.data.success) {
        toast.success(response.data.message || "Task marked as complete");
        setShowCompleteDialog(false);
        loadTask();
      }
    } catch (error) {
      console.error("Full error object:", error);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      
      // Extract the error message with priority
      let errorMessage = "Failed to mark task as complete";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 403) {
        errorMessage = "Permission denied: You can only mark your own tasks as complete.";
      } else if (error.message && !error.message.includes("status code")) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const deleteTask = async () => {
    try {
      const response = await API.delete(`/tasks/${params.id}`);
      if (response.data.success) {
        toast.success(response.data.message || "Task deleted successfully");
        router.push("/dashboard/tasks");
      }
    } catch (error) {
      console.error("Full error object:", error);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      
      // Extract the error message with priority
      let errorMessage = "Failed to delete task";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 403) {
        errorMessage = "Permission denied: You do not have permission to delete this task.";
      } else if (error.message && !error.message.includes("status code")) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-4 h-4 mr-1" />
            Completed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="outline" className="border-amber-200 text-amber-700">
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-4 h-4 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Task not found</h2>
          <p className="text-gray-600 mb-6">The task you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard/tasks")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                {getStatusBadge(task.status)}
                {getFrequencyBadge(task.frequency)}
                {task.deadlineDay && (
                  <span className="text-sm text-gray-600">
                    Day {task.deadlineDay}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {task.status === "PENDING" && (
                <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Mark Task as Complete</DialogTitle>
                      <DialogDescription>
                        Add any notes about the completion of this task.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Textarea
                        placeholder="Enter completion notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={markComplete}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/tasks/${task.id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Task</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this task? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={deleteTask}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Task
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Task Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {task.description || "No description provided"}
                  </p>
                </div>

                {task.timeline && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Timeline</h3>
                    <p className="text-gray-900">{task.timeline}</p>
                  </div>
                )}

                {task.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{task.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Assignee</h3>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{task.assignee?.name || "Unassigned"}</p>
                      <p className="text-sm text-gray-500">{task.assignee?.username ? `@${task.assignee.username}` : ""}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Assigned By</h3>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{task.assignedBy?.name || "Unknown"}</p>
                      <p className="text-sm text-gray-500">{task.assignedBy?.username ? `@${task.assignedBy.username}` : ""}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timing Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Created</h3>
                    <p className="text-sm text-gray-900">{formatDate(task.createdAt)}</p>
                  </div>
                  
                  {task.completedAt && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Completed</h3>
                      <p className="text-sm text-gray-900">{formatDate(task.completedAt)}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Frequency</h3>
                  <div className="flex items-center gap-2">
                    {task.frequency === "DAILY" && <CalendarDays className="w-4 h-4 text-blue-500" />}
                    {task.frequency === "WEEKLY" && <Calendar className="w-4 h-4 text-purple-500" />}
                    {task.frequency === "MONTHLY" && <CalendarDays className="w-4 h-4 text-indigo-500" />}
                    <span className="capitalize">{task.frequency ? task.frequency.toLowerCase().replace("_", " ") : "Not Specified"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}