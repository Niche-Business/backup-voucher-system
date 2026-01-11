# Mobile App Deployment Guide - BAK UP E-Voucher System

## Overview

The BAK UP E-Voucher System is built as a **Progressive Web App (PWA)** with native mobile app capabilities using **Capacitor**. This allows the same codebase to run as:

- 🌐 **Web App** - Accessible via browser
- 📱 **Android App** - Native Android application
- 🍎 **iOS App** - Native iPhone/iPad application
- 💻 **PWA** - Installable web app with offline capabilities

## Current Status

✅ **PWA (Progressive Web App)** - Fully functional and deployed
✅ **Android Project** - Configured and ready for build
⚠️ **iOS Project** - Needs to be initialized (requires macOS)

## PWA (Progressive Web App)

### What is a PWA?

A PWA is a web application that can be installed on users' devices and works like a native app. Users can:
- Install it directly from the browser (no app store needed)
- Access it from their home screen
- Use it offline (with service workers)
- Receive push notifications

### Current PWA Features

✅ **Install Prompts** - Users see "Install BAK UP" buttons
✅ **Offline Support** - Basic offline functionality
✅ **Home Screen Icon** - Custom app icon when installed
✅ **Splash Screen** - Professional loading screen
✅ **Responsive Design** - Works on all screen sizes

### How Users Install the PWA

**On Android (Chrome/Edge):**
1. Visit https://backup-voucher-system-1.onrender.com
2. Tap the "Install" button on the page, OR
3. Tap the browser menu (⋮) → "Install app" or "Add to Home screen"
4. Confirm installation
5. App appears on home screen

**On iPhone/iPad (Safari):**
1. Visit https://backup-voucher-system-1.onrender.com
2. Tap the Share button (□↑)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. App appears on home screen

**On Desktop (Chrome/Edge):**
1. Visit https://backup-voucher-system-1.onrender.com
2. Look for the install icon (⊕) in the address bar
3. Click "Install"
4. App opens in its own window

### PWA Advantages

✅ **No App Store Approval** - Deploy instantly
✅ **Automatic Updates** - Users always get the latest version
✅ **Cross-Platform** - Works on Android, iOS, Windows, Mac, Linux
✅ **Smaller Size** - No need to download large app packages
✅ **SEO Benefits** - Discoverable via search engines

## Android App Deployment

### Prerequisites

- Android Studio installed
- Java Development Kit (JDK) 11 or higher
- Android SDK
- Google Play Console account (for publishing)

### Step 1: Build the Web App

```bash
cd /home/ubuntu/backup-voucher-system/frontend
pnpm install
pnpm build
```

This creates the production build in the `dist/` directory.

### Step 2: Sync with Capacitor

```bash
npx cap sync android
```

This copies the web app into the Android project and updates native dependencies.

### Step 3: Open in Android Studio

```bash
npx cap open android
```

This opens the Android project in Android Studio.

### Step 4: Configure App Details

Edit `/android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">BAK UP</string>
    <string name="title_activity_main">BAK UP E-Voucher</string>
    <string name="package_name">com.bakup.voucher</string>
    <string name="custom_url_scheme">bakup</string>
</resources>
```

### Step 5: Update App Icon

1. Generate app icons using https://icon.kitchen/ or similar tool
2. Replace icons in `/android/app/src/main/res/mipmap-*/`
3. Recommended sizes:
   - `mipmap-mdpi`: 48x48
   - `mipmap-hdpi`: 72x72
   - `mipmap-xhdpi`: 96x96
   - `mipmap-xxhdpi`: 144x144
   - `mipmap-xxxhdpi`: 192x192

### Step 6: Build APK (for Testing)

In Android Studio:
1. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for build to complete
3. APK will be in `/android/app/build/outputs/apk/debug/`
4. Install on Android device for testing

### Step 7: Build AAB (for Google Play)

In Android Studio:
1. Click **Build** → **Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Create or select a keystore
4. Set release build variant
5. Click **Finish**
6. AAB will be in `/android/app/build/outputs/bundle/release/`

### Step 8: Publish to Google Play Store

1. **Create Google Play Console Account**
   - Go to https://play.google.com/console
   - Pay one-time $25 registration fee
   - Complete account setup

2. **Create New App**
   - Click "Create app"
   - Enter app details:
     - App name: "BAK UP E-Voucher"
     - Default language: English (UK)
     - App type: App
     - Free or paid: Free

3. **Complete Store Listing**
   - App name: BAK UP E-Voucher
   - Short description: Digital food voucher system for communities
   - Full description: (Use the About section from your website)
   - App icon: 512x512 PNG
   - Feature graphic: 1024x500 PNG
   - Screenshots: At least 2 phone screenshots

4. **Upload AAB**
   - Go to **Production** → **Create new release**
   - Upload the AAB file
   - Add release notes
   - Review and rollout

5. **Complete Content Rating**
   - Answer questionnaire
   - Get rating certificate

6. **Set Target Audience**
   - Age groups: 18+
   - Not designed for children

7. **Submit for Review**
   - Review all sections
   - Submit for review
   - Wait 1-7 days for approval

## iOS App Deployment

### Prerequisites

- **macOS** (required for iOS development)
- Xcode 14 or higher
- Apple Developer Account ($99/year)
- CocoaPods installed

### Step 1: Initialize iOS Project

```bash
cd /home/ubuntu/backup-voucher-system/frontend
npx cap add ios
```

### Step 2: Build the Web App

```bash
pnpm build
npx cap sync ios
```

### Step 3: Open in Xcode

```bash
npx cap open ios
```

### Step 4: Configure App in Xcode

1. **Select Project** → **General**
2. **Display Name**: BAK UP
3. **Bundle Identifier**: com.bakup.voucher
4. **Version**: 1.0.0
5. **Deployment Target**: iOS 13.0 or higher

### Step 5: Add App Icon

1. Open **Assets.xcassets** → **AppIcon**
2. Drag and drop icon images for all sizes
3. Use https://appicon.co/ to generate all required sizes

### Step 6: Configure Signing

1. Select **Signing & Capabilities**
2. Enable **Automatically manage signing**
3. Select your **Team** (Apple Developer account)
4. Xcode will generate provisioning profiles

### Step 7: Build and Test

1. Select a simulator or connected iPhone
2. Click **Run** (▶️) button
3. App will build and launch on device/simulator

### Step 8: Archive for App Store

1. Select **Any iOS Device** as build target
2. Click **Product** → **Archive**
3. Wait for archive to complete
4. Click **Distribute App**
5. Select **App Store Connect**
6. Upload to App Store

### Step 9: Publish to App Store

1. **Create App Store Connect Account**
   - Go to https://appstoreconnect.apple.com
   - Sign in with Apple Developer account

2. **Create New App**
   - Click **My Apps** → **+** → **New App**
   - Platform: iOS
   - Name: BAK UP E-Voucher
   - Primary Language: English (UK)
   - Bundle ID: com.bakup.voucher
   - SKU: bakup-voucher-001

3. **Complete App Information**
   - App name: BAK UP E-Voucher
   - Subtitle: Community Food Voucher System
   - Category: Lifestyle
   - Content Rights: Yes (you have rights)

4. **Add Screenshots**
   - iPhone 6.7" Display: 1290x2796 (required)
   - iPhone 6.5" Display: 1242x2688 (required)
   - iPad Pro 12.9" Display: 2048x2732 (optional)

5. **Upload Build**
   - Go to **App Store** tab
   - Click **+** next to Build
   - Select the uploaded build

6. **Set Pricing**
   - Price: Free
   - Availability: All countries

7. **Submit for Review**
   - Complete all required fields
   - Submit for review
   - Wait 1-7 days for approval

## Continuous Deployment

### Automated Builds

You can set up automated builds using:

**For Android:**
- GitHub Actions
- Bitrise
- Codemagic
- Fastlane

**For iOS:**
- GitHub Actions (with macOS runner)
- Bitrise
- Codemagic
- Fastlane

### Example GitHub Actions Workflow

Create `.github/workflows/android-build.yml`:

```yaml
name: Android Build

on:
  push:
    branches: [ master ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && pnpm install
      - name: Build web app
        run: cd frontend && pnpm build
      - name: Sync Capacitor
        run: cd frontend && npx cap sync android
      - name: Build APK
        run: cd frontend/android && ./gradlew assembleRelease
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release
          path: frontend/android/app/build/outputs/apk/release/app-release.apk
```

## App Store Optimization (ASO)

### Keywords

Choose relevant keywords for better discoverability:
- food voucher
- community support
- digital vouchers
- food assistance
- charity app
- VCSE
- food bank

### App Description Template

```
BAK UP E-Voucher System - Connecting Communities

The BAK UP E-Voucher System is a comprehensive digital platform that connects food vendors, VCSE organizations, and vulnerable families through a unified solution.

KEY FEATURES:
• Digital Food Vouchers - Receive and manage vouchers with dignity
• Local Vendor Network - Support local businesses
• Surplus Food Sharing - Reduce food waste
• Real-time Notifications - Stay updated on voucher status
• Secure Transactions - Safe and reliable platform

FOR RECIPIENTS:
• Receive digital food vouchers
• Choose what you need from local vendors
• Track your voucher balance easily
• Access discounted food items

FOR VENDORS:
• Accept digital vouchers seamlessly
• Post surplus food for collection
• Support your local community
• Manage multiple shop locations

FOR VCSE ORGANIZATIONS:
• Issue and manage vouchers efficiently
• Fund families digitally
• Track usage and impact
• Generate detailed reports

Join the Northamptonshire Community E-Voucher Scheme today!

Led by BAK UP CIC, our scheme provides dignified support through flexible vouchers, respects cultural preferences, and strengthens local economies.

Contact: admin@bakupcic.co.uk
Phone: 01933698347
```

## Testing Checklist

Before publishing to app stores:

### Functional Testing
- [ ] User registration works for all user types
- [ ] Login/logout functionality
- [ ] Voucher creation and redemption
- [ ] QR code scanning
- [ ] Payment processing (Stripe)
- [ ] Notifications
- [ ] Offline functionality

### UI/UX Testing
- [ ] All screens display correctly
- [ ] Navigation works smoothly
- [ ] Forms validate properly
- [ ] Error messages are clear
- [ ] Loading states are visible

### Device Testing
- [ ] Test on multiple Android devices
- [ ] Test on multiple iOS devices
- [ ] Test on different screen sizes
- [ ] Test on different OS versions

### Performance Testing
- [ ] App loads quickly
- [ ] Smooth scrolling
- [ ] No memory leaks
- [ ] Battery usage is reasonable

## App Store Requirements

### Google Play Store
- Minimum SDK: Android 5.0 (API 21)
- Target SDK: Latest Android version
- Privacy Policy URL required
- Content rating required
- App must comply with Google Play policies

### Apple App Store
- Minimum iOS: 13.0
- Privacy Policy URL required
- App must comply with App Store Review Guidelines
- Must support latest iPhone screen sizes
- Must not crash or have major bugs

## Costs

### One-Time Costs
- Google Play Developer Account: $25 (one-time)
- Apple Developer Program: $99/year
- App icon design: $0-$500 (optional)

### Ongoing Costs
- Apple Developer renewal: $99/year
- Server hosting: Already covered by Render
- Push notification service: Free tier available

## Recommended Timeline

1. **Week 1**: Build and test Android APK locally
2. **Week 2**: Submit to Google Play Store
3. **Week 3**: Build and test iOS app (requires macOS)
4. **Week 4**: Submit to Apple App Store
5. **Week 5-6**: Wait for approvals and make any requested changes

## Support Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Android Studio**: https://developer.android.com/studio
- **Xcode**: https://developer.apple.com/xcode/
- **Google Play Console**: https://play.google.com/console
- **App Store Connect**: https://appstoreconnect.apple.com

## Next Steps

1. **For Android**:
   - Install Android Studio
   - Build and test APK locally
   - Create Google Play Console account
   - Prepare app store listing materials

2. **For iOS**:
   - Get access to a Mac
   - Install Xcode
   - Enroll in Apple Developer Program
   - Initialize iOS project with Capacitor

3. **For PWA**:
   - ✅ Already deployed and working!
   - Promote PWA installation to users
   - Monitor usage analytics

## Questions?

For technical support or questions about mobile app deployment, contact your development team or refer to the official Capacitor documentation.

---

**Status:** 
- ✅ PWA: Fully deployed and functional
- ✅ Android: Project configured, ready for build
- ⚠️ iOS: Requires macOS and Apple Developer account

**Last Updated:** December 5, 2024
