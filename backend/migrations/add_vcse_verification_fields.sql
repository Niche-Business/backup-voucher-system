-- Migration: Add VCSE Verification Fields to User Table
-- Date: 2025-12-02
-- Description: Adds account_status, rejection_reason, verified_at, and verified_by_admin_id fields for VCSE verification workflow

-- Add account_status column (ACTIVE, PENDING_VERIFICATION, REJECTED)
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS account_status VARCHAR(30) DEFAULT 'ACTIVE';

-- Add rejection_reason column
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add verified_at timestamp
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Add verified_by_admin_id foreign key
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS verified_by_admin_id INTEGER REFERENCES "user"(id);

-- Create index on account_status for faster queries
CREATE INDEX IF NOT EXISTS idx_user_account_status ON "user"(account_status);

-- Create index on user_type and account_status for VCSE verification queries
CREATE INDEX IF NOT EXISTS idx_user_type_status ON "user"(user_type, account_status);

-- Update existing VCSE users to ACTIVE status (they were already approved)
UPDATE "user" 
SET account_status = 'ACTIVE' 
WHERE user_type = 'vcse' AND account_status IS NULL;

-- Update all other existing users to ACTIVE status
UPDATE "user" 
SET account_status = 'ACTIVE' 
WHERE account_status IS NULL OR account_status = '';

COMMENT ON COLUMN "user".account_status IS 'Account verification status: ACTIVE, PENDING_VERIFICATION, or REJECTED';
COMMENT ON COLUMN "user".rejection_reason IS 'Reason for rejection if account_status is REJECTED';
COMMENT ON COLUMN "user".verified_at IS 'Timestamp when account was verified by admin';
COMMENT ON COLUMN "user".verified_by_admin_id IS 'ID of admin user who verified this account';
