# Email Setup Guide - BAK UP E-Voucher System

## Overview
The BAK UP system uses **SendGrid** to send transactional emails including:
- ✉️ Welcome emails when users register
- 🔐 Password reset links when users forget their password

## SendGrid Setup Instructions

### Step 1: Create SendGrid Account
1. Go to https://signup.sendgrid.com
2. Sign up for a **free account** (100 emails/day)
3. Verify your email address
4. Complete the account setup

### Step 2: Create API Key
1. Log in to SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **"Create API Key"**
4. Name it: `BAK-UP-Production` (or any name you prefer)
5. Select **"Full Access"** permissions
6. Click **"Create & View"**
7. **COPY THE API KEY** - you won't see it again!

### Step 3: Configure Render Environment Variables
1. Go to https://dashboard.render.com
2. Select your `backup-voucher-system` service
3. Go to **Environment** tab
4. Add these environment variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `SENDGRID_API_KEY` | `SG.xxxxxxxxxxxxxxxx` | Your SendGrid API key |
| `FROM_EMAIL` | `noreply@bakup.com` | Sender email address |
| `APP_URL` | `https://backup-voucher-system.onrender.com` | Your app URL |

5. Click **"Save Changes"**
6. Render will automatically redeploy with the new configuration

### Step 4: Verify Sender Identity (Important!)
SendGrid requires sender verification to prevent spam:

1. In SendGrid dashboard, go to **Settings** → **Sender Authentication**
2. Choose one of these options:

   **Option A: Single Sender Verification (Quick)**
   - Click **"Verify a Single Sender"**
   - Enter: `noreply@bakup.com` (or your email)
   - Fill in your details
   - Check your email and click the verification link
   - ✅ Ready to send emails!

   **Option B: Domain Authentication (Professional)**
   - Click **"Authenticate Your Domain"**
   - Follow the DNS setup instructions
   - More complex but looks more professional

### Step 5: Test Email Functionality
After deployment completes:

1. **Test Welcome Email:**
   - Go to your app
   - Register a new test account
   - Check your email inbox for welcome message

2. **Test Password Reset:**
   - Click "Forgot Password"
   - Enter your email
   - Check inbox for password reset link

## Email Templates

### Welcome Email Features:
- ✅ Professional branded design
- ✅ Personalized greeting with user's name
- ✅ Role-specific information
- ✅ Direct link to dashboard
- ✅ Support contact information

### Password Reset Email Features:
- ✅ Secure one-time reset link
- ✅ 1-hour expiration for security
- ✅ Clear instructions
- ✅ Security warnings
- ✅ Fallback text link

## Troubleshooting

### Emails Not Sending?
1. **Check API Key:** Ensure `SENDGRID_API_KEY` is set correctly in Render
2. **Check Sender Verification:** Must verify sender email in SendGrid
3. **Check Logs:** View Render logs for error messages
4. **Check Spam Folder:** Emails might be filtered as spam initially

### Common Errors:

**Error: "The from email does not contain a valid address"**
- Solution: Verify your sender email in SendGrid dashboard

**Error: "API key not configured"**
- Solution: Add `SENDGRID_API_KEY` to Render environment variables

**Error: "Forbidden"**
- Solution: Check API key permissions (should be "Full Access")

## SendGrid Dashboard

Monitor email activity:
- **Activity Feed:** See all sent emails
- **Stats:** Track open rates, clicks, bounces
- **Suppressions:** Manage unsubscribes and bounces

## Cost & Limits

**Free Tier:**
- 100 emails/day (3,000/month)
- Perfect for initial launch
- No credit card required

**Paid Plans (if needed later):**
- Essentials: $19.95/month (50,000 emails)
- Pro: $89.95/month (100,000 emails)

## Security Best Practices

1. ✅ Never commit API keys to Git
2. ✅ Use environment variables only
3. ✅ Rotate API keys periodically
4. ✅ Use "Full Access" only when needed
5. ✅ Monitor SendGrid activity dashboard

## Support

- SendGrid Docs: https://docs.sendgrid.com
- SendGrid Support: https://support.sendgrid.com
- BAK UP Support: Contact your developer

---

**Ready to set up?** Follow steps 1-5 above, and your email system will be live! 🚀
