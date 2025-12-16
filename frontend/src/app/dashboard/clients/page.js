"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Phone, 
  Mail, 
  MapPin,
  UserCheck,
  UserPlus,
  ArrowRight
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { Badge } from "@/components/ui/badge"; // Assuming you have a basic badge, or replace with span

export default function ClientManagement() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'leads', 'clients'
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState([]);

  // --- Load Data ---
  useEffect(() => {
    // Simulated data load - replace with your real API/LocalStorage
    const saved = localStorage.getItem("igpl_crm_records");
    if (saved) {
      setRecords(JSON.parse(saved));
    } else {
      // Seed Data
      const seeds = [
        { id: "c1", type: "client", name: "Kaushik Traders", contact: "Kaushik Bhai", phone: "9876543210", email: "kaushik@example.com", city: "Surat", status: "Active", lastActive: "2024-12-01" },
        { id: "l1", type: "lead", name: "New Era Logistics", contact: "Rahul Verma", phone: "9988776655", email: "rahul@newera.com", city: "Delhi", status: "New", source: "Referral" },
        { id: "c2", type: "client", name: "Charu Enterprises", contact: "Charu Ma'am", phone: "9123456789", email: "charu@example.com", city: "Mumbai", status: "Active", lastActive: "2024-12-10" },
      ];
      setRecords(seeds);
      localStorage.setItem("igpl_crm_records", JSON.stringify(seeds));
    }
  }, []);

  // --- Filter Logic ---
  const filtered = records.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                          r.contact.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "all" ? true : r.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: records.length,
    leads: records.filter(r => r.type === 'lead').length,
    clients: records.filter(r => r.type === 'client').length
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <Toaster position="top-right" />
      
      {/* Header Stats */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">CRM & Client Management</h1>
            <p className="text-slate-500">Manage your leads pipeline and active client accounts.</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/clients/new')}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" /> Add New Record
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                 <div className="text-slate-500 text-xs font-bold uppercase tracking-wide">Total Records</div>
                 <div className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</div>
              </div>
              <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                 <UserCheck className="w-5 h-5" />
              </div>
           </div>
           <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                 <div className="text-blue-600 text-xs font-bold uppercase tracking-wide">Active Clients</div>
                 <div className="text-3xl font-bold text-slate-900 mt-1">{stats.clients}</div>
              </div>
              <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 relative z-10">
                 <UserCheck className="w-5 h-5" />
              </div>
              <div className="absolute right-0 top-0 h-full w-1 bg-blue-500" />
           </div>
           <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                 <div className="text-amber-600 text-xs font-bold uppercase tracking-wide">Pending Leads</div>
                 <div className="text-3xl font-bold text-slate-900 mt-1">{stats.leads}</div>
              </div>
              <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 relative z-10">
                 <UserPlus className="w-5 h-5" />
              </div>
              <div className="absolute right-0 top-0 h-full w-1 bg-amber-500" />
           </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          
          {/* Tabs & Search */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50">
             <div className="flex bg-slate-200/60 p-1 rounded-lg self-start">
                {['all', 'client', 'lead'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === tab 
                        ? "bg-white text-slate-900 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1) + (tab !== 'all' ? 's' : '')}
                  </button>
                ))}
             </div>

             <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, phone or contact..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none text-sm"
                />
             </div>
          </div>

          {/* Records List */}
          <div className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
               <div className="p-12 text-center text-slate-400">
                  <p>No records found.</p>
               </div>
            ) : (
              filtered.map((record) => (
                <div 
                  key={record.id} 
                  onClick={() => router.push(`/dashboard/clients/${record.id}`)}
                  className="p-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${
                      record.type === 'client' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {record.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 text-base">{record.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          record.type === 'client'
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {record.type}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-3">
                        <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {record.contact}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {record.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                     <div className="text-right hidden md:block">
                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Status</div>
                        <div className={`text-sm font-semibold ${
                           record.status === 'Active' ? 'text-green-600' : 'text-slate-600'
                        }`}>
                           {record.status}
                        </div>
                     </div>
                     <div className="text-right hidden md:block">
                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Phone</div>
                        <div className="text-sm font-medium text-slate-900">{record.phone}</div>
                     </div>
                     <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}