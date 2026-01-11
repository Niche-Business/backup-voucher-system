"""
Migration script to add payout_request table to the database
"""
import os
import sys
from sqlalchemy import create_engine, text

# Get database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("Error: DATABASE_URL environment variable not set")
    sys.exit(1)

# Fix postgres:// to postgresql://
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)

# SQL to create payout_request table
create_table_sql = """
CREATE TABLE IF NOT EXISTS payout_request (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES "user"(id),
    shop_id INTEGER NOT NULL REFERENCES vendor_shop(id),
    amount FLOAT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    sort_code VARCHAR(20),
    account_holder_name VARCHAR(100),
    notes TEXT,
    admin_notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES "user"(id),
    paid_at TIMESTAMP
);
"""

try:
    with engine.connect() as conn:
        # Create the table
        print("Creating payout_request table...")
        conn.execute(text(create_table_sql))
        conn.commit()
        print("✓ payout_request table created successfully")
        
        # Create indexes for better performance
        print("Creating indexes...")
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_payout_vendor ON payout_request(vendor_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_payout_shop ON payout_request(shop_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_payout_status ON payout_request(status);"))
        conn.commit()
        print("✓ Indexes created successfully")
        
        print("\n✅ Migration completed successfully!")
        
except Exception as e:
    print(f"\n❌ Migration failed: {str(e)}")
    sys.exit(1)
