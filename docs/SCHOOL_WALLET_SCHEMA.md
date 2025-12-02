# School/Care Organization Wallet System - Database Schema Design

## Overview

This document outlines the database schema changes needed to implement an independent wallet and voucher issuance system for Schools/Care Organizations.

## Current State

**User Model** already includes:
- `user_type` = 'school' (for school/care organizations)
- `balance` = Current wallet balance (used by VCSE, will be reused for schools)
- `allocated_balance` = Admin-allocated funds (used by VCSE)

## Design Decision

**Reuse existing fields** to maintain consistency:
- Schools will use the same `balance` field as VCSEs
- Schools will use the same `allocated_balance` field for admin allocations (if needed)
- This ensures consistent UX and reduces code duplication

## New Database Tables

### 1. WalletTransaction Table

Tracks all wallet transactions for schools and VCSEs.

```python
class WalletTransaction(db.Model):
    __tablename__ = 'wallet_transaction'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # 'credit', 'debit', 'allocation'
    amount = db.Column(db.Float, nullable=False)
    balance_before = db.Column(db.Float, nullable=False)
    balance_after = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)
    reference = db.Column(db.String(100))  # Payment reference, voucher code, etc.
    payment_method = db.Column(db.String(50))  # 'stripe', 'bank_transfer', 'admin_allocation', etc.
    payment_reference = db.Column(db.String(100))  # Stripe payment ID, etc.
    status = db.Column(db.String(20), default='completed')  # 'pending', 'completed', 'failed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))  # Admin who made allocation, or self
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='wallet_transactions')
    creator = db.relationship('User', foreign_keys=[created_by])
```

### 2. Update Voucher Table

Add field to track which wallet the voucher was issued from.

```python
# Add to existing Voucher model:
issued_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id'))  # School/VCSE who issued the voucher
deducted_from_wallet = db.Column(db.Boolean, default=False)  # Whether voucher value was deducted from issuer's wallet
wallet_transaction_id = db.Column(db.Integer, db.ForeignKey('wallet_transaction.id'))  # Link to wallet transaction

# Relationships
issued_by = db.relationship('User', foreign_keys=[issued_by_user_id])
wallet_transaction = db.relationship('WalletTransaction')
```

## Database Migration Steps

1. Create `wallet_transaction` table
2. Add new columns to `voucher` table:
   - `issued_by_user_id`
   - `deducted_from_wallet`
   - `wallet_transaction_id`

## Transaction Flow

### Add Funds (Credit)
1. School initiates "Add Funds" request
2. Payment gateway processes payment (Stripe/manual)
3. On success:
   - Create `WalletTransaction` record (type='credit')
   - Update `User.balance` += amount
   - Send notification to school

### Issue Voucher (Debit)
1. School creates voucher with specified amount
2. System checks: `User.balance >= voucher_amount`
3. If sufficient:
   - Create `Voucher` record
   - Create `WalletTransaction` record (type='debit')
   - Update `User.balance` -= voucher_amount
   - Link voucher to transaction
4. If insufficient:
   - Return error: "Insufficient balance"

### Admin Allocation (Credit)
1. Admin allocates funds to school
2. Create `WalletTransaction` record (type='allocation')
3. Update `User.allocated_balance` += amount
4. Optionally transfer to `User.balance`
5. Send notification to school

## API Endpoints Needed

### Wallet Management
- `GET /api/school/wallet/balance` - Get current balance
- `GET /api/school/wallet/transactions` - Get transaction history
- `POST /api/school/wallet/add-funds` - Initiate fund addition
- `POST /api/school/wallet/confirm-payment` - Confirm payment (webhook)

### Voucher Issuance
- `POST /api/school/vouchers/issue` - Issue new voucher from wallet
- `GET /api/school/vouchers` - Get all vouchers issued by school
- `GET /api/school/vouchers/stats` - Get usage statistics

### Reports
- `GET /api/school/reports/funds-summary` - Funds in/out summary
- `GET /api/school/reports/voucher-spend` - Voucher spend analysis
- `GET /api/school/reports/recipient-history` - Recipient usage history

## Frontend Components Needed

### School Dashboard Sections
1. **Wallet Overview**
   - Current balance display
   - Quick stats (total added, total spent, remaining)
   - "Add Funds" button

2. **Fund Management**
   - Add funds form
   - Transaction history table
   - Download transaction report

3. **Voucher Issuance**
   - Issue voucher form (amount, shop, recipient)
   - Balance validation
   - Voucher list (active, redeemed, expired)

4. **Reports & Analytics**
   - Funds in/out chart
   - Voucher spend breakdown
   - Recipient usage table

5. **Notifications**
   - Low balance alerts
   - Successful top-up confirmations
   - Voucher issuance confirmations

## Validation Rules

1. **Add Funds**
   - Minimum amount: £10
   - Maximum amount: £10,000 per transaction
   - Payment must be verified before crediting

2. **Issue Voucher**
   - Balance must be >= voucher amount
   - Voucher amount must be > £0
   - Expiry date must be in future
   - Shop must be active and verified

3. **Wallet Balance**
   - Cannot go negative
   - All transactions must be logged
   - Balance must always equal sum of transactions

## Security Considerations

1. **Transaction Integrity**
   - Use database transactions (BEGIN/COMMIT)
   - Lock user record during balance updates
   - Verify balance before and after each operation

2. **Audit Trail**
   - Log all wallet operations
   - Track who initiated each transaction
   - Store payment references for reconciliation

3. **Access Control**
   - Only school users can access their own wallet
   - Admin can view all wallets (read-only)
   - Payment webhooks must be authenticated

## Implementation Priority

**Phase 1: Core Wallet (High Priority)**
1. Create WalletTransaction model
2. Update Voucher model
3. Implement balance management APIs
4. Build basic wallet UI

**Phase 2: Voucher Issuance (High Priority)**
1. Implement voucher issuance with wallet deduction
2. Add validation and error handling
3. Build voucher issuance UI

**Phase 3: Payment Integration (Medium Priority)**
1. Integrate Stripe/payment gateway
2. Implement webhook handling
3. Add payment confirmation flow

**Phase 4: Reports & Analytics (Medium Priority)**
1. Build transaction reports
2. Add voucher spend analytics
3. Create recipient history views

**Phase 5: Notifications (Low Priority)**
1. Implement low balance alerts
2. Add transaction notifications
3. Send email confirmations

## Testing Checklist

- [ ] Create school user account
- [ ] Add funds to wallet (manual/Stripe)
- [ ] Verify balance updates correctly
- [ ] Issue voucher with sufficient balance
- [ ] Verify voucher issuance fails with insufficient balance
- [ ] Check transaction history accuracy
- [ ] Test concurrent transactions (race conditions)
- [ ] Verify balance cannot go negative
- [ ] Test admin allocation to school
- [ ] Verify reports show correct data
- [ ] Test notifications are sent
- [ ] Check audit trail completeness

## Migration Script

```sql
-- Create wallet_transaction table
CREATE TABLE wallet_transaction (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount FLOAT NOT NULL,
    balance_before FLOAT NOT NULL,
    balance_after FLOAT NOT NULL,
    description TEXT,
    reference VARCHAR(100),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (created_by) REFERENCES user(id)
);

-- Add columns to voucher table
ALTER TABLE voucher ADD COLUMN issued_by_user_id INTEGER;
ALTER TABLE voucher ADD COLUMN deducted_from_wallet BOOLEAN DEFAULT FALSE;
ALTER TABLE voucher ADD COLUMN wallet_transaction_id INTEGER;
ALTER TABLE voucher ADD FOREIGN KEY (issued_by_user_id) REFERENCES user(id);
ALTER TABLE voucher ADD FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transaction(id);
```
