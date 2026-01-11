# School Wallet System - Testing Guide

## 🎯 Testing Objectives

This guide provides step-by-step instructions to test the complete wallet system functionality for Schools/Care Organizations.

## 📋 Pre-Testing Checklist

- [ ] Backend deployed successfully on Render
- [ ] Frontend deployed successfully on Render
- [ ] Database migration completed (`wallet_transaction` table created)
- [ ] Test school user account available
- [ ] Browser developer tools ready for debugging

## 🧪 Test Scenarios

### Test 1: Access Wallet Management Tab

**Objective:** Verify that school users can access the wallet management interface

**Steps:**
1. Log in as a school user
2. Navigate to School Dashboard
3. Click on "💰 Wallet Management" tab

**Expected Results:**
- ✅ Wallet Management tab is visible in the navigation
- ✅ Tab switches to wallet view when clicked
- ✅ Four overview cards are displayed:
  - Current Wallet Balance
  - Total Credits
  - Total Debits
  - Vouchers Issued
- ✅ All balances show £0.00 for new accounts
- ✅ Add Funds form is visible
- ✅ Transaction History section is visible

**Screenshot:** Take screenshot of initial wallet view

---

### Test 2: Add Funds to Wallet

**Objective:** Verify that schools can add funds to their wallet

**Steps:**
1. In Wallet Management tab, locate "Add Funds to Wallet" section
2. Enter amount: `500.00`
3. Enter payment reference: `TEST-REF-001`
4. Enter description: `Initial test funds`
5. Click "➕ Add Funds to Wallet" button

**Expected Results:**
- ✅ Success message appears: "✅ Funds added successfully! New balance: £500.00"
- ✅ Current Wallet Balance card updates to £500.00
- ✅ Total Credits card updates to £500.00
- ✅ Form fields are cleared after submission
- ✅ New transaction appears in Transaction History table with:
  - Type: CREDIT (green badge)
  - Amount: +£500.00 (green text)
  - Balance After: £500.00
  - Status: completed (green badge)
  - Description: "Initial test funds"
  - Reference: "TEST-REF-001"

**Screenshot:** Take screenshot of wallet after adding funds

---

### Test 3: Add Multiple Fund Transactions

**Objective:** Verify transaction history accumulation

**Steps:**
1. Add funds: £250.00, ref: `TEST-REF-002`, description: `Second deposit`
2. Add funds: £150.00, ref: `TEST-REF-003`, description: `Third deposit`

**Expected Results:**
- ✅ Current Wallet Balance: £900.00
- ✅ Total Credits: £900.00
- ✅ Transaction history shows 3 transactions in reverse chronological order
- ✅ Each transaction shows correct balance progression:
  - Transaction 1: £0.00 → £500.00
  - Transaction 2: £500.00 → £750.00
  - Transaction 3: £750.00 → £900.00

**Screenshot:** Take screenshot of transaction history

---

### Test 4: Issue Voucher from Wallet (Sufficient Balance)

**Objective:** Verify voucher issuance deducts from wallet

**Steps:**
1. Navigate to "Issue Vouchers" tab
2. Fill in voucher form:
   - Recipient Email: `test.recipient@example.com`
   - Recipient First Name: `John`
   - Recipient Last Name: `Doe`
   - Voucher Amount: `50.00`
   - Shop Assignment: "Recipient to Choose"
3. Click "Issue Voucher" button

**Expected Results:**
- ✅ Success message appears with voucher code
- ✅ Message includes: "New wallet balance: £850.00"
- ✅ Return to Wallet Management tab
- ✅ Current Wallet Balance: £850.00
- ✅ Total Debits: £50.00
- ✅ Vouchers Issued: 1
- ✅ New DEBIT transaction in history:
  - Type: DEBIT (red badge)
  - Amount: -£50.00 (red text)
  - Balance After: £850.00
  - Description: "Voucher issued: [VOUCHER_CODE]"
  - Status: completed

**Screenshot:** Take screenshot showing debit transaction

---

### Test 5: Issue Multiple Vouchers

**Objective:** Verify wallet balance decreases correctly with multiple vouchers

**Steps:**
1. Issue voucher for £100.00
2. Issue voucher for £75.00
3. Issue voucher for £25.00

**Expected Results:**
- ✅ Current Wallet Balance: £650.00 (850 - 100 - 75 - 25)
- ✅ Total Credits: £900.00 (unchanged)
- ✅ Total Debits: £250.00 (50 + 100 + 75 + 25)
- ✅ Vouchers Issued: 4
- ✅ Transaction history shows all 4 debit transactions
- ✅ Balance progression is correct in each transaction

**Screenshot:** Take screenshot of wallet overview after multiple vouchers

---

### Test 6: Insufficient Balance Validation

**Objective:** Verify system prevents voucher issuance when balance is insufficient

**Steps:**
1. Current balance should be £650.00
2. Navigate to "Issue Vouchers" tab
3. Try to issue voucher for £1000.00

**Expected Results:**
- ✅ Error message appears: "❌ Error: Insufficient balance. Please add funds to issue this voucher."
- ✅ Message may include current balance and shortfall
- ✅ Voucher is NOT issued
- ✅ Wallet balance remains £650.00
- ✅ No new transaction in history

**Screenshot:** Take screenshot of insufficient balance error

---

### Test 7: Edge Case - Exact Balance

**Objective:** Verify voucher can be issued for exact wallet balance

**Steps:**
1. Current balance: £650.00
2. Issue voucher for exactly £650.00

**Expected Results:**
- ✅ Voucher issued successfully
- ✅ Current Wallet Balance: £0.00
- ✅ Total Debits: £900.00
- ✅ Transaction recorded correctly

---

### Test 8: Wallet Statistics Accuracy

**Objective:** Verify all statistics are calculated correctly

**Steps:**
1. Review all wallet overview cards
2. Manually calculate totals from transaction history
3. Compare with displayed statistics

**Expected Results:**
- ✅ Current Wallet Balance = Total Credits - Total Debits
- ✅ Total Credits = Sum of all CREDIT transactions
- ✅ Total Debits = Sum of all DEBIT transactions
- ✅ Vouchers Issued count matches number of vouchers created
- ✅ Total voucher value matches Total Debits

---

### Test 9: Transaction History Pagination

**Objective:** Verify transaction history displays correctly

**Steps:**
1. Review transaction history table
2. Check if all transactions are visible
3. Verify sorting (newest first)

**Expected Results:**
- ✅ Transactions sorted by date (newest at top)
- ✅ All columns display correctly:
  - Date (DD/MM/YYYY format)
  - Time (HH:MM:SS format)
  - Type badge (color-coded)
  - Description
  - Amount (with +/- sign)
  - Balance After
  - Status
- ✅ Reference shown when available
- ✅ Table is responsive and scrollable

---

### Test 10: Form Validation

**Objective:** Verify add funds form validation works correctly

**Steps:**
1. Try to submit form with empty amount
2. Try to submit with amount = 0
3. Try to submit with negative amount
4. Try to submit with amount > £10,000
5. Try to submit with valid amount but no reference (should work)

**Expected Results:**
- ✅ Empty amount: Browser validation prevents submission
- ✅ Zero amount: Browser validation prevents submission (min="1")
- ✅ Negative amount: Browser validation prevents submission
- ✅ Amount > £10,000: Browser validation prevents submission (max="10000")
- ✅ No reference: Form submits successfully (reference is optional)

---

### Test 11: Real-time Balance Updates

**Objective:** Verify balance updates immediately after transactions

**Steps:**
1. Note current balance
2. Add funds
3. Immediately check if balance card updated
4. Issue voucher
5. Immediately check if balance card updated

**Expected Results:**
- ✅ Balance updates immediately after add funds (no page refresh needed)
- ✅ Balance updates immediately after voucher issuance
- ✅ All statistics update in real-time
- ✅ Transaction history updates without manual refresh

---

### Test 12: Browser Compatibility

**Objective:** Verify wallet UI works across different browsers

**Browsers to Test:**
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**Expected Results:**
- ✅ Layout renders correctly in all browsers
- ✅ Forms work correctly
- ✅ Buttons are clickable
- ✅ Tables display properly
- ✅ No console errors

---

### Test 13: Mobile Responsiveness

**Objective:** Verify wallet UI is mobile-friendly

**Steps:**
1. Open wallet management on mobile device or use browser dev tools
2. Test on different screen sizes:
   - Mobile (375px width)
   - Tablet (768px width)
   - Desktop (1200px width)

**Expected Results:**
- ✅ Overview cards stack vertically on mobile
- ✅ Form fields stack vertically on mobile
- ✅ Transaction table is horizontally scrollable on mobile
- ✅ All text is readable
- ✅ Buttons are easily tappable
- ✅ No horizontal overflow

---

### Test 14: API Error Handling

**Objective:** Verify graceful error handling

**Steps:**
1. Open browser developer tools
2. Go to Network tab
3. Throttle network to "Offline"
4. Try to add funds
5. Try to load wallet balance

**Expected Results:**
- ✅ Error message displayed to user
- ✅ No application crash
- ✅ Meaningful error message (not technical jargon)
- ✅ User can retry after network restored

---

### Test 15: Concurrent User Testing

**Objective:** Verify wallet works correctly with multiple users

**Steps:**
1. Create two school user accounts
2. Add funds to School A: £500
3. Add funds to School B: £300
4. Issue voucher from School A: £100
5. Check both wallets

**Expected Results:**
- ✅ School A balance: £400
- ✅ School B balance: £300
- ✅ Transactions are isolated per school
- ✅ No cross-contamination of data

---

## 🐛 Common Issues and Solutions

### Issue 1: Wallet Tab Not Visible
**Solution:** 
- Clear browser cache
- Check if latest frontend is deployed
- Verify user role is "school"

### Issue 2: Balance Not Updating
**Solution:**
- Check browser console for errors
- Verify API endpoints are responding
- Check network tab for failed requests

### Issue 3: Transaction History Empty
**Solution:**
- Verify database migration completed
- Check if wallet_transaction table exists
- Verify API endpoint `/school/wallet/transactions` returns data

### Issue 4: Cannot Add Funds
**Solution:**
- Check form validation errors
- Verify API endpoint `/school/wallet/add-funds` is accessible
- Check backend logs for errors

---

## 📊 Test Results Summary

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Access Wallet Tab | ⬜ | |
| 2 | Add Funds | ⬜ | |
| 3 | Multiple Transactions | ⬜ | |
| 4 | Issue Voucher (Sufficient) | ⬜ | |
| 5 | Multiple Vouchers | ⬜ | |
| 6 | Insufficient Balance | ⬜ | |
| 7 | Exact Balance | ⬜ | |
| 8 | Statistics Accuracy | ⬜ | |
| 9 | Transaction History | ⬜ | |
| 10 | Form Validation | ⬜ | |
| 11 | Real-time Updates | ⬜ | |
| 12 | Browser Compatibility | ⬜ | |
| 13 | Mobile Responsiveness | ⬜ | |
| 14 | Error Handling | ⬜ | |
| 15 | Concurrent Users | ⬜ | |

**Legend:**
- ⬜ Not Tested
- ✅ Passed
- ❌ Failed
- ⚠️ Partial Pass

---

## 🚀 Production Readiness Checklist

Before marking the wallet system as production-ready:

- [ ] All 15 tests passed
- [ ] No critical bugs found
- [ ] Performance is acceptable (page loads < 3 seconds)
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility confirmed
- [ ] Error handling works correctly
- [ ] User documentation created
- [ ] Admin documentation created
- [ ] Backup and recovery tested
- [ ] Security review completed

---

## 📸 Required Screenshots

Please capture and save the following screenshots for documentation:

1. **Initial Wallet View** - Empty wallet with £0.00 balance
2. **After Adding Funds** - Wallet showing first credit transaction
3. **Transaction History** - Table with multiple transactions
4. **After Issuing Voucher** - Showing debit transaction
5. **Insufficient Balance Error** - Error message display
6. **Mobile View** - Wallet on mobile device
7. **Full Workflow** - Complete flow from add funds to issue voucher

---

## 🔍 API Testing (Optional)

For advanced testing, use these curl commands:

### Get Wallet Balance
```bash
curl -X GET "https://backup-voucher-system.onrender.com/api/school/wallet/balance" \
     -H "Cookie: session=YOUR_SESSION_COOKIE"
```

### Add Funds
```bash
curl -X POST "https://backup-voucher-system.onrender.com/api/school/wallet/add-funds" \
     -H "Content-Type: application/json" \
     -H "Cookie: session=YOUR_SESSION_COOKIE" \
     -d '{
       "amount": 500.00,
       "payment_method": "manual",
       "payment_reference": "API-TEST-001",
       "description": "API test funds"
     }'
```

### Get Transactions
```bash
curl -X GET "https://backup-voucher-system.onrender.com/api/school/wallet/transactions?limit=10" \
     -H "Cookie: session=YOUR_SESSION_COOKIE"
```

---

## 📝 Test Report Template

**Tester Name:** _______________  
**Date:** _______________  
**Environment:** Production / Staging  
**Browser:** _______________  
**Device:** _______________  

**Overall Status:** Pass / Fail / Partial

**Critical Issues Found:**
1. 
2. 
3. 

**Minor Issues Found:**
1. 
2. 
3. 

**Recommendations:**
1. 
2. 
3. 

**Sign-off:** _______________

---

## ✅ Final Approval

Once all tests pass and issues are resolved:

**Approved by:** _______________  
**Date:** _______________  
**Status:** Ready for Production / Needs Revision

---

**Note:** This testing guide should be executed thoroughly before declaring the wallet system production-ready. Any failed tests should be documented, fixed, and retested.
