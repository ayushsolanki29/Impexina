"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Package, Search, Calendar, CheckCircle2, Circle, Plus, ChevronRight, LayoutGrid, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { get } from "@/lib/api";

export default function ClientContainersPage() {
  const { id } = useParams();
  const router = useRouter();
  const [containers, setContainers] = useState([]);
  const [blankSheets, setBlankSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchContainers();
  }, [id]);

  const fetchContainers = async () => {
    try {
      setLoading(true);
      // Fetch containers
      const res = await get(`/accounts/clts/${id}/containers`);
      if (res.success) {
        setContainers(res.data.containers || []);
        setBlankSheets(res.data.blankSheets || []);
      }
      
      // Also fetch client name for header
      const clientRes = await get(`/accounts/clts/${id}`); // Assuming this endpoint returns client details too
      if (clientRes.success) {
          setClientName(clientRes.data.name);
      }
      
    } catch (error) {
      toast.error("Failed to load containers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const allItems = useMemo(() => {
    const combined = [
      ...containers.map(c => ({ ...c, type: 'CONTAINER', sheetName: c.sheetName || `${clientName} ${c.containerCode} ${new Date().toLocaleString('en-US', { month: 'long' })}`.toUpperCase() })),
      ...blankSheets.map(bs => ({ ...bs, type: 'CUSTOM_SHEET' }))
    ];

    if (!search) {
      return combined;
    }

    const lowercasedSearch = search.toLowerCase();
    return combined.filter(item => {
      const name = item.sheetName || item.containerCode; // Use sheetName for custom, containerCode for container
      return name.toLowerCase().includes(lowercasedSearch);
    });
  }, [containers, blankSheets, search, clientName]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;

  return (
    <div className="min-h-screen bg-white font-sans transition-all duration-500">
      <div className="max-w-5xl mx-auto pt-10 space-y-12 pb-20 px-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <button 
                onClick={() => router.push(`/dashboard/accounts/clients`)}
                className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-100"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
               <div className="flex items-center gap-2 mb-1">
                   <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{clientName || 'Loading...'}</span>
               </div>
               <h1 className="text-3xl font-light text-slate-900 tracking-tight">Select Workspace</h1>
            </div>
          </div>
          
          <div className="relative w-full md:w-64">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  placeholder="Find workspace..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 bg-transparent border-b border-slate-100 focus:border-slate-400 outline-none transition-all placeholder:text-slate-200 text-sm"
                />
          </div>
        </div>

        {/* Primary Actions - Lighter Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Full Ledger Card */}
            <div 
                onClick={() => router.push(`/dashboard/accounts/clients/${id}`)}
                className="group relative bg-white p-10 rounded-[2rem] border border-slate-100 hover:border-slate-900 transition-all cursor-pointer flex flex-col justify-between h-56 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]"
            >
                <div>
                   <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-all">
                       <LayoutGrid className="w-6 h-6" />
                   </div>
                   <h2 className="text-2xl font-medium text-slate-900 mb-2">View Entire Ledger</h2>
                   <p className="text-slate-400 text-sm font-normal">Unified view of all transactions.</p>
                </div>
                <div className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Access <ArrowRight className="w-3.5 h-3.5" />
                </div>
            </div>

            {/* New Sheet Card */}
            <div 
                onClick={() => {
                    const monthStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
                    router.push(`/dashboard/accounts/clients/${id}?sheetName=${encodeURIComponent(monthStr)}`);
                }}
                className="group relative bg-white p-10 rounded-[2rem] border border-slate-100 hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between h-56 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]"
            >
                <div>
                   <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                       <Plus className="w-6 h-6" />
                   </div>
                   <h2 className="text-2xl font-medium text-slate-900 mb-2">Start New Sheet</h2>
                   <p className="text-slate-400 text-sm font-normal">Begin a fresh blank ledger.</p>
                </div>
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Create <ArrowRight className="w-3.5 h-3.5" />
                </div>
            </div>
        </div>

        {/* Workspaces List */}
        <div className="space-y-6">
            <h2 className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em] ml-2">Recent Workspaces</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {allItems.map((item, idx) => {
                    const isContainer = item.type === 'CONTAINER';
                    const containerCode = item.containerCode;
                    const sheetName = item.sheetName;
                    
                    const path = isContainer 
                        ? `/dashboard/accounts/clients/${id}?containerCode=${encodeURIComponent(containerCode)}`
                        : `/dashboard/accounts/clients/${id}?sheetName=${encodeURIComponent(sheetName)}`;

                    return (
                        <div 
                            key={idx}
                            onClick={() => router.push(path)}
                            className="group cursor-pointer flex flex-col pt-6 border-t border-slate-100/60 hover:border-slate-300 transition-colors h-48"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                    isContainer ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"
                                }`}>
                                    {isContainer ? "Container" : "Custom Sheet"}
                                </span>
                                <span className="text-[10px] font-medium text-slate-300">
                                    {new Date(item.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            
                            <h4 className="text-xl font-medium text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                                {isContainer ? `Container: ${containerCode}` : sheetName}
                            </h4>
                            
                            {isContainer && sheetName && sheetName !== containerCode && (
                                <p className="text-xs text-slate-400 font-normal truncate mb-4 italic">
                                    Sheet: {sheetName}
                                </p>
                            )}

                            <div className="mt-auto flex items-center justify-between text-[11px] font-medium text-slate-300 uppercase tracking-widest group-hover:text-blue-500 transition-colors">
                                <span>Open Ledger</span>
                                <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    );
                })}

                {allItems.length === 0 && (
                    <div className="col-span-full py-24 text-center">
                        <p className="text-slate-300 font-light text-xl italic">No matching workspaces.</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
