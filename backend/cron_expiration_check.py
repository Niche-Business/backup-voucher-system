#!/usr/bin/env python3
"""
Cron Job Script for Voucher Expiration Reminders
This script should be run daily to check for expiring vouchers and send reminders

Usage:
    python3 cron_expiration_check.py

Setup as cron job (daily at 9 AM):
    0 9 * * * cd /path/to/backend && python3 cron_expiration_check.py >> /var/log/expiration_reminders.log 2>&1
"""

import os
import sys
import requests
from datetime import datetime

# Configuration
API_URL = os.environ.get('API_URL', 'https://backup-voucher-system-1.onrender.com')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'prince@bakupcic.co.uk')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '')  # Set this in environment variables

def log(message):
    """Print timestamped log message"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] {message}")

def login_as_admin(session):
    """
    Login as admin to get authenticated session
    Returns True if successful, False otherwise
    """
    try:
        log("Attempting to login as admin...")
        response = session.post(
            f"{API_URL}/login",
            json={
                'email': ADMIN_EMAIL,
                'password': ADMIN_PASSWORD
            }
        )
        
        if response.status_code == 200:
            log("Successfully logged in as admin")
            return True
        else:
            log(f"Login failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        log(f"Error during login: {str(e)}")
        return False

def trigger_expiration_check(session):
    """
    Trigger the expiration reminder check via API
    Returns the result of the check
    """
    try:
        log("Triggering expiration reminder check...")
        response = session.post(f"{API_URL}/api/admin/trigger-expiration-check")
        
        if response.status_code == 200:
            result = response.json()
            log(f"Expiration check completed successfully")
            log(f"Reminders sent: {result.get('reminders_sent', 0)}")
            return result
        else:
            log(f"Expiration check failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        log(f"Error during expiration check: {str(e)}")
        return None

def main():
    """Main execution function"""
    log("=== Starting Voucher Expiration Reminder Cron Job ===")
    
    # Check if admin password is set
    if not ADMIN_PASSWORD:
        log("ERROR: ADMIN_PASSWORD environment variable not set")
        log("Please set ADMIN_PASSWORD before running this script")
        sys.exit(1)
    
    # Create session
    session = requests.Session()
    
    # Login as admin
    if not login_as_admin(session):
        log("ERROR: Failed to login as admin")
        sys.exit(1)
    
    # Trigger expiration check
    result = trigger_expiration_check(session)
    
    if result:
        log(f"SUCCESS: {result.get('message', 'Expiration check completed')}")
        log("=== Cron Job Completed Successfully ===")
        sys.exit(0)
    else:
        log("ERROR: Expiration check failed")
        log("=== Cron Job Failed ===")
        sys.exit(1)

if __name__ == "__main__":
    main()
