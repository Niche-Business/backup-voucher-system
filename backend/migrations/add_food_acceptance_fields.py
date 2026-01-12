#!/usr/bin/env python3
"""
BAK UP CIC E-Voucher System - Database Migration
Version 1.0.5 - Add VCSE Food Acceptance Workflow Fields

This migration adds fields to support VCSE acceptance of Food to Go items:
- accepted_by_vcse_id: Which VCSE organization accepted the item
- accepted_at: When the item was accepted
- collection_time: Scheduled collection time
- collection_status: Status tracking (available/accepted/collected/expired)

Run this script in the Render Shell after deployment.
"""

import os
import psycopg2
from psycopg2 import sql

def run_migration():
    # Get database URL from environment
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set")
        return False
    
    # Fix postgres:// to postgresql:// for SQLAlchemy compatibility
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    print("=" * 60)
    print("BAK UP CIC E-Voucher System - Database Migration")
    print("Version 1.0.5 - Add VCSE Food Acceptance Workflow")
    print("=" * 60)
    print()
    
    try:
        # Connect to database
        print("Connecting to database...")
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        print("✓ Connected successfully")
        print()
        
        # Check if columns already exist
        print("Checking existing schema...")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'surplus_item' 
            AND column_name IN ('accepted_by_vcse_id', 'accepted_at', 'collection_time', 'collection_status')
        """)
        existing_columns = [row[0] for row in cur.fetchall()]
        
        if len(existing_columns) == 4:
            print("⚠️  All columns already exist. Migration may have been run before.")
            print("   Existing columns:", existing_columns)
            response = input("\nDo you want to continue anyway? (yes/no): ")
            if response.lower() != 'yes':
                print("Migration cancelled.")
                return False
        
        # Add new columns
        print("Adding new columns to surplus_item table...")
        
        # Add accepted_by_vcse_id column
        if 'accepted_by_vcse_id' not in existing_columns:
            cur.execute("""
                ALTER TABLE surplus_item 
                ADD COLUMN accepted_by_vcse_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL
            """)
            print("✓ Added accepted_by_vcse_id column")
        else:
            print("⊘ accepted_by_vcse_id column already exists")
        
        # Add accepted_at column
        if 'accepted_at' not in existing_columns:
            cur.execute("""
                ALTER TABLE surplus_item 
                ADD COLUMN accepted_at TIMESTAMP
            """)
            print("✓ Added accepted_at column")
        else:
            print("⊘ accepted_at column already exists")
        
        # Add collection_time column
        if 'collection_time' not in existing_columns:
            cur.execute("""
                ALTER TABLE surplus_item 
                ADD COLUMN collection_time TIMESTAMP
            """)
            print("✓ Added collection_time column")
        else:
            print("⊘ collection_time column already exists")
        
        # Add collection_status column
        if 'collection_status' not in existing_columns:
            cur.execute("""
                ALTER TABLE surplus_item 
                ADD COLUMN collection_status VARCHAR(20) DEFAULT 'available'
            """)
            print("✓ Added collection_status column")
        else:
            print("⊘ collection_status column already exists")
        
        # Create indexes for performance
        print("\nCreating indexes...")
        
        try:
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_surplus_item_accepted_by_vcse 
                ON surplus_item(accepted_by_vcse_id)
            """)
            print("✓ Created index on accepted_by_vcse_id")
        except Exception as e:
            print(f"⊘ Index on accepted_by_vcse_id may already exist: {e}")
        
        try:
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_surplus_item_collection_status 
                ON surplus_item(collection_status)
            """)
            print("✓ Created index on collection_status")
        except Exception as e:
            print(f"⊘ Index on collection_status may already exist: {e}")
        
        try:
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_surplus_item_collection_time 
                ON surplus_item(collection_time)
            """)
            print("✓ Created index on collection_time")
        except Exception as e:
            print(f"⊘ Index on collection_time may already exist: {e}")
        
        # Update existing items to have 'available' status
        print("\nUpdating existing items...")
        cur.execute("""
            UPDATE surplus_item 
            SET collection_status = 'available' 
            WHERE collection_status IS NULL
        """)
        updated_count = cur.rowcount
        print(f"✓ Updated {updated_count} existing items to 'available' status")
        
        # Commit changes
        conn.commit()
        print()
        print("=" * 60)
        print("✅ Migration completed successfully!")
        print("=" * 60)
        print()
        
        # Verify the changes
        print("Verifying migration...")
        cur.execute("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'surplus_item' 
            AND column_name IN ('accepted_by_vcse_id', 'accepted_at', 'collection_time', 'collection_status')
            ORDER BY column_name
        """)
        
        print("\n✓ Verification successful:")
        for row in cur.fetchall():
            print(f"  - {row[0]}: {row[1]}" + (f" (default: {row[2]})" if row[2] else ""))
        
        # Show total columns in to_go_item table
        cur.execute("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = 'surplus_item'
        """)
        total_columns = cur.fetchone()[0]
        print(f"\n✓ Total columns in surplus_item table: {total_columns}")
        
        # Close connection
        cur.close()
        conn.close()
        
        print()
        print("=" * 60)
        print("Next Steps:")
        print("1. Restart the web service in Render dashboard")
        print("2. Test VCSE food acceptance workflow")
        print("3. Verify real-time notifications work")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print()
        print("=" * 60)
        print("❌ Migration failed!")
        print("=" * 60)
        print(f"\nError: {str(e)}")
        print()
        print("Troubleshooting:")
        print("1. Check that DATABASE_URL is set correctly")
        print("2. Verify database connection is working")
        print("3. Check that surplus_item table exists")
        print("4. Review error message above for details")
        print()
        
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        
        return False

if __name__ == '__main__':
    success = run_migration()
    exit(0 if success else 1)
