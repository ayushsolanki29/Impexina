const backupService = require("./backup.service");
const { getBackupSettings, saveBackupSettings } = require("../../crons/backup.cron");

class BackupController {
  // List Backups
  async listBackups(req, res, next) {
    try {
      const { section } = req.query; // 'stats', 'db', 'files', 'logs', 'cron'
      const data = await backupService.listBackups();
      
      if (section) {
        let result = {};
        if (section === 'stats') result = { storage: data.storage, paths: data.paths };
        else if (section === 'db') result = { db: data.db };
        else if (section === 'files') result = { uploads: data.uploads };
        else if (section === 'logs') result = { logs: data.logs };
        else if (section === 'cron') result = { cronLogs: data.cronLogs };
        
        return res.status(200).json({ success: true, data: result });
      }

      res.status(200).json({
        success: true,
        data: data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Create Backup
  async createBackup(req, res, next) {
    try {
      const { type } = req.body; // 'db', 'files', 'all'
      if (!['db', 'files', 'all'].includes(type)) {
          return res.status(400).json({ success: false, message: "Invalid backup type" });
      }

      // RBAC: Only Admin can create backups
      if (req.user.role !== "ADMIN" && !req.user.isSuper) {
        return res.status(403).json({ success: false, message: "Forbidden: Only Administrators can create backups" });
      }

      // Pass the user info so we can log it
      const username = req.user ? (req.user.name || req.user.email || 'Unknown User') : 'System';
      const result = await backupService.createBackup(type, username);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Restore Backup
  async restoreBackup(req, res, next) {
    try {
      const { filename, type } = req.body;
      if (!filename || !type) {
         return res.status(400).json({ success: false, message: "Filename and type required" });
      }

      // RBAC: Only Superadmin can restore backups (Admin is not enough)
      if (!req.user.isSuper) {
        return res.status(403).json({ success: false, message: "Forbidden: Only the System Superadmin can perform system restoration" });
      }

      const username = req.user ? (req.user.name || req.user.email || 'Unknown User') : 'System';
      const result = await backupService.restoreBackup(filename, type, username);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
  // Download Backup File
  async downloadBackup(req, res, next) {
    try {
      // RBAC: Only Admin can download backups
      if (req.user.role !== "ADMIN" && !req.user.isSuper) {
        return res.status(403).json({ success: false, message: "Forbidden: Only Administrators can download backup files" });
      }

      const { type, filename } = req.params;
      const user = req.user; // User object from auth middleware
      
      if (!['db', 'files'].includes(type)) {
        return res.status(400).json({ success: false, message: "Invalid backup type" });
      }

      const { filePath } = await backupService.getDownloadPath(type, filename);
      
      // Log the download and increment counter in cache
      const username = user ? (user.name || user.email || 'Unknown User') : 'Unknown User';
      await backupService._log(`Downloaded → ${filename} (by ${username})`);
      await backupService.incrementDownloadCount(filename);

      res.download(filePath, filename, (err) => {
        if (err && !res.headersSent) {
          res.status(500).json({ success: false, message: "Download failed" });
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Backup Cron Settings
  getSettings(req, res, next) {
    try {
      const settings = getBackupSettings();
      res.status(200).json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  // Update Backup Cron Settings
  updateSettings(req, res, next) {
    try {
      // RBAC: Only Admin can update settings
      if (req.user.role !== "ADMIN" && !req.user.isSuper) {
        return res.status(403).json({ success: false, message: "Forbidden: Only Administrators can modify backup settings" });
      }

      const { schedule, autoDelete, retentionMonths } = req.body;
      const username = req.user ? (req.user.name || req.user.email || 'Unknown User') : 'System';
      
      const settings = getBackupSettings();

      if (schedule && !['daily', 'weekly', 'fortnightly', 'monthly'].includes(schedule)) {
        return res.status(400).json({ success: false, message: "Invalid schedule option" });
      }

      if (retentionMonths && ![1, 3, 5].includes(parseInt(retentionMonths))) {
        return res.status(400).json({ success: false, message: "Invalid retention period" });
      }

      const newSettings = {
        schedule: schedule || settings.schedule,
        autoDelete: autoDelete !== undefined ? autoDelete : settings.autoDelete,
        retentionMonths: retentionMonths !== undefined ? parseInt(retentionMonths) : settings.retentionMonths
      };

      const success = saveBackupSettings(newSettings, username);
      if (success) {
        res.status(200).json({ success: true, message: "Backup schedule updated successfully" });
      } else {
        res.status(500).json({ success: false, message: "Failed to save backup schedule" });
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BackupController();
