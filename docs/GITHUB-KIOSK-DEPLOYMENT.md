# Tab Keeper - GitHub Kiosk Deployment Guide

## 🚨 Fix for "Application Cannot Be Downloaded" Error

### ✅ Step 1: Upload to GitHub Releases

**Via Web UI:**
1. Go to https://github.com/zant0p/tab-keeper/releases/new
2. Tag version: `v2.0.0`
3. Title: "Tab Keeper v2.0.0"
4. **Attach files:**
   - `dist/tab-keeper-2.0.0.zip` (the extension package)
   - `dist/updates.xml` (the update manifest)
5. Click "Publish release"

**Via GitHub CLI:**
```bash
cd /root/.openclaw/workspace/tab-keeper

gh release create v2.0.0 \
  ./dist/tab-keeper-2.0.0.zip \
  ./dist/updates.xml \
  --title "Tab Keeper v2.0.0 - Kiosk Ready" \
  --notes "Chrome extension for PointClickCare kiosk deployment"
```

### ✅ Step 2: Verify URLs Work

Test that both files are accessible:

```bash
# Test ZIP file
curl -I https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/tab-keeper-2.0.0.zip
# Should return: HTTP/2 200

# Test updates.xml
curl -I https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/updates.xml
# Should return: HTTP/2 200

# Verify updates.xml content
curl https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/updates.xml
# Should show XML with your extension ID and GitHub URL
```

### ✅ Step 3: Configure Chrome Admin Console

**Policy JSON:**
```json
{
  "ExtensionInstallForcesList": [
    {
      "app_id": "4nsinwkb7e5khfdund5hlutwfa",
      "update_url": "https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/updates.xml"
    }
  ],
  "ExtensionSettings": {
    "4nsinwkb7e5khfdund5hlutwfa": {
      "installation_mode": "force_installed",
      "update_url": "https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/updates.xml"
    }
  }
}
```

**In Chrome Admin Console:**
1. Go to admin.google.com → Devices → Chrome → Settings → User & Browser Settings
2. Scroll to **Extensions** section
3. Find **"Extension Install Force List"**
4. Click **"Add Extension Install Force"**
5. Enter:
   - **Extension ID:** `4nsinwkb7e5khfdund5hlutwfa`
   - **Update URL:** `https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/updates.xml`
6. Save

### ✅ Step 4: Deploy to Kiosk/Managed Guest Session

**For Managed Guest Session:**
1. Devices → Chrome → Settings → Device Settings
2. Enable **"Managed Guest Session"**
3. Apply extension policy to same OU

**What Happens:**
1. Device reboots
2. User clicks "Managed Guest Session"
3. Chrome opens full-screen
4. Extension auto-installs (no user interaction)
5. Tab Keeper opens both tabs automatically
6. Auto-login happens
7. Timer monitoring starts

## 🐛 Troubleshooting

### "Application cannot be downloaded"

**Causes:**
1. ❌ Files not uploaded to GitHub Releases
2. ❌ Wrong URL in policy or updates.xml
3. ❌ GitHub Releases not published yet
4. ❌ Network/firewall blocking GitHub

**Fixes:**
```bash
# 1. Verify files exist in release
curl -I https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/tab-keeper-2.0.0.zip
curl -I https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/updates.xml

# Both should return HTTP/2 200

# 2. Check updates.xml has correct URL
curl https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/updates.xml

# Should show:
# codebase='https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/tab-keeper-2.0.0.zip'
```

### Extension Not Installing

**Check Policy Status:**
```
chrome://policy/
```
- Click "Reload policies"
- Look for `ExtensionInstallForcesList`
- Status should be **"Mandatory"**

**Check Extension Status:**
```
chrome://extensions/
```
- Look for Tab Keeper
- Should show "Installed by enterprise policy"

### Still Getting CRX_REQUIRED_PROOF_MISSING

This means it's doing **manual install**, not enterprise force-install:

**Verify:**
1. Policy is applied (`chrome://policy/`)
2. Using `ExtensionInstallForcesList` (not just dragging CRX file)
3. Device is managed (`chrome://management/`)

## 📋 Checklist

Before deploying to production:

- [ ] Created GitHub Release v2.0.0
- [ ] Uploaded `tab-keeper-2.0.0.zip` to release
- [ ] Uploaded `updates.xml` to release
- [ ] Verified both URLs return HTTP 200
- [ ] Configured Chrome Admin Console policy
- [ ] Policy shows as "Mandatory" at `chrome://policy/`
- [ ] Tested on one kiosk device first
- [ ] Extension auto-installs without errors
- [ ] Both tabs open automatically
- [ ] Auto-login works
- [ ] Timer refocus works

## 🔑 Key Information

**Extension ID:** `4nsinwkb7e5khfdund5hlutwfa`  
**GitHub Release:** https://github.com/zant0p/tab-keeper/releases/tag/v2.0.0  
**Update URL:** `https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/updates.xml`  
**ZIP URL:** `https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/tab-keeper-2.0.0.zip`

---

**Status:** Ready for GitHub deployment  
**Next:** Upload files to GitHub Releases, configure Chrome Admin Console
