# Render Account & Domain Transfer Guide
## Complete Handover Process for BAK UP E-Voucher System

**Date:** December 4, 2025  
**Purpose:** Transfer Render account ownership and domain to client

---

## 🎯 Overview

Since you used your company business email to create the Render account, you have two main options for transferring the project to your client:

### **Option A: Transfer Team Ownership** (Recommended)
Transfer the entire team/workspace to the client, giving them full ownership.

### **Option B: Add Client as Team Owner** (Alternative)
Keep the account but add the client as an owner with full administrative access.

---

## 🔄 Option A: Transfer Team Ownership (RECOMMENDED)

This is the cleanest handover method - the client gets complete ownership and you're removed from the account.

### **Prerequisites:**
- Client must have a Render account (they can create one for free)
- Client's email address
- Current billing information settled

### **Step-by-Step Process:**

#### **Step 1: Client Creates Render Account**

1. Client goes to [https://render.com/signup](https://render.com/signup)
2. Client signs up with their email address
3. Client verifies their email
4. Client completes account setup

#### **Step 2: Transfer Team Ownership**

1. **Log into your Render Dashboard** at [https://dashboard.render.com](https://dashboard.render.com)

2. **Navigate to Team Settings:**
   - Click on your team name in the top-left corner
   - Select **"Team Settings"** from the dropdown

3. **Go to Members Tab:**
   - Click on the **"Members"** tab
   - You should see yourself listed as the Owner

4. **Invite Client as Owner:**
   - Click **"Invite Member"** button
   - Enter client's email address
   - Set role to **"Owner"**
   - Click **"Send Invitation"**

5. **Client Accepts Invitation:**
   - Client receives email invitation
   - Client clicks the link to accept
   - Client is now added as Owner

6. **Transfer Primary Ownership:**
   - Once client is added as Owner
   - Click the **three dots (⋮)** next to the client's name
   - Select **"Transfer Ownership"**
   - Confirm the transfer
   - Client becomes the primary owner
   - You become a regular Owner (can leave the team after)

7. **Leave the Team (Optional):**
   - After transfer is complete
   - Click the **three dots (⋮)** next to your name
   - Select **"Leave Team"**
   - Confirm departure

### **What Gets Transferred:**
✅ All services (web service, cron job, static site)  
✅ All environment variables  
✅ All databases  
✅ All deployment history  
✅ All custom domains  
✅ Billing responsibility  
✅ All team settings  

### **Important Notes:**
- ⚠️ **Settle any outstanding bills** before transfer
- ⚠️ Client will be responsible for all future billing
- ⚠️ Transfer is **irreversible** - make sure client is ready
- ⚠️ Update payment method to client's card before transfer

---

## 👥 Option B: Add Client as Team Owner (ALTERNATIVE)

If you want to maintain access or the client prefers you to stay involved, you can add them as a co-owner.

### **Step-by-Step Process:**

1. **Log into Render Dashboard**

2. **Navigate to Team Settings:**
   - Click team name → Team Settings

3. **Invite Client:**
   - Go to **"Members"** tab
   - Click **"Invite Member"**
   - Enter client's email
   - Set role to **"Owner"**
   - Click **"Send Invitation"**

4. **Client Accepts:**
   - Client receives email
   - Client accepts invitation
   - Client now has full Owner access

### **What Client Can Do as Owner:**
✅ Deploy services  
✅ Modify environment variables  
✅ Access databases  
✅ View logs  
✅ Manage billing  
✅ Invite/remove team members  
✅ Delete services  

### **Considerations:**
- ⚠️ You both have equal access
- ⚠️ Billing remains under your account
- ⚠️ Client cannot remove you (unless you leave voluntarily)
- ⚠️ Not a true "handover" - you're still involved

---

## 🌐 Domain Transfer Options

The application is currently hosted on Render's default domain:
- **Current URL:** `https://backup-voucher-system.onrender.com`

You have three options for domain management:

### **Option 1: Keep Render Default Domain** (Simplest)

**What to do:**
- Nothing! The domain stays as is
- Client gets access through team transfer
- No DNS changes needed

**Pros:**
- ✅ No additional cost
- ✅ No setup required
- ✅ SSL automatically managed

**Cons:**
- ❌ Not branded (shows "onrender.com")
- ❌ Less professional

---

### **Option 2: Client Adds Their Own Custom Domain** (Recommended)

If the client has their own domain (e.g., `bakup.co.uk`), they can connect it to Render.

**Prerequisites:**
- Client owns a domain (purchased from GoDaddy, Namecheap, Google Domains, etc.)
- Client has access to domain DNS settings

**Step-by-Step Process:**

#### **Step 1: Add Custom Domain in Render**

1. **Client logs into Render Dashboard**

2. **Navigate to the Web Service:**
   - Click on `backup-voucher-system` web service

3. **Go to Settings:**
   - Click **"Settings"** in the left sidebar

4. **Add Custom Domain:**
   - Scroll to **"Custom Domains"** section
   - Click **"Add Custom Domain"**
   - Enter domain: `app.bakup.co.uk` (or `bakup.co.uk`)
   - Click **"Save"**

5. **Get DNS Records:**
   - Render will show DNS records to add:
     - **CNAME record** or **A record**
     - Example: `app.bakup.co.uk` → `backup-voucher-system.onrender.com`

#### **Step 2: Update DNS Settings**

1. **Client logs into domain registrar** (GoDaddy, Namecheap, etc.)

2. **Navigate to DNS Management:**
   - Find DNS settings for the domain

3. **Add DNS Record:**
   - **Type:** CNAME
   - **Name:** `app` (or `@` for root domain)
   - **Value:** `backup-voucher-system.onrender.com`
   - **TTL:** 3600 (or default)

4. **Save DNS Changes:**
   - Changes can take 5 minutes to 48 hours to propagate

#### **Step 3: Verify Domain**

1. **Wait for DNS propagation:**
   - Usually takes 15-30 minutes
   - Can take up to 48 hours

2. **Check in Render:**
   - Render will automatically verify the domain
   - SSL certificate will be issued automatically
   - Domain status will show "Active"

3. **Test the Domain:**
   - Visit `https://app.bakup.co.uk`
   - Should load the application
   - SSL should be active (padlock icon)

#### **Step 4: Update Environment Variables**

1. **Update `APP_URL`:**
   - Go to Environment settings
   - Change `APP_URL` from `https://backup-voucher-system.onrender.com` to `https://app.bakup.co.uk`
   - Save and redeploy

2. **Update Stripe Webhook:**
   - Go to Stripe Dashboard → Webhooks
   - Update webhook URL to: `https://app.bakup.co.uk/api/payment/webhook`

**Pros:**
- ✅ Professional branded domain
- ✅ Client owns the domain
- ✅ Free SSL certificate
- ✅ Easy to set up

**Cons:**
- ❌ Requires domain purchase (~$10-15/year)
- ❌ DNS configuration needed

---

### **Option 3: Transfer Existing Custom Domain** (If You Have One)

If you already set up a custom domain for this project and want to transfer it:

#### **If Domain is Registered in Your Name:**

**Option 3A: Transfer Domain Registration**

1. **Unlock Domain:**
   - Log into your domain registrar
   - Find the domain
   - Unlock it for transfer

2. **Get Transfer Code:**
   - Request authorization/EPP code
   - Registrar will email you the code

3. **Client Initiates Transfer:**
   - Client logs into their domain registrar
   - Initiates domain transfer
   - Enters the authorization code
   - Pays transfer fee (~$10-15)

4. **Approve Transfer:**
   - You receive email to approve
   - Approve the transfer
   - Transfer completes in 5-7 days

5. **Update DNS:**
   - Client updates DNS to point to Render
   - Follow "Option 2" steps above

**Option 3B: Keep Domain, Update DNS**

1. **Keep domain in your name**
2. **Update DNS to point to client's Render instance**
3. **Client pays you annually for domain renewal**

**Not recommended** - creates ongoing dependency

---

## 💳 Billing Transfer

### **Current Billing Situation:**

The Render account is currently under your company's billing.

### **Transfer Billing to Client:**

#### **Step 1: Add Client's Payment Method**

1. **Before transferring ownership:**
   - Go to Team Settings → Billing
   - Add client's credit card
   - Set it as default payment method

2. **Or after client becomes owner:**
   - Client adds their payment method
   - Client removes your payment method

#### **Step 2: Review Current Costs**

**Current Render Services:**
- Web Service (backend): ~$7-25/month (depending on plan)
- Static Site (frontend): Free
- PostgreSQL Database: Free (Starter) or $7+/month (paid plan)
- Cron Job (backup): Free

**Estimated Monthly Cost:** $7-32/month

#### **Step 3: Settle Outstanding Charges**

1. **Check current billing period:**
   - Team Settings → Billing → Invoices

2. **Pay any outstanding invoices:**
   - Ensure account is current before transfer

3. **Prorate if needed:**
   - If transferring mid-month, calculate prorated amount
   - Client pays from transfer date forward

---

## 📋 Complete Handover Checklist

### **Before Transfer:**

- [ ] **Settle all bills** - Pay any outstanding invoices
- [ ] **Update configurations** - Complete CLIENT_HANDOVER_CHECKLIST.md items
- [ ] **Backup data** - Ensure database backups are working
- [ ] **Document credentials** - Prepare secure credentials document
- [ ] **Test everything** - Verify all functionality works
- [ ] **Clean test data** - Remove test accounts and data

### **During Transfer:**

- [ ] **Client creates Render account** - Client signs up
- [ ] **Invite client as Owner** - Send invitation
- [ ] **Client accepts invitation** - Verify client has access
- [ ] **Add client's payment method** - Update billing
- [ ] **Transfer ownership** - Complete the transfer
- [ ] **Verify client access** - Client can log in and manage services
- [ ] **Update domain** (if applicable) - Configure custom domain
- [ ] **Update environment variables** - Change APP_URL if needed

### **After Transfer:**

- [ ] **Client verifies access** - Can deploy, view logs, etc.
- [ ] **Test application** - Everything still works
- [ ] **Update Stripe webhook** - If domain changed
- [ ] **Monitor for issues** - Check logs for 24-48 hours
- [ ] **Leave team** (optional) - Remove yourself from team
- [ ] **Transfer GitHub access** - Transfer repository ownership
- [ ] **Transfer documentation** - Share all guides and credentials

---

## 🔐 GitHub Repository Transfer

Don't forget to transfer the GitHub repository as well!

### **Transfer GitHub Repository:**

1. **Go to GitHub Repository:**
   - Navigate to `https://github.com/Niche-Business/backup-voucher-system`

2. **Go to Settings:**
   - Click **"Settings"** tab
   - Scroll to **"Danger Zone"** at bottom

3. **Transfer Repository:**
   - Click **"Transfer"**
   - Enter client's GitHub username or organization
   - Confirm transfer
   - Client accepts transfer

**Alternative:** Add client as Owner/Admin collaborator and keep repository in your organization.

---

## 📞 Support During Transition

### **Recommended Transition Period:**

**Week 1-2:**
- You remain available for questions
- Monitor system together with client
- Help with any issues

**Week 3-4:**
- Client takes full responsibility
- You provide emergency support only

**After 1 Month:**
- Client fully independent
- Optional: Offer paid support contract

---

## ⚠️ Important Warnings

### **Before You Transfer:**

1. **⚠️ Transfer is IRREVERSIBLE**
   - Once ownership is transferred, you cannot get it back
   - Make sure client is ready and understands responsibilities

2. **⚠️ Settle All Bills First**
   - Pay all outstanding invoices
   - Avoid billing disputes

3. **⚠️ Backup Everything**
   - Export database backup
   - Save all environment variables
   - Keep copy of all configurations

4. **⚠️ Test Thoroughly**
   - Ensure everything works before transfer
   - Client should test after transfer

5. **⚠️ Document Everything**
   - Provide complete documentation
   - Include credentials securely
   - Create handover meeting/call

---

## 📝 Recommended Handover Process

### **Step-by-Step Timeline:**

#### **Day 1-3: Preparation**
- Complete all configuration updates
- Clean up test data
- Prepare documentation
- Create credentials document

#### **Day 4: Pre-Transfer Meeting**
- Walk client through the system
- Explain Render dashboard
- Show how to deploy
- Answer questions

#### **Day 5: Transfer Day**
- Client creates Render account
- You invite client as Owner
- Add client's payment method
- Transfer ownership
- Verify client access

#### **Day 6-7: Post-Transfer Support**
- Client tests everything
- You monitor for issues
- Fix any problems together

#### **Week 2: Gradual Handoff**
- Client handles minor issues
- You provide guidance
- Document any new findings

#### **Week 3-4: Independence**
- Client fully independent
- You available for emergencies only

---

## 🎓 Training for Client

### **What Client Needs to Know:**

1. **How to Deploy:**
   - Manual deploy vs auto-deploy
   - Viewing deployment logs
   - Troubleshooting failed deployments

2. **Environment Variables:**
   - How to add/edit variables
   - When to redeploy after changes
   - Security best practices

3. **Database Management:**
   - Viewing database
   - Running backups manually
   - Checking backup logs

4. **Monitoring:**
   - Viewing application logs
   - Checking error logs
   - Monitoring uptime

5. **Billing:**
   - Understanding costs
   - Viewing invoices
   - Upgrading/downgrading plans

### **Provide Training Materials:**
- Screen recording of common tasks
- Written step-by-step guides
- Emergency contact information
- FAQ document

---

## 💰 Pricing Discussion with Client

### **Ongoing Costs Client Will Pay:**

**Render Hosting:**
- Web Service: $7-25/month
- Database: $0-7/month (upgrade recommended for production)
- Total: ~$7-32/month

**Domain (if custom):**
- Domain registration: $10-15/year
- DNS management: Usually free

**Stripe Fees:**
- 1.5% + 20p per UK card transaction
- 2.9% + 20p per non-UK card transaction

**Optional:**
- Email service (if not using Gmail): $0-10/month
- SMS service (Twilio): Pay-as-you-go
- Monitoring tools: $0-50/month

**Total Estimated:** $10-50/month + transaction fees

---

## ✅ Final Checklist

- [ ] Client understands ongoing costs
- [ ] Client has Render account created
- [ ] Client added as Owner on Render
- [ ] Client's payment method added
- [ ] Ownership transferred
- [ ] Custom domain configured (if applicable)
- [ ] GitHub repository transferred
- [ ] All credentials documented and shared securely
- [ ] Client trained on basic operations
- [ ] Post-transfer support period agreed
- [ ] Final testing completed
- [ ] Client confirms satisfaction

---

## 📞 Questions?

If you have any questions during the transfer process:

1. Check Render documentation: [https://render.com/docs](https://render.com/docs)
2. Contact Render support: [https://render.com/support](https://render.com/support)
3. Review this guide again
4. Schedule a call with client to walk through together

---

**Last Updated:** December 4, 2025  
**Version:** 1.0  
**Status:** Ready for Transfer
