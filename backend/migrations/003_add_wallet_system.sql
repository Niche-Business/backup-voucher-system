-- Migration: Add Wallet System for Schools/Care Organizations
-- Date: 2025-12-02
-- Description: Creates wallet_transaction table and adds wallet-related fields to voucher table

-- Create wallet_transaction table
CREATE TABLE IF NOT EXISTS wallet_transaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL COMMENT 'credit, debit, allocation',
    amount DECIMAL(10, 2) NOT NULL,
    balance_before DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    description TEXT,
    reference VARCHAR(100) COMMENT 'Payment reference, voucher code, etc.',
    payment_method VARCHAR(50) COMMENT 'stripe, bank_transfer, admin_allocation, manual',
    payment_reference VARCHAR(100) COMMENT 'Stripe payment ID, bank reference, etc.',
    status VARCHAR(20) DEFAULT 'completed' COMMENT 'pending, completed, failed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT COMMENT 'Admin who made allocation, or self for self-service',
    
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES user(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_at (created_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add wallet-related columns to voucher table
ALTER TABLE voucher 
    ADD COLUMN IF NOT EXISTS issued_by_user_id INT COMMENT 'School/VCSE who issued the voucher',
    ADD COLUMN IF NOT EXISTS deducted_from_wallet BOOLEAN DEFAULT FALSE COMMENT 'Whether voucher value was deducted from issuer wallet',
    ADD COLUMN IF NOT EXISTS wallet_transaction_id INT COMMENT 'Link to wallet transaction',
    ADD FOREIGN KEY IF NOT EXISTS fk_voucher_issued_by_user (issued_by_user_id) REFERENCES user(id) ON DELETE SET NULL,
    ADD FOREIGN KEY IF NOT EXISTS fk_voucher_wallet_transaction (wallet_transaction_id) REFERENCES wallet_transaction(id) ON DELETE SET NULL;

-- Add indexes for better query performance
ALTER TABLE voucher 
    ADD INDEX IF NOT EXISTS idx_issued_by_user_id (issued_by_user_id),
    ADD INDEX IF NOT EXISTS idx_wallet_transaction_id (wallet_transaction_id),
    ADD INDEX IF NOT EXISTS idx_deducted_from_wallet (deducted_from_wallet);

-- Create view for wallet balance summary (optional, for reporting)
CREATE OR REPLACE VIEW wallet_balance_summary AS
SELECT 
    u.id AS user_id,
    u.email,
    u.organization_name,
    u.user_type,
    u.balance AS current_balance,
    u.allocated_balance,
    COUNT(wt.id) AS total_transactions,
    SUM(CASE WHEN wt.transaction_type = 'credit' THEN wt.amount ELSE 0 END) AS total_credits,
    SUM(CASE WHEN wt.transaction_type = 'debit' THEN wt.amount ELSE 0 END) AS total_debits,
    SUM(CASE WHEN wt.transaction_type = 'allocation' THEN wt.amount ELSE 0 END) AS total_allocations,
    MAX(wt.created_at) AS last_transaction_date
FROM user u
LEFT JOIN wallet_transaction wt ON u.id = wt.user_id
WHERE u.user_type IN ('school', 'vcse')
GROUP BY u.id, u.email, u.organization_name, u.user_type, u.balance, u.allocated_balance;

-- Insert sample data for testing (optional, remove in production)
-- This creates a test transaction for existing school users
-- INSERT INTO wallet_transaction (user_id, transaction_type, amount, balance_before, balance_after, description, payment_method, status, created_by)
-- SELECT id, 'allocation', 100.00, balance, balance + 100.00, 'Initial test allocation', 'admin_allocation', 'completed', 1
-- FROM user
-- WHERE user_type = 'school' AND balance = 0
-- LIMIT 1;

-- Migration complete
SELECT 'Wallet system migration completed successfully' AS status;
