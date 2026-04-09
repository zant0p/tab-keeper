# Tab Keeper - Chrome Extension

Keeps a designated tab active, automatically switches back after inactivity, and auto-logins when needed.

## Features

- **🎯 Target Tab Enforcement**: Monitors your active tab and switches back to the designated URL after 10 minutes (configurable)
- **🔐 Auto-Login**: Automatically fills username/password and submits when login page is detected
- **⏱️ Configurable Timer**: Set return timer from 1-60 minutes
- **📊 Status Popup**: Quick view of current status and settings
- **🧪 Test Mode**: Test auto-login functionality before deploying

## Installation

### Option 1: Load Unpacked (Development)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `tab-keeper` folder (wherever you cloned/downloaded it)
5. Extension icon should appear in toolbar

### Option 2: Package as CRX (For Distribution)

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Pack extension**
4. Set extension root to the `tab-keeper` folder
5. Click **Pack Extension**
6. Install the generated `.crx` file

## Configuration

1. Right-click the extension icon → **Options**
2. Or click the icon → **⚙️ Settings**

### Required Settings

| Setting | Description |
|---------|-------------|
| **Enable Tab Keeper** | Toggle the extension on/off |
| **Target URL** | The URL to keep active (e.g., `https://example.com/dashboard`) |
| **Return Timer** | Minutes before switching back (default: 10) |
| **Username** | Auto-login username/email |
| **Password** | Auto-login password |

## How It Works

1. **Monitor**: Extension watches which tab is active
2. **Timer Start**: When you switch away from target tab, 10-min timer begins
3. **Auto-Switch**: When timer expires, extension switches back to target tab
4. **Login Check**: Content script detects login pages and auto-fills credentials
5. **Repeat**: Continues monitoring in background

## Security Notes

⚠️ **Credentials are stored locally** in Chrome's storage API:
- Not synced to Google account
- Not transmitted anywhere
- Accessible only by this extension
- Stored in plain text (Chrome storage is not encrypted)

**Recommendations:**
- Use a dedicated Chrome profile for kiosk/monitoring use
- Don't use this with highly sensitive accounts
- Clear credentials when no longer needed

## Files

```
tab-keeper/
├── manifest.json      # Extension manifest (v3)
├── background.js      # Service worker - tab monitoring & timer
├── content.js         # Content script - login detection
├── popup.html         # Quick status popup
├── popup.js           # Popup logic
├── options.html       # Settings page
├── options.js         # Settings logic
└── README.md          # This file
```

## Troubleshooting

### Extension not switching back
- Check that Target URL is correctly configured
- Ensure extension is enabled in Options
- Check Chrome's extension permissions (tabs, storage, alarms)

### Auto-login not working
- Verify username/password are saved in Options
- Some sites use custom login forms - may need site-specific selectors
- Check browser console for errors (F12 → Console)

### Timer not starting
- Extension only tracks active tab in focused window
- Switching windows may not trigger timer immediately
- Check `chrome://extensions/` → Tab Keeper → Service Worker for logs

## Permissions Explained

| Permission | Why It's Needed |
|------------|-----------------|
| `tabs` | Monitor and switch between tabs |
| `storage` | Save settings and credentials |
| `alarms` | Periodic background checks |
| `activeTab` | Access current tab for login detection |
| `<all_urls>` | Inject login script on any site |

## Version History

- **1.0** (2026-04-08): Initial release
  - Tab monitoring with 10-min timer
  - Auto-login with credential storage
  - Configurable settings page
  - Status popup

## License

MIT - Feel free to modify and distribute.
