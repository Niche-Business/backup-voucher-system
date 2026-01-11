"""
Database migration script for Super Admin feature
Adds super_admin user type and creates impersonation_log table
"""

import os
import sys
from sqlalchemy import create_engine, text
from datetime import datetime

# Get database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    sys.exit(1)

# Fix postgres:// to postgresql://
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

print("=" * 60)
print("Super Admin Migration Script")
print("=" * 60)
print(f"Database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'local'}")
print()

# Create engine
engine = create_engine(DATABASE_URL)

def run_migration():
    """Run the migration"""
    with engine.connect() as conn:
        print("[1/3] Checking if impersonation_log table exists...")
        
        # Check if table exists
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'impersonation_log'
            );
        """))
        table_exists = result.scalar()
        
        if table_exists:
            print("✓ impersonation_log table already exists")
        else:
            print("[2/3] Creating impersonation_log table...")
            
            conn.execute(text("""
                CREATE TABLE impersonation_log (
                    id SERIAL PRIMARY KEY,
                    super_admin_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                    target_user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    ended_at TIMESTAMP,
                    reason VARCHAR(500),
                    CONSTRAINT no_self_impersonation CHECK (super_admin_id != target_user_id)
                );
            """))
            
            print("✓ impersonation_log table created")
            
            print("[3/3] Creating indexes...")
            
            conn.execute(text("""
                CREATE INDEX idx_impersonation_super_admin ON impersonation_log(super_admin_id);
            """))
            
            conn.execute(text("""
                CREATE INDEX idx_impersonation_target_user ON impersonation_log(target_user_id);
            """))
            
            conn.execute(text("""
                CREATE INDEX idx_impersonation_started_at ON impersonation_log(started_at DESC);
            """))
            
            print("✓ Indexes created")
        
        conn.commit()
        
        print()
        print("=" * 60)
        print("✓ Migration completed successfully!")
        print("=" * 60)
        print()
        print("Next steps:")
        print("1. Create a super admin user using create_super_admin.py")
        print("2. Deploy the application")
        print("3. Test impersonation feature")
        print()

if __name__ == '__main__':
    try:
        run_migration()
    except Exception as e:
        print()
        print("=" * 60)
        print("✗ Migration failed!")
        print("=" * 60)
        print(f"Error: {str(e)}")
        print()
        sys.exit(1)
