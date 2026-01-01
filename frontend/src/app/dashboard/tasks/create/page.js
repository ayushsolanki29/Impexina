"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, User, Calendar, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateTask() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assignees, setAssignees] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    frequency: "DAILY",
    deadlineDay: "",
    timeline: "",
    assigneeId: "",
    notes: ""
  });

  // Load assignees
  useEffect(() => {
    loadAssignees();
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.assigneeId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const response = await API.post("/tasks", formData);
      
      if (response.data.success) {
        toast.success(response.data.message || "Task created successfully");
        router.push("/dashboard/tasks");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(error.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
          <p className="text-gray-600 mt-1">
            Assign a new task to an employee
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Task Details */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Title *
                    </label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter task title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter task description"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeline / Requirements
                    </label>
                    <Input
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                      placeholder="e.g., AS PER REQUIREMENT, Daily, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Completion Notes (Optional)
                    </label>
                    <Textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any notes for the assignee"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Assignment & Timing */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign To *
                    </label>
                    <Select
                      value={formData.assigneeId}
                      onValueChange={(value) => handleSelectChange("assigneeId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignees.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                <User className="w-3 h-3 text-gray-600" />
                              </div>
                              <span>{user.name}</span>
                              <span className="text-xs text-gray-500 ml-auto">
                                {user.role}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Timing & Frequency
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency *
                    </label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => handleSelectChange("frequency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="AS_PER_REQUIREMENT">As Per Requirement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.frequency === "MONTHLY" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deadline Day (1-31)
                      </label>
                      <Input
                        type="number"
                        name="deadlineDay"
                        value={formData.deadlineDay}
                        onChange={handleChange}
                        min="1"
                        max="31"
                        placeholder="e.g., 8, 17, 28"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the day of month when this task should be completed
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Task
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}