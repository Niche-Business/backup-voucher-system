"""
Database Migration Script
Adds missing columns to User table for VCSE verification system
"""
import os
import sys
from sqlalchemy import create_engine, text, inspect

# Get database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    sys.exit(1)

# Fix postgres:// to postgresql:// if needed (Render uses postgres://)
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)

def column_exists(engine, table_name, column_name):
    """Check if a column exists in a table"""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def add_column_if_not_exists(engine, table_name, column_name, column_definition):
    """Add a column to a table if it doesn't exist"""
    if column_exists(engine, table_name, column_name):
        print(f"✓ Column '{column_name}' already exists in '{table_name}'")
        return False
    
    try:
        with engine.connect() as conn:
            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"))
            conn.commit()
        print(f"✓ Added column '{column_name}' to '{table_name}'")
        return True
    except Exception as e:
        print(f"✗ Failed to add column '{column_name}': {str(e)}")
        return False

# Run migrations
print("\n=== Starting Database Migration ===\n")

migrations = [
    ("user", "account_status", "VARCHAR(30) DEFAULT 'ACTIVE'"),
    ("user", "rejection_reason", "TEXT"),
    ("user", "verified_at", "TIMESTAMP"),
    ("user", "verified_by_admin_id", "INTEGER REFERENCES \"user\"(id)"),
]

success_count = 0
for table, column, definition in migrations:
    if add_column_if_not_exists(engine, table, column, definition):
        success_count += 1

print(f"\n=== Migration Complete ===")
print(f"Added {success_count} new columns")
print(f"Database is now up to date!")
