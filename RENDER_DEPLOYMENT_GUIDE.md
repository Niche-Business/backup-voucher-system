# BAK UP E-Voucher System - Render Deployment Guide

**Date:** November 17, 2025  
**Author:** Manus AI

This guide provides step-by-step instructions to deploy the BAK UP E-Voucher System to Render.com using your GitHub repository.

## Prerequisites

1. ✅ **Render Account** (you have this)
2. ✅ **GitHub Repository** (we created this: `Niche-Business/backup-voucher-system`)
3. ✅ **Domain Name** (`bak-up.com`)

## Deployment Steps

### Step 1: Create a New Blueprint on Render

1. **Log in to your Render account:** https://dashboard.render.com

2. **Click "New +"** in the top right corner and select **"Blueprint"**.

3. **Connect your GitHub account** to Render if you haven't already.

4. **Select your repository:** `Niche-Business/backup-voucher-system`

5. **Give your service group a name:** `bakup-evoucher-system`

6. **Click "Apply"** to create the services from your `render.yaml` file.

### Step 2: Configure Services

Render will automatically detect the `render.yaml` file and configure the services. Here's what it will create:

- **Web Service:** `bakup-evoucher` (your Flask backend + React frontend)
- **Database:** `bakup-db` (PostgreSQL database)

**No manual configuration is needed** - the `render.yaml` file handles everything!

### Step 3: First Deployment

1. After applying the blueprint, Render will automatically start the first deployment.

2. **Monitor the build process:** You can watch the logs in the Render dashboard.
   - It will install Python dependencies
   - It will install Node.js dependencies
   - It will build the React frontend
   - It will start the unified server

3. **Wait for the deployment to complete.** This may take 5-10 minutes.

4. Once complete, your application will be live at a free subdomain like `https://bakup-evoucher.onrender.com`

### Step 4: Add Your Custom Domain

1. In the Render dashboard, go to the **Settings** tab for your `bakup-evoucher` web service.

2. **Click "Add Custom Domain"**.

3. **Enter your domain name:** `bak-up.com`

4. **Follow the instructions** to update your DNS records at your domain registrar (where you bought `bak-up.com`). You'll need to add an `A` record or `CNAME` record pointing to Render.

5. **Wait for DNS propagation.** This can take a few minutes to a few hours.

6. Render will automatically provision an SSL certificate for your domain.

### Step 5: Verify Your Deployment

1. **Visit your custom domain:** `https://bak-up.com`

2. **Test the application:**
   - Register a new user
   - Log in with the test accounts
   - Browse To Go items
   - Add items to cart
   - View your cart

## Troubleshooting

### Build Fails
- **Check the build logs** in the Render dashboard for errors.
- **Ensure `requirements.txt` and `package.json` are correct.**
- **Verify the `buildCommand`** in `render.yaml` is correct.

### Application Crashes
- **Check the runtime logs** for your web service.
- **Ensure all environment variables are set correctly.** The `DATABASE_URL` and `SECRET_KEY` are set automatically by Render.

### Domain Not Working
- **Double-check your DNS records** at your domain registrar.
- **Use a DNS checker tool** to verify propagation.
- **Wait a few hours** for DNS to fully update.

## Post-Deployment Recommendations

### 1. Upgrade Database
For a production application, consider upgrading your PostgreSQL database from the free tier to a paid plan for better performance and daily backups.

### 2. Set Up Email Service
- The application is configured to use Flask-Mail.
- **Add your email provider's credentials** as environment variables in the Render dashboard:
  - `MAIL_SERVER`
  - `MAIL_PORT`
  - `MAIL_USERNAME`
  - `MAIL_PASSWORD`

### 3. Change Admin Password
- The default admin password in the database is `Prince@2024`.
- **Change this immediately** after deployment for security.

---

**You are now ready to deploy! Follow these steps and let me know if you have any questions.**
