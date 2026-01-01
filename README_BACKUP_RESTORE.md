# Backup & Restore Automation – Impexina (Linux Production)

This document explains the **production-grade backup and restore strategy** for the Impexina office software.
It is designed for **Linux-only servers**, **internal office usage**, and **PostgreSQL-based systems**.

---

## 🎯 Backup Scope

The following components are backed up:

- PostgreSQL database (`impexina`)
- Uploaded files (PDFs, images, exports, etc.)
- Backup logs

The following are **NOT** backed up:
- `node_modules`
- Build artifacts
- OS-level packages

---

## 📁 Backup Directory Structure

All backups are stored locally on the server:

```
/var/backups/impexina/
├── db/
│   └── impexina_YYYY-MM-DD.sql.gz
├── uploads/
│   └── uploads_YYYY-MM-DD.tar.gz
└── logs/
    └── backup.log
```

---

## 🛠️ Initial Setup

Create backup directories:

```bash
sudo mkdir -p /var/backups/impexina/{db,uploads,logs}
sudo chown -R deploy:deploy /var/backups/impexina
```

---

## 🗄️ PostgreSQL Database Backup

### Script: `db_backup.sh`

Create file:

```bash
nano ~/db_backup.sh
```

```bash
#!/bin/bash

DATE=$(date +%F)
BACKUP_DIR="/var/backups/impexina/db"
LOG_FILE="/var/backups/impexina/logs/backup.log"

DB_NAME="impexina"
DB_USER="impexina_user"

pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/impexina_$DATE.sql.gz

if [ $? -eq 0 ]; then
  echo "$DATE ✅ Database backup successful" >> $LOG_FILE
else
  echo "$DATE ❌ Database backup failed" >> $LOG_FILE
fi
```

Make executable:

```bash
chmod +x ~/db_backup.sh
```

---

## 📦 Uploaded Files Backup

### Script: `files_backup.sh`

Create file:

```bash
nano ~/files_backup.sh
```

```bash
#!/bin/bash

DATE=$(date +%F)
BACKUP_DIR="/var/backups/impexina/uploads"
SOURCE_DIR="/home/deploy/apps/backend/uploads"
LOG_FILE="/var/backups/impexina/logs/backup.log"

tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz $SOURCE_DIR

if [ $? -eq 0 ]; then
  echo "$DATE ✅ Files backup successful" >> $LOG_FILE
else
  echo "$DATE ❌ Files backup failed" >> $LOG_FILE
fi
```

Make executable:

```bash
chmod +x ~/files_backup.sh
```

---

## ♻️ Cleanup Old Backups (Retention Policy)

### Script: `cleanup_backups.sh`

```bash
nano ~/cleanup_backups.sh
```

```bash
#!/bin/bash

find /var/backups/impexina/db -type f -mtime +7 -delete
find /var/backups/impexina/uploads -type f -mtime +7 -delete
```

```bash
chmod +x ~/cleanup_backups.sh
```

---

## ⏰ Cron Job Automation

Edit cron:

```bash
crontab -e
```

Add:

```cron
# Daily DB backup at 02:00 AM
0 2 * * * /home/deploy/db_backup.sh

# Daily files backup at 02:15 AM
15 2 * * * /home/deploy/files_backup.sh

# Weekly cleanup (Sunday 03:00 AM)
0 3 * * 0 /home/deploy/cleanup_backups.sh
```

---

## 🔄 Restore Procedure

### Restore Database

```bash
gunzip impexina_YYYY-MM-DD.sql.gz
psql -U impexina_user -d impexina < impexina_YYYY-MM-DD.sql
```

### Restore Uploaded Files

```bash
tar -xzf uploads_YYYY-MM-DD.tar.gz -C /
```

---

## 🔐 Optional Enhancements

### Encrypt Backup Files

```bash
gpg -c impexina_YYYY-MM-DD.sql.gz
```

### Copy Backups Off-Server

```bash
rsync -av /var/backups/impexina remote_server:/backup/impexina
```

---

## 📜 Verification

```bash
ls -lh /var/backups/impexina/db
ls -lh /var/backups/impexina/uploads
tail /var/backups/impexina/logs/backup.log
```

---

## ✅ Best Practices

- Test restore once after setup
- Keep at least one off-server backup
- Never expose backup directory publicly
- Monitor backup logs weekly

---

## 🏁 Notes

This backup strategy is intended for **internal office systems**.
For higher resilience, combine with:
- WireGuard VPN
- Encrypted offsite backups
- Snapshot-based VPS backups
