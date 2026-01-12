# Deployment Guide - Version 1.0.4
## 2-Step Voucher Redemption Workflow with Recipient Approval

**Date:** January 12, 2026  
**Version:** 1.0.4  
**Priority:** CRITICAL - Addresses User Feedback  
**Presentation Date:** January 14, 2026

---

## 🎯 What Was Implemented

### Critical User Feedback Addressed

This release addresses **three critical user feedback issues**:

1. ✅ **Partial Redemption Support** - Shop owners can now redeem only the actual purchase amount (e.g., £50 from a £100 voucher) instead of being forced to redeem the entire voucher balance.

2. ✅ **Recipient Approval Required** - Recipients must now validate and approve each redemption request. Validation has been moved from the shop portal to the recipient, giving them full control.

3. ✅ **Prevents Unauthorized Redemptions** - Shop owners can no longer automatically redeem the entire voucher. They must request approval for each transaction.

### Technical Implementation

#### Backend Changes

**New Database Model:**
- `RedemptionRequest` model added to track pending redemption requests
- Fields: id, voucher_id, vendor_id, recipient_id, amount, status, rejection_reason, created_at, responded_at
- Status options: pending, approved, rejected, expired
- Auto-expiration after 5 minutes

**Modified Endpoints:**
- `/vendor/redeem-voucher` - Now creates pending requests instead of immediate redemption
- `/api/recipient/redemption-requests` (GET) - Fetch pending requests for recipient
- `/api/recipient/redemption-requests/<id>/respond` (POST) - Approve or reject requests

**Real-Time Notifications:**
- Socket.IO event `redemption_request` - Notifies recipient when vendor requests redemption
- Socket.IO event `redemption_response` - Notifies vendor when recipient approves/rejects
- Instant notification system for seamless user experience

#### Frontend Changes

**RecipientDashboard:**
- Added real-time socket listener for redemption requests
- Beautiful redemption approval modal with:
  - Shop name and address
  - Voucher code
  - Amount to redeem (highlighted in red)
  - Current voucher balance
  - Remaining balance after redemption (highlighted in green)
  - Time remaining countdown (5 minutes)
  - Approve button (green)
  - Reject button (red) with reason input
  - Close button (decide later)
- Pending requests counter
- Queue system for multiple simultaneous requests

**VendorDashboard:**
- Already had amount input field (purchaseAmount state)
- Updated success message to "Redemption request sent to recipient"
- Vendor receives real-time notification when recipient responds

---

## 📋 Deployment Steps

### Step 1: Verify Auto-Deployment

Render should automatically deploy the new version from GitHub. Check deployment status:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your web service
3. Check "Events" tab for deployment status
4. Wait for "Deploy succeeded" message

### Step 2: Run Database Migration

**CRITICAL:** You must run the migration script to create the `redemption_requests` table.

#### On Render (Production):

1. Go to Render Dashboard
2. Select your web service
3. Click **"Shell"** tab
4. Run the following commands:
   ```bash
   cd backend/migrations
   python3 add_redemption_requests_table.py
   ```
5. Verify you see: ✅ Migration completed successfully!

#### Expected Output:
```
============================================================
BAK UP CIC E-Voucher System - Database Migration
Version 1.0.4 - Add redemption_requests table
============================================================

Creating redemption_requests table...
✓ Table created successfully
Creating indexes...
✓ Indexes created successfully

✅ Migration completed successfully!
The redemption_requests table is now ready.

✓ Verification successful:
  - Table 'redemption_requests' exists
  - Columns: 9
  - Indexes: 5

============================================================
Migration complete! You can now use the 2-step redemption workflow.
============================================================
```

### Step 3: Verify System Functionality

After deployment and migration, test the complete workflow:

#### Test Scenario 1: Partial Redemption
1. **As Vendor:** Scan a voucher QR code
2. **As Vendor:** Enter partial amount (e.g., £50 from £100 voucher)
3. **As Vendor:** Click "Redeem Voucher"
4. **As Vendor:** Verify success message: "Redemption request sent to recipient"
5. **As Recipient:** Check for real-time notification popup
6. **As Recipient:** Verify redemption approval modal appears
7. **As Recipient:** Verify details are correct (shop, amount, balance)
8. **As Recipient:** Click "Approve"
9. **As Vendor:** Verify real-time notification: "Redemption approved"
10. **As Recipient:** Verify voucher balance decreased by £50 (now £50 remaining)

#### Test Scenario 2: Rejection
1. **As Vendor:** Request redemption
2. **As Recipient:** Click "Reject" in approval modal
3. **As Recipient:** Enter rejection reason
4. **As Vendor:** Verify notification: "Redemption rejected: [reason]"
5. **As Recipient:** Verify voucher balance unchanged

#### Test Scenario 3: Expiration
1. **As Vendor:** Request redemption
2. **As Recipient:** Wait 5 minutes without responding
3. **As Vendor:** Verify notification: "Redemption request expired"
4. **As Recipient:** Verify request status changed to "expired"

#### Test Scenario 4: Multiple Requests
1. **As Vendor 1:** Request redemption
2. **As Vendor 2:** Request redemption (same recipient)
3. **As Recipient:** Verify modal shows first request
4. **As Recipient:** Verify counter shows "1 more request(s) pending"
5. **As Recipient:** Approve first request
6. **As Recipient:** Verify modal automatically shows second request

### Step 4: Check System Changelog

1. Log in as **Super Admin**
2. Navigate to **Admin Dashboard**
3. Scroll down to **System Changelog** section
4. Verify version shows **1.0.4**
5. Verify entry #29 appears: "2-Step Voucher Redemption Workflow with Recipient Approval"

---

## 🔍 What Changed in the User Experience

### For Recipients (Voucher Holders)

**Before:**
- No control over redemptions
- Shop owner could redeem entire voucher automatically
- No notification when voucher was used
- No way to verify purchase amount

**After:**
- ✅ Full control over every redemption
- ✅ Real-time notification when shop requests redemption
- ✅ Beautiful approval modal with all transaction details
- ✅ Can approve or reject each request
- ✅ Can see time remaining to respond
- ✅ Can provide rejection reason
- ✅ Requests expire after 5 minutes if not responded

### For Vendors (Shop Owners)

**Before:**
- Could only redeem entire voucher balance
- Immediate redemption without recipient approval
- No way to redeem partial amounts

**After:**
- ✅ Can enter custom redemption amount (partial redemption)
- ✅ Must request approval from recipient
- ✅ Receives real-time notification when approved/rejected
- ✅ Can see rejection reason if request is denied
- ✅ More transparent and secure process

---

## 📊 System Architecture Changes

### Database Schema

**New Table: `redemption_requests`**
```sql
CREATE TABLE redemption_requests (
    id SERIAL PRIMARY KEY,
    voucher_id INTEGER NOT NULL REFERENCES vouchers(id),
    vendor_id INTEGER NOT NULL REFERENCES users(id),
    recipient_id INTEGER NOT NULL REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP
);
```

**Indexes:**
- `idx_redemption_requests_recipient` - Fast lookup by recipient and status
- `idx_redemption_requests_vendor` - Fast lookup by vendor and status
- `idx_redemption_requests_voucher` - Fast lookup by voucher
- `idx_redemption_requests_created` - Fast lookup by creation time

### API Endpoints

| Method | Endpoint | Description | User Type |
|--------|----------|-------------|-----------|
| POST | `/vendor/redeem-voucher` | Create redemption request (modified) | Vendor |
| GET | `/api/recipient/redemption-requests` | Get pending requests | Recipient |
| POST | `/api/recipient/redemption-requests/<id>/respond` | Approve/reject request | Recipient |

### Socket.IO Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `redemption_request` | Backend → Recipient | Request details | Notifies recipient of new request |
| `redemption_response` | Backend → Vendor | Response details | Notifies vendor of approval/rejection |

---

## 🚨 Important Notes

### Breaking Changes

⚠️ **This is a breaking change** - The redemption workflow has fundamentally changed:
- Old behavior: Immediate redemption
- New behavior: Request → Approval → Redemption

### Migration Required

⚠️ **Database migration is REQUIRED** - The system will not work without running the migration script to create the `redemption_requests` table.

### Backwards Compatibility

✅ **Existing vouchers are compatible** - All existing vouchers will work with the new redemption workflow. No data migration needed for vouchers.

### Performance Considerations

- Socket.IO connections may increase server load slightly
- Database queries optimized with proper indexes
- Auto-expiration runs every minute (minimal overhead)

---

## 🐛 Troubleshooting

### Issue: "Table redemption_requests does not exist"
**Solution:** Run the migration script in Render Shell

### Issue: Recipient not receiving real-time notifications
**Solution:** 
1. Check Socket.IO connection in browser console
2. Verify recipient is logged in
3. Refresh the page to reconnect socket

### Issue: Vendor sees "Redemption request sent" but recipient doesn't see modal
**Solution:**
1. Check if recipient has pending requests counter showing
2. Recipient may need to refresh page
3. Check if request expired (5 minutes)

### Issue: Migration script fails with permission error
**Solution:** Ensure database user has CREATE TABLE and CREATE INDEX permissions

---

## 📈 Success Metrics

After deployment, monitor these metrics:

1. **Redemption Request Volume** - How many requests are created per day
2. **Approval Rate** - Percentage of requests approved vs rejected
3. **Average Response Time** - How long recipients take to respond
4. **Expiration Rate** - Percentage of requests that expire without response
5. **User Feedback** - Collect feedback from vendors and recipients

---

## 🎓 Training Materials Needed

Consider creating training materials for:

1. **For Recipients:**
   - How to respond to redemption requests
   - What to check before approving
   - When to reject a request
   - What happens if you don't respond

2. **For Vendors:**
   - How to enter partial redemption amounts
   - How to handle rejections
   - What to do if request expires
   - Best practices for requesting redemptions

---

## 📅 Pre-Presentation Checklist (January 14, 2026)

Before the presentation, ensure:

- [ ] Deployment completed successfully on Render
- [ ] Database migration executed without errors
- [ ] All test scenarios pass (partial redemption, rejection, expiration, multiple requests)
- [ ] System changelog shows version 1.0.4 with entry #29
- [ ] Real-time notifications working for both recipients and vendors
- [ ] Mobile responsiveness tested (approval modal works on phones)
- [ ] Arabic RTL support verified (modal displays correctly in Arabic)
- [ ] Demo accounts prepared (1 recipient, 2 vendors, 1 active voucher)
- [ ] Presentation slides updated with new workflow screenshots
- [ ] User feedback documentation showing issues resolved

---

## 📞 Support

If you encounter any issues during deployment:

1. Check Render logs for error messages
2. Verify database connection is working
3. Check browser console for JavaScript errors
4. Review Socket.IO connection status
5. Contact development team if issues persist

---

## 🎉 Conclusion

This release represents a **fundamental improvement** to the voucher redemption system based on critical user feedback. The new 2-step workflow with recipient approval provides:

- ✅ Better security and fraud prevention
- ✅ More flexibility with partial redemptions
- ✅ Improved transparency for all parties
- ✅ Real-time communication between vendors and recipients
- ✅ Professional, user-friendly interface

The system is now **production-ready** for the January 14th presentation with all critical user feedback addressed.

---

**Version:** 1.0.4  
**Last Updated:** January 12, 2026  
**Next Review:** After presentation on January 14, 2026
