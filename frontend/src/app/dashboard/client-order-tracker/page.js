"use client";

import React, { useState, useEffect } from "react";
import API from "@/lib/api";
import { toast } from "sonner";
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Calendar, 
  MoreVertical,
  Trash2,
  ExternalLink,
  DollarSign,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ClientOrderSheets() {
  const router = useRouter();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // New Sheet State
  const [newSheetName, setNewSheetName] = useState("");

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    try {
      const res = await API.get("/client-order-tracker/sheets");
      if (res.data.success) {
        setSheets(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to load order sheets");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSheet = async (e) => {
    e.preventDefault();
    if (!newSheetName.trim()) return;

    try {
      const res = await API.post("/client-order-tracker/sheets", {
        name: newSheetName,
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
      });
      if (res.data.success) {
        toast.success("Sheet created successfully");
        setNewSheetName("");
        setIsCreating(false);
        fetchSheets();
        router.push(`/dashboard/client-order-tracker/${res.data.data.id}`);
      }
    } catch (error) {
      toast.error("Failed to create sheet");
    }
  };

  const handleDeleteSheet = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure? This will delete the sheet and all its orders.")) return;

    try {
      await API.delete(`/client-order-tracker/sheets/${id}`);
      toast.success("Sheet deleted");
      setSheets(sheets.filter(s => s.id !== id));
    } catch (error) {
      toast.error("Failed to delete sheet");
    }
  };

  const filteredSheets = sheets.filter(sheet => 
    sheet.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Order Sheets</h1>
          <p className="text-slate-500">Manage monthly order tracking sheets</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Sheet
          </Button>
        </div>
      </div>

      {isCreating && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
          <form onSubmit={handleCreateSheet} className="flex gap-3">
            <input
              type="text"
              value={newSheetName}
              onChange={(e) => setNewSheetName(e.target.value)}
              placeholder="e.g. January 2025 Orders"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              autoFocus
            />
            <Button type="submit">Create</Button>
            <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sheets..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSheets.map((sheet) => (
          <div 
            key={sheet.id}
            onClick={() => router.push(`/dashboard/client-order-tracker/${sheet.id}`)}
            className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => handleDeleteSheet(sheet.id, e)}
                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
              {sheet.name}
            </h3>
            
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
              <Calendar className="w-3 h-3" />
              <span>{new Date(sheet.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-4 py-3 border-t border-slate-100">
               <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">{sheet._count?.orders || 0}</span>
                  <span className="text-xs text-slate-400">Orders</span>
               </div>
               <div className="flex items-center gap-1.5 ml-auto">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-sm font-semibold text-emerald-600">
                    {sheet.totalAmount?.toLocaleString()}
                  </span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}