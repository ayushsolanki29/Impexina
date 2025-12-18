"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  MoreHorizontal, 
  BarChart3,
  Users,
  LayoutGrid,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter
} from "lucide-react";
import { Toaster, toast } from "sonner";

// --- Configuration ---
// Using a more professional, subdued palette for avatars
const EMPLOYEES = [
  { id: "e1", name: "Narendra", role: "Manager", initials: "NA", color: "bg-slate-800" },
  { id: "e2", name: "Nikita", role: "Accounts/Doc", initials: "NI", color: "bg-indigo-600" },
  { id: "e3", name: "Niki", role: "Invoicing", initials: "NK", color: "bg-violet-600" },
  { id: "e4", name: "Jinal", role: "Logistics", initials: "JI", color: "bg-blue-600" },
  { id: "e5", name: "Mayur", role: "Accounts/Tally", initials: "MA", color: "bg-cyan-600" },
  { id: "e6", name: "Mehul", role: "Import Doc", initials: "ME", color: "bg-teal-600" },
  { id: "e7", name: "Bhargav", role: "E-Commerce", initials: "BH", color: "bg-emerald-600" },
];

const TASK_TEMPLATES = [
  // Narendra
  { title: "China Loading Plan", assignee: "Narendra", frequency: "Daily", priority: "High" },
  { title: "China Order Plan & Payment", assignee: "Narendra", frequency: "Daily", priority: "High" },
  { title: "Tally AC Overview", assignee: "Narendra", frequency: "Weekly", day: 1, priority: "Medium" },
  { title: "Monthly Ledger Checking", assignee: "Narendra", frequency: "Monthly", date: 1, priority: "High" },
  // Nikita
  { title: "Client AC", assignee: "Nikita", frequency: "Weekly", day: 1, priority: "Medium" },
  { title: "New Client Acquisition", assignee: "Nikita", frequency: "Weekly", day: 2, priority: "High" },
  { title: "Container Tracking", assignee: "Nikita", frequency: "Daily", priority: "Medium" },
  // Niki
  { title: "Invoice Printing", assignee: "Niki", frequency: "Daily", priority: "Medium" },
  { title: "Import Document Check", assignee: "Niki", frequency: "Daily", priority: "High" },
  // Jinal
  { title: "Loading Sheet Final", assignee: "Jinal", frequency: "Daily", priority: "High" },
  { title: "Warehouse Stock", assignee: "Jinal", frequency: "Daily", priority: "Medium" },
  // Bhargav
  { title: "Amazon / Flipkart Ops", assignee: "Bhargav", frequency: "Daily", priority: "Medium" },
  { title: "New Client Acquisition", assignee: "Bhargav", frequency: "Daily", priority: "High" },
];

export default function TaskDashboard() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState([]);
  const [filterEmp, setFilterEmp] = useState("ALL");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);
  useEffect(() => { loadTasksForDate(selectedDate); }, [selectedDate]);

  const loadTasksForDate = (dateStr) => {
    const storageKey = `igpl_tasks_${dateStr}`;
    const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      const generated = generateDailyTasks(dateStr);
      setTasks(generated);
      if (typeof window !== 'undefined') localStorage.setItem(storageKey, JSON.stringify(generated));
    }
  };

  const generateDailyTasks = (dateStr) => {
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay(); 
    const dayOfMonth = dateObj.getDate();
    const newTasks = [];
    
    TASK_TEMPLATES.forEach(template => {
      let shouldAssign = false;
      if (template.frequency === "Daily") shouldAssign = true;
      if (template.frequency === "Weekly" && template.day === dayOfWeek) shouldAssign = true;
      if (template.frequency === "Monthly" && template.date === dayOfMonth) shouldAssign = true;

      if (shouldAssign) {
        newTasks.push({
          id: `t_${Date.now()}_${Math.random()}`,
          title: template.title,
          assignee: template.assignee,
          status: "Pending",
          priority: template.priority || "Medium",
          isSystem: true,
          date: dateStr
        });
      }
    });
    return newTasks;
  };

  const toggleStatus = (taskId) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) return { ...t, status: t.status === "Done" ? "Pending" : "Done" };
      return t;
    });
    setTasks(updated);
    localStorage.setItem(`igpl_tasks_${selectedDate}`, JSON.stringify(updated));
  };

  const deleteTask = (taskId) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    localStorage.setItem(`igpl_tasks_${selectedDate}`, JSON.stringify(updated));
    toast.success("Task removed");
  };

  const shiftDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const filteredTasks = useMemo(() => {
    if (filterEmp === "ALL") return tasks;
    return tasks.filter(t => t.assignee === filterEmp);
  }, [tasks, filterEmp]);

  const stats = {
    total: filteredTasks.length,
    completed: filteredTasks.filter(t => t.status === "Done").length,
    pending: filteredTasks.filter(t => t.status === "Pending").length
  };
  const progress = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  // Formatting helpers
  const formatDateDisplay = (dateStr) => {
    if(!isClient) return dateStr;
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
  };

  if (!isClient) return null; // Prevent hydration mismatch

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-20">
      <Toaster position="bottom-right" theme="light" />

      {/* --- Header --- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none">OpsCenter</h1>
                <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase">Task Dashboard</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
               {/* Custom Date Navigator */}
               <div className="flex items-center bg-gray-100 rounded-md p-1 border border-gray-200">
                  <button onClick={() => shiftDate(-1)} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-500"><ChevronLeft className="w-4 h-4"/></button>
                  <div className="relative group">
                     <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                    />
                    <div className="flex items-center gap-2 px-3 py-1 text-sm font-semibold text-slate-700 w-32 justify-center">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateDisplay(selectedDate)}
                    </div>
                  </div>
                  <button onClick={() => shiftDate(1)} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-500"><ChevronRight className="w-4 h-4"/></button>
               </div>

              <button 
                onClick={() => router.push('/dashboard/tasks/planner')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all text-sm font-medium shadow-sm hover:shadow"
              >
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- KPI Stats Row --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            label="Total Tasks" 
            value={stats.total} 
            icon={LayoutGrid} 
            color="text-indigo-600" 
            bg="bg-indigo-50" 
          />
          <StatCard 
            label="Pending" 
            value={stats.pending} 
            icon={Clock} 
            color="text-amber-600" 
            bg="bg-amber-50" 
          />
          <StatCard 
            label="Completed" 
            value={stats.completed} 
            icon={CheckCircle2} 
            color="text-emerald-600" 
            bg="bg-emerald-50" 
          />
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
             <div className="flex justify-between items-end mb-2">
                <span className="text-slate-500 text-xs font-semibold uppercase">Daily Goal</span>
                <span className="text-slate-900 font-bold text-lg">{progress}%</span>
             </div>
             <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-900 h-full rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${progress}%` }}
                ></div>
             </div>
          </div>
        </div>

        {/* --- Filters --- */}
        <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex p-1 bg-gray-100 rounded-lg border border-gray-200 shrink-0">
             <button
               onClick={() => setFilterEmp("ALL")}
               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                 filterEmp === "ALL" 
                 ? "bg-white text-slate-900 shadow-sm" 
                 : "text-slate-500 hover:text-slate-700"
               }`}
             >
               All Team
             </button>
          </div>
          <div className="w-px h-6 bg-gray-300 hidden md:block"></div>
          {EMPLOYEES.map(emp => (
            <button
              key={emp.id}
              onClick={() => setFilterEmp(emp.name)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-sm whitespace-nowrap ${
                filterEmp === emp.name 
                ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                : "bg-white border-gray-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
              }`}
            >
              <span className={`w-5 h-5 rounded-full ${emp.color} text-white flex items-center justify-center text-[9px] font-bold`}>
                {emp.initials}
              </span>
              {emp.name}
            </button>
          ))}
        </div>

        {/* --- Content Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EMPLOYEES.filter(emp => filterEmp === 'ALL' || filterEmp === emp.name).map(emp => {
             const empTasks = filteredTasks.filter(t => t.assignee === emp.name);
             if (empTasks.length === 0 && filterEmp === "ALL") return null;
             
             const doneCount = empTasks.filter(t => t.status === 'Done').length;
             const total = empTasks.length;
             const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

             return (
               <div key={emp.id} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
                  {/* Card Header */}
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${emp.color} flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white`}>
                        {emp.initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{emp.name}</h3>
                        <p className="text-xs text-slate-500">{emp.role}</p>
                      </div>
                    </div>
                    <div className="relative w-10 h-10 flex items-center justify-center">
                       <svg className="w-full h-full transform -rotate-90">
                          <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-100" />
                          <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" 
                            strokeDasharray={100} 
                            strokeDashoffset={100 - percent} 
                            className={`transition-all duration-1000 ease-out ${percent === 100 ? 'text-emerald-500' : 'text-indigo-600'}`} 
                          />
                       </svg>
                       <span className="absolute text-[10px] font-bold text-slate-700">{percent}%</span>
                    </div>
                  </div>

                  {/* Task List */}
                  <div className="flex-1 bg-white min-h-[150px]">
                    {empTasks.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                        <CheckSquare className="w-8 h-8 mb-2 opacity-20" />
                        <span className="text-xs">No tasks assigned</span>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {empTasks.map(task => (
                          <TaskItem 
                            key={task.id} 
                            task={task} 
                            onToggle={() => toggleStatus(task.id)} 
                            onDelete={() => deleteTask(task.id)} 
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Action Footer */}
                  <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                    <button 
                      onClick={() => router.push(`/dashboard/tasks/planner?emp=${emp.name}&date=${selectedDate}`)}
                      className="w-full py-2 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Assign Ad-hoc Task
                    </button>
                  </div>
               </div>
             )
          })}
        </div>
      </main>
    </div>
  );
}

// --- Sub-components for Cleaner Code ---

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`p-2.5 rounded-lg ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  )
}

function TaskItem({ task, onToggle, onDelete }) {
  const isDone = task.status === "Done";
  
  // Priority Colors
  const priorityStyle = {
    High: "bg-red-50 text-red-700 border-red-100",
    Medium: "bg-amber-50 text-amber-700 border-amber-100",
    Low: "bg-blue-50 text-blue-700 border-blue-100"
  }[task.priority] || "bg-gray-50 text-gray-600";

  return (
    <div className={`group flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors ${isDone ? 'opacity-50' : ''}`}>
      <button 
        onClick={onToggle}
        className={`mt-0.5 shrink-0 transition-all ${isDone ? 'text-emerald-500' : 'text-gray-300 hover:text-indigo-500'}`}
      >
        {isDone ? <CheckCircle2 className="w-5 h-5 fill-emerald-50" /> : <Circle className="w-5 h-5" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${isDone ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${priorityStyle}`}>
            {task.priority}
          </span>
          {task.isSystem && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
               <Clock className="w-3 h-3" /> Recurring
            </span>
          )}
        </div>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  )
}