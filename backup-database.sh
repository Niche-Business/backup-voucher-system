#!/bin/bash

# BAK UP E-Voucher System - Database Backup Script
# Run this script daily via cron to backup the database

# Configuration
BACKUP_DIR="/home/bakup/backups"
DB_FILE="/home/bakup/bakup-clean/backend/instance/vcse_charity.db"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup database
if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_DIR/vcse_charity_$DATE.db"
    echo "✓ Database backed up to $BACKUP_DIR/vcse_charity_$DATE.db"
    
    # Compress the backup
    gzip "$BACKUP_DIR/vcse_charity_$DATE.db"
    echo "✓ Backup compressed to $BACKUP_DIR/vcse_charity_$DATE.db.gz"
    
    # Delete backups older than retention period
    find "$BACKUP_DIR" -name "vcse_charity_*.db.gz" -mtime +$RETENTION_DAYS -delete
    echo "✓ Old backups cleaned up (retention: $RETENTION_DAYS days)"
    
    # Count remaining backups
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/vcse_charity_*.db.gz 2>/dev/null | wc -l)
    echo "✓ Total backups: $BACKUP_COUNT"
else
    echo "✗ Error: Database file not found at $DB_FILE"
    exit 1
fi

# Log the backup
echo "$(date): Database backup completed" >> "$BACKUP_DIR/backup.log"
