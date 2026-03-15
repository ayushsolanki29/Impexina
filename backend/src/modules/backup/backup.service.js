const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");
const execPromise = util.promisify(exec);
const checkDiskSpace = require('check-disk-space').default || require('check-disk-space');

// ============================================================
// PATH CONFIGURATION
// Production:  /root/apps/backup/db, /root/apps/backup/files
// Dev/Windows: F:\Projects\Impexina\backup\db, backup\files
// ============================================================

const IS_WINDOWS = process.platform === "win32";

// Auto-detect paths based on environment by dynamically resolving parent directories
const APP_ROOT = process.env.APP_ROOT || path.resolve(__dirname, "../../../../");
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(APP_ROOT, "backup");
const FRONTEND_DIR = process.env.FRONTEND_DIR || path.join(APP_ROOT, "frontend");
const BACKEND_DIR = process.env.BACKEND_DIR || path.join(APP_ROOT, "backend");

const DATABASE_URL = process.env.DATABASE_URL || "";

// Sub-directories
const DB_BACKUP_DIR = path.join(BACKUP_DIR, "db");
const FILES_BACKUP_DIR = path.join(BACKUP_DIR, "files");
const LOGS_DIR = path.join(BACKUP_DIR, "logs");
const LOG_FILE = path.join(LOGS_DIR, "backup.log");

class BackupService {
  /**
   * Ensure backup directories exist
   */
  async _ensureDirs() {
    for (const dir of [DB_BACKUP_DIR, FILES_BACKUP_DIR, LOGS_DIR]) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Append timestamped log entry
   */
  async _log(message) {
    try {
      await this._ensureDirs();
      const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
      await fs.promises.appendFile(LOG_FILE, `${timestamp} ${message}\n`);
    } catch (e) {
      console.error("Failed to write backup log:", e.message);
    }
  }

  /**
   * Helper to retrieve only the last N lines safely (using a 64KB tail chunk)
   */
  async _readTailLines(filePath, numLines = 30) {
    try {
      const stats = await fs.promises.stat(filePath);
      const chunkSize = 64 * 1024; // 64KB limit to prevent memory bloat
      const start = Math.max(0, stats.size - chunkSize);
      const length = stats.size - start;

      const fd = await fs.promises.open(filePath, 'r');
      const buffer = Buffer.alloc(length);
      await fd.read(buffer, 0, length, start);
      await fd.close();
      
      const content = buffer.toString('utf-8');
      const lines = content.split('\n').filter(Boolean);
      return lines.slice(-numLines).reverse();
    } catch (e) {
      return [];
    }
  }

  /**
   * Read real logs from backup.log safely
   */
  async _readLogs() {
    const lines = await this._readTailLines(LOG_FILE, 30);
    return lines.length > 0 ? lines : ["No backup logs yet. Create your first backup to see activity here."];
  }

  /**
   * Read cron logs from cron.log safely
   */
  async _readCronLogs() {
    const cronLogFile = path.join(LOGS_DIR, "cron.log");
    const lines = await this._readTailLines(cronLogFile, 30);
    return lines.length > 0 ? lines : ["No cron logs yet. Cron jobs will log here when they run."];
  }

  /**
   * List files in a directory with stats
   */
  async _listFiles(dirPath) {
    try {
      const files = await fs.promises.readdir(dirPath);
      const fileStats = await Promise.all(
        files
          .filter((f) => !f.startsWith("."))
          .map(async (file) => {
            const stat = await fs.promises.stat(path.join(dirPath, file));
            const sizeBytes = stat.size;
            let size;
            if (sizeBytes > 1024 * 1024 * 1024) {
              size = (sizeBytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
            } else if (sizeBytes > 1024 * 1024) {
              size = (sizeBytes / 1024 / 1024).toFixed(2) + " MB";
            } else {
              size = (sizeBytes / 1024).toFixed(1) + " KB";
            }
            return {
              name: file,
              size,
              sizeBytes,
              date: stat.mtime.toISOString().split("T")[0],
              time: stat.mtime.toISOString().split("T")[1].split(".")[0],
              downloads: 0, // Placeholder, updated in listBackups
            };
          })
      );
      return fileStats.sort((a, b) => b.name.localeCompare(a.name));
    } catch (e) {
      return [];
    }
  }

  /**
   * List all backups (REAL data — no mocks)
   */
  async listBackups() {
    try {
      await this._ensureDirs();

      const dbBackups = await this._listFiles(DB_BACKUP_DIR);
      const fileBackups = await this._listFiles(FILES_BACKUP_DIR);
      const logs = await this._readLogs();
      const cronLogs = await this._readCronLogs();

      // Safely count downloads without loading entire file into memory
      const downloadCounts = {};
      try {
        const readline = require('readline');
        const rl = readline.createInterface({
          input: fs.createReadStream(LOG_FILE),
          crlfDelay: Infinity
        });

        for await (const line of rl) {
          if (line.includes("Downloaded →")) {
            const match = line.match(/Downloaded → (.+?) \(/);
            if (match && match[1]) {
              const fName = match[1].trim();
              downloadCounts[fName] = (downloadCounts[fName] || 0) + 1;
            }
          }
        }
      } catch (e) {
        // silent
      }

      const mapDownloads = (files) => {
        return files.map(f => {
          f.downloads = downloadCounts[f.name] || 0;
          return f;
        });
      };

      const formatSize = (sizeBytes) => {
        if (sizeBytes === 0) return "0.0 KB";
        if (sizeBytes > 1024 * 1024 * 1024) {
          return (sizeBytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
        } else if (sizeBytes > 1024 * 1024) {
          return (sizeBytes / 1024 / 1024).toFixed(2) + " MB";
        } else {
          return (sizeBytes / 1024).toFixed(1) + " KB";
        }
      };

      const dbStorageBytes = dbBackups.reduce((acc, file) => acc + file.sizeBytes, 0);
      const filesStorageBytes = fileBackups.reduce((acc, file) => acc + file.sizeBytes, 0);
      const totalStorageBytes = dbStorageBytes + filesStorageBytes;

      let diskSpace = null;
      try {
        diskSpace = await checkDiskSpace(BACKUP_DIR);
      } catch (e) {
        console.error("Could not check disk space:", e.message);
      }

      return {
        db: mapDownloads(dbBackups),
        uploads: mapDownloads(fileBackups),
        logs,
        cronLogs,
        storage: {
          dbBytes: dbStorageBytes,
          dbFormatted: formatSize(dbStorageBytes),
          filesBytes: filesStorageBytes,
          filesFormatted: formatSize(filesStorageBytes),
          totalBytes: totalStorageBytes,
          totalFormatted: formatSize(totalStorageBytes),
          diskTotal: diskSpace ? diskSpace.size : 0,
          diskTotalFormatted: diskSpace ? formatSize(diskSpace.size) : 'Unknown',
          diskFree: diskSpace ? diskSpace.free : 0,
          diskFreeFormatted: diskSpace ? formatSize(diskSpace.free) : 'Unknown',
        },
        paths: {
          backupDir: BACKUP_DIR,
          dbDir: DB_BACKUP_DIR,
          filesDir: FILES_BACKUP_DIR,
          frontendDir: FRONTEND_DIR,
          backendDir: BACKEND_DIR,
        },
      };
    } catch (error) {
      console.error("Error listing backups:", error);
      return {
        db: [],
        uploads: [],
        logs: ["❌ Error: " + error.message],
        paths: {},
        storage: { dbFormatted: "0 KB", filesFormatted: "0 KB", totalFormatted: "0 KB" }
      };
    }
  }

  /**
   * Parse DATABASE_URL to get pg connection details
   */
  _parseDbUrl() {
    try {
      const url = new URL(DATABASE_URL);
      return {
        host: url.hostname,
        port: url.port || "5432",
        user: url.username,
        password: url.password,
        database: url.pathname.replace("/", "").split("?")[0],
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Find pg_dump executable path
   */
  async _findPgDump() {
    if (!IS_WINDOWS) return "pg_dump";

    // Check if pg_dump is in PATH
    try {
      await execPromise("where pg_dump", { shell: "cmd.exe" });
      return "pg_dump";
    } catch (e) {
      // Not in PATH, search common locations
    }

    // Common PostgreSQL install paths on Windows
    const pgBasePath = "C:\\Program Files\\PostgreSQL";
    try {
      const versions = await fs.promises.readdir(pgBasePath);
      // Sort descending to try newest version first
      const sorted = versions.sort((a, b) => parseInt(b) - parseInt(a));
      for (const ver of sorted) {
        const pgDumpPath = path.join(pgBasePath, ver, "bin", "pg_dump.exe");
        try {
          await fs.promises.access(pgDumpPath);
          return `"${pgDumpPath}"`;
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      // PostgreSQL directory not found
    }

    return null;
  }

  /**
   * Create database backup using pg_dump
   */
  async _backupDatabase() {
    const db = this._parseDbUrl();
    if (!db) {
      throw new Error("Cannot parse DATABASE_URL — check your .env file");
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateTime = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;
    const filename = `db_${dateTime}.sql`;

    const pgDump = await this._findPgDump();

    if (!pgDump) {
      // Fallback: use Prisma to export data as JSON
      await this._log("⚠️ pg_dump not found, using Prisma JSON export fallback");
      const { prisma } = require("../../../database/prisma");
      const jsonFilename = `db_${dateTime}.json`;
      const backupFile = path.join(DB_BACKUP_DIR, jsonFilename);

      // Export all table counts and basic metadata
      const tables = Object.keys(prisma).filter(
        (k) => !k.startsWith("_") && !k.startsWith("$") && typeof prisma[k].findMany === "function"
      );
      const data = {};
      for (const table of tables) {
        try {
          data[table] = await prisma[table].findMany();
        } catch (e) {
          data[table] = { error: e.message };
        }
      }
      await fs.promises.writeFile(backupFile, JSON.stringify(data, null, 2), "utf-8");
      return jsonFilename;
    }

    if (IS_WINDOWS) {
      const backupFile = path.join(DB_BACKUP_DIR, filename);
      const cmd = `set PGPASSWORD=${db.password}&& ${pgDump} -h ${db.host} -p ${db.port} -U ${db.user} ${db.database} > "${backupFile}"`;
      await execPromise(cmd, { shell: "cmd.exe" });
      return filename;
    } else {
      const gzFilename = filename + ".gz";
      const backupFile = path.join(DB_BACKUP_DIR, gzFilename);
      const cmd = `PGPASSWORD="${db.password}" ${pgDump} -h ${db.host} -p ${db.port} -U ${db.user} ${db.database} | gzip > "${backupFile}"`;
      await execPromise(cmd);
      return gzFilename;
    }
  }

  /**
   * Create file system backup (uploads folder only)
   */
  async _backupFiles() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateTime = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;
    const results = [];

    // Backup uploads folder from backend
    const uploadsDir = path.join(BACKEND_DIR, "uploads");
    const uploadsExist = await fs.promises.access(uploadsDir).then(() => true).catch(() => false);

    if (uploadsExist) {
      const filename = `uploads_${dateTime}`;
      if (IS_WINDOWS) {
        const backupFile = path.join(FILES_BACKUP_DIR, filename + ".zip");
        const cmd = `powershell -Command "Compress-Archive -Path '${uploadsDir}\\*' -DestinationPath '${backupFile}' -Force"`;
        await execPromise(cmd);
        results.push(`Uploads → ${filename}.zip`);
      } else {
        const backupFile = path.join(FILES_BACKUP_DIR, filename + ".tar.gz");
        const cmd = `tar -czf "${backupFile}" -C "${path.dirname(uploadsDir)}" "${path.basename(uploadsDir)}"`;
        await execPromise(cmd);
        results.push(`Uploads → ${filename}.tar.gz`);
      }
    } else {
      results.push("⚠️ No uploads directory found, nothing to backup");
    }

    return results;
  }

  /**
   * Create Backup
   * @param {string} type 'db' | 'files' | 'all'
   * @param {string} username Name of the user triggering the backup (optional)
   */
  async createBackup(type, username = 'System') {
    try {
      await this._ensureDirs();
      const messages = [];

      if (type === "db" || type === "all") {
        try {
          const filename = await this._backupDatabase();
          await this._log(`Database backup successful → ${filename} (by ${username})`);
          messages.push(`Database backup: ${filename}`);
        } catch (err) {
          await this._log(`Database backup failed: ${err.message} (by ${username})`);
          if (type === "db") throw err;
          messages.push(`Database backup failed: ${err.message}`);
        }
      }

      if (type === "files" || type === "all") {
        try {
          const results = await this._backupFiles();
          for (const r of results) {
            await this._log(`Files backup successful → ${r} (by ${username})`);
          }
          messages.push(...results.map((r) => `File backup: ${r}`));
        } catch (err) {
          await this._log(`Files backup failed: ${err.message} (by ${username})`);
          if (type === "files") throw err;
          messages.push(`Files backup failed: ${err.message}`);
        }
      }

      return {
        success: true,
        message: messages.join(" | ") || "Backup completed",
      };
    } catch (error) {
      console.error("Backup failed:", error);
      await this._log(`Backup failed: ${error.message}`);
      throw { status: 500, message: `Backup failed: ${error.message}` };
    }
  }

  /**
   * Restore Backup
   */
  async restoreBackup(filename, type) {
    if (!filename || filename.includes("/") || filename.includes("..") || filename.includes("\\")) {
      throw { status: 400, message: "Invalid filename" };
    }

    throw {
      status: 501,
      message: "Automatic restore via UI is disabled for safety. Please use CLI.",
    };
  }

  /**
   * Get file path for download
   * @param {string} type 'db' | 'files'
   * @param {string} filename
   * @returns {object} { filePath, filename }
   */
  async getDownloadPath(type, filename) {
    // Security: prevent path traversal
    if (!filename || filename.includes("/") || filename.includes("..") || filename.includes("\\")) {
      throw { status: 400, message: "Invalid filename" };
    }

    const dir = type === "db" ? DB_BACKUP_DIR : FILES_BACKUP_DIR;
    const filePath = path.join(dir, filename);

    // Verify file exists
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch (e) {
      throw { status: 404, message: "Backup file not found" };
    }

    return { filePath, filename };
  }
}

module.exports = new BackupService();
