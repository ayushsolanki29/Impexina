"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Calendar, User, Flag, CheckCircle, Loader2 } from "lucide-react";
import { Toaster, toast } from "sonner";

const EMPLOYEES = ["Narendra", "Nikita", "Niki", "Jinal", "Mayur", "Mehul", "Bhargav"];

// 1. Move the main logic into this sub-component
function TaskPlannerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Default from URL or today
  const defaultEmp = searchParams.get('emp') || EMPLOYEES[0];
  const defaultDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee: defaultEmp,
    date: defaultDate,
    priority: "Medium",
    recurrence: "One-time"
  });

  // Update state if URL params change after initial load
  useEffect(() => {
    setFormData(prev => ({
        ...prev,
        assignee: searchParams.get('emp') || prev.assignee,
        date: searchParams.get('date') || prev.date
    }));
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Task title is required");

    // Load existing tasks for that date
    const storageKey = `igpl_tasks_${formData.date}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");

    const newTask = {
      id: `t_adhoc_${Date.now()}`,
      title: formData.title,
      description: formData.description,
      assignee: formData.assignee,
      status: "Pending",
      priority: formData.priority,
      isSystem: false,
      date: formData.date
    };

    localStorage.setItem(storageKey, JSON.stringify([...existing, newTask]));
    toast.success("Task assigned successfully");
    
    setTimeout(() => router.push('/dashboard/tasks'), 500);
  };

  return (
    <div className="w-full max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.push('/dashboard/tasks')} 
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assign New Task</h1>
          <p className="text-slate-500 text-sm">Create an ad-hoc task for an employee.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
        
        {/* Task Title */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Task Title</label>
          <input 
            autoFocus
            className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium text-slate-900 placeholder:text-slate-300"
            placeholder="e.g. Verify Shipment Documents"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
        </div>

        {/* Assignee & Date */}
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assign To</label>
              <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <select 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                    value={formData.assignee}
                    onChange={e => setFormData({...formData, assignee: e.target.value})}
                  >
                    {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                  </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Due Date</label>
              <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="date"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
              </div>
            </div>
        </div>

        {/* Priority */}
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Priority Level</label>
            <div className="flex gap-2">
              {['High', 'Medium', 'Low'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({...formData, priority: p})}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                        formData.priority === p 
                          ? 'bg-slate-900 text-white border-slate-900' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
              ))}
            </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description (Optional)</label>
          <textarea 
            rows={3}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm"
            placeholder="Add specific details or instructions..."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
            <button 
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Assign Task
            </button>
        </div>

      </form>
    </div>
  );
}

// 2. Export the wrapper component with Suspense
export default function TaskPlanner() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center items-start pt-10">
      <Toaster position="top-center" />
      <Suspense fallback={
        <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading planner...</span>
        </div>
      }>
        <TaskPlannerForm />
      </Suspense>
    </div>
  );
}