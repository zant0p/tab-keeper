# Tab Keeper - Testing Guide

**Version:** 2.0.3  
**Last Updated:** June 26, 2026

---

## Overview

This guide covers how to test Tab Keeper locally before submitting to the Chrome Web Store. Follow these steps to verify all functionality works correctly.

---

## Prerequisites

- Chrome browser (latest version recommended)
- Git installed
- Basic familiarity with Chrome DevTools

---

## Step 1: Clone and Prepare

```bash
# Clone the repository
git clone <repository-url>
cd tab-keeper

# Checkout the PWA branch
git checkout PWA
```

---

## Step 2: Load Extension in Developer Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `tab-keeper` folder (the one containing `manifest.json`)
5. Extension should appear with a blue "Developer" badge

**Expected Result:** Extension icon appears in Chrome toolbar, no errors in console.

---

## Step 3: Verify Extension Loads Without Errors

1. Open Chrome DevTools (`F12` or `Ctrl+Shift+I`)
2. Go to the **Console** tab
3. Look for `[Tab Keeper] Background script loaded` message
4. Check for any red error messages

**Expected Result:** 
- ✅ `[Tab Keeper] Background script loaded`
- ✅ `[Tab Keeper] Config loaded:` with configuration details
- ✅ No red error messages

---

## Step 4: Test Tab Creation

1. Click the Tab Keeper extension icon
2. Click **🚀 Launch Target Tabs** button
3. Two new tabs should open:
   - Primary: `https://10.1.129.207/Arial/#/login`
   - Secondary: `https://login.pointclickcare.com/poc/userLogin.xhtml`

**Expected Result:** Both tabs open successfully in background (not active).

---

## Step 5: Test Timer Functionality

1. Navigate to the secondary tab (PointClickCare login)
2. Open Tab Keeper popup (click extension icon)
3. Timer countdown should be visible
4. Wait for timer to complete (default 5 minutes, or check configured duration)
5. Extension should automatically switch back to primary tab

**Expected Result:**
- ✅ Timer displays countdown
- ✅ After timer expires, focus switches to primary tab automatically
- ✅ Status shows "✅ On primary tab (safe zone)"

---

## Step 6: Test Auto-Reopen Closed Tabs

1. With both target tabs open, close the primary tab manually
2. Wait ~1 second
3. Primary tab should automatically reopen

**Expected Result:** Closed target tab is automatically recreated.

---

## Step 7: Test Auto-Login (If Credentials Configured)

⚠️ **Important:** Auto-login requires credentials to be configured via enterprise policy or local storage. Do not test with real credentials on shared machines.

### Option A: Configure via Local Storage

1. Open Chrome DevTools Console on any page
2. Run:
```javascript
chrome.storage.local.set({
  username: 'testuser',
  password: 'testpass'
}, () => console.log('Credentials set'));
```
3. Reload extension (`chrome://extensions/` → Refresh icon)

### Option B: Configure via Managed Storage (Enterprise)

Create a policy file (see ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md for details).

### Test Auto-Login

1. Close all PointClickCare tabs
2. Launch tabs via extension popup
3. When primary tab loads, auto-login should trigger
4. Watch DevTools Console for `[Auto-Login] Starting login process...`

**Expected Result:** Login form fields are auto-filled and submitted.

---

## Step 8: Test Breach Popup Dismissal

1. Trigger a login attempt
2. If Chrome shows a password breach notification, it should auto-dismiss after ~3 seconds

**Expected Result:** Breach popup closes automatically without user interaction.

---

## Step 9: Test PWA Integration

1. Navigate to `http://localhost:8765/pwa/index.html` (or your file server URL)
2. PWA dashboard should load
3. Configuration from extension should display
4. Click **🚀 Launch Target Tabs** - should open both URLs

**Expected Result:** PWA displays extension status and can launch tabs.

---

## Step 10: Verify No Hardcoded Credentials

1. Search codebase for common credential patterns:
```bash
grep -r "password.*:" . --include="*.js" | grep -v node_modules
grep -r "alstaff\|snf" . --include="*.js"
```
2. Verify credentials only come from `chrome.storage.managed` or `chrome.storage.local`

**Expected Result:** No hardcoded credentials found in source files.

---

## Step 11: Verify Manifest Compliance

1. Open `manifest.json`
2. Verify NO `key` field present
3. Verify NO `update_url` field present

**Expected Result:** 
- ✅ No `"key"` property
- ✅ No `"update_url"` property
- ✅ All required permissions listed

---

## Step 12: Build ZIP for Web Store

```bash
# From tab-keeper directory
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

**Expected Result:** Clean ZIP file created without build artifacts or old ZIPs.

---

## Common Issues & Troubleshooting

### Issue: Extension doesn't load
**Solution:** Check `manifest.json` syntax. Use JSON validator.

### Issue: Tabs don't open
**Solution:** Check popup.js console logs. Verify URLs are valid.

### Issue: Timer doesn't start
**Solution:** Ensure you navigated away from primary tab. Timer only runs when on secondary/other tabs.

### Issue: Auto-login fails
**Solution:** 
- Verify credentials are configured
- Check that login page selectors match current HTML structure
- Review DevTools Console for specific errors

### Issue: "Managed storage not available" warning
**Solution:** This is normal for non-enterprise users. Extension falls back to local storage.

---

## Test Checklist

Before Web Store submission, verify:

- [ ] Extension loads without errors
- [ ] Both target tabs open correctly
- [ ] Timer countdown works
- [ ] Auto-switch to primary tab works
- [ ] Closed tabs auto-reopen
- [ ] No hardcoded credentials in code
- [ ] Manifest has no `key` or `update_url`
- [ ] Privacy policy exists and is accurate
- [ ] ZIP file is clean (no dev files, old builds)
- [ ] PWA dashboard loads and connects to extension

---

## Next Steps

After successful local testing:

1. Review WEBSTORE_SUBMISSION_GUIDE.md for submission process
2. Prepare screenshots and promotional materials
3. Complete Chrome Web Store developer registration
4. Submit for review

---

**Contact:** zantop@protonmail.com for questions or issues.
