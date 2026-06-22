# Chrome Managed Guest Session - Required Policies

For **Managed Guest Session (MGS)** with Tab Keeper extension, configure these policies in Chrome Admin Console.

## 🎯 Minimal Policy Set (Force Install Only)

```json
{
  "ExtensionInstallForcesList": [
    {
      "app_id": "4nsinwkb7e5khfdund5hlutwfa",
      "update_url": "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/updates.xml"
    }
  ]
}
```

**What this does:**
- Automatically installs Tab Keeper on MGS
- Silently installs (no user interaction)
- Auto-updates from your Azure URL
- Grants all permissions implicitly

---

## 🔒 Recommended Policy Set (Force Install + Configuration)

```json
{
  "ExtensionInstallForcesList": [
    {
      "app_id": "4nsinwkb7e5khfdund5hlutwfa",
      "update_url": "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/updates.xml"
    }
  ],
  "ExtensionSettings": {
    "4nsinwkb7e5khfdund5hlutwfa": {
      "installation_mode": "force_installed",
      "update_url": "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/updates.xml",
      "blocked_install_message": "",
      "install_sources": ["https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/*"],
      "minimum_version_required": "2.0.0"
    }
  }
}
```

**What this adds:**
- Explicit installation mode
- Version requirement
- Install source restriction
- Custom blocked message (optional)

---

## 📋 Complete Policy Set (With Extension Configuration)

If you want to pre-configure Tab Keeper settings via policy:

```json
{
  "ExtensionInstallForcesList": [
    {
      "app_id": "4nsinwkb7e5khfdund5hlutwfa",
      "update_url": "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/updates.xml"
    }
  ],
  "ExtensionSettings": {
    "4nsinwkb7e5khfdund5hlutwfa": {
      "installation_mode": "force_installed",
      "update_url": "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/updates.xml"
    }
  },
  "ExtensionInstallSources": [
    "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/*"
  ],
  "ExtensionInstallAllowlist": [
    "4nsinwkb7e5khfdund5hlutwfa"
  ]
}
```

**Note:** For v2.0.0, credentials are hardcoded in the extension variant (AL/SNF), so no managed storage policies needed.

---

## 🖥️ Policy Deployment Locations

### Chrome Admin Console (Cloud)
1. Go to [admin.google.com](https://admin.google.com)
2. Devices → Chrome → Settings → User & Browser Settings
3. Scroll to **Extensions** section
4. Configure:
   - **Extension Install Force List**
   - **Extension Settings** (optional)

### Windows Registry (Local)
```reg
[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome]

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\ExtensionInstallForcesList]
"1"="4nsinwkb7e5khfdund5hlutwfa:https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/updates.xml"
```

### Linux (Local)
File: `/etc/opt/chrome/policies/managed/extension_policy.json`

```json
{
  "ExtensionInstallForcesList": [
    {
      "app_id": "4nsinwkb7e5khfdund5hlutwfa",
      "update_url": "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/updates.xml"
    }
  ]
}
```

**Permissions:**
```bash
sudo chown root:root /etc/opt/chrome/policies/managed/extension_policy.json
sudo chmod 644 /etc/opt/chrome/policies/managed/extension_policy.json
```

### macOS (Local)
File: `/Library/Managed Preferences/com.google.Chrome.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>ExtensionInstallForcesList</key>
  <array>
    <dict>
      <key>app_id</key>
      <string>4nsinwkb7e5khfdund5hlutwfa</string>
      <key>update_url</key>
      <string>https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/updates.xml</string>
    </dict>
  </array>
</dict>
</plist>
```

---

## ✅ Verification Steps

After deploying policies:

### 1. Check Device is Managed
```
chrome://management/
```
Should show: "This browser is managed by your organization"

### 2. Verify Policies Applied
```
chrome://policy/
```
- Click **"Reload policies"**
- Look for:
  - `ExtensionInstallForcesList` → Status: **Mandatory**
  - `ExtensionSettings` → Status: **Mandatory** (if configured)

### 3. Verify Extension Installed
```
chrome://extensions/
```
- Tab Keeper should appear automatically
- No user interaction required
- Should show "Installed by enterprise policy"

### 4. Check Extension Logs
```
chrome://extensions/?id=4nsinwkb7e5khfdund5hlutwfa
```
- Click "Service Worker" under "Inspect views"
- Check Console for errors

---

## 🆘 Troubleshooting

### Extension Not Installing

**Check:**
1. Policy status is **Mandatory** (not Recommended)
2. Extension ID is correct: `4nsinwkb7e5khfdund5hlutwfa`
3. Update URL is accessible (test in browser)
4. Container has public read access

**Test update URL:**
```bash
curl -I https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/updates.xml
# Should return: Content-Type: application/xml
```

### Policy Shows as "Recommended"

**Linux:** Policy file is world-writable
```bash
# Fix permissions
sudo chmod 644 /etc/opt/chrome/policies/managed/*.json
sudo chown root:root /etc/opt/chrome/policies/managed/*.json
```

**Windows:** Policy not in HKLM
- Must use `HKEY_LOCAL_MACHINE`, not `HKEY_CURRENT_USER`
- Or use Group Policy Editor

### CRX Error Despite Policy

**Check:**
1. MIME type: `application/x-chrome-extension`
2. No `X-Content-Type-Options: nosniff` header
3. HTTPS URL (required for auto-update)
4. updates.xml format is valid

**Test CRX download:**
```bash
curl -I https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/tab-keeper-2.0.0.crx
# Should return: Content-Type: application/x-chrome-extension
```

---

## 📝 Managed Guest Session Specific Notes

### What is MGS?
- Temporary session that resets on sign-out
- All user data cleared after session
- Policies re-applied every session
- Ideal for kiosks, shared devices, testing

### Why Use Force Install for MGS?
- Extensions survive session reset
- Settings persist via policy (not local storage)
- No user interaction required
- Automatic updates

### Tab Keeper v2.0.0 in MGS
- Credentials are hardcoded in extension (AL or SNF variant)
- No managed storage needed for basic functionality
- Timer and tab management work out-of-box
- Survives cache clears and restarts

---

## 🧪 Quick Test Checklist

Before deploying to production:

- [ ] Build correct variant (AL or SNF)
- [ ] Upload CRX to Azure with correct MIME type
- [ ] Upload updates.xml with correct MIME type
- [ ] Update updates.xml with actual Azure URLs
- [ ] Configure Chrome Admin Console policy
- [ ] Wait for policy sync (or force reload)
- [ ] Verify at `chrome://policy/` shows Mandatory
- [ ] Create Managed Guest Session
- [ ] Verify Tab Keeper auto-installs
- [ ] Test tab switching functionality
- [ ] Sign out and verify extension persists in new session

---

## 📖 References

- [ExtensionInstallForcesList Policy](https://chromeenterprise.google/policies/#ExtensionInstallForcesList)
- [ExtensionSettings Policy](https://chromeenterprise.google/policies/#ExtensionSettings)
- [Managed Guest Sessions](https://support.google.com/chrome/a/answer/3509957)
- [Chrome Policy List](https://chromeenterprise.google/policies/)

---

**Your Extension ID:** `4nsinwkb7e5khfdund5hlutwfa`  
**Version:** `2.0.0`  
**Variant:** AL or SNF (choose before building)
