# Email Notifications Setup Guide - BAK UP E-Voucher System

## ✅ Current Status

**Email notifications are FULLY IMPLEMENTED and ready to use!**

The system currently uses **Gmail SMTP** for sending emails. All email functionality is working, it just needs Gmail credentials to be configured.

## 📧 Automated Emails

The system automatically sends emails for:

- ✅ **New User Registration** - Welcome emails for all user types
- ✅ **VCSE Verification** - Pending verification notifications for VCSE organizations  
- ✅ **Password Reset** - Secure password reset links
- ✅ **Voucher Issued** - Notifications when vouchers are issued to recipients
- ✅ **Voucher Redemption** - Receipt emails after voucher redemption
- ✅ **Payout Requests** - Notifications for vendor payout requests and approvals
- ✅ **Collection Confirmations** - Surplus food collection notifications

## 🔧 Gmail SMTP Configuration

### Required Environment Variables

Add these to your Render dashboard:

| Variable Name | Example Value | Description |
|--------------|---------------|-------------|
| `GMAIL_USER` | `bakup-noreply@gmail.com` | Your Gmail email address |
| `GMAIL_APP_PASSWORD` | `abcdefghijklmnop` | Gmail App Password (16 characters) |
| `FROM_EMAIL` | `bakup-noreply@gmail.com` | Sender email (optional, defaults to GMAIL_USER) |
| `APP_URL` | `https://backup-voucher-system-1.onrender.com` | Your app URL |

### How to Get a Gmail App Password

1. **Create a dedicated Gmail account** (recommended):
   - Go to https://accounts.google.com/signup
   - Create an account like `bakup-noreply@gmail.com`
   - This keeps business emails separate from personal

2. **Enable 2-Step Verification**:
   - Go to https://myaccount.google.com/security
   - Click **2-Step Verification**
   - Follow the setup process
   - This is REQUIRED for App Passwords

3. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select **Mail** and **Other (Custom name)**
   - Name it "BAK UP E-Voucher System"
   - Click **Generate**
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
   - **Remove spaces** before using: `abcdefghijklmnop`

### Setting Environment Variables on Render

1. Go to https://dashboard.render.com/
2. Select your **backup-voucher-system** service
3. Click **Environment** in the left sidebar
4. Click **Add Environment Variable**
5. Add each variable:
   ```
   GMAIL_USER = bakup-noreply@gmail.com
   GMAIL_APP_PASSWORD = abcdefghijklmnop
   FROM_EMAIL = bakup-noreply@gmail.com
   ```
6. Click **Save Changes**
7. Render will automatically redeploy (takes ~5 minutes)

## 🧪 Testing Email Notifications

### Test 1: Welcome Email (New User Registration)

1. Go to https://backup-voucher-system-1.onrender.com
2. Click **Get Started**
3. Fill in the registration form:
   - Use a **real email address you can access**
   - Choose any user type (Recipient, Vendor, etc.)
4. Click **Register**
5. Check your email inbox for a welcome email
6. ✅ You should receive a professionally formatted welcome email

### Test 2: VCSE Organization Verification Email

1. Register as a **VCSE Organization**
2. Provide a valid Charity Commission Number (e.g., `1234567`)
3. Provide an organization name
4. Submit the form
5. Check your email for a "Verification Pending" notification
6. ✅ You should receive an email explaining the verification process

### Test 3: Password Reset Email

1. Go to the login page
2. Click **Forgot Password?**
3. Enter your email address
4. Click **Send Reset Link**
5. Check your email inbox
6. ✅ You should receive a password reset email with a secure link

## 📊 Monitoring Email Delivery

### Check Render Logs

1. Go to Render dashboard
2. Select your service
3. Click **Logs**
4. Look for email-related messages:
   ```
   ✓ Gmail SMTP configured successfully
   ✓ SMTP connection test successful!
   ✓ Email sent to user@example.com: Welcome to BAK UP
   ```

### Common Log Messages

**Success:**
```
✓ Gmail SMTP configured successfully
✓ SMTP connection test successful!
✓ Email sent to user@example.com: Welcome to BAK UP - Your Recipient Account is Ready!
```

**Not Configured:**
```
⚠️ Gmail SMTP not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.
⚠️ Email not sent to user@example.com (SMTP not configured)
```

**Authentication Error:**
```
✗ SMTP Authentication FAILED: (535, b'5.7.8 Username and Password not accepted')
Please check your GMAIL_USER and GMAIL_APP_PASSWORD
```

## 🎨 Email Templates

All emails use professional HTML templates with:
- ✅ BAK UP branding and colors
- ✅ Responsive design (mobile-friendly)
- ✅ Clear call-to-action buttons
- ✅ Personalized content
- ✅ Footer with contact information

Template locations: `/backend/src/email_service.py`

## 🔍 Troubleshooting

### Emails Not Sending

**Problem:** "Email not sent (SMTP not configured)"
- **Solution:** Add `GMAIL_USER` and `GMAIL_APP_PASSWORD` to Render environment variables

**Problem:** "SMTP Authentication FAILED"
- **Solution:** 
  1. Verify you're using an **App Password**, not your regular Gmail password
  2. Ensure 2-Step Verification is enabled on the Gmail account
  3. Check for typos in the App Password (remove spaces)

**Problem:** "SMTP connection test FAILED"
- **Solution:**
  1. Check your internet connection
  2. Verify Gmail SMTP is not blocked by firewall
  3. Try regenerating the App Password

### Emails Going to Spam

**Problem:** Emails landing in spam folder
- **Solution:**
  1. Ask users to add `bakup-noreply@gmail.com` to their contacts
  2. Check spam folder and mark as "Not Spam"
  3. For production, consider using a custom domain with SPF/DKIM records

### App Password Not Working

**Problem:** Can't generate App Password
- **Solution:**
  1. Ensure 2-Step Verification is enabled first
  2. Wait a few minutes after enabling 2-Step Verification
  3. Try using a different browser
  4. Make sure you're logged into the correct Google account

## 🚀 Alternative Email Services

If you prefer a different email service, the system can be easily adapted:

### SendGrid (Professional)
- ✅ Better deliverability
- ✅ Advanced analytics
- ✅ 100 emails/day free tier
- ❌ Requires API key setup

### AWS SES (Scalable)
- ✅ Very cost-effective at scale
- ✅ High deliverability
- ❌ More complex setup

### Mailgun (Developer-Friendly)
- ✅ Simple API
- ✅ Good documentation
- ✅ Free tier available

To switch email services, modify `/backend/src/email_service.py`

## 📈 Email Limits

### Gmail SMTP Limits
- **Free Gmail Account:** 500 emails/day
- **Google Workspace:** 2,000 emails/day
- **Rate Limit:** ~100 emails/hour

These limits are sufficient for most use cases. If you need more, consider upgrading to Google Workspace or switching to SendGrid/AWS SES.

## ✅ Checklist

Before going live, ensure:

- [ ] Created a dedicated Gmail account for the application
- [ ] Enabled 2-Step Verification on the Gmail account
- [ ] Generated Gmail App Password
- [ ] Added `GMAIL_USER` to Render environment variables
- [ ] Added `GMAIL_APP_PASSWORD` to Render environment variables
- [ ] Tested welcome email by registering a new user
- [ ] Tested password reset email
- [ ] Checked Render logs for successful email delivery
- [ ] Verified emails are not going to spam

## 🎯 Next Steps

1. **Create Gmail Account**: Set up `bakup-noreply@gmail.com` (or similar)
2. **Configure Render**: Add environment variables
3. **Test Thoroughly**: Register test accounts and verify emails arrive
4. **Monitor**: Check Render logs for any email errors
5. **Go Live**: Email notifications will work automatically for all users

## 📞 Support

If you encounter issues:
1. Check Render logs for error messages
2. Verify environment variables are set correctly
3. Test with a different email address
4. Check Gmail account settings

---

**Status:** ✅ Email system is fully implemented and ready to use once Gmail credentials are configured!

**Last Updated:** December 5, 2024
