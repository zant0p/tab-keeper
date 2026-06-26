# Tab Keeper - Chrome Web Store Submission Guide

**Version:** 2.0.3  
**Last Updated:** June 26, 2026

---

## Overview

This guide walks you through submitting Tab Keeper to the Chrome Web Store. Follow each step carefully to ensure a smooth review process.

---

## Pre-Submission Checklist

Before starting submission, verify:

- [ ] All code tested locally (see TESTING_GUIDE.md)
- [ ] No hardcoded credentials in source code
- [ ] `manifest.json` has no `key` or `update_url` fields
- [ ] Privacy policy is published and accessible
- [ ] ZIP file is clean and presentable
- [ ] Screenshots prepared (1280x800 or 640x400 minimum)
- [ ] Developer account registered ($5 one-time fee)

---

## Step 1: Chrome Web Store Developer Registration

### If You Don't Have an Account

1. Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **Register**
3. Pay the $5 one-time registration fee
4. Complete identity verification
5. Wait for account approval (usually instant, can take 24-48 hours)

### If You Already Have an Account

1. Log in to [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Ensure your developer profile is complete

---

## Step 2: Prepare Extension Package

### Create Clean ZIP File

```bash
cd /root/.openclaw/workspace/tab-keeper

# Remove any build artifacts first
rm -f *.zip updates.xml tab-keeper.pem

# Create fresh ZIP for submission
zip -r ../tab-keeper-2.0.3.zip \
  manifest.json \
  background.js \
  content.js \
  popup.js \
  popup.html \
  options.js \
  options.html \
  icons/ \
  managed_storage_schema.json \
  pwa/
```

### Verify ZIP Contents

```bash
unzip -l ../tab-keeper-2.0.3.zip
```

**Should include:**
- ✅ manifest.json
- ✅ background.js
- ✅ content.js
- ✅ popup.js, popup.html
- ✅ options.js, options.html
- ✅ icons/ folder with PNG files
- ✅ managed_storage_schema.json
- ✅ pwa/ folder (optional, for PWA integration)

**Should NOT include:**
- ❌ .git/ folder
- ❌ Old ZIP files
- ❌ .pem keys
- ❌ updates.xml
- ❌ dist-al/, dist-snf/ folders
- ❌ scripts/ folder
- ❌ Documentation files (TESTING_GUIDE.md, etc.)

---

## Step 3: Create New Item in Dashboard

1. Log in to [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **New Item**
3. Select **Chrome Extension**
4. Upload your ZIP file (`tab-keeper-2.0.3.zip`)
5. Wait for upload and parsing to complete

---

## Step 4: Fill Out Store Listing

### Basic Information

| Field | Value |
|-------|-------|
| **Name** | Tab Keeper |
| **Short Description** | Keep important tabs alive with auto-login and timer management |
| **Category** | Productivity |

### Detailed Description

```
Tab Keeper helps you maintain focus on important web applications by automatically managing multiple tabs and keeping them logged in.

Key Features:
• Automatically opens and manages two target tabs
• Configurable inactivity timer (default 5 minutes)
• Auto-switches back to primary tab after inactivity
• Auto-reopens closed target tabs
• Optional auto-login support for enterprise deployments
• Enterprise policy support via chrome.storage.managed
• Works alongside PWA dashboard for monitoring

Perfect for:
- Healthcare facilities using PointClickCare
- Kiosk deployments
- Enterprise environments requiring persistent tab management
- Anyone who needs to keep specific tabs active and logged in

Privacy & Security:
- No data collection or transmission
- All settings stored locally in browser
- Credentials managed via Chrome's secure storage
- Enterprise policies supported for centralized management

Note: This extension is designed for enterprise and kiosk deployments. Individual users should configure credentials only on dedicated/shared devices with appropriate security measures.
```

### Language & Locale

- **Primary Language:** English (US)
- **Additional Languages:** (optional, can add later)

---

## Step 5: Upload Graphics Assets

### Required Images

| Asset | Dimensions | Format | Notes |
|-------|------------|--------|-------|
| **Small Tile** | 440x280 | PNG or JPEG | Promotional tile |
| **Large Tile** | 920x680 | PNG or JPEG | Featured promo (optional) |
| **Marquee** | 1400x560 | PNG or JPEG | Hero image (optional) |
| **Screenshots** | 1280x800 min | PNG or JPEG | At least 1 required |

### Screenshot Guidelines

Capture these screens:

1. **Extension Popup** - Show main UI with timer
2. **Options Page** - Show configuration interface
3. **In Action** - Show both target tabs open
4. **PWA Dashboard** (optional) - Show PWA integration

**Tips:**
- Use high-resolution displays
- Remove personal data from screenshots
- Add annotations/arrows if helpful
- Ensure text is readable

---

## Step 6: Privacy Policy

### Requirement

Chrome Web Store requires a publicly accessible privacy policy URL.

### Options

**Option A: Host Existing Privacy Policy**

1. Use the existing `privacy-policy.md` file
2. Convert to HTML and host on a public URL
3. Options:
   - GitHub Pages (free)
   - Company website
   - Google Sites (free)
   - File server (if publicly accessible)

**Option B: Use GitHub Pages (Recommended)**

```bash
# If using GitHub repository
git checkout gh-pages
# Copy privacy-policy.html to root
# Push to GitHub
# Enable GitHub Pages in repo settings
```

**Option C: Simple HTML Hosting**

Create a simple HTML version:

```html
<!DOCTYPE html>
<html>
<head><title>Tab Keeper - Privacy Policy</title></head>
<body>
<h1>Tab Keeper Privacy Policy</h1>
<!-- Paste privacy-policy.md content here -->
</body>
</html>
```

Host anywhere publicly accessible.

### Submit Privacy Policy URL

In Developer Dashboard:
1. Go to **Store Listing** → **Privacy Policy**
2. Enter the public URL to your privacy policy
3. Save

---

## Step 7: Content Rating

Complete the content rating questionnaire:

1. Click **Content Rating** tab
2. Answer all questions honestly
3. For Tab Keeper, typical answers:
   - ❌ Does not contain ads
   - ❌ Does not collect user data
   - ❌ Not designed for children under 13
   - ✅ Complies with Limited Use requirements

### Limited Use Compliance

Tab Keeper complies with Chrome Web Store's **Limited Use** requirements:

- Data used only for extension's core functionality
- No third-party data transfers
- No human access to user data
- No advertising use
- No credit/lending decisions

---

## Step 8: Permissions Justification

Chrome will ask you to justify each permission. Use these explanations:

| Permission | Justification |
|------------|---------------|
| `tabs` | Required to monitor active tab, detect when user switches away, and automatically switch back to primary tab after inactivity |
| `storage` | Stores user configuration (URLs, timer duration, credentials) locally in browser |
| `activeTab` | Detects current tab URL to determine if user is on primary or secondary target |
| `scripting` | Injects auto-login script into login pages to fill credentials automatically |
| `alarms` | Implements inactivity timer that triggers automatic tab switching |
| `<all_urls>` (host_permissions) | Detects login forms on target URLs for auto-login functionality |

---

## Step 9: Submit for Review

### Final Checklist

Before clicking Submit:

- [ ] ZIP file uploaded successfully
- [ ] All store listing fields completed
- [ ] Graphics assets uploaded
- [ ] Privacy policy URL added
- [ ] Content rating completed
- [ ] Permissions justified
- [ ] Pricing set (Free)

### Submit

1. Click **Submit for Review** button
2. Confirm submission
3. Note the submission reference number

---

## Step 10: Review Process

### Timeline

- **Standard Review:** 3-5 business days
- **Complex Extensions:** Up to 2 weeks
- **Expedited:** Not available for most developers

### Status Updates

Check status in Developer Dashboard:

- **In Review** - Under evaluation
- **Needs Attention** - Issues found, requires fixes
- **Approved** - Ready to publish
- **Rejected** - Significant issues, must resubmit

### Common Rejection Reasons

1. **Hardcoded Credentials** - Fixed in v2.0.3 by using chrome.storage.managed
2. **Missing Privacy Policy** - Ensure URL is accessible
3. **Unclear Functionality** - Provide detailed description
4. **Excessive Permissions** - Justify each permission clearly
5. **Broken Features** - Test thoroughly before submission

---

## Step 11: Publishing

Once approved:

1. Go to **Dashboard** in Developer Console
2. Find Tab Keeper item
3. Click **Publish**
4. Extension goes live within 1-2 hours

### Post-Publish

- Share extension URL with stakeholders
- Monitor reviews and feedback
- Track install metrics in dashboard
- Prepare for updates based on user feedback

---

## Step 12: Post-Submission Maintenance

### Version Updates

When releasing updates:

1. Increment version in `manifest.json`
2. Update CHANGELOG
3. Create new ZIP
4. Upload as new version in dashboard
5. Submit for review again

### User Support

- Monitor reviews daily
- Respond to questions within 48 hours
- Track issues via email (zantop@protonmail.com)
- Document common issues in FAQ

---

## Enterprise Deployment Note

For enterprise customers deploying via Admin Console:

- See ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md
- Extension supports chrome.storage.managed policies
- Credentials can be pushed centrally
- No user configuration required

---

## Contact & Support

**Developer:** BJ  
**Email:** zantop@protonmail.com  
**Privacy Policy:** [Insert URL]

---

## Appendix: Quick Reference

### Submission URL
https://chrome.google.com/webstore/devconsole

### Developer Fee
$5 one-time (non-refundable)

### Review Time
3-5 business days (typical)

### Extension ID (After Publishing)
Will be generated after first publish. Example: `abcdefghijklmnop1234567890`

### Managed Storage Schema
Located at: `managed_storage_schema.json`

---

**Good luck with your submission! 🚀**
