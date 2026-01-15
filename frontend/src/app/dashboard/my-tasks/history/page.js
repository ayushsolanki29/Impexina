"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  History,
  Calendar,
  CalendarDays,
  Repeat,
  Clock,
  CheckCircle,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CompletionHistoryPage() {
  const router = useRouter();
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const loadCompletions = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      };

      const response = await API.get("/tasks/my-completions", { params });
      if (response.data.success) {
        setCompletions(response.data.data.completions);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error("Error loading completions:", error);
      toast.error(error.response?.data?.message || "Failed to load completion history");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadCompletions();
  }, [loadCompletions]);

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
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate stats
  const todayCompletions = completions.filter((c) => {
    const today = new Date();
    const completedDate = new Date(c.completedAt);
    return (
      completedDate.getDate() === today.getDate() &&
      completedDate.getMonth() === today.getMonth() &&
      completedDate.getFullYear() === today.getFullYear()
    );
  }).length;

  const onTimeCompletions = completions.filter((c) => c.isOnTime).length;
  const lateCompletions = completions.filter((c) => !c.isOnTime).length;

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
                onClick={() => router.push("/dashboard/my-tasks")}
                className="hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-6 h-6 text-amber-600" />
                  Completion History
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  View your task completion history
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => loadCompletions()}
              className="border-slate-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
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
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
                <p className="text-xs text-slate-500">Total Completions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{todayCompletions}</p>
                <p className="text-xs text-slate-500">Today</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{onTimeCompletions}</p>
                <p className="text-xs text-slate-500">On Time</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{lateCompletions}</p>
                <p className="text-xs text-slate-500">Late</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                From Date
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                To Date
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
            >
              Clear Filters
            </Button>
            <Button onClick={() => loadCompletions()} className="bg-amber-600 hover:bg-amber-700">
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>

        {/* Completions Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : completions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No completions found</h3>
              <p className="text-slate-500 mb-6">
                {dateFrom || dateTo
                  ? "Try adjusting your date filters"
                  : "Complete your first task to see it here"}
              </p>
              <Button
                onClick={() => router.push("/dashboard/my-tasks")}
                className="bg-amber-600 hover:bg-amber-700"
              >
                View My Tasks
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Task</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Completed At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[300px]">Completion Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completions.map((completion) => {
                  const ScheduleIcon = getScheduleIcon(completion.assignment?.scheduleType);
                  return (
                    <TableRow key={completion.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {completion.assignment?.title}
                            </p>
                            {completion.assignment?.category && (
                              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                                {completion.assignment.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getScheduleBadgeColor(completion.assignment?.scheduleType)}
                        >
                          <ScheduleIcon className="w-3 h-3 mr-1" />
                          {completion.assignment?.scheduleType?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-slate-900">{formatDateOnly(completion.periodStart)}</p>
                          <p className="text-slate-500">to {formatDateOnly(completion.periodEnd)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {formatDate(completion.completedAt)}
                      </TableCell>
                      <TableCell>
                        {completion.isOnTime ? (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            On Time
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">
                            <Clock className="w-3 h-3 mr-1" />
                            Late
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {completion.completionNote}
                        </p>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!loading && completions.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <div className="text-sm text-slate-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} completions
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadCompletions(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadCompletions(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
