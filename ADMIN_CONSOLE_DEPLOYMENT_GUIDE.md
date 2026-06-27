# Tab Keeper - Admin Console Deployment Guide

**Version:** 2.0.3  
**Last Updated:** June 26, 2026

---

## Overview

This guide covers enterprise deployment of Tab Keeper using Chrome Admin Console (Google Workspace) or Microsoft Intune. The extension supports `chrome.storage.managed` for centralized policy management, allowing IT administrators to configure URLs, timers, and credentials without user interaction.

---

## Prerequisites

- Google Workspace Admin Console access **OR** Microsoft Intune admin access
- Extension ID (after Web Store publishing or via forced install)
- Policy configuration template
- Target user groups identified

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Admin Console / Intune                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Group Policy / Configuration Profile                  │  │
│  │  - Primary URL                                         │  │
│  │  - Secondary URL                                       │  │
│  │  - Timer Duration                                      │  │
│  │  - Username (encrypted)                                │  │
│  │  - Password (encrypted)                                │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Chrome Browser (Managed Device)                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  chrome.storage.managed                                │  │
│  │  - Policies applied automatically                      │  │
│  │  - No user configuration required                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Tab Keeper Extension                                  │  │
│  │  - Reads policies on startup                           │  │
│  │  - Auto-launches target tabs                           │  │
│  │  - Manages timer and auto-login                        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Method 1: Google Workspace Admin Console

### Step 1: Get Extension ID

**Option A: From Chrome Web Store (After Publishing)**

1. Publish extension to Chrome Web Store
2. After publishing, go to item details
3. Copy Extension ID (looks like: `abcdefghijklmnop1234567890`)

**Option B: Forced Install Before Publishing**

For testing or internal deployment:

1. Download the extension ZIP
2. Upload to a publicly accessible URL (e.g., company server, S3 bucket)
3. Use the `.crx` update URL format in Admin Console

### Step 2: Configure Extension Policy

1. Log in to [Google Admin Console](https://admin.google.com)
2. Navigate to **Devices** → **Chrome** → **Apps & extensions**
3. Select target organizational unit or group
4. Click **+ Add extension by ID**
5. Enter Extension ID

### Step 3: Configure Managed Storage Policy

Click the extension → **App settings** → **Configure managed storage**

Use this JSON template:

```json
{
  "primaryUrl": {
    "value": "https://10.1.129.207/Arial/#/login",
    "description": "Primary target URL for tab management"
  },
  "secondaryUrl": {
    "value": "https://login.pointclickcare.com/poc/userLogin.xhtml",
    "description": "Secondary URL to monitor and keep open"
  },
  "timerMinutes": {
    "value": 10,
    "description": "Minutes of inactivity before switching back (1-60)"
  },
  "autoLoginEnabled": {
    "value": true,
    "description": "Enable automatic login when tabs are opened"
  },
  "username": {
    "value": "enterprise_user",
    "description": "Username for auto-login (stored encrypted by Chrome)"
  },
  "password": {
    "value": "secure_password",
    "description": "Password for auto-login (stored encrypted by Chrome)"
  }
}
```

### Step 4: Force Install Extension

In App settings:

1. Set **Installation policy** to **Force install**
2. Select target users/groups
3. Click **Save**

### Step 5: Verify Deployment

On a managed device:

1. Open Chrome
2. Navigate to `chrome://policy/`
3. Click **Reload policies**
4. Verify Tab Keeper policies appear under `ExtensionSettings`
5. Navigate to `chrome://extensions/`
6. Confirm Tab Keeper is installed and active

---

## Method 2: Microsoft Intune

### Step 1: Prepare Extension Package

1. Download extension ZIP from Chrome Web Store or build locally
2. Rename `.zip` to `.crx` if needed, or use unpacked format

### Step 2: Create App in Intune

1. Log in to [Microsoft Endpoint Manager](https://endpoint.microsoft.com)
2. Navigate to **Apps** → **All apps** → **Add**
3. Select **App type**: Chrome browser app
4. Click **Select**

### Step 3: Configure App Information

| Field | Value |
|-------|-------|
| **Name** | Tab Keeper |
| **Description** | Enterprise tab management for PointClickCare |
| **Publisher** | BJ |
| **Category** | Productivity |

### Step 4: Configure App Package

**Option A: Chrome Web Store**

- **App source**: Chrome Web Store
- **URL**: `https://chrome.google.com/webstore/detail/<extension-id>`

**Option B: Line-of-Business (Internal)**

- **App source**: Line-of-business app
- Upload `.crx` or `.zip` file
- Specify Extension ID manually

### Step 5: Configure Managed Preferences

Under **Configuration settings**, add managed preferences JSON:

```json
{
  "primaryUrl": "https://10.1.129.207/Arial/#/login",
  "secondaryUrl": "https://login.pointclickcare.com/poc/userLogin.xhtml",
  "timerMinutes": 10,
  "autoLoginEnabled": true,
  "username": "enterprise_user",
  "password": "secure_password"
}
```

### Step 6: Assign to Groups

1. Go to **Assignments**
2. Add required groups (e.g., "Healthcare Staff", "Kiosk Devices")
3. Set **Install intent** to **Required**
4. Click **Next** → **Create**

### Step 7: Monitor Deployment

1. Navigate to **Apps** → **Monitor** → **App install status**
2. Track installation success/failure rates
3. Troubleshoot failed installations

---

## Method 3: Windows Group Policy (ADMX)

### Step 1: Download Chrome ADMX Templates

1. Download from [Chrome Enterprise](https://chromeenterprise.google/browser/download/)
2. Extract ADMX/ADML files
3. Copy to PolicyDefinitions folder:
   - ADMX: `C:\Windows\PolicyDefinitions`
   - ADML: `C:\Windows\PolicyDefinitions\en-US`

### Step 2: Configure Extension Policies

1. Open **Group Policy Management Editor**
2. Navigate to:
   ```
   Computer Configuration → Administrative Templates → 
   Google → Google Chrome → Extensions
   ```

3. **Configure extension list to force-install:**
   - Policy: **Configure the list of force-installed apps and extensions**
   - Value: `<extension_id>;https://clients2.google.com/service/update2/crx`

4. **Configure managed storage:**
   - Policy: **Extension settings**
   - Enter Extension ID
   - Paste managed storage JSON (see template above)

### Step 3: Apply GPO to Target OUs

1. Link GPO to appropriate Organizational Units
2. Run `gpupdate /force` on target machines
3. Verify with `gpresult /r`

---

## Security Considerations

### Credential Storage

- ✅ Credentials stored in Chrome's encrypted storage
- ✅ Managed storage policies are encrypted at rest
- ✅ Credentials never transmitted externally
- ⚠️ Ensure devices are physically secure
- ⚠️ Use dedicated service accounts for shared devices

### Best Practices

1. **Use Service Accounts**: Create dedicated accounts for kiosk/shared device use
2. **Rotate Passwords**: Update credentials periodically via policy
3. **Limit Scope**: Deploy only to necessary devices/users
4. **Audit Logs**: Enable Chrome policy audit logging
5. **Network Security**: Ensure target URLs are accessible from managed network

---

## Troubleshooting

### Issue: Policies Not Applying

**Check:**
```bash
# On Chrome
chrome://policy/
# Click "Reload policies"
# Check for errors
```

**Solutions:**
- Verify device is enrolled in management
- Check network connectivity to policy servers
- Ensure user/device is in target group
- Wait up to 24 hours for policy propagation

### Issue: Extension Not Installing

**Check:**
```bash
chrome://extensions/
# Enable Developer mode
# Check for error messages
```

**Solutions:**
- Verify Extension ID is correct
- Check installation policy scope
- Ensure Chrome version is 88+ (Manifest V3 support)
- Review Admin Console deployment logs

### Issue: Auto-Login Not Working

**Check:**
```javascript
// In DevTools Console
chrome.storage.managed.get(null, console.log);
```

**Solutions:**
- Verify username/password are set in policy
- Check that autoLoginEnabled is true
- Ensure target URL matches login page exactly
- Review content script selectors (may need updates if site changes)

### Issue: Timer Not Starting

**Solutions:**
- Verify timerMinutes is set (1-60 range)
- Check that user navigates away from primary tab
- Restart extension after policy changes
- Clear extension data and reload

---

## Testing Before Production Rollout

### Pilot Group Strategy

1. Create test group (5-10 devices)
2. Deploy policies to test group only
3. Validate functionality on pilot devices
4. Collect feedback from pilot users
5. Refine configuration based on issues
6. Expand to production groups

### Test Checklist

- [ ] Extension installs automatically
- [ ] Policies apply correctly (`chrome://policy/`)
- [ ] Target tabs open on startup
- [ ] Timer switches back after configured duration
- [ ] Auto-login works (if enabled)
- [ ] Closed tabs reopen automatically
- [ ] No errors in `chrome://extensions/` console

---

## Maintenance

### Updating Extension

When new version is published:

1. Update extension in Web Store
2. Chrome auto-updates within 24 hours
3. Force immediate update:
   - Navigate to `chrome://extensions/`
   - Click **Update** button
4. Verify version number incremented

### Updating Policies

To change URLs or credentials:

1. Update policy JSON in Admin Console/Intune
2. Save changes
3. Devices pick up changes within 24 hours
4. Force reload: `chrome://policy/` → **Reload policies**

### Monitoring

Regular checks:

- Weekly: Review deployment reports
- Monthly: Audit credential rotation
- Quarterly: Review extension permissions and functionality
- Annually: Full security review

---

## Support Contacts

**Technical Support:** zantop@protonmail.com  
**Emergency Issues:** Contact IT helpdesk  
**Policy Questions:** See Google Workspace or Intune documentation

---

## Appendix: Complete Policy Template

```json
{
  "primaryUrl": "https://10.1.129.207/Arial/#/login",
  "secondaryUrl": "https://login.pointclickcare.com/poc/userLogin.xhtml",
  "timerMinutes": 10,
  "autoLoginEnabled": true,
  "username": "your_service_account_username",
  "password": "your_service_account_password"
}
```

### Schema Validation

The extension validates against `managed_storage_schema.json`:

```json
{
  "type": "object",
  "properties": {
    "primaryUrl": { "type": "string" },
    "secondaryUrl": { "type": "string" },
    "timerMinutes": { "type": "integer", "minimum": 1, "maximum": 60 },
    "autoLoginEnabled": { "type": "boolean" },
    "username": { "type": "string" },
    "password": { "type": "string" }
  }
}
```

---

**End of Guide**
