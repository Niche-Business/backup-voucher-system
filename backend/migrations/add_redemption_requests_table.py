"""
Database Migration Script: Add redemption_requests table
Version: 1.0.4
Date: 2026-01-12

This migration adds the redemption_requests table to support the new 2-step
voucher redemption workflow where recipients must approve redemption requests.

Run this script ONCE after deploying version 1.0.4
"""

import os
import sys
from sqlalchemy import create_engine, text

# Get database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    sys.exit(1)

# Fix postgres:// to postgresql:// for SQLAlchemy
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)

# SQL to create redemption_requests table
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS redemption_request (
    id SERIAL PRIMARY KEY,
    voucher_id INTEGER NOT NULL REFERENCES voucher(id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    shop_id INTEGER NOT NULL REFERENCES vendor_shop(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    expires_at TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    CONSTRAINT positive_amount CHECK (amount > 0)
);
"""

# SQL to create indexes for better query performance
CREATE_INDEXES_SQL = """
CREATE INDEX IF NOT EXISTS idx_redemption_request_recipient 
    ON redemption_request(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_redemption_request_vendor 
    ON redemption_request(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_redemption_request_voucher 
    ON redemption_request(voucher_id);
CREATE INDEX IF NOT EXISTS idx_redemption_request_shop 
    ON redemption_request(shop_id);
CREATE INDEX IF NOT EXISTS idx_redemption_request_created 
    ON redemption_request(created_at);
"""

def run_migration():
    """Execute the migration"""
    try:
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                print("Creating redemption_request table...")
                conn.execute(text(CREATE_TABLE_SQL))
                print("✓ Table created successfully")
                
                print("Creating indexes...")
                conn.execute(text(CREATE_INDEXES_SQL))
                print("✓ Indexes created successfully")
                
                # Commit transaction
                trans.commit()
                print("✅ Migration completed successfully!")
                print("The redemption_request table is now ready.")
                
            except Exception as e:
                # Rollback on error
                trans.rollback()
                print(f"\n❌ Migration failed: {str(e)}")
                raise
                
    except Exception as e:
        print(f"\n❌ Database connection failed: {str(e)}")
        sys.exit(1)

def verify_migration():
    """Verify the migration was successful"""
    try:
        with engine.connect() as conn:
            # Check if table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'redemption_request'
                );
            """))
            exists = result.scalar()
            
            if exists:
                # Get column count
                result = conn.execute(text("""
                    SELECT COUNT(*) 
                    FROM information_schema.columns 
                    WHERE table_name = 'redemption_request';
                """))
                column_count = result.scalar()
                
                print(f"\n✓ Verification successful:")
                print(f"  - Table 'redemption_request' exists")
                print(f"  - Columns: {column_count}")
                
                # Get index count
                result = conn.execute(text("""
                    SELECT COUNT(*) 
                    FROM pg_indexes 
                    WHERE tablename = 'redemption_request';
                """))
                index_count = result.scalar()
                print(f"  - Indexes: {index_count}")
                
            else:
                print("\n❌ Verification failed: Table 'redemption_request' does not exist")
                sys.exit(1)
                
    except Exception as e:
        print(f"\n❌ Verification failed: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    print("=" * 60)
    print("BAK UP CIC E-Voucher System - Database Migration")
    print("Version 1.0.4 - Add redemption_request table")
    print("=" * 60)
    print()
    
    # Run migration
    run_migration()
    
    # Verify migration
    verify_migration()
    
    print()
    print("=" * 60)
    print("Migration complete! You can now use the 2-step redemption workflow.")
    print("=" * 60)
