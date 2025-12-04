#!/bin/bash

###############################################################################
# PostgreSQL Database Backup Script for BAK UP E-Voucher System (Production)
# 
# This script creates automated backups of the PostgreSQL database on Render
# 
# Usage: ./backup_postgres.sh
# Cron: 0 2 * * * /path/to/backup_postgres.sh  (runs daily at 2 AM)
###############################################################################

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/render/project/backups}"
DATABASE_URL="${DATABASE_URL}"  # From Render environment
RETENTION_DAYS="${RETENTION_DAYS:-30}"  # Keep backups for 30 days
MAX_BACKUPS="${MAX_BACKUPS:-30}"  # Maximum number of backups to keep

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "========================================="
log "Starting PostgreSQL database backup"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log "ERROR: DATABASE_URL environment variable not set"
    exit 1
fi

# Parse DATABASE_URL properly for Render's PostgreSQL
# Format: postgresql://user:password@host:port/database or postgres://...
# Handle both postgresql:// and postgres:// schemes

# Extract components using parameter expansion and sed
DB_URL_NO_SCHEME="${DATABASE_URL#postgres://}"
DB_URL_NO_SCHEME="${DB_URL_NO_SCHEME#postgresql://}"

# Extract user:password part
DB_USERPASS="${DB_URL_NO_SCHEME%%@*}"
DB_USER="${DB_USERPASS%%:*}"
DB_PASS="${DB_USERPASS#*:}"

# Extract host:port/database part
DB_HOSTDB="${DB_URL_NO_SCHEME#*@}"
DB_HOST="${DB_HOSTDB%%:*}"

# Extract port and database
DB_PORT_DB="${DB_HOSTDB#*:}"
DB_PORT="${DB_PORT_DB%%/*}"
DB_NAME_FULL="${DB_PORT_DB#*/}"
# Remove query parameters if any
DB_NAME="${DB_NAME_FULL%%\?*}"

log "Database: $DB_NAME on $DB_HOST:$DB_PORT"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
if [ $? -ne 0 ]; then
    log "ERROR: Failed to create backup directory: $BACKUP_DIR"
    exit 1
fi

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/postgres_backup_$TIMESTAMP.sql"

log "Creating backup: $BACKUP_FILE"

# Set password for pg_dump
export PGPASSWORD="$DB_PASS"

# Use pg_dump with explicit connection parameters for remote database
# -F c: custom format (compressed)
# -v: verbose
# --no-password: don't prompt for password (use PGPASSWORD)
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -v --no-password -f "$BACKUP_FILE" 2>&1

DUMP_STATUS=$?

# Clear password from environment immediately
unset PGPASSWORD

if [ $DUMP_STATUS -eq 0 ]; then
    log "Backup created successfully"
    
    # Get backup size
    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "Backup size: $BACKUP_SIZE"
        
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
        log "ERROR: Backup file was not created"
        exit 1
    fi
else
    log "ERROR: Failed to create backup (pg_dump exit code: $DUMP_STATUS)"
    exit 1
fi

# Clean up old backups (keep only last N backups)
log "Cleaning up old backups (keeping last $MAX_BACKUPS)..."
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/postgres_backup_*.sql.gz 2>/dev/null | wc -l)
log "Current backup count: $BACKUP_COUNT"

if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    # Delete oldest backups
    ls -t "$BACKUP_DIR"/postgres_backup_*.sql.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
    DELETED=$((BACKUP_COUNT - MAX_BACKUPS))
    log "Deleted $DELETED old backup(s)"
fi

# Also delete backups older than retention days
log "Deleting backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "postgres_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null
log "Old backups cleaned up"

# Show backup statistics
TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/postgres_backup_*.sql.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
log "Total backups: $TOTAL_BACKUPS"
log "Total backup size: $TOTAL_SIZE"

log "Backup completed successfully"
log "========================================="

# Exit successfully
exit 0
