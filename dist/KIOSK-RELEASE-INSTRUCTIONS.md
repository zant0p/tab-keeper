# Tab Keeper v2.0.1-kiosk Release Instructions

## ✅ Already Completed

- [x] Manifest updated with kiosk flags (`kiosk_enabled`, `kiosk_needed`)
- [x] Version bumped to `2.0.1-kiosk`
- [x] Extension packaged: `dist/tab-keeper-2.0.1-kiosk.zip`
- [x] Updates.xml configured
- [x] Git tag created: `v2.0.1-kiosk`
- [x] Pushed to GitHub main branch

## 📋 Manual Steps to Complete Release

### Step 1: Create GitHub Release

1. Go to: https://github.com/zant0p/tab-keeper/releases/new
2. Tag version: `v2.0.1-kiosk` (already pushed)
3. Target: `main`
4. Release title: `Tab Keeper v2.0.1-kiosk`
5. Description:

```markdown
ChromeOS Kiosk Mode Support

## Changes
- Added kiosk_enabled and kiosk_needed flags to manifest.json
- ChromeOS Single App Kiosk compatible
- All enterprise features retained (managed storage, auto-login, tab monitoring)

## Installation
1. Upload tab-keeper-2.0.1-kiosk.zip to Chrome Admin Console
2. Configure Kiosk policies for your ChromeOS device OU
3. Powerwash and re-enroll device
4. Device boots directly into Tab Keeper
```

6. **Upload files:**
   - `dist/tab-keeper-2.0.1-kiosk.zip`
   - `dist/updates.xml`
7. Click "Publish release"

### Step 2: Chrome Admin Console Setup

1. Go to https://admin.google.com
2. Navigate to: **Devices → Chrome → Apps & extensions → Kiosk**
3. Select your ChromeOS device organizational unit
4. Click **"Kiosk enabled apps"** → **"+" Add**
5. Enter extension ID: `4nsinwkb7e5khfdund5hlutwfa`
6. Configure custom policy JSON:

```json
{
  "ExtensionInstallAllowlist": ["4nsinwkb7e5khfdund5hlutwfa"],
  "KioskEnabledApps": ["4nsinwkb7e5khfdund5hlutwfa"],
  "ExtensionInstallForcesList": [
    {
      "app_id": "4nsinwkb7e5khfdund5hlutwfa",
      "update_url": "https://github.com/zant0p/tab-keeper/releases/download/v2.0.1-kiosk/updates.xml"
    }
  ],
  "ExtensionSettings": {
    "4nsinwkb7e5khfdund5hlutwfa": {
      "installation_mode": "force_installed",
      "update_url": "https://github.com/zant0p/tab-keeper/releases/download/v2.0.1-kiosk/updates.xml"
    }
  }
}
```

### Step 3: Deploy to ChromeOS Device

1. **Powerwash the device** (if previously configured):
   - Sign out
   - Press `Ctrl + Alt + Shift + R`
   - Select "Powerwash" → "Restart"
   
2. **Re-enroll in Chrome Enterprise**:
   - At welcome screen, press `Ctrl + Alt + E`
   - Follow enrollment prompts

3. **Wait for policies to apply** (5-10 minutes)

4. **Device should boot directly into Tab Keeper**

## 🔍 Verify Deployment

On the ChromeOS kiosk device:

1. Open `chrome://management/` - should show "This device is managed by..."
2. Open `chrome://policy/` - click "Reload policies"
3. Verify Tab Keeper extension is listed
4. Extension should auto-launch in kiosk mode

## 📝 Extension ID Reference

- **Extension ID**: `4nsinwkb7e5khfdund5hlutwfa`
- **Derived from**: `tab-keeper.pem` (your private key)
- **Important**: This ID is tied to your key pair - do not lose `tab-keeper.pem`!

## Troubleshooting

### Device doesn't boot into kiosk app
- Verify policies applied: `chrome://policy/`
- Check kiosk app is enabled: `chrome://kiosk/`
- Ensure device OU has correct policies

### Extension not installing
- Confirm extension ID matches: `4nsinwkb7e5khfdund5hlutwfa`
- Check network allows GitHub releases access
- Verify updates.xml is accessible from device

### Settings not persisting
- Use managed policies, not local storage
- Policies override local settings automatically
- Check `chrome.storage.managed` in DevTools

---

For more details, see `ENTERPRISE_DEPLOYMENT.md`
