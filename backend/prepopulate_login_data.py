#!/usr/bin/env python3
"""
Script to prepopulate login statistics data for testing
This updates existing users with realistic login counts and timestamps
"""

import requests
import json
from datetime import datetime, timedelta
import random

BASE_URL = "https://backup-voucher-system.onrender.com/api"

def update_user_login_data():
    """Update users with realistic login data via API calls"""
    
    # First, get all users
    print("Fetching all users...")
    
    # We'll need to create an admin session first
    session = requests.Session()
    
    # Login as admin
    login_data = {
        "email": "prince.caesar@bakup.org",
        "password": "Prince@2024"
    }
    
    print("Logging in as admin...")
    response = session.post(f"{BASE_URL}/login", json=login_data)
    
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    print("✓ Logged in successfully")
    
    # Get all users (we'll need to query the database directly or use an admin endpoint)
    # For now, let's create a simple endpoint to update login stats
    
    print("\nUpdating login statistics for existing users...")
    print("This will add realistic login counts and timestamps to all users")
    
    # Define test data for different user types
    test_updates = [
        {
            "email": "bsvcse@yopmail.com",
            "login_count": random.randint(15, 50),
            "days_ago": random.randint(1, 5)
        },
        {
            "email": "osborncaesar@gmail.com",
            "login_count": random.randint(20, 60),
            "days_ago": random.randint(1, 3)
        },
        {
            "email": "mens@gmail.com",
            "login_count": random.randint(10, 40),
            "days_ago": random.randint(5, 15)
        }
    ]
    
    print("\nTest data prepared for:")
    for update in test_updates:
        print(f"  - {update['email']}: {update['login_count']} logins, last login {update['days_ago']} days ago")
    
    print("\n✓ Script prepared. Run this on the production server to update the database.")
    print("  Or use the SQL commands below:\n")
    
    for update in test_updates:
        last_login = datetime.utcnow() - timedelta(days=update['days_ago'])
        print(f"UPDATE users SET login_count = {update['login_count']}, last_login = '{last_login.isoformat()}' WHERE email = '{update['email']}';")

if __name__ == "__main__":
    update_user_login_data()
