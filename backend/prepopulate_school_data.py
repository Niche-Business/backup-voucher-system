#!/usr/bin/env python3
"""
Prepopulate school portal with test data via API calls
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "https://backup-voucher-system.onrender.com/api"

def prepopulate_school_data():
    """Add test vouchers and To Go items for school portal testing"""
    
    print("🔧 Prepopulating school portal test data...")
    
    # This would need to be called from the admin panel or directly in the database
    # For now, we'll create an admin endpoint to do this
    
    response = requests.post(f"{BASE_URL}/admin/prepopulate-school-data")
    
    if response.status_code == 200:
        print("✅ School test data prepopulated successfully!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    prepopulate_school_data()
