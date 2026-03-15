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
  const [actionLoading, setActionLoading] = useState(null);
  const [logPolling, setLogPolling] = useState(false);
  const [restoreModal, setRestoreModal] = useState(null);
  const [logTab, setLogTab] = useState('backup'); // 'backup' | 'cron'
  const [settingsModal, setSettingsModal] = useState(false);
  const [schedule, setSchedule] = useState('daily');
  const [savingSettings, setSavingSettings] = useState(false);
  const pollingRef = useRef(null);
  const logsEndRef = useRef(null);

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
      setActionLoading('refresh');
      const [res, userRes, settingsRes] = await Promise.all([
        API.get("/backups"),
        API.get("/auth/me").catch(() => null),
        API.get("/backups/settings").catch(() => null)
      ]);

      if (res.data.success) {
        setBackups(res.data.data);
      }
      if (userRes?.data?.success) {
        setCurrentUser(userRes.data.data);
      }
      if (settingsRes?.data?.success) {
        setSchedule(settingsRes.data.data.schedule || 'daily');
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
      }, 3000);
    }
  };

  const handleRestore = (filename, type) => {
    setRestoreModal({ filename, type });
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
      const res = await API.post("/backups/settings", { schedule });
      if (res.data.success) {
        toast.success("Backup schedule updated!");
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

      {backups.storage && (
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
          onBackup={() => handleCreateBackup('db')}
          onDownload={handleDownload}
          onRestore={handleRestore}
          disabled={isReadOnly}
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
          onBackup={() => handleCreateBackup('files')}
          onDownload={handleDownload}
          onRestore={handleRestore}
          disabled={isReadOnly}
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
          {(() => {
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

      {/* Restore Instructions Modal */}
      {restoreModal && (
        <RestoreCommandsModal
          filename={restoreModal.filename}
          type={restoreModal.type}
          backupDir={backups.paths?.backupDir || '/root/apps/backup'}
          onClose={() => setRestoreModal(null)}
        />
      )}
    </div>
  );
}

const PER_PAGE = 20;

function BackupListCard({
  title, subtitle, icon, iconBg, emptyIcon, emptyText,
  files, type, actionLabel, actionIcon, actionClass, actionVariant,
  actionLoading, onBackup, onDownload, onRestore, disabled
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
        {filtered.length === 0 ? (
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
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400" title="Restore" onClick={() => onRestore(file.name, type)} disabled={disabled}>
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

function RestoreCommandsModal({ filename, type, backupDir, onClose }) {
  const [copiedIdx, setCopiedIdx] = useState(null);

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const isGz = filename.endsWith('.gz');
  const isSql = filename.endsWith('.sql') || filename.endsWith('.sql.gz');
  const isJson = filename.endsWith('.json');

  let commands = [];
  let title = '';
  let warning = '';

  const isWindows = backupDir.includes(':\\') || backupDir.includes(':/');
  const winTargetObj = '../../backend/';
  const winTargetObjUploads = '../../backend/uploads';
  const linuxTargetObj = '/root/apps/impexina/backend/';
  const linuxTargetObjUploads = '/root/apps/impexina/backend/uploads';
  const targetObj = isWindows ? winTargetObj : linuxTargetObj;
  const targetObjUploads = isWindows ? winTargetObjUploads : linuxTargetObjUploads;

  const getRestartCmd = () => isWindows ? `npm run dev` : `pm2 restart impexina-backend`;

  if (type === 'db') {
    title = 'Restore Database Backup';
    warning = '⚠️ This will OVERWRITE your current database. Make sure you have a recent backup before restoring.';

    if (isJson) {
      commands = [
        { label: 'Step 1: Navigate to backup directory', cmd: `cd ${backupDir}/db` },
        { label: 'Step 2: View the backup contents', cmd: `cat ${filename} | head -100` },
        { label: 'Note', cmd: `# JSON backups must be restored programmatically via Prisma.\n# Import the JSON data using a custom script.` },
      ];
    } else if (isGz) {
      commands = [
        { label: 'Step 1: Navigate to backup directory', cmd: `cd "${backupDir}/db"` },
        { label: 'Step 2: Decompress the backup', cmd: `gunzip -k ${filename}` },
        { label: 'Step 3: Restore to PostgreSQL', cmd: `psql -h localhost -U postgres -d impexina_db -f ${filename.replace('.gz', '')}` },
        { label: 'Step 4: Restart the backend', cmd: getRestartCmd() },
      ];
    } else if (isSql) {
      commands = [
        { label: 'Step 1: Navigate to backup directory', cmd: `cd "${backupDir}/db"` },
        { label: 'Step 2: Restore to PostgreSQL', cmd: `psql -h localhost -U postgres -d impexina_db -f ${filename}` },
        { label: 'Step 3: Restart the backend', cmd: getRestartCmd() },
      ];
    }
  } else {
    title = 'Restore Files Backup';
    warning = '⚠️ This will OVERWRITE your current uploads folder.';

    const isZip = filename.endsWith('.zip');
    if (isZip) {
      commands = [
        { label: 'Step 1: Navigate to backup directory', cmd: `cd "${backupDir}/files"` },
        { label: 'Step 2: Remove existing uploads (optional)', cmd: `rm -rf ${targetObjUploads}` },
        { label: 'Step 3: Extract the backup', cmd: `unzip ${filename} -d ${targetObj}` },
        { label: 'Step 4: Restart the backend', cmd: getRestartCmd() },
      ];
    } else {
      commands = [
        { label: 'Step 1: Navigate to backup directory', cmd: `cd "${backupDir}/files"` },
        { label: 'Step 2: Remove existing uploads (optional)', cmd: `rm -rf ${targetObjUploads}` },
        { label: 'Step 3: Extract the backup', cmd: `tar -xzf ${filename} -C ${targetObj}` },
        { label: 'Step 4: Restart the backend', cmd: getRestartCmd() },
      ];
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <Terminal className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                <p className="text-sm text-slate-500 font-mono">{filename}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Warning */}
        <div className="mx-6 mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">{warning}</p>
          </div>
        </div>

        {/* Commands */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 font-medium">Run these commands on your server via SSH:</p>
          {commands.map((step, idx) => (
            <div key={idx} className="group">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{step.label}</div>
              <div className="bg-slate-900 rounded-xl overflow-hidden">
                <div className="flex items-start justify-between p-4">
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap break-all flex-1 select-all">{step.cmd}</pre>
                  <button
                    onClick={() => copyToClipboard(step.cmd, idx)}
                    className="ml-3 p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-700 transition-colors flex-shrink-0"
                    title="Copy command"
                  >
                    {copiedIdx === idx ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Always verify your backup before restoring.</p>
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
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
