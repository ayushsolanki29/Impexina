const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const backupService = require("../modules/backup/backup.service");

// Cron log file — same backup directory
const IS_WINDOWS = process.platform === "win32";
const APP_ROOT = process.env.APP_ROOT || path.resolve(__dirname, "../../../");
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(APP_ROOT, "backup");
const LOGS_DIR = path.join(BACKUP_DIR, "logs");
const CRON_LOG_FILE = path.join(LOGS_DIR, "cron.log");

/**
 * Write to cron log file
 */
const cronLog = async (message) => {
  try {
    await fs.promises.mkdir(LOGS_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
    await fs.promises.appendFile(CRON_LOG_FILE, `${timestamp} ${message}\n`);
  } catch (e) {
    console.error("[CRON] Failed to write log:", e.message);
  }
};

/**
 * Backup Cron Jobs
 * Runs daily at 12:00 AM (midnight) to create both DB and file backups.
 *
 * Cron format: minute hour day-of-month month day-of-week
 * "0 0 * * *" = At 00:00 every day
 */
let currentCronTask = null;

const SETTINGS_FILE = path.join(BACKUP_DIR, "settings.json");

/**
 * Get current backup settings
 */
const getBackupSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("[CRON] Failed to read settings:", e.message);
  }
  // Default values
  return { 
    schedule: "daily",
    autoDelete: false,
    retentionMonths: 3
  };
};

/**
 * Save backup settings
 */
const saveBackupSettings = (settings, username = 'System') => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    updateBackupCron(username); // Restart the cron with new settings
    return true;
  } catch (e) {
    console.error("[CRON] Failed to save settings:", e.message);
    return false;
  }
};

/**
 * Get cron expression for schedule option
 */
const getCronExpression = (schedule) => {
  switch (schedule) {
    case "weekly":
      // Weekly on Sunday at 12:00 AM
      return "0 0 * * 0";
    case "fortnightly":
      // 1st and 15th of every month at 12:00 AM
      return "0 0 1,15 * *";
    case "monthly":
      // 1st of every month at 12:00 AM
      return "0 0 1 * *";
    case "daily":
    default:
      // Daily at 12:00 AM
      return "0 0 * * *";
  }
};

const getScheduleLabel = (schedule) => {
  switch (schedule) {
    case "weekly": return "Weekly (Sunday 12:00 AM)";
    case "fortnightly": return "Every 15 Days (1st and 15th 12:00 AM)";
    case "monthly": return "Monthly (1st 12:00 AM)";
    case "daily":
    default: return "Daily (12:00 AM)";
  }
};

/**
 * Initialize or Update Backup Cron Job
 */
const updateBackupCron = (username = 'System') => {
  if (currentCronTask) {
    currentCronTask.stop();
  }

  const settings = getBackupSettings();
  const cronExpression = getCronExpression(settings.schedule);
  const label = getScheduleLabel(settings.schedule);

  currentCronTask = cron.schedule(cronExpression, async () => {
    console.log("[CRON] Starting scheduled backup at", new Date().toISOString());
    await cronLog(`Cron job triggered — starting scheduled backup (${settings.schedule})...`);

    try {
      const result = await backupService.createBackup("all");
      console.log("[CRON] Scheduled backup completed:", result.message);
      await cronLog(`Scheduled backup completed — ${result.message}`);

      // Auto Cleanup if enabled
      if (settings.autoDelete) {
        await cronLog(`[CRON] Auto-delete enabled. Starting cleanup...`);
        const cleanupResult = await backupService.autoCleanUp(settings.retentionMonths);
        await cronLog(`[CRON] ${cleanupResult.message}`);
      }
    } catch (error) {
      const msg = error.message || JSON.stringify(error);
      console.error("[CRON] Scheduled backup FAILED:", msg);
      await cronLog(`Scheduled backup FAILED — ${msg}`);
    }
  }, {
    timezone: "Asia/Kolkata",
  });

  cronLog(`Cron scheduler updated — next run based on: ${label} IST (by ${username})`);
  console.log(`[CRON] Backup scheduled: ${label} IST`);
};

// Map old init function to new update function
const initBackupCron = updateBackupCron;

module.exports = { initBackupCron, updateBackupCron, getBackupSettings, saveBackupSettings };
