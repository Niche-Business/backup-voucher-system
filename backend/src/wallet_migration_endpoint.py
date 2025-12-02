"""
Wallet System Migration Endpoint
This file contains the migration endpoint code to be added to main.py
"""

# Add this endpoint to main.py after the existing migration endpoints

@app.route('/api/admin/run-wallet-migration', methods=['POST'])
def run_wallet_migration():
    """Run wallet system database migration"""
    # Check for secret key in request
    secret_key = request.json.get('secret_key') if request.json else request.args.get('secret_key')
    
    MIGRATION_SECRET_KEY = os.environ.get('MIGRATION_SECRET_KEY', 'Food_To_Go_2024_Migration_Key')
    
    if secret_key != MIGRATION_SECRET_KEY:
        return jsonify({'error': 'Invalid secret key'}), 403
    
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        results = []
        
        # 1. Create wallet_transaction table if it doesn't exist
        if 'wallet_transaction' not in tables:
            results.append("Creating wallet_transaction table...")
            create_table_sql = text("""
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
            """)
            db.session.execute(create_table_sql)
            results.append("✓ wallet_transaction table created")
        else:
            results.append("✓ wallet_transaction table already exists")
        
        # 2. Add columns to voucher table
        voucher_columns = inspector.get_columns('voucher')
        existing_columns = [col['name'] for col in voucher_columns]
        
        if 'issued_by_user_id' not in existing_columns:
            results.append("Adding issued_by_user_id column to voucher table...")
            db.session.execute(text("ALTER TABLE voucher ADD COLUMN issued_by_user_id INT"))
            results.append("✓ issued_by_user_id column added")
        else:
            results.append("✓ issued_by_user_id column already exists")
        
        if 'deducted_from_wallet' not in existing_columns:
            results.append("Adding deducted_from_wallet column to voucher table...")
            db.session.execute(text("ALTER TABLE voucher ADD COLUMN deducted_from_wallet BOOLEAN DEFAULT FALSE"))
            results.append("✓ deducted_from_wallet column added")
        else:
            results.append("✓ deducted_from_wallet column already exists")
        
        if 'wallet_transaction_id' not in existing_columns:
            results.append("Adding wallet_transaction_id column to voucher table...")
            db.session.execute(text("ALTER TABLE voucher ADD COLUMN wallet_transaction_id INT"))
            results.append("✓ wallet_transaction_id column added")
        else:
            results.append("✓ wallet_transaction_id column already exists")
        
        # 3. Add foreign key constraints (if they don't exist)
        try:
            results.append("Adding foreign key constraints...")
            db.session.execute(text("""
                ALTER TABLE voucher 
                ADD CONSTRAINT fk_voucher_issued_by_user 
                FOREIGN KEY (issued_by_user_id) REFERENCES `user`(id) ON DELETE SET NULL
            """))
            results.append("✓ Foreign key fk_voucher_issued_by_user added")
        except Exception as e:
            if "Duplicate foreign key" in str(e) or "already exists" in str(e):
                results.append("✓ Foreign key fk_voucher_issued_by_user already exists")
            else:
                results.append(f"⚠ Foreign key fk_voucher_issued_by_user: {str(e)}")
        
        try:
            db.session.execute(text("""
                ALTER TABLE voucher 
                ADD CONSTRAINT fk_voucher_wallet_transaction 
                FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transaction(id) ON DELETE SET NULL
            """))
            results.append("✓ Foreign key fk_voucher_wallet_transaction added")
        except Exception as e:
            if "Duplicate foreign key" in str(e) or "already exists" in str(e):
                results.append("✓ Foreign key fk_voucher_wallet_transaction already exists")
            else:
                results.append(f"⚠ Foreign key fk_voucher_wallet_transaction: {str(e)}")
        
        # 4. Add indexes
        try:
            db.session.execute(text("ALTER TABLE voucher ADD INDEX idx_issued_by_user_id (issued_by_user_id)"))
            results.append("✓ Index idx_issued_by_user_id added")
        except Exception as e:
            if "Duplicate key name" in str(e):
                results.append("✓ Index idx_issued_by_user_id already exists")
            else:
                results.append(f"⚠ Index idx_issued_by_user_id: {str(e)}")
        
        try:
            db.session.execute(text("ALTER TABLE voucher ADD INDEX idx_wallet_transaction_id (wallet_transaction_id)"))
            results.append("✓ Index idx_wallet_transaction_id added")
        except Exception as e:
            if "Duplicate key name" in str(e):
                results.append("✓ Index idx_wallet_transaction_id already exists")
            else:
                results.append(f"⚠ Index idx_wallet_transaction_id: {str(e)}")
        
        try:
            db.session.execute(text("ALTER TABLE voucher ADD INDEX idx_deducted_from_wallet (deducted_from_wallet)"))
            results.append("✓ Index idx_deducted_from_wallet added")
        except Exception as e:
            if "Duplicate key name" in str(e):
                results.append("✓ Index idx_deducted_from_wallet already exists")
            else:
                results.append(f"⚠ Index idx_deducted_from_wallet: {str(e)}")
        
        db.session.commit()
        results.append("\n✅ Wallet system migration completed successfully!")
        
        return jsonify({
            'message': 'Wallet system migration completed',
            'details': results
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': f'Migration failed: {str(e)}',
            'details': results
        }), 500
