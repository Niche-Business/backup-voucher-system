# Client Handover Email Template

---

## Email Template 1: Initial Information Request (Recommended)

**Subject:** BAK UP E-Voucher System - Final Handover Information Required

---

Dear [Client Name],

I hope this email finds you well.

I'm pleased to inform you that the **BAK UP E-Voucher System** is now complete and ready for final handover. Before we transfer full ownership to you, I need to gather some essential information to ensure a smooth transition and configure the system with your details.

### **What We Need to Complete the Handover**

To finalize the setup and transfer everything to your ownership, please provide the following information:

---

#### **1. Email Configuration (Critical)**

The system sends automated emails for password resets, welcome messages, voucher notifications, and admin alerts. You'll need a Gmail account for this:

**Required Information:**
- **Gmail Address:** The email account you want to use for sending system emails (e.g., support@yourdomain.com or yourname@gmail.com)
- **Gmail App Password:** A 16-character password generated specifically for this application

**How to Set This Up:**
1. Choose a Gmail account (create a new one if needed for professional use)
2. Enable 2-Factor Authentication on the account: [https://myaccount.google.com/security](https://myaccount.google.com/security)
3. Generate an App Password: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Name it "BAK UP System"
   - Copy the 16-character password
4. Send me both the Gmail address and the app password (via secure method - see below)

**Additional Email Addresses:**
- **Admin Email:** Email address where you want to receive admin notifications (e.g., payout requests, system alerts)
- **Support Email:** Email address to display as the "From" address in system emails

---

#### **2. Payment Gateway (Stripe) - Critical**

The system uses Stripe to process payments. You'll need your own Stripe account:

**Required Information:**
- **Stripe Publishable Key** (starts with `pk_live_...`)
- **Stripe Secret Key** (starts with `sk_live_...`)
- **Stripe Webhook Secret** (starts with `whsec_...`)

**How to Set This Up:**
1. Create a Stripe account at [https://stripe.com](https://stripe.com) (if you don't have one)
2. Complete business verification
3. Get your API keys:
   - Go to Stripe Dashboard → Developers → API Keys
   - Copy the **Publishable key** and **Secret key**
   - **Important:** Start with TEST mode keys first, we'll switch to LIVE after testing
4. Set up webhook:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - URL: `https://backup-voucher-system.onrender.com/api/payment/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`
   - Copy the **Signing secret**
5. Send me all three keys (via secure method)

**Note:** We'll test thoroughly with TEST mode keys before switching to LIVE mode.

---

#### **3. Admin Account Details**

**Required Information:**
- **Admin Email Address:** Your preferred email for the main admin account
- **Admin Name/Organization Name:** Your name or organization name
- **Temporary Password:** Choose a secure temporary password (you can change it after first login)

---

#### **4. Organization/Branding Information**

**Required Information:**
- **Organization Name:** Official name to replace "BAK UP" throughout the system
- **Support Contact Email:** Email for users to contact support
- **Support Phone Number:** (Optional) Phone number for support
- **Organization Website:** (Optional) Your organization's website URL

**Optional (for branding):**
- **Logo:** Your organization's logo (PNG or SVG format, transparent background preferred)
- **Favicon:** Small icon for browser tab (16x16 or 32x32 pixels)
- **Brand Colors:** Primary and secondary colors (hex codes, e.g., #FF5733)

---

#### **5. Hosting Account (Render)**

**Required Information:**
- **Email Address:** Email you want to use for your Render account (can be same as admin email)
- **Payment Method:** Credit/debit card for Render hosting (approximately $7-32/month)

**Action Required:**
1. Create a free Render account at [https://render.com/signup](https://render.com/signup)
2. Verify your email
3. Add a payment method in billing settings
4. Send me the email address you used to sign up

---

#### **6. Custom Domain (Optional)**

**If you want a custom domain** (e.g., app.bakup.co.uk instead of backup-voucher-system.onrender.com):

**Required Information:**
- **Domain Name:** The domain you want to use
- **DNS Access:** Confirm you have access to update DNS records for this domain

**If you don't have a domain yet:**
- Let me know if you'd like help choosing and setting one up
- Domains typically cost $10-15/year

---

#### **7. SMS Notifications (Optional)**

**If you want SMS functionality** for balance alerts and notifications:

**Required Information:**
- **Twilio Account SID**
- **Twilio Auth Token**
- **Twilio Phone Number**

**How to Set This Up:**
1. Create account at [https://www.twilio.com](https://www.twilio.com)
2. Purchase a phone number
3. Get credentials from dashboard

**Note:** This is optional - the system works fine without SMS.

---

### **How to Send Sensitive Information Securely**

**Please DO NOT send passwords or API keys via plain email.** Instead, use one of these secure methods:

**Option 1: Password Manager (Recommended)**
- Use a service like [1Password](https://1password.com), [LastPass](https://www.lastpass.com), or [Bitwarden](https://bitwarden.com)
- Create a secure note with all information
- Share it with me securely through the platform

**Option 2: Encrypted Document**
- Create a document with all information
- Compress it to a ZIP file with password protection
- Email me the ZIP file
- Send the password via SMS or phone call

**Option 3: Secure File Sharing**
- Use a service like [Firefox Send](https://send.firefox.com) or [Tresorit Send](https://send.tresorit.com)
- Upload the document
- Share the link with me

---

### **Timeline and Next Steps**

**Once I receive all the information:**

1. **Day 1-2:** I'll update all configurations with your details
2. **Day 3:** We'll schedule a handover meeting where I'll:
   - Walk you through the Render dashboard
   - Show you how to deploy and manage the system
   - Demonstrate key features
   - Answer any questions
3. **Day 4:** Transfer ownership of the Render account to you
4. **Day 5-7:** Post-handover support to ensure everything runs smoothly
5. **Week 2+:** You'll be fully independent with the system

---

### **Estimated Ongoing Costs**

For your budgeting purposes, here are the expected monthly costs:

- **Render Hosting:** $7-32/month (depending on usage)
- **Domain Registration:** ~$1/month ($10-15/year)
- **Stripe Fees:** 1.5% + 20p per UK card transaction
- **SMS (if enabled):** Pay-as-you-go (optional)

**Total:** Approximately $10-50/month + transaction fees

---

### **Questions or Concerns?**

If you have any questions about any of these items, please don't hesitate to ask. I'm here to make this transition as smooth as possible.

**Please aim to provide this information by [DATE]** so we can complete the handover on schedule.

Looking forward to hearing from you!

Best regards,  
[Your Name]  
[Your Company]  
[Your Contact Information]

---

## Email Template 2: Simplified Version (Alternative)

**Subject:** BAK UP System Handover - Information Needed

---

Hi [Client Name],

The BAK UP E-Voucher System is ready for handover! To transfer everything to your name, I need the following information:

**Essential Items:**

1. **Gmail Account for System Emails**
   - Gmail address
   - App password (generate at: myaccount.google.com/apppasswords)

2. **Stripe Payment Account**
   - Create account at stripe.com
   - Send me: Publishable key, Secret key, Webhook secret
   - Start with TEST mode

3. **Render Hosting Account**
   - Sign up at render.com/signup
   - Send me the email you used

4. **Admin Account**
   - Your preferred admin email
   - Organization name
   - Temporary password

5. **Organization Details**
   - Official organization name
   - Support email
   - Support phone (optional)

**Optional:**
- Custom domain (if you want one)
- Logo and branding
- SMS service (Twilio)

**Security:** Please send passwords/keys via encrypted method (password-protected ZIP, password manager, etc.)

**Timeline:** Once I have this info, handover takes 3-5 days.

**Questions?** Let me know!

Best,  
[Your Name]

---

## Email Template 3: Follow-Up Email (If No Response)

**Subject:** Re: BAK UP System Handover - Information Needed

---

Hi [Client Name],

I wanted to follow up on my previous email regarding the BAK UP E-Voucher System handover.

To complete the transfer and get the system running under your ownership, I still need the information outlined in my last email (copied below for reference).

**Quick Summary of What's Needed:**
- Gmail account details for system emails
- Stripe account credentials for payments
- Render account for hosting
- Admin account details
- Organization information

**I'm here to help!** If any of these items are unclear or you need assistance setting them up, please let me know. I can schedule a call to walk you through the process.

**Current Status:** The system is fully functional and ready to transfer - we just need your details to complete the configuration.

Please let me know if you have any questions or if there's anything I can do to help move this forward.

Best regards,  
[Your Name]

---

## Checklist for Client Response

When client responds, verify you received:

- [ ] Gmail address
- [ ] Gmail app password
- [ ] Admin email for notifications
- [ ] Stripe publishable key
- [ ] Stripe secret key
- [ ] Stripe webhook secret
- [ ] Render account email
- [ ] Admin account email
- [ ] Organization name
- [ ] Support contact details
- [ ] Custom domain info (if applicable)
- [ ] Logo/branding (if provided)

---

## Tips for Sending the Email

1. **Personalize it:** Replace [Client Name], [Your Name], etc.
2. **Adjust tone:** Match your existing communication style with the client
3. **Set deadline:** Give realistic timeframe (e.g., "by end of week")
4. **Offer help:** Make it clear you're available for questions
5. **Attach guides:** Consider attaching the handover checklist PDF
6. **Schedule call:** Offer to schedule a call to explain if needed

---

**Last Updated:** December 4, 2025
