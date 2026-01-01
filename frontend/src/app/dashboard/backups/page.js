"use client";

import React, { useState, useEffect } from "react";
import API from "@/lib/api";
import { toast } from "sonner";
import {
  DatabaseBackup,
  Loader2,
  HardDrive,
  FileArchive,
  RefreshCw,
  Clock,
  RotateCcw,
  AlertTriangle,
  Download,
  Server
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BackupsPage() {
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState({ db: [], uploads: [], logs: [] });
  const [actionLoading, setActionLoading] = useState(null); // 'db' | 'files' | 'restore'

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setActionLoading('refresh');
      const res = await API.get("/backups");
      if (res.data.success) {
        setBackups(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to load backups");
      console.error(error);
    } finally {
      setLoading(false);
      setActionLoading(null);
    }
  };

  const handleCreateBackup = async (type) => {
    setActionLoading(type);
    try {
      const res = await API.post("/backups", { type });
      if (res.data.success) {
        toast.success(`${type === 'all' ? 'Full' : type} backup started`);
        // Refresh list after a moment or expect socket update(in future)
        // For now, simple timeout refresh as script runs in background
        setTimeout(fetchBackups, 3000); 
      }
    } catch (error) {
      toast.error("Backup failed to start");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (filename, type) => {
      // In production, you'd likely want a confirmation modal
     if(!confirm(`Are you sure you want to RESTORE ${filename}? This will overwrite current data!`)) return;

     setActionLoading('restore');
     try {
       const res = await API.post("/backups/restore", { filename, type });
       if (res.data.success) {
         toast.success(res.data.message);
       }
     } catch(error) {
        toast.error(error.response?.data?.message || "Restore failed");
     } finally {
        setActionLoading(null);
     }
  };

  if (loading) {
     return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
             <DatabaseBackup className="w-8 h-8 text-blue-600" />
             System Backups & Recovery
          </h1>
          <p className="text-slate-500 mt-1">Manage database snapshots and file system archives.</p>
        </div>
        <Button 
            variant="outline" 
            onClick={fetchBackups} 
            disabled={!!actionLoading}
            className="gap-2"
        >
            <RefreshCw className={`w-4 h-4 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
            Refresh List
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Database Backups Card */}
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Server className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800">Database Backups</h3>
                        <p className="text-xs text-slate-500">PostgreSQL .sql.gz dumps</p>
                    </div>
                </div>
                <Button 
                    size="sm" 
                    onClick={() => handleCreateBackup('db')}
                    disabled={!!actionLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {actionLoading === 'db' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <HardDrive className="w-4 h-4 mr-2" />}
                    Backup DB
                </Button>
            </div>
            
            <div className="flex-1 overflow-auto max-h-[400px] p-2">
                {backups.db.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-10 text-slate-400">
                        <DatabaseBackup className="w-10 h-10 mb-2 opacity-20" />
                        <p className="text-sm">No database backups found</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {backups.db.map((file, i) => (
                             <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                        <FileArchive className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{file.name}</p>
                                        <div className="flex gap-3 text-xs text-slate-400">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {file.date}</span>
                                            <span className="font-mono">{file.size}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600" title="Download (Not Implemented)">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-slate-400 hover:text-red-600" 
                                        onClick={() => handleRestore(file.name, 'db')}
                                        title="Restore this backup"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </Button>
                                </div>
                             </div>
                        ))}
                    </div>
                )}
            </div>
         </div>

         {/* File Backups Card */}
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                        <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800">File Uploads Backups</h3>
                        <p className="text-xs text-slate-500">User uploads .tar.gz archives</p>
                    </div>
                </div>
                <Button 
                    size="sm" 
                    onClick={() => handleCreateBackup('files')}
                    disabled={!!actionLoading}
                    variant="outline"
                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                    {actionLoading === 'files' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FolderArchive className="w-4 h-4 mr-2" />}
                    Backup Files
                </Button>
            </div>
            
            <div className="flex-1 overflow-auto max-h-[400px] p-2">
                 {backups.uploads.length === 0 ? (
                     <div className="flex flex-col items-center justify-center p-10 text-slate-400">
                        <HardDrive className="w-10 h-10 mb-2 opacity-20" />
                        <p className="text-sm">No file backups found</p>
                    </div>
                 ) : (
                    <div className="space-y-1">
                        {backups.uploads.map((file, i) => (
                             <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                        <FileArchive className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{file.name}</p>
                                        <div className="flex gap-3 text-xs text-slate-400">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {file.date}</span>
                                            <span className="font-mono">{file.size}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600" title="Download (Not Implemented)">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                                        onClick={() => handleRestore(file.name, 'files')}
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </Button>
                                </div>
                             </div>
                        ))}
                    </div>
                 )}
            </div>
         </div>
      </div>
      
      {/* Logs Section */}
      <div className="bg-slate-900 rounded-xl overflow-hidden text-slate-300 font-mono text-xs shadow-lg">
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"/>
                <div className="w-3 h-3 rounded-full bg-amber-500"/>
                <div className="w-3 h-3 rounded-full bg-green-500"/>
                <span className="ml-2 font-semibold">backup.log</span>
             </div>
             <div className="text-slate-500">/var/backups/impexina/logs/backup.log</div>
          </div>
          <div className="p-4 h-48 overflow-y-auto space-y-1">
             {backups.logs.length > 0 ? (
                 backups.logs.map((log, i) => (
                    <div key={i} className="border-b border-slate-800/50 pb-1 last:border-0">{log}</div>
                 ))
             ) : (
                <div className="text-slate-600 italic">No logs available...</div>
             )}
          </div>
      </div>
    </div>
  );
}

function FolderArchive(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <path d="M12 11v6" />
      <path d="m9 14 3 3 3-3" />
    </svg>
  )
}
