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
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
      toast.error(error.message || "Failed to mark task as complete");
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get frequency icon
  const getFrequencyIcon = (frequency) => {
    switch (frequency) {
      case "DAILY":
        return <CalendarDays className="w-4 h-4 text-blue-500" />;
      case "WEEKLY":
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case "MONTHLY":
        return <CalendarDays className="w-4 h-4 text-indigo-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
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

  // Group tasks by frequency
  const groupedTasks = tasks.reduce((groups, task) => {
    const frequency = task.frequency;
    if (!groups[frequency]) {
      groups[frequency] = [];
    }
    groups[frequency].push(task);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-gray-600 mt-1">
              View and manage your assigned tasks
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Tasks</p>
                    <p className="text-2xl font-bold">{stats.myTotalTasks}</p>
                  </div>
                  <CheckSquare className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold">{stats.myPendingTasks}</p>
                  </div>
                  <Clock className="w-8 h-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-2xl font-bold">{stats.myCompletedTasks}</p>
                  </div>
                  <CheckCheck className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Today's Tasks</p>
                    <p className="text-2xl font-bold">{stats.myTodayTasks}</p>
                  </div>
                  <CalendarDays className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Daily Tasks</p>
                    <p className="text-2xl font-bold">{stats.myDailyTasks}</p>
                  </div>
                  <CalendarDays className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Weekly Tasks</p>
                    <p className="text-2xl font-bold">{stats.myWeeklyTasks}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Filter by frequency:</span>
              </div>
              <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                <SelectTrigger className="w-40">
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
          </CardContent>
        </Card>

        {/* Tasks List */}
        <div className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900">No tasks assigned</h3>
                <p className="text-gray-500 mt-1">You don't have any tasks assigned to you yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {Object.entries(groupedTasks).map(([frequency, freqTasks]) => (
                <Card key={frequency}>
                  <AccordionItem value={frequency} className="border-none">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          {getFrequencyIcon(frequency)}
                          <div>
                            <h3 className="text-lg font-semibold text-left">
                              {frequency.replace("_", " ")} Tasks
                            </h3>
                            <p className="text-sm text-gray-500">
                              {freqTasks.length} task{freqTasks.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {freqTasks.filter(t => t.status === 'PENDING').length} pending
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {freqTasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-medium">{task.title}</h4>
                                  {getStatusBadge(task.status)}
                                </div>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>Assigned by: {task.assignedBy?.name}</span>
                                  <span>•</span>
                                  <span>Created: {formatDate(task.createdAt)}</span>
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
                                  size="sm"
                                  onClick={() => markComplete(task.id)}
                                  className="ml-4"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Mark Complete
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </AccordionContent>
                  </AccordionItem>
                </Card>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}