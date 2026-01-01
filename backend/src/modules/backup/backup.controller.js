const backupService = require("./backup.service");

class BackupController {
  // List Backups
  async listBackups(req, res, next) {
    try {
      const backups = await backupService.listBackups();
      res.status(200).json({
        success: true,
        data: backups,
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

      const result = await backupService.createBackup(type);
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

      const result = await backupService.restoreBackup(filename, type);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BackupController();
