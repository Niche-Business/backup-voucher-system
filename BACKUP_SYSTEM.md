# Database Backup System Documentation

## Overview

The BAK UP E-Voucher System now has an automated database backup system deployed on Render that creates daily backups of the PostgreSQL database.

## System Configuration

### Backup Schedule
- **Frequency:** Daily at 2:00 AM UTC
- **Platform:** Render Cron Job
- **Service Name:** `database-backup`

### Backup Retention Policy
- **Maximum Backups:** 30 backups
- **Retention Period:** 30 days
- **Cleanup:** Automatic (runs after each backup)

### Backup Location
- **Directory:** `/opt/render/project/backups`
- **Format:** PostgreSQL custom format (`.sql` files)
- **Compression:** gzip (`.sql.gz` files)
- **Naming Convention:** `postgres_backup_YYYYMMDD_HHMMSS.sql.gz`

## Technical Details

### Backup Script
- **Location:** `backend/scripts/backup_postgres.py`
- **Language:** Python 3
- **Command:** `python3 backend/scripts/backup_postgres.py`

### Environment Variables
| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | (from web service) | PostgreSQL connection string |
| `BACKUP_DIR` | `/opt/render/project/backups` | Backup storage directory |
| `RETENTION_DAYS` | `30` | Number of days to keep backups |
| `MAX_BACKUPS` | `30` | Maximum number of backups to retain |

### Backup Process

1. **Parse DATABASE_URL** - Extract connection parameters (host, port, user, password, database)
2. **Create Backup Directory** - Ensure `/opt/render/project/backups` exists
3. **Run pg_dump** - Create PostgreSQL backup in custom format
4. **Compress Backup** - Use gzip to compress the backup file (typically 60-70% compression)
5. **Cleanup Old Backups** - Remove backups exceeding retention limits
6. **Log Statistics** - Display backup count and total size

## Monitoring

### Accessing Logs

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Navigate to **database-backup** cron job
3. Click on **Logs** in the left sidebar
4. View the latest backup execution logs

### Successful Backup Log Example

```
[2025-12-04 14:18:55] ============================================================
[2025-12-04 14:18:55] Starting PostgreSQL database backup
[2025-12-04 14:18:55] Database: backup_db on dpg-d4fguhbe5dus73cjm4p0-a:5432
[2025-12-04 14:18:55] User: backup_db_user
[2025-12-04 14:18:55] Backup directory: /opt/render/project/backups
[2025-12-04 14:18:55] Creating backup: /opt/render/project/backups/postgres_backup_20251204_141855.sql
[2025-12-04 14:18:56] Backup created successfully
[2025-12-04 14:18:56] Backup size: 0.09 MB
[2025-12-04 14:18:56] Compressing backup...
[2025-12-04 14:18:56] Backup compressed successfully: 0.03 MB
[2025-12-04 14:18:56] Cleaning up old backups (keeping last 30)...
[2025-12-04 14:18:56] Current backup count: 1
[2025-12-04 14:18:56] Deleting backups older than 30 days...
[2025-12-04 14:18:56] Total backups: 1
[2025-12-04 14:18:56] Total backup size: 0.03 MB
[2025-12-04 14:18:56] Backup completed successfully
[2025-12-04 14:18:56] ============================================================
```

### What to Look For

✅ **Success Indicators:**
- "Backup created successfully"
- "Backup compressed successfully"
- "Backup completed successfully"
- No error messages in red

❌ **Failure Indicators:**
- "ERROR: Failed to create backup"
- "pg_dump: error: connection to server..."
- "Your cronjob failed because of an error"

## Manual Testing

To manually trigger a backup:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Navigate to **database-backup** cron job
3. Click **Trigger Run** button (top right)
4. Wait for execution to complete
5. Review logs to verify success

## Troubleshooting

### Common Issues

#### Issue: "Connection to server failed"
**Solution:** Check that `DATABASE_URL` environment variable is correctly set in the cron job settings.

#### Issue: "Failed to create backup directory"
**Solution:** Verify that `BACKUP_DIR` path is correct and writable.

#### Issue: "pg_dump: command not found"
**Solution:** Ensure PostgreSQL client tools are installed. Check `requirements.txt` includes necessary dependencies.

#### Issue: "Invalid integer value for port"
**Solution:** The Python script should properly parse the DATABASE_URL. If this error occurs, check the URL format.

## Backup Restoration

### How to Restore from Backup

**Note:** Render cron jobs use ephemeral storage. Backups are stored locally and will be lost when the cron job restarts. For production use, consider implementing backup uploads to cloud storage (S3, Google Cloud Storage, etc.).

To restore a backup (if accessible):

```bash
# Download the backup file
# Decompress it
gunzip postgres_backup_YYYYMMDD_HHMMSS.sql.gz

# Restore using pg_restore
pg_restore -h <host> -p <port> -U <user> -d <database> -v postgres_backup_YYYYMMDD_HHMMSS.sql
```

## Future Enhancements

Consider implementing these improvements:

1. **Cloud Storage Integration**
   - Upload backups to AWS S3, Google Cloud Storage, or Azure Blob Storage
   - Ensures backups persist beyond cron job lifecycle

2. **Email Notifications**
   - Send email alerts on backup success/failure
   - Weekly backup summary reports

3. **Backup Verification**
   - Automated backup integrity checks
   - Test restore procedures

4. **Metrics & Monitoring**
   - Track backup size trends
   - Monitor backup duration
   - Alert on backup failures

5. **Incremental Backups**
   - Implement incremental backup strategy
   - Reduce backup time and storage

## Deployment History

- **2025-12-04:** Initial deployment with bash script (failed due to parsing issues)
- **2025-12-04:** Fixed with Python script for robust DATABASE_URL parsing
- **2025-12-04:** Successfully tested and verified working

## Support

For issues or questions about the backup system:
- Check the logs in Render dashboard
- Review this documentation
- Contact the development team

---

**Last Updated:** December 4, 2025
