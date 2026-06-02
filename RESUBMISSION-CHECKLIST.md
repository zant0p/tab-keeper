# Tab Keeper - Resubmission Checklist

**Version:** 1.0.1  
**Date:** 2026-05-27  
**Issue:** Google rejected v1.0.0 for unused `alarms` permission

---

## ✅ Fixes Applied

- [x] Removed unused `alarms` permission from `manifest.json`
- [x] Bumped version from `1.0.0` to `1.0.1`
- [x] Verified code uses `setTimeout()` instead of Chrome alarms API

---

## 📦 Before Resubmitting

### 1. Package the Extension

```bash
cd /home/zantop/.openclaw/workspace/tab-keeper-review

# Create clean ZIP (excludes dev files)
zip -r tab-keeper-v1.0.1.zip \
  manifest.json \
  background.js \
  content.js \
  popup.html \
  popup.js \
  options.html \
  options.js \
  icons/ \
  README.md \
  privacy-policy.md
```

### 2. Verify Package Contents

```bash
unzip -l tab-keeper-v1.0.1.zip
```

Should include:
- ✅ `manifest.json` (v1.0.1, no alarms permission)
- ✅ All JS/HTML files
- ✅ Icons (16, 48, 128px)
- ✅ Privacy policy

---

## 🎯 Chrome Web Store Resubmission

### Step 1: Go to Developer Dashboard
https://chrome.google.com/webstore/devconsole

### Step 2: Find Your Extension
- Item ID: `oejjcahgbiipgebncfnjiipgebncfnjiioapmhlefio`
- Or search for "Tab Keeper"

### Step 3: Upload New Version
1. Click on your extension
2. Go to **Package** tab
3. Upload `tab-keeper-v1.0.1.zip`
4. Version should auto-detect as 1.0.1

### Step 4: Update Store Listing (if needed)
- Review description
- Ensure screenshots are uploaded
- Verify privacy policy is linked

### Step 5: Submit for Review
1. Click **Submit for Review**
2. Confirm compliance
3. Wait for approval (typically 1-3 business days)

---

## 📋 Store Listing Details

### Description (Recommended)
```
Tab Keeper helps you maintain focus on a specific tab by automatically switching back after a configurable period of inactivity. Perfect for monitoring dashboards, kiosk displays, and keeping important pages active.

Features:
• Automatic tab switching after inactivity
• Configurable timer (1-60 minutes)
• Auto-login support for credential-based sites
• Easy-to-use settings page
• Lightweight background operation

Privacy: All data stored locally. No data collection or transmission.
```

### Category
**Productivity**

### Screenshots Needed (Minimum 1)
- Extension popup
- Settings page
- Extension in action

### Privacy Policy
Use the existing `privacy-policy.md` file or host it on your website.

---

## ⚠️ What Changed from Rejected Version

| Issue | Status |
|-------|--------|
| Unused `alarms` permission | ✅ REMOVED |
| Version not bumped | ✅ UPDATED to 1.0.1 |
| Code actually uses alarms API | ✅ VERIFIED: Uses setTimeout() instead |

---

## 🔍 Review Timeline

- **Submission:** Immediate
- **Review Time:** 1-3 business days (typical)
- **Approval/Denial:** Email notification
- **If Approved:** Live in store within hours
- **If Denied:** Check email for specific issues

---

## 📧 If Rejected Again

Common issues to check:
1. **Permissions still too broad?** → Review all permissions
2. **Privacy policy unclear?** → Make it more explicit
3. **Screenshots missing?** → Add at least 1 screenshot
4. **Description misleading?** → Clarify functionality

---

## 🚀 After Approval

1. Share extension URL with users
2. Monitor reviews in dashboard
3. Track installation stats
4. Plan future updates based on feedback

---

**Ready to resubmit! 🎉**
