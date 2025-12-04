#!/usr/bin/env python3
"""
PostgreSQL Database Backup Script for BAK UP E-Voucher System (Production)

This script creates automated backups of the PostgreSQL database on Render

Usage: python3 backup_postgres.py
Cron: 0 2 * * * python3 /path/to/backup_postgres.py  (runs daily at 2 AM)
"""

import os
import sys
import subprocess
from datetime import datetime
from urllib.parse import urlparse
import glob

def log(message):
    """Log messages with timestamp"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] {message}", flush=True)

def main():
    log("=" * 60)
    log("Starting PostgreSQL database backup")
    
    # Configuration
    backup_dir = os.environ.get('BACKUP_DIR', '/opt/render/project/backups')
    database_url = os.environ.get('DATABASE_URL')
    retention_days = int(os.environ.get('RETENTION_DAYS', '30'))
    max_backups = int(os.environ.get('MAX_BACKUPS', '30'))
    
    # Check if DATABASE_URL is set
    if not database_url:
        log("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)
    
    # Parse DATABASE_URL
    try:
        parsed = urlparse(database_url)
        db_user = parsed.username
        db_pass = parsed.password
        db_host = parsed.hostname
        db_port = parsed.port or 5432
        db_name = parsed.path.lstrip('/')
        
        # Remove query parameters if any
        if '?' in db_name:
            db_name = db_name.split('?')[0]
        
        log(f"Database: {db_name} on {db_host}:{db_port}")
        log(f"User: {db_user}")
        
    except Exception as e:
        log(f"ERROR: Failed to parse DATABASE_URL: {e}")
        sys.exit(1)
    
    # Create backup directory
    try:
        os.makedirs(backup_dir, exist_ok=True)
        log(f"Backup directory: {backup_dir}")
    except Exception as e:
        log(f"ERROR: Failed to create backup directory: {e}")
        sys.exit(1)
    
    # Generate timestamp and backup filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = os.path.join(backup_dir, f'postgres_backup_{timestamp}.sql')
    
    log(f"Creating backup: {backup_file}")
    
    # Set password environment variable for pg_dump
    env = os.environ.copy()
    env['PGPASSWORD'] = db_pass
    
    # Run pg_dump
    try:
        cmd = [
            'pg_dump',
            '-h', db_host,
            '-p', str(db_port),
            '-U', db_user,
            '-d', db_name,
            '-F', 'c',  # Custom format (compressed)
            '-v',  # Verbose
            '--no-password',  # Don't prompt for password
            '-f', backup_file
        ]
        
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            log("Backup created successfully")
            
            # Get backup size
            if os.path.exists(backup_file):
                size_bytes = os.path.getsize(backup_file)
                size_mb = size_bytes / (1024 * 1024)
                log(f"Backup size: {size_mb:.2f} MB")
                
                # Compress backup
                log("Compressing backup...")
                gzip_result = subprocess.run(
                    ['gzip', backup_file],
                    capture_output=True,
                    text=True
                )
                
                if gzip_result.returncode == 0:
                    compressed_file = f"{backup_file}.gz"
                    compressed_size_bytes = os.path.getsize(compressed_file)
                    compressed_size_mb = compressed_size_bytes / (1024 * 1024)
                    log(f"Backup compressed successfully: {compressed_size_mb:.2f} MB")
                else:
                    log(f"ERROR: Failed to compress backup: {gzip_result.stderr}")
                    sys.exit(1)
            else:
                log("ERROR: Backup file was not created")
                sys.exit(1)
        else:
            log(f"ERROR: pg_dump failed with exit code {result.returncode}")
            log(f"STDERR: {result.stderr}")
            sys.exit(1)
            
    except Exception as e:
        log(f"ERROR: Failed to create backup: {e}")
        sys.exit(1)
    
    # Clean up old backups (keep only last N backups)
    try:
        log(f"Cleaning up old backups (keeping last {max_backups})...")
        backup_files = sorted(
            glob.glob(os.path.join(backup_dir, 'postgres_backup_*.sql.gz')),
            key=os.path.getmtime,
            reverse=True
        )
        
        backup_count = len(backup_files)
        log(f"Current backup count: {backup_count}")
        
        if backup_count > max_backups:
            files_to_delete = backup_files[max_backups:]
            for file_path in files_to_delete:
                os.remove(file_path)
                log(f"Deleted old backup: {os.path.basename(file_path)}")
            log(f"Deleted {len(files_to_delete)} old backup(s)")
        
        # Also delete backups older than retention days
        log(f"Deleting backups older than {retention_days} days...")
        current_time = datetime.now().timestamp()
        deleted_count = 0
        
        for file_path in glob.glob(os.path.join(backup_dir, 'postgres_backup_*.sql.gz')):
            file_age_days = (current_time - os.path.getmtime(file_path)) / 86400
            if file_age_days > retention_days:
                os.remove(file_path)
                deleted_count += 1
        
        if deleted_count > 0:
            log(f"Deleted {deleted_count} backup(s) older than {retention_days} days")
        
    except Exception as e:
        log(f"WARNING: Failed to clean up old backups: {e}")
    
    # Show backup statistics
    try:
        total_backups = len(glob.glob(os.path.join(backup_dir, 'postgres_backup_*.sql.gz')))
        log(f"Total backups: {total_backups}")
        
        # Calculate total size
        total_size_bytes = sum(
            os.path.getsize(f) 
            for f in glob.glob(os.path.join(backup_dir, 'postgres_backup_*.sql.gz'))
        )
        total_size_mb = total_size_bytes / (1024 * 1024)
        log(f"Total backup size: {total_size_mb:.2f} MB")
        
    except Exception as e:
        log(f"WARNING: Failed to calculate backup statistics: {e}")
    
    log("Backup completed successfully")
    log("=" * 60)
    
    sys.exit(0)

if __name__ == '__main__':
    main()
