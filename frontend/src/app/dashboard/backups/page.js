"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Server,
  X,
  Copy,
  Check,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Filter,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BackupsPage() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [backups, setBackups] = useState({ db: [], uploads: [], logs: [], cronLogs: [] });
  const [sectionLoading, setSectionLoading] = useState({ stats: true, db: true, files: true, logs: true, cron: true });
  const [actionLoading, setActionLoading] = useState(null);
  const [logPolling, setLogPolling] = useState(false);
  const [restoreModal, setRestoreModal] = useState(null);
  const [logTab, setLogTab] = useState('backup'); // 'backup' | 'cron'
  const [settingsModal, setSettingsModal] = useState(false);
  const [schedule, setSchedule] = useState('daily');
  const [autoDelete, setAutoDelete] = useState(false);
  const [retentionMonths, setRetentionMonths] = useState(3);
  const [savingSettings, setSavingSettings] = useState(false);
  const pollingRef = useRef(null);
  const logsEndRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(null); // { label: string, current: number, total: number }

  useEffect(() => {
    fetchBackups();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Auto-scroll logs to the top (newest) when new logs arrive
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollTop = 0;
    }
  }, [backups.logs]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setLogPolling(true);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await API.get("/backups");
        if (res.data.success) {
          setBackups(res.data.data);
          
          // Parse steps from the latest log
          const latestLog = res.data.data.logs[0];
          if (latestLog) {
            const backupMatch = latestLog.match(/\[BACKUP_STEP: (\d+)\/(\d+)\] (.+)/);
            const restoreMatch = latestLog.match(/\[RESTORE_STEP: (\d+)\/(\d+)\] (.+)/);
            
            if (backupMatch) {
              setCurrentStep({ current: parseInt(backupMatch[1]), total: parseInt(backupMatch[2]), label: backupMatch[3], type: 'backup' });
            } else if (restoreMatch) {
              setCurrentStep({ current: parseInt(restoreMatch[1]), total: parseInt(restoreMatch[2]), label: restoreMatch[3], type: 'restore' });
            }
          }
        }
      } catch (e) { /* silent */ }
    }, 2000);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setLogPolling(false);
  }, []);

  const fetchBackups = async () => {
    try {
      // 1. Fetch User & Settings first (Fast)
      const [userRes, settingsRes] = await Promise.all([
        API.get("/auth/me").catch(() => null),
        API.get("/backups/settings").catch(() => null)
      ]);
      
      if (userRes?.data?.success) setCurrentUser(userRes.data.data);
      if (settingsRes?.data?.success) {
        setSchedule(settingsRes.data.data.schedule || 'daily');
        setAutoDelete(settingsRes.data.data.autoDelete || false);
        setRetentionMonths(settingsRes.data.data.retentionMonths || 3);
      }
      
      setLoading(false);

      // 2. Fetch Sections "One by One" (or in parallel but update independently)
      const fetchSection = async (section) => {
        try {
          const res = await API.get(`/backups?section=${section}`);
          if (res.data.success) {
            setBackups(prev => ({ ...prev, ...res.data.data }));
          }
        } finally {
          setSectionLoading(prev => ({ ...prev, [section]: false }));
        }
      };

      fetchSection('stats');
      fetchSection('db');
      fetchSection('files');
      fetchSection('logs');
      fetchSection('cron');

    } catch (error) {
      toast.error("Failed to load backups");
      console.error(error);
    }
  };

  const handleCreateBackup = async (type) => {
    setActionLoading(type);
    startPolling();
    try {
      const res = await API.post("/backups", { type });
      if (res.data.success) {
        toast.success(res.data.data?.message || `${type === 'all' ? 'Full' : type} backup completed`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Backup failed");
    } finally {
      setActionLoading(null);
      // Final refresh and then stop polling after a couple more refreshes
      await fetchBackups();
      setTimeout(() => {
        fetchBackups();
        stopPolling();
        setCurrentStep(null);
      }, 3000);
    }
  };

  const handleRestore = async (filename, type) => {
    setRestoreModal({ filename, type });
  };

  const performRestore = async (filename, type) => {
    setActionLoading('restore');
    startPolling();
    try {
      const res = await API.post("/backups/restore", { filename, type });
      if (res.data.success) {
        toast.success(res.data.data?.message || "Restore completed successfully!");
        setRestoreModal(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Restore failed");
    } finally {
      setActionLoading(null);
      await fetchBackups();
      setTimeout(() => {
        fetchBackups();
        stopPolling();
        setCurrentStep(null);
      }, 3000);
    }
  };

  const handleDownload = async (filename, type) => {
    try {
      toast.success(`Downloading ${filename}`);
      startPolling(); // Poll to grab the immediate download log and counter increment
      await API.download(`/backups/download/${type}/${encodeURIComponent(filename)}`, {}, filename);
    } catch (error) {
      toast.error("Download failed");
      console.error(error);
    } finally {
      // Re-fetch once more after it completes, then stop polling
      await fetchBackups();
      setTimeout(() => {
        fetchBackups();
        stopPolling();
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      const res = await API.post("/backups/settings", { 
        schedule, 
        autoDelete, 
        retentionMonths 
      });
      if (res.data.success) {
        toast.success("Backup settings updated!");
        setSettingsModal(false);
      }
    } catch (error) {
      toast.error("Failed to update schedule");
      console.error(error);
    } finally {
      setSavingSettings(false);
    }
  };

  // Employees and New Joiners are read-only
  const isReadOnly = currentUser?.role === "EMPLOYEE" || currentUser?.role === "NEW_JOINNER";
  const isSuper = currentUser?.isSuper === true;

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

        {/* Stepper Progress */}
        {currentStep && (
          <div className="flex-1 max-w-md bg-white border border-blue-100 rounded-xl p-4 shadow-sm animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                {currentStep.type === 'backup' ? 'Backup Process' : 'Restore Process'}
              </span>
              <span className="text-xs font-bold text-slate-400">Step {currentStep.current} of {currentStep.total}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-blue-500 transition-all duration-1000 ease-in-out"
                style={{ width: `${(currentStep.current / currentStep.total) * 100}%` }}
              />
            </div>
            <p className="text-[11px] font-medium text-slate-700 truncate italic">
              {currentStep.label}
            </p>
          </div>
        )}
        <div className="flex items-center gap-3">
          {!isReadOnly && (
            <Button
              variant="outline"
              onClick={() => setSettingsModal(true)}
              disabled={!!actionLoading}
              className="gap-2 text-slate-600"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          )}
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
      </div>

      {sectionLoading.stats ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse flex gap-6">
          <div className="w-24 h-12 bg-slate-100 rounded" />
          <div className="w-48 h-12 bg-slate-100 rounded" />
          <div className="w-32 h-12 bg-slate-100 rounded" />
        </div>
      ) : backups.storage && (
        <div className="flex flex-wrap gap-6 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
            <div className="p-2.5 bg-indigo-100 rounded-lg"><HardDrive className="w-5 h-5 text-indigo-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-0.5">Software Take Space in System</p>
              <p className="font-bold text-slate-800 text-lg">{backups.storage.totalFormatted}</p>
            </div>
          </div>

          {/* Server Disk Stats */}
          {(backups.storage.diskTotalFormatted !== 'Unknown' && backups.storage.diskTotalFormatted !== '0.0 KB') && (
            <div className="flex flex-col gap-2 pr-6 border-r border-slate-200 min-w-[280px]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-lg"><Server className="w-5 h-5 text-emerald-500" /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs text-slate-500 font-medium">Server Disk Space</p>
                    <p className="text-[10px] text-slate-400 font-medium flex items-center">Free / Total</p>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">
                    <span className="text-emerald-600 font-semibold">{backups.storage.diskFreeFormatted}</span> / {backups.storage.diskTotalFormatted}
                  </p>
                </div>
              </div>
              {(() => {
                const total = backups.storage.diskTotal || 0;
                const free = backups.storage.diskFree || 0;
                const used = total - free;
                const percent = total > 0 ? (used / total) * 100 : 0;
                let color = "bg-green-500";
                if (percent >= 95) color = "bg-red-700";
                else if (percent >= 90) color = "bg-red-500";
                else if (percent >= 60) color = "bg-amber-400";

                return (
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-0.5">
                    <div
                      className={`h-full ${color} transition-all duration-500 ease-in-out`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex items-center gap-2.5 pr-6 border-r border-slate-200">
            <div className="p-2 bg-blue-50 rounded-lg"><Server className="w-4 h-4 text-blue-500" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-0.5">Database Backups</p>
              <p className="font-semibold text-slate-700">{backups.storage.dbFormatted}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 rounded-lg"><FileArchive className="w-4 h-4 text-amber-500" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-0.5">File Uploads</p>
              <p className="font-semibold text-slate-700">{backups.storage.filesFormatted}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BackupListCard
          title="Database Backups"
          subtitle="PostgreSQL .sql / .json dumps"
          icon={<Server className="w-5 h-5" />}
          iconBg="bg-blue-100 text-blue-600"
          emptyIcon={<DatabaseBackup className="w-10 h-10 mb-2 opacity-20" />}
          emptyText="No database backups found"
          files={backups.db}
          type="db"
          actionLabel="Backup DB"
          actionIcon={<HardDrive className="w-4 h-4 mr-2" />}
          actionClass="bg-blue-600 hover:bg-blue-700"
          actionLoading={actionLoading}
          sectionLoading={sectionLoading.db}
          onBackup={() => handleCreateBackup('db')}
          onDownload={handleDownload}
          onRestore={handleRestore}
          disabled={isReadOnly}
          canRestore={isSuper}
        />

        <BackupListCard
          title="File Uploads Backups"
          subtitle="User uploads archives"
          icon={<HardDrive className="w-5 h-5" />}
          iconBg="bg-amber-100 text-amber-600"
          emptyIcon={<HardDrive className="w-10 h-10 mb-2 opacity-20" />}
          emptyText="No file backups found"
          files={backups.uploads}
          type="files"
          actionLabel="Backup Files"
          actionIcon={<FolderArchive className="w-4 h-4 mr-2" />}
          actionClass="border-amber-200 text-amber-700 hover:bg-amber-50"
          actionVariant="outline"
          actionLoading={actionLoading}
          sectionLoading={sectionLoading.files}
          onBackup={() => handleCreateBackup('files')}
          onDownload={handleDownload}
          onRestore={handleRestore}
          disabled={isReadOnly}
          canRestore={isSuper}
        />
      </div>

      {/* Logs Section */}
      <div className="bg-slate-900 rounded-xl overflow-hidden text-slate-300 font-mono text-xs shadow-lg">
        <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className={`w-3 h-3 rounded-full ${logPolling ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`} />

            {/* Tabs */}
            <div className="flex ml-3 bg-slate-700/50 rounded-lg p-0.5">
              <button
                onClick={() => setLogTab('backup')}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${logTab === 'backup'
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                backup.log
              </button>
              <button
                onClick={() => setLogTab('cron')}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${logTab === 'cron'
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                cron.log
              </button>
            </div>

            {logPolling && <span className="text-green-400 text-[10px] ml-2">● LIVE</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-slate-500">
              {backups.paths?.backupDir || ''}/logs/{logTab === 'backup' ? 'backup' : 'cron'}.log
            </div>
            <button
              onClick={fetchBackups}
              className="text-slate-400 hover:text-white transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div ref={logsEndRef} className="p-4 h-56 overflow-y-auto space-y-1">
          {sectionLoading.logs || sectionLoading.cron ? (
            <div className="flex flex-col gap-2 animate-pulse">
               <div className="h-4 bg-slate-800 rounded w-3/4" />
               <div className="h-4 bg-slate-800 rounded w-1/2" />
               <div className="h-4 bg-slate-800 rounded w-2/3" />
            </div>
          ) : (() => {
            const currentLogs = logTab === 'backup' ? backups.logs : (backups.cronLogs || []);
            return currentLogs.length > 0 ? (
              currentLogs.map((log, i) => (
                <div key={i} className={`border-b border-slate-800/50 pb-1 last:border-0 ${i === 0 && logPolling ? 'text-green-300' : ''}`}>
                  {log}
                </div>
              ))
            ) : (
              <div className="text-slate-600 italic">No logs available...</div>
            );
          })()}
        </div>
      </div>

      {/* Settings Modal */}
      {settingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" /> Backup Settings
              </h3>
              <button onClick={() => setSettingsModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Automated Backup Schedule</label>
                <div className="space-y-3">
                  {[
                    { id: 'daily', label: 'Daily (12:00 AM)' },
                    { id: 'weekly', label: 'Once a Week (Sunday 12:00 AM)' },
                    { id: 'fortnightly', label: 'Once in 15 Days (Every 15th 12:00 AM)' },
                    { id: 'monthly', label: 'Once in 30 Days (Every 1st 12:00 AM)' }
                  ].map((option) => (
                    <label key={option.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${schedule === option.id ? 'border-blue-600 bg-blue-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}>
                      <input
                        type="radio"
                        name="schedule"
                        value={option.id}
                        checked={schedule === option.id}
                        onChange={(e) => setSchedule(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600"
                      />
                      <span className={`text-sm ${schedule === option.id ? 'font-semibold text-blue-900' : 'font-medium text-slate-700'}`}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3">This schedule applies to both database backups and file uploads backups simultaneously.</p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-800">Auto-Delete Records</label>
                    <p className="text-xs text-slate-500">Automatically remove old backups to save space.</p>
                  </div>
                  <button
                    onClick={() => setAutoDelete(!autoDelete)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoDelete ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoDelete ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {autoDelete && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Retention Period</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 1, label: '1 Month', color: 'text-red-600 border-red-100 bg-red-50 hover:bg-red-100' },
                        { id: 3, label: '3 Months', color: 'text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-100' },
                        { id: 5, label: '5 Months', color: 'text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-100' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setRetentionMonths(opt.id)}
                          className={`px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all ${
                            retentionMonths === opt.id 
                              ? (opt.id === 1 ? 'border-red-500 bg-red-100 text-red-700' : 'border-blue-500 bg-blue-100 text-blue-700') 
                              : 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Records older than the selected period will be permanently deleted from the server.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setSettingsModal(false)} disabled={savingSettings}>Cancel</Button>
              <Button onClick={handleSaveSettings} disabled={savingSettings} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]">
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {restoreModal && (
        <RestoreModal
          filename={restoreModal.filename}
          type={restoreModal.type}
          onClose={() => setRestoreModal(null)}
          onConfirm={() => performRestore(restoreModal.filename, restoreModal.type)}
          isLoading={actionLoading === 'restore'}
        />
      )}
    </div>
  );
}

const PER_PAGE = 20;

function BackupListCard({
  title, subtitle, icon, iconBg, emptyIcon, emptyText,
  files, type, actionLabel, actionIcon, actionClass, actionVariant,
  actionLoading, sectionLoading, onBackup, onDownload, onRestore, disabled, canRestore
}) {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter by date range
  const filtered = files.filter((f) => {
    if (startDate && f.date < startDate) return false;
    if (endDate && f.date > endDate) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [startDate, endDate, files]);

  const isLoading = actionLoading === type;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
          <div>
            <h3 className="font-semibold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onBackup}
          disabled={!!actionLoading || disabled}
          variant={actionVariant || "default"}
          className={actionClass}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : actionIcon}
          {actionLabel}
        </Button>
      </div>

      {/* Date Filter */}
      {files.length > 0 && (
        <div className="px-4 pt-3 pb-1 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-xs text-slate-400 hover:text-slate-600 ml-1">
              Clear
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto">Results: {filtered.length}</span>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-auto max-h-[400px] p-2">
        {sectionLoading ? (
           <div className="space-y-3 p-4 animate-pulse">
             {[1,2,3].map(i => (
               <div key={i} className="flex gap-4">
                 <div className="w-8 h-8 bg-slate-100 rounded-full" />
                 <div className="flex-1 space-y-2">
                   <div className="h-3 bg-slate-100 rounded w-1/2" />
                   <div className="h-2 bg-slate-100 rounded w-1/4" />
                 </div>
               </div>
             ))}
           </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-slate-400">
            {emptyIcon}
            <p className="text-sm">{(startDate || endDate) ? 'No backups in this date range' : emptyText}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {paginated.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <FileArchive className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{file.name}</p>
                    <div className="flex gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {file.date}</span>
                      <span className="font-mono">{file.size}</span>
                      {file.downloads > 0 && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium text-[10px]">
                          <Download className="w-3 h-3" /> {file.downloads}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400" title="Download" onClick={() => onDownload(file.name, type)} disabled={disabled}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400" title={canRestore ? "Restore" : "Restore restricted to Superadmin"} onClick={() => onRestore(file.name, type)} disabled={disabled || !canRestore}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RestoreModal({ filename, type, onClose, onConfirm, isLoading }) {
  const [confirmText, setConfirmText] = useState("");
  const expectedText = "RESTORE";

  const isDb = type === 'db';
  const title = isDb ? 'Restore Database State' : 'Restore Media Assets';
  
  // Format the filename date (e.g., db_2024-03-15-12-00.sql -> 15th March 2024, 12:00 PM)
  const formatBackupDate = (fname) => {
    try {
      const match = fname.match(/(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/);
      if (!match) return fname;
      const [_, year, month, day, hour, minute] = match;
      const date = new Date(year, month - 1, day, hour, minute);
      
      const dayNum = parseInt(day);
      const suffix = ["th", "st", "nd", "rd"][(dayNum % 10 > 3 || Math.floor(dayNum % 100 / 10) === 1) ? 0 : dayNum % 10];
      
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).replace(day, day + suffix) + " at " + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return fname;
    }
  };

  const backupDateLabel = formatBackupDate(filename);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={!isLoading ? onClose : undefined}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDb ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[240px] uppercase tracking-tighter">{filename}</p>
            </div>
          </div>
          {!isLoading && (
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-black text-rose-900 uppercase tracking-tight">Critical Warning: Data Overwrite</p>
              <p className="text-sm text-rose-800 leading-relaxed font-medium">
                You are about to <span className="underline decoration-2">permanently wipe</span> your current {isDb ? 'database records' : 'media assets'} and replace them with the data from:
                <span className="block mt-2 px-3 py-2 bg-white/50 rounded border border-rose-200 text-rose-950 font-bold italic">
                  {backupDateLabel}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <DatabaseBackup className="w-4 h-4 flex-shrink-0" />
              <p className="text-[11px] font-semibold">A safety rollback snapshot will be generated automatically before the wipe begins.</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execution Sequence:</p>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  "Create emergency rollback point",
                  isDb ? "Purge existing PostgreSQL schema" : "Wipe server uploads directory",
                  "Stream backup data to production",
                  "Verify structural integrity & logs"
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600 font-bold">
                    <Check className="w-3 h-3 text-emerald-500" />
                    {step}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 space-y-3 border-t border-slate-100">
              <p className="text-xs text-slate-600 leading-snug">
                To confirm you understand that current data will be <span className="text-rose-600 font-black">LOST</span>, please manually type the word <span className="font-black text-slate-900 px-1.5 py-0.5 bg-slate-100 rounded">{expectedText}</span> below. 
                <span className="block mt-1 text-[10px] text-slate-400 italic">(Copy-paste is disabled for safety)</span>
              </p>
              
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onPaste={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                autoFocus
                disabled={isLoading}
                placeholder={`TYPE ${expectedText} TO PROCEED`}
                className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-black text-center tracking-[0.2em] uppercase disabled:opacity-50 text-xl"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col gap-3">
          <Button 
            onClick={onConfirm} 
            disabled={isLoading || confirmText !== expectedText}
            className={`w-full py-7 rounded-xl font-black text-lg shadow-xl transition-all ${
              confirmText === expectedText 
                ? 'bg-blue-600 hover:bg-blue-700 text-white scale-[1.02] shadow-blue-200' 
                : 'bg-slate-200 text-slate-400 grayscale'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Executing Restore Sequence...
              </span>
            ) : (
              'Confirm & Start Restore'
            )}
          </Button>
          {!isLoading && (
            <button onClick={onClose} className="text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors py-2">
              Cancel Restoration
            </button>
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
