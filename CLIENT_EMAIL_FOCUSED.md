# Client Handover Email - Gmail & Stripe Information Request

---

## Email Template: Focused Request for Critical Information

**Subject:** BAK UP System - Gmail & Stripe Setup Required for Handover

---

Dear [Client Name],

I hope this email finds you well.

The **BAK UP E-Voucher System** is now complete and ready for final handover. To transfer the system to your ownership and ensure it operates under your credentials, I need two critical pieces of information from you.

---

## 📧 1. Gmail Account Information (For System Emails)

The system sends automated emails including welcome messages, password resets, voucher notifications, and admin alerts. You'll need to provide a Gmail account for this purpose.

### **What I Need From You:**

#### **A. Gmail Email Address**
- **Format:** `yourname@gmail.com` or `support@yourdomain.com` (if using Google Workspace)
- **Example:** `support@bakup.org` or `admin@gmail.com`
- **What to send:** The complete email address

#### **B. Gmail App Password (16-Character Code)**
- **Format:** 16 lowercase letters (no spaces, dashes, or special characters)
- **Example:** `abcdwxyzefghijkl` (this is just an example, yours will be different)
- **What to send:** The exact 16-character code shown when you generate it

#### **C. Admin Notification Email**
- **Format:** Any valid email address
- **Example:** `admin@bakup.org` or `yourname@gmail.com`
- **What to send:** The email address where you want to receive admin notifications (payout requests, system alerts, etc.)

---

### **How to Generate Your Gmail App Password:**

**Step 1: Enable 2-Factor Authentication**
1. Go to: [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Scroll to "2-Step Verification"
3. Click "Get Started" and follow the prompts
4. Complete the setup (you'll need your phone)

**Step 2: Generate App Password**
1. Go to: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. You may need to sign in again
3. Under "Select app" → choose **"Mail"**
4. Under "Select device" → choose **"Other (Custom name)"**
5. Type: **"BAK UP System"**
6. Click **"Generate"**
7. Google will show you a **16-character password** in a yellow box
8. **Copy this password immediately** (you won't be able to see it again)
9. Send me this 16-character code

**Important Notes:**
- ✅ The app password will look like: `abcdwxyzefghijkl` (16 lowercase letters)
- ✅ Google may show it with spaces like `abcd wxyz efgh ijkl` - remove the spaces when sending to me
- ✅ This is NOT your regular Gmail password - it's a special code just for this application
- ✅ You can revoke this password anytime from your Google account settings

---

## 💳 2. Stripe Payment Gateway Information

The system uses Stripe to process payments from VCSE organizations loading funds. You'll need to create a Stripe account and provide three specific API keys.

### **What I Need From You:**

#### **A. Stripe Publishable Key**
- **Format:** Starts with `pk_test_` (for testing) or `pk_live_` (for production)
- **Length:** 107-110 characters
- **Example:** `pk_test_51ABCDEfghijKLMNOpqrsTUVwxyz1234567890abcdefGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqr`
- **What to send:** The complete key starting with `pk_test_` or `pk_live_`

#### **B. Stripe Secret Key**
- **Format:** Starts with `sk_test_` (for testing) or `sk_live_` (for production)
- **Length:** 107-110 characters
- **Example:** `sk_test_51ABCDEfghijKLMNOpqrsTUVwxyz1234567890abcdefGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqr`
- **What to send:** The complete key starting with `sk_test_` or `sk_live_`
- **⚠️ CRITICAL:** This is highly sensitive - send via secure method only (see below)

#### **C. Stripe Webhook Signing Secret**
- **Format:** Starts with `whsec_`
- **Length:** 60-70 characters
- **Example:** `whsec_1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`
- **What to send:** The complete secret starting with `whsec_`

---

### **How to Get Your Stripe Keys:**

**Step 1: Create Stripe Account**
1. Go to: [https://stripe.com/register](https://stripe.com/register)
2. Sign up with your business email
3. Complete the registration form
4. Verify your email address
5. Complete business verification (you can do this later, but you'll need it for live payments)

**Step 2: Get API Keys**
1. Log into Stripe Dashboard: [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Click on **"Developers"** in the left sidebar
3. Click on **"API keys"**
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - click "Reveal test key" to see it
5. **Copy both keys** (click the copy icon next to each)
6. Send me both keys

**Important:** 
- ✅ Start with **TEST mode** keys (`pk_test_` and `sk_test_`)
- ✅ We'll test the system thoroughly before switching to LIVE mode
- ✅ You can switch to LIVE mode later by toggling the "Test mode" switch in Stripe dashboard

**Step 3: Set Up Webhook**
1. Still in Stripe Dashboard → **"Developers"** → **"Webhooks"**
2. Click **"Add endpoint"** button
3. In "Endpoint URL" field, enter:
   ```
   https://backup-voucher-system.onrender.com/api/payment/webhook
   ```
4. Click **"Select events"**
5. Find and check these three events:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`
6. Click **"Add events"**
7. Click **"Add endpoint"**
8. After creating the endpoint, click on it to view details
9. Under "Signing secret", click **"Reveal"**
10. Copy the secret (starts with `whsec_...`)
11. Send me this secret

---

## 🔐 How to Send This Information Securely

**⚠️ IMPORTANT: DO NOT send passwords or API keys via plain email!**

Please use one of these secure methods:

### **Option 1: Password-Protected Document (Easiest)**
1. Create a document (Word, Google Doc, or text file) with all the information
2. Use this format:
   ```
   GMAIL INFORMATION:
   - Gmail Address: support@bakup.org
   - Gmail App Password: abcdwxyzefghijkl
   - Admin Email: admin@bakup.org

   STRIPE INFORMATION:
   - Publishable Key: pk_test_51ABC...
   - Secret Key: sk_test_51ABC...
   - Webhook Secret: whsec_123...
   ```
3. Save as a file (e.g., `bakup_credentials.txt`)
4. Compress to ZIP with password protection
   - **Windows:** Right-click → Send to → Compressed folder → Right-click ZIP → Add password
   - **Mac:** Use an app like Keka or The Unarchiver
5. Email me the ZIP file
6. Send me the ZIP password via **SMS or phone call** (NOT email)

### **Option 2: Password Manager (Most Secure)**
1. Use 1Password, LastPass, or Bitwarden
2. Create a secure note with all information
3. Share the note with me through the platform
4. Send me access notification

### **Option 3: Encrypted Messaging**
1. Use WhatsApp, Signal, or Telegram
2. Send the information via encrypted message
3. Confirm I received it

---

## 📋 Summary Checklist

Please provide the following (with exact formats):

**Gmail:**
- [ ] Gmail email address (e.g., `support@bakup.org`)
- [ ] 16-character app password (e.g., `abcdwxyzefghijkl`)
- [ ] Admin notification email (e.g., `admin@bakup.org`)

**Stripe:**
- [ ] Publishable key starting with `pk_test_` (107-110 characters)
- [ ] Secret key starting with `sk_test_` (107-110 characters)
- [ ] Webhook secret starting with `whsec_` (60-70 characters)

**Security:**
- [ ] Sent via secure method (password-protected ZIP, password manager, or encrypted messaging)
- [ ] If using ZIP, sent password separately via SMS/call

---

## ⏰ Timeline

**Once I receive this information:**

- **Day 1:** I'll configure the system with your credentials
- **Day 2:** Test all email and payment functionality
- **Day 3:** Schedule handover meeting to walk you through the system
- **Day 4:** Transfer Render account ownership to you
- **Day 5-7:** Post-handover support

**Target Completion:** [DATE]

---

## 💰 Ongoing Costs (For Your Information)

After handover, you'll be responsible for:

- **Stripe Fees:** 1.5% + 20p per UK card transaction (2.9% + 20p for non-UK cards)
- **Render Hosting:** Approximately $7-32/month
- **Domain** (optional): ~$10-15/year

**Total estimated monthly cost:** $10-50/month + transaction fees

---

## ❓ Questions or Need Help?

If you have any questions or need assistance with any of these steps, please don't hesitate to reach out. I'm happy to:

- Schedule a call to walk you through the Gmail app password setup
- Help you set up your Stripe account
- Clarify any of the requirements

**Please aim to provide this information by [DATE]** so we can complete the handover on schedule.

Looking forward to completing this handover!

Best regards,  
[Your Name]  
[Your Company]  
[Your Email]  
[Your Phone]

---

## 📎 Helpful Links

**Gmail Setup:**
- Enable 2FA: [https://myaccount.google.com/security](https://myaccount.google.com/security)
- Generate App Password: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

**Stripe Setup:**
- Sign Up: [https://stripe.com/register](https://stripe.com/register)
- Dashboard: [https://dashboard.stripe.com](https://dashboard.stripe.com)
- API Keys: [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
- Webhooks: [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)

---

## 🔍 What Each Key Looks Like (Visual Reference)

**Gmail App Password:**
```
Format: 16 lowercase letters, no spaces
Example: abcdwxyzefghijkl
Length: Exactly 16 characters
```

**Stripe Publishable Key (TEST mode):**
```
Format: pk_test_ followed by ~100 characters
Example: pk_test_51ABCDEfghijKLMNOpqrsTUVwxyz1234567890abcdefGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqr
Length: 107-110 characters
```

**Stripe Secret Key (TEST mode):**
```
Format: sk_test_ followed by ~100 characters
Example: sk_test_51ABCDEfghijKLMNOpqrsTUVwxyz1234567890abcdefGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqr
Length: 107-110 characters
⚠️ HIGHLY SENSITIVE - Never share publicly
```

**Stripe Webhook Secret:**
```
Format: whsec_ followed by ~60 characters
Example: whsec_1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
Length: 60-70 characters
```

---

**P.S.** If you get stuck at any point, just reply to this email or give me a call. I'm here to help make this process as smooth as possible!

---

**Last Updated:** December 4, 2025
