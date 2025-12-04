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
BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/backups}"
DATABASE_URL="${DATABASE_URL:-$DATABASE_URL}"  # From Render environment
RETENTION_DAYS="${RETENTION_DAYS:-30}"  # Keep backups for 30 days
MAX_BACKUPS="${MAX_BACKUPS:-30}"  # Maximum number of backups to keep

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/postgres_backup_$TIMESTAMP.sql"

# Log file
LOG_FILE="$BACKUP_DIR/backup.log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========================================="
log "Starting PostgreSQL database backup"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log "ERROR: DATABASE_URL environment variable not set"
    exit 1
fi

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

log "Database: $DB_NAME on $DB_HOST:$DB_PORT"

# Create backup using pg_dump
log "Creating backup: $BACKUP_FILE"
export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    log "Backup created successfully"
    
    # Get backup size
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
    log "ERROR: Failed to create backup"
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
find "$BACKUP_DIR" -name "postgres_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
log "Old backups cleaned up"

# Show backup statistics
TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/postgres_backup_*.sql.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Total backups: $TOTAL_BACKUPS"
log "Total backup size: $TOTAL_SIZE"

log "Backup completed successfully"
log "========================================="

# Clear password from environment
unset PGPASSWORD

# Exit successfully
exit 0
