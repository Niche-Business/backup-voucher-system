#!/bin/bash

###############################################################################
# Database Backup Script for BAK UP E-Voucher System
# 
# This script creates automated backups of the database and manages retention
# 
# Usage: ./backup_db.sh
# Cron: 0 2 * * * /path/to/backup_db.sh  (runs daily at 2 AM)
###############################################################################

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/backups}"
DB_PATH="${DB_PATH:-/home/ubuntu/backup-voucher-system-repo/backend/database.db}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"  # Keep backups for 30 days
MAX_BACKUPS="${MAX_BACKUPS:-30}"  # Maximum number of backups to keep

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/database_$TIMESTAMP.db"

# Log file
LOG_FILE="$BACKUP_DIR/backup.log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========================================="
log "Starting database backup"

# Check if database file exists
if [ ! -f "$DB_PATH" ]; then
    log "ERROR: Database file not found at $DB_PATH"
    exit 1
fi

# Get database size
DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
log "Database size: $DB_SIZE"

# Create backup using SQLite backup command (safer than cp)
log "Creating backup: $BACKUP_FILE"
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

if [ $? -eq 0 ]; then
    log "Backup created successfully"
    
    # Compress backup to save space
    log "Compressing backup..."
    gzip "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        COMPRESSED_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
        log "Backup compressed successfully: $COMPRESSED_SIZE"
    else
        log "ERROR: Failed to compress backup"
        exit 1
    fi
else
    log "ERROR: Failed to create backup"
    exit 1
fi

# Clean up old backups (keep only last N backups)
log "Cleaning up old backups (keeping last $MAX_BACKUPS)..."
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/database_*.db.gz 2>/dev/null | wc -l)
log "Current backup count: $BACKUP_COUNT"

if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    # Delete oldest backups
    ls -t "$BACKUP_DIR"/database_*.db.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
    DELETED=$((BACKUP_COUNT - MAX_BACKUPS))
    log "Deleted $DELETED old backup(s)"
fi

# Also delete backups older than retention days
log "Deleting backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "database_*.db.gz" -type f -mtime +$RETENTION_DAYS -delete
log "Old backups cleaned up"

# Show backup statistics
TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/database_*.db.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Total backups: $TOTAL_BACKUPS"
log "Total backup size: $TOTAL_SIZE"

log "Backup completed successfully"
log "========================================="

# Exit successfully
exit 0
