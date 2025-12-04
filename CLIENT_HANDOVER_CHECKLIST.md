# Client Handover Checklist
## BAK UP E-Voucher System - Configuration Transfer Guide

**Purpose:** This document lists all places where developer/temporary details need to be replaced with client's actual details before final handover.

**Date:** December 4, 2025

---

## 🔐 1. Email Configuration (HIGH PRIORITY)

### **Backend Email Service**

**Files to Update:**
- `backend/src/email_service.py` (Lines 12-17, 465)
- `backend/src/email_service_gmail.py` (Lines 12-17, 313)
- `backend/src/email_service_sendgrid_backup.py` (Lines 10-12, 431)

**Environment Variables to Set on Render:**

| Variable | Current Value | Replace With | Description |
|----------|--------------|--------------|-------------|
| `GMAIL_USER` | (your Gmail) | client's Gmail address | Gmail account for sending emails |
| `GMAIL_APP_PASSWORD` | (your app password) | client's Gmail app password | Gmail app-specific password |
| `FROM_EMAIL` | (your email) | client's support email | Email address shown as sender |
| `ADMIN_EMAIL` | `admin@bakup.com` | client's admin email | Email for admin notifications |

**Action Steps:**

1. **Set up Client's Gmail Account:**
   - Client needs a Gmail account for sending system emails
   - Enable 2-Factor Authentication on the Gmail account
   - Generate an App Password: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Save the 16-character app password

2. **Update Render Environment Variables:**
   - Go to Render Dashboard → `backup-voucher-system` web service
   - Navigate to **Environment** section
   - Update these variables:
     - `GMAIL_USER` = client's Gmail address (e.g., `support@clientcompany.com` or `clientname@gmail.com`)
     - `GMAIL_APP_PASSWORD` = the 16-character app password
     - `FROM_EMAIL` = client's preferred sender email
     - `ADMIN_EMAIL` = client's admin email for notifications

3. **Test Email Functionality:**
   - Trigger password reset email
   - Test welcome email for new users
   - Verify payout request notifications

**Email Templates Affected:**
- Welcome emails (new user registration)
- Password reset emails
- Voucher allocation notifications
- Low balance alerts
- Payout request notifications (to admin)
- Vendor approval notifications

---

## 💳 2. Stripe Payment Configuration (HIGH PRIORITY)

### **Payment Gateway Setup**

**Files Affected:**
- `backend/src/stripe_payment.py` (Lines 7, 16)
- `backend/src/main.py` (Lines 2066-2071, 2106-2115, 2159-2163, 2282-2304)
- `frontend/.env.example` (Line 7)

**Environment Variables to Set:**

| Variable | Current Value | Replace With | Description |
|----------|--------------|--------------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` (your test key) | client's `sk_live_...` | Stripe secret key (backend) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (your test key) | client's `pk_live_...` | Stripe publishable key (backend) |
| `STRIPE_WEBHOOK_SECRET` | (your webhook secret) | client's webhook secret | Webhook signature verification |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | client's `pk_live_...` | Frontend Stripe key |

**Action Steps:**

1. **Client Creates Stripe Account:**
   - Client signs up at [https://stripe.com](https://stripe.com)
   - Complete business verification
   - Activate live mode (after testing)

2. **Get API Keys:**
   - Go to Stripe Dashboard → Developers → API Keys
   - Copy **Publishable key** (starts with `pk_live_...`)
   - Copy **Secret key** (starts with `sk_live_...`)
   - ⚠️ **NEVER share the secret key publicly**

3. **Set Up Webhook:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - URL: `https://backup-voucher-system.onrender.com/api/payment/webhook`
   - Events to listen to:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
   - Copy the **Signing secret** (starts with `whsec_...`)

4. **Update Render Environment Variables:**
   - **Backend (Web Service):**
     - `STRIPE_SECRET_KEY` = client's secret key
     - `STRIPE_PUBLISHABLE_KEY` = client's publishable key
     - `STRIPE_WEBHOOK_SECRET` = webhook signing secret
   
   - **Frontend (Static Site):**
     - `VITE_STRIPE_PUBLISHABLE_KEY` = client's publishable key

5. **Test Payment Flow:**
   - Test with Stripe test cards first
   - Switch to live mode after verification
   - Process a small test transaction

**Important Notes:**
- Start with TEST mode keys (`sk_test_...`, `pk_test_...`)
- Switch to LIVE mode only after thorough testing
- Test cards: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## 🌐 3. Application URLs and Domain

### **Backend Configuration**

**Files to Update:**
- `backend/src/email_service.py` (Line 17)
- `backend/src/email_service_gmail.py` (Line 17)
- `backend/src/email_service_sendgrid_backup.py` (Line 12)

**Environment Variables:**

| Variable | Current Value | Replace With |
|----------|--------------|--------------|
| `APP_URL` | `https://backup-voucher-system.onrender.com` | client's custom domain |

**Action Steps:**

1. **If Client Has Custom Domain:**
   - Update `APP_URL` to client's domain (e.g., `https://bakup.co.uk`)
   - Configure custom domain in Render dashboard
   - Update DNS records as per Render instructions

2. **Update Email Templates:**
   - All email links will automatically use the new `APP_URL`
   - Test password reset links
   - Verify voucher redemption links

---

## 👤 4. Admin Account and Test Data

### **Admin Credentials**

**Files with Test Data:**
- `backend/prepopulate_login_data.py` (Lines 47-59)
- `backend/src/check_and_populate.py` (Lines 16-20, 23-27)
- `backend/src/create_admin.py`
- `backend/src/create_prince_admin.py`

**Action Steps:**

1. **Create Client's Admin Account:**
   ```bash
   # SSH into Render or use Render Shell
   cd /opt/render/project/src/backend
   python3 -c "from src.main import db, app, User; from werkzeug.security import generate_password_hash; app.app_context().push(); admin = User(email='client-admin@example.com', password_hash=generate_password_hash('SecurePassword123!'), role='admin', organization_name='Client Organization'); db.session.add(admin); db.session.commit(); print('Admin created')"
   ```

2. **Delete Test Accounts:**
   - Remove or disable test accounts:
     - `admin.test@bakup.org`
     - `vcse.test@bakup.org`
     - `vendor.test@bakup.org`
     - `recipient.test@bakup.org`
     - `school.test@bakup.org`
     - `prince.caesar@bakup.org`
     - `osborncaesar@gmail.com`
     - `bsvcse@yopmail.com`

3. **Clean Test Data:**
   - Review and remove test vouchers
   - Clear test transactions
   - Remove dummy vendor shops

---

## 📧 5. Support and Contact Information

### **Contact Details in Code**

**Files to Review:**
- `backend/src/email_service.py` - Email footers
- `backend/src/sms_service.py` - SMS messages
- `README.md` - Documentation
- `frontend/src/components/*` - Contact forms

**What to Replace:**

| Item | Current | Replace With |
|------|---------|--------------|
| Support Email | (your email) | client's support email |
| Organization Name | "BAK UP" | client's organization name |
| Contact Phone | (if any) | client's support phone |
| Website URL | (current) | client's website |

**Action Steps:**

1. **Update Email Footers:**
   - Search for "support" or "contact" in email templates
   - Replace with client's contact information

2. **Update SMS Messages:**
   - Check `backend/src/sms_service.py`
   - Update organization name in SMS alerts

3. **Update Documentation:**
   - Update README.md with client's details
   - Update deployment guides
   - Update support contact information

---

## 🗄️ 6. Database Configuration

### **Database Connection**

**Environment Variables:**

| Variable | Current Value | Replace With |
|----------|--------------|--------------|
| `DATABASE_URL` | (Render PostgreSQL) | Keep as is (managed by Render) |

**Action Steps:**

1. **Database Ownership:**
   - Database is managed by Render
   - Client should have access to Render dashboard
   - Backup system is already configured (runs daily at 2 AM UTC)

2. **Database Backups:**
   - Backups stored in `/opt/render/project/backups`
   - Retention: 30 days / 30 backups
   - See `BACKUP_SYSTEM.md` for details

**Note:** For production, consider upgrading to a paid PostgreSQL plan with better backup options.

---

## 📱 7. SMS Configuration (If Enabled)

### **SMS Service Setup**

**Files:**
- `backend/src/sms_service.py`

**Environment Variables:**

| Variable | Current Value | Replace With |
|----------|--------------|--------------|
| `TWILIO_ACCOUNT_SID` | (your SID) | client's Twilio SID |
| `TWILIO_AUTH_TOKEN` | (your token) | client's Twilio token |
| `TWILIO_PHONE_NUMBER` | (your number) | client's Twilio number |

**Action Steps:**

1. **Client Creates Twilio Account:**
   - Sign up at [https://www.twilio.com](https://www.twilio.com)
   - Purchase a phone number
   - Get Account SID and Auth Token

2. **Update Render Environment Variables:**
   - Add Twilio credentials
   - Test SMS functionality

---

## 🔒 8. Security Keys and Secrets

### **Session and Security**

**Environment Variables:**

| Variable | Current Value | Replace With |
|----------|--------------|--------------|
| `SECRET_KEY` | (your secret) | Generate new random key |
| `JWT_SECRET_KEY` | (if used) | Generate new random key |

**Action Steps:**

1. **Generate New Secret Keys:**
   ```python
   import secrets
   print(secrets.token_hex(32))  # Generate 64-character hex string
   ```

2. **Update on Render:**
   - Replace `SECRET_KEY` with new value
   - This will invalidate all existing sessions (users need to re-login)

---

## 📊 9. Analytics and Monitoring (Optional)

### **Third-Party Services**

**Potential Integrations:**

| Service | Purpose | Action |
|---------|---------|--------|
| Google Analytics | Website analytics | Add client's GA tracking ID |
| Sentry | Error monitoring | Create client's Sentry project |
| LogRocket | Session replay | Add client's LogRocket ID |

**Action Steps:**
- Client decides which services to use
- Add respective environment variables
- Update frontend/backend with tracking codes

---

## 📝 10. Branding and Content

### **Visual Identity**

**Files to Update:**
- `frontend/src/components/*` - Logo, colors, branding
- `frontend/public/favicon.ico` - Website icon
- `frontend/public/index.html` - Page title, meta tags

**What to Replace:**

| Item | Location | Action |
|------|----------|--------|
| Logo | Frontend assets | Replace with client's logo |
| Favicon | `frontend/public/` | Replace with client's icon |
| Color Scheme | CSS files | Update to client's brand colors |
| Organization Name | Throughout app | Replace "BAK UP" with client's name |
| Footer Text | Frontend components | Update copyright and links |

---

## ✅ Handover Checklist Summary

### **Critical Items (Must Do Before Handover):**

- [ ] **Email Configuration**
  - [ ] Update `GMAIL_USER` with client's email
  - [ ] Update `GMAIL_APP_PASSWORD` with client's app password
  - [ ] Update `FROM_EMAIL` with client's sender email
  - [ ] Update `ADMIN_EMAIL` with client's admin email
  - [ ] Test all email notifications

- [ ] **Stripe Payment Setup**
  - [ ] Client creates Stripe account
  - [ ] Get client's live API keys
  - [ ] Update `STRIPE_SECRET_KEY`
  - [ ] Update `STRIPE_PUBLISHABLE_KEY`
  - [ ] Set up webhook endpoint
  - [ ] Update `STRIPE_WEBHOOK_SECRET`
  - [ ] Update frontend `VITE_STRIPE_PUBLISHABLE_KEY`
  - [ ] Test payment flow end-to-end

- [ ] **Admin Account**
  - [ ] Create client's admin account
  - [ ] Delete all test accounts
  - [ ] Remove test data

- [ ] **Security**
  - [ ] Generate new `SECRET_KEY`
  - [ ] Update all environment variables

- [ ] **Domain and URLs**
  - [ ] Update `APP_URL` if using custom domain
  - [ ] Configure custom domain in Render (if applicable)

### **Important Items (Should Do):**

- [ ] **Contact Information**
  - [ ] Update support email in templates
  - [ ] Update organization name in SMS messages
  - [ ] Update README and documentation

- [ ] **Branding**
  - [ ] Replace logo with client's logo
  - [ ] Update favicon
  - [ ] Update color scheme
  - [ ] Update footer text

- [ ] **SMS Configuration** (if enabled)
  - [ ] Set up client's Twilio account
  - [ ] Update Twilio credentials

### **Optional Items:**

- [ ] **Analytics**
  - [ ] Add Google Analytics (if client wants)
  - [ ] Set up error monitoring (Sentry)

- [ ] **Custom Domain**
  - [ ] Configure client's custom domain
  - [ ] Update DNS records
  - [ ] Set up SSL certificate

---

## 🚀 Deployment Steps for Client

### **After Configuration Updates:**

1. **Redeploy Backend:**
   - Go to Render Dashboard → `backup-voucher-system` web service
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait for deployment to complete

2. **Redeploy Frontend:**
   - Go to Render Dashboard → frontend static site
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait for deployment to complete

3. **Test Everything:**
   - [ ] User registration and welcome email
   - [ ] Password reset email
   - [ ] Login functionality
   - [ ] Payment processing (test mode first)
   - [ ] Voucher creation and redemption
   - [ ] Admin dashboard access
   - [ ] Vendor portal
   - [ ] Recipient portal

4. **Switch to Production:**
   - [ ] Switch Stripe from test to live mode
   - [ ] Monitor first few transactions
   - [ ] Verify email delivery
   - [ ] Check backup system logs

---

## 📞 Support and Assistance

**For Questions During Handover:**
- Review this checklist thoroughly
- Test each configuration change
- Keep backups of all credentials
- Document any custom changes

**Post-Handover:**
- Client should have full access to:
  - Render dashboard (owner access)
  - GitHub repository (owner access)
  - Stripe account (owner access)
  - Gmail account (owner access)
  - Database backups

---

## 📋 Credentials Handover Document

**Create a separate secure document with:**
- Render account credentials
- GitHub repository access
- Stripe API keys
- Gmail account and app password
- Database connection details
- Admin account credentials
- Any other service credentials

**Security Best Practices:**
- Use a password manager (1Password, LastPass, Bitwarden)
- Never share credentials via email
- Use encrypted file sharing (e.g., password-protected zip)
- Change all passwords after handover

---

**Last Updated:** December 4, 2025  
**Version:** 1.0  
**Status:** Ready for Client Handover
