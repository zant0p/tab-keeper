# Tab Keeper - Enterprise Deployment Guide

## Overview

Tab Keeper v1.0.16+ supports Chrome Enterprise managed storage, allowing IT administrators to deploy and configure the extension across multiple devices via Chrome Admin Console.

## Features

- **Primary + Secondary Tab Monitoring**: Keep up to 2 websites alive simultaneously
- **Auto-Reopen**: Automatically reopens target tabs if closed
- **Smart Timer**: Only primary tab is a "safe zone" - timer runs on all other tabs
- **Enterprise Policy Support**: Configure via Chrome Admin Console for persistence
- **Auto-Login**: Optional credential management for automatic sign-in

## Installation Methods

### Method 1: Chrome Web Store (Recommended for most users)

1. Install from [Chrome Web Store](https://chrome.google.com/webstore)
2. Configure via Settings page

### Method 2: Force Install via Enterprise Policy

For managed environments (kiosks, shared devices):

#### Step 1: Create Policy Configuration

Create a JSON policy file or configure via Chrome Admin Console:

```json
{
  "ExtensionInstallForcesList": [
    {
      "app_id": "YOUR_EXTENSION_ID_HERE",
      "update_url": "https://clients2.google.com/service/update2/crx"
    }
  ],
  "ExtensionSettings": {
    "YOUR_EXTENSION_ID_HERE": {
      "installation_mode": "force_installed",
      "update_url": "https://clients2.google.com/service/update2/crx"
    }
  }
}
```

**Note**: Replace `YOUR_EXTENSION_ID_HERE` with the actual extension ID after publishing to Chrome Web Store.

#### Step 2: Configure Extension Policies

Set the following policies to pre-configure Tab Keeper:

```json
{
  "primaryUrl": "https://example.com/dashboard",
  "secondaryUrl": "https://example.com/reports",
  "timerMinutes": 10,
  "autoLoginEnabled": true,
  "username": "kiosk-user@example.com",
  "password": "secure-password-here"
}
```

These values are stored in `chrome.storage.managed` and take precedence over local settings.

### Method 3: Manual Installation (Development/Testing)

1. Download extension ZIP
2. Extract to a folder
3. Go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the folder

## Policy Reference

| Policy | Type | Description | Required |
|--------|------|-------------|----------|
| `primaryUrl` | string | Primary target URL (always switches back here) | Yes (if enabled) |
| `secondaryUrl` | string | Secondary target URL to monitor | No |
| `timerMinutes` | integer | Minutes before switching back (1-60) | No (default: 10) |
| `autoLoginEnabled` | boolean | Enable auto-login feature | No (default: true) |
| `username` | string | Username for auto-login | No |
| `password` | string | Password for auto-login (encrypted by Chrome) | No |

## Persistence in Managed Guest Sessions

**Important**: Managed Guest Sessions are designed to be ephemeral. For true persistence:

1. **Use Enterprise Policies**: Configure all settings via Admin Console
   - Settings are re-applied every session
   - Survives cache clears and restarts
   - No user interaction required

2. **Avoid Local Storage**: Local settings may be cleared in guest sessions
   - Managed policies override local settings
   - Use `chrome.storage.managed` for critical config

3. **Kiosk Mode Considerations**:
   - Standard kiosk mode only allows single tab
   - Use Managed Guest Session with force-installed extension instead
   - Configure policies at the organizational unit level

## Testing Enterprise Deployment

### Verify Policy Application

1. Open `chrome://management/` to confirm device is managed
2. Open `chrome://policy/` and click "Reload policies"
3. Look for Tab Keeper policies in the list
4. Open extension settings - managed fields will be disabled with blue notice

### Debug Storage

Open DevTools on the extension's background page:

1. Go to `chrome://extensions/`
2. Find Tab Keeper, click "Service Worker" under "Inspect views"
3. In Console, run:
   ```javascript
   chrome.storage.managed.get(null, console.log);
   chrome.storage.local.get(null, console.log);
   ```

## Troubleshooting

### Settings not persisting
- Check if device is in Managed Guest Session mode
- Verify policies are applied at correct organizational level
- Ensure `ExtensionInstallForcesList` is configured correctly

### Auto-login not working
- Check credentials in policy configuration
- Verify target site doesn't have additional security (2FA, CAPTCHA)
- Review background script logs for errors

### Extension not installing
- Confirm extension ID matches Chrome Web Store listing
- Check `ExtensionInstallForcesList` syntax
- Verify network allows access to Chrome Web Store

## Security Considerations

- **Credentials**: Stored encrypted by Chrome, not transmitted anywhere
- **Public Repo**: This repository contains no credentials or sensitive data
- **Policy Management**: Only admins with Console access can modify policies
- **Audit Logs**: Monitor policy changes via Admin Console audit logs

## Support

For issues or questions:
- GitHub Issues: https://github.com/zant0p/tab-keeper/issues
- Chrome Enterprise Docs: https://support.google.com/chrome/a/answer/7514525
