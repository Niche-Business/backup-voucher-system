#!/usr/bin/env python3.11
"""
Database initialization script to create all tables including shopping_cart
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app, db

def init_tables():
    """Create all database tables"""
    with app.app_context():
        print("=" * 60)
        print("DATABASE TABLE INITIALIZATION")
        print("=" * 60)
        
        try:
            # Create all tables
            db.create_all()
            print("\n✅ All database tables created successfully!")
            print("\nTables created:")
            print("  - user")
            print("  - vendor_shop")
            print("  - voucher")
            print("  - surplus_item")
            print("  - shopping_cart")
            print("  - order")
            print("  - notification")
            print("  - login_history")
            print("  - report")
            print("  - cart_notification")
            
            print("\n" + "=" * 60)
            print("INITIALIZATION COMPLETE")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n❌ Error creating tables: {str(e)}")
            print("\n" + "=" * 60)
            return False
        
        return True

if __name__ == '__main__':
    success = init_tables()
    sys.exit(0 if success else 1)
