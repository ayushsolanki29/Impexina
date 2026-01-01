const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");
const execPromise = util.promisify(exec);

// Path configuration - Should ideally be in ENV
const BACKUP_BASE_DIR = "/var/backups/impexina";
// We will use the scripts provided in the user manual
// Assume scripts are in /home/deploy in production, but for now we might trigger them or simulate
const SCRIPT_DIR = "/home/deploy";

class BackupService {
  /**
   * List all backups
   * @returns {object} { db: [], uploads: [] }
   */
  async listBackups() {
    // In Windows Dev environment, we might not have these paths.
    // We'll return mock data if not on Linux or if directory doesn't exist, 
    // to allow frontend development.
    if (process.platform === "win32") {
      return {
        db: [
          { name: "impexina_2024-05-20.sql.gz", size: "1.2MB", date: "2024-05-20" },
          { name: "impexina_2024-05-21.sql.gz", size: "1.3MB", date: "2024-05-21" },
        ],
        uploads: [
          { name: "uploads_2024-05-20.tar.gz", size: "150MB", date: "2024-05-20" },
        ],
        logs: [
            "2024-05-20 ✅ Database backup successful",
            "2024-05-20 ✅ Files backup successful"
        ]
      };
    }

    try {
      // Create directories if they don't exist (recursive)
      // Actually we are reading, so just try to read
      const dbBackups = await this._listFiles(path.join(BACKUP_BASE_DIR, "db"));
      const uploadBackups = await this._listFiles(path.join(BACKUP_BASE_DIR, "uploads"));
      
      let logs = [];
      try {
        const logContent = await fs.promises.readFile(path.join(BACKUP_BASE_DIR, "logs/backup.log"), 'utf-8');
        logs = logContent.split('\n').filter(Boolean).slice(-20).reverse(); // Last 20 logs
      } catch (e) {
        logs = ["No logs found"];
      }

      return {
        db: dbBackups,
        uploads: uploadBackups,
        logs
      };
    } catch (error) {
      console.error("Error listing backups:", error);
      // Return empty if directory not found
      return { db: [], uploads: [], logs: [] };
    }
  }

  async _listFiles(dirPath) {
    try {
        const files = await fs.promises.readdir(dirPath);
        const fileStats = await Promise.all(
            files.map(async (file) => {
                const stat = await fs.promises.stat(path.join(dirPath, file));
                return {
                    name: file,
                    size: (stat.size / 1024 / 1024).toFixed(2) + " MB",
                    date: stat.mtime.toISOString().split('T')[0]
                };
            })
        );
        return fileStats.sort((a, b) => b.name.localeCompare(a.name)); // Sort by name (date) desc
    } catch (e) {
        return [];
    }
  }

  /**
   * Create Backup
   * @param {string} type 'db' | 'files' | 'all'
   */
  async createBackup(type) {
    if (process.platform === "win32") {
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, message: `[DEV] Mock backup of ${type} created successfully` };
    }

    try {
      if (type === 'db' || type === 'all') {
        await execPromise(`${SCRIPT_DIR}/db_backup.sh`);
      }
      if (type === 'files' || type === 'all') {
        await execPromise(`${SCRIPT_DIR}/files_backup.sh`);
      }
      return { success: true, message: "Backup process started successfully" };
    } catch (error) {
      console.error("Backup failed:", error);
      throw { status: 500, message: "Backup script execution failed" };
    }
  }

  /**
   * Restore Backup
   * @param {string} filename 
   * @param {string} type 'db' | 'files'
   */
  async restoreBackup(filename, type) {
     if (process.platform === "win32") {
       await new Promise(resolve => setTimeout(resolve, 3000));
       return { success: true, message: `[DEV] Mock restore of ${filename} completed` };
     }
     
     // Security check on filename to prevent injection
     if (!filename || filename.includes("/") || filename.includes("..")) {
         throw { status: 400, message: "Invalid filename" };
     }

     try {
         // This is DANGEROUS and should be handled carefully in production.
         // We assume the user has manual control or this is a restricted internal app.
         // For now, let's just log implementation TODO
         // In a real scenario, we might have a restore script.
         // For now we will throw not implemented for safety unless we have a restore script
         throw { status: 501, message: "Automatic restore via UI is disabled for safety. Please use CLI." };
     } catch (error) {
         throw error;
     }
  }
}

module.exports = new BackupService();
