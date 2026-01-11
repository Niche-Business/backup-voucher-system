#!/usr/bin/env python3
"""
Migration Script: Add Wallet System for Schools/Care Organizations
Date: 2025-12-02
Description: Creates wallet_transaction table and adds wallet-related fields to voucher table
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Database connection
DATABASE_URL = os.environ.get('DATABASE_URL')

if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    sys.exit(1)

def run_migration():
    """Execute the wallet system migration"""
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            print("Starting wallet system migration...")
            
            # Start transaction
            trans = conn.begin()
            
            try:
                # 1. Create wallet_transaction table
                print("Creating wallet_transaction table...")
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS wallet_transaction (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        transaction_type VARCHAR(20) NOT NULL,
                        amount DECIMAL(10, 2) NOT NULL,
                        balance_before DECIMAL(10, 2) NOT NULL,
                        balance_after DECIMAL(10, 2) NOT NULL,
                        description TEXT,
                        reference VARCHAR(100),
                        payment_method VARCHAR(50),
                        payment_reference VARCHAR(100),
                        status VARCHAR(20) DEFAULT 'completed',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        created_by INT,
                        
                        FOREIGN KEY (user_id) REFERENCES `user`(id) ON DELETE CASCADE,
                        FOREIGN KEY (created_by) REFERENCES `user`(id) ON DELETE SET NULL,
                        
                        INDEX idx_user_id (user_id),
                        INDEX idx_transaction_type (transaction_type),
                        INDEX idx_created_at (created_at),
                        INDEX idx_status (status)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """))
                print("✓ wallet_transaction table created")
                
                # 2. Add issued_by_user_id column to voucher table
                print("Adding issued_by_user_id column to voucher table...")
                try:
                    conn.execute(text("""
                        ALTER TABLE voucher 
                        ADD COLUMN issued_by_user_id INT
                    """))
                    print("✓ issued_by_user_id column added")
                except SQLAlchemyError as e:
                    if "Duplicate column name" in str(e):
                        print("  (Column already exists, skipping)")
                    else:
                        raise
                
                # 3. Add deducted_from_wallet column to voucher table
                print("Adding deducted_from_wallet column to voucher table...")
                try:
                    conn.execute(text("""
                        ALTER TABLE voucher 
                        ADD COLUMN deducted_from_wallet BOOLEAN DEFAULT FALSE
                    """))
                    print("✓ deducted_from_wallet column added")
                except SQLAlchemyError as e:
                    if "Duplicate column name" in str(e):
                        print("  (Column already exists, skipping)")
                    else:
                        raise
                
                # 4. Add wallet_transaction_id column to voucher table
                print("Adding wallet_transaction_id column to voucher table...")
                try:
                    conn.execute(text("""
                        ALTER TABLE voucher 
                        ADD COLUMN wallet_transaction_id INT
                    """))
                    print("✓ wallet_transaction_id column added")
                except SQLAlchemyError as e:
                    if "Duplicate column name" in str(e):
                        print("  (Column already exists, skipping)")
                    else:
                        raise
                
                # 5. Add foreign key constraints
                print("Adding foreign key constraints...")
                try:
                    conn.execute(text("""
                        ALTER TABLE voucher 
                        ADD CONSTRAINT fk_voucher_issued_by_user 
                        FOREIGN KEY (issued_by_user_id) REFERENCES `user`(id) ON DELETE SET NULL
                    """))
                    print("✓ Foreign key fk_voucher_issued_by_user added")
                except SQLAlchemyError as e:
                    if "Duplicate foreign key constraint" in str(e) or "already exists" in str(e):
                        print("  (Foreign key already exists, skipping)")
                    else:
                        raise
                
                try:
                    conn.execute(text("""
                        ALTER TABLE voucher 
                        ADD CONSTRAINT fk_voucher_wallet_transaction 
                        FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transaction(id) ON DELETE SET NULL
                    """))
                    print("✓ Foreign key fk_voucher_wallet_transaction added")
                except SQLAlchemyError as e:
                    if "Duplicate foreign key constraint" in str(e) or "already exists" in str(e):
                        print("  (Foreign key already exists, skipping)")
                    else:
                        raise
                
                # 6. Add indexes for better performance
                print("Adding indexes...")
                try:
                    conn.execute(text("""
                        ALTER TABLE voucher 
                        ADD INDEX idx_issued_by_user_id (issued_by_user_id)
                    """))
                    print("✓ Index idx_issued_by_user_id added")
                except SQLAlchemyError as e:
                    if "Duplicate key name" in str(e):
                        print("  (Index already exists, skipping)")
                    else:
                        raise
                
                try:
                    conn.execute(text("""
                        ALTER TABLE voucher 
                        ADD INDEX idx_wallet_transaction_id (wallet_transaction_id)
                    """))
                    print("✓ Index idx_wallet_transaction_id added")
                except SQLAlchemyError as e:
                    if "Duplicate key name" in str(e):
                        print("  (Index already exists, skipping)")
                    else:
                        raise
                
                try:
                    conn.execute(text("""
                        ALTER TABLE voucher 
                        ADD INDEX idx_deducted_from_wallet (deducted_from_wallet)
                    """))
                    print("✓ Index idx_deducted_from_wallet added")
                except SQLAlchemyError as e:
                    if "Duplicate key name" in str(e):
                        print("  (Index already exists, skipping)")
                    else:
                        raise
                
                # Commit transaction
                trans.commit()
                print("\n✅ Wallet system migration completed successfully!")
                return True
                
            except Exception as e:
                trans.rollback()
                print(f"\n❌ Migration failed: {str(e)}")
                raise
                
    except SQLAlchemyError as e:
        print(f"❌ Database error: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
