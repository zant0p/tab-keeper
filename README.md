# Tab Keeper - Chrome Extension


## Latest Release: v1.0.15

**Released:** June 2, 2026

### What's New
- ✅ Fixed auto-login to only trigger on target website (not any login page)
- ✅ Updated contact and support email
- ✅ Cleaned up debug code for Chrome Web Store submission
- ✅ Improved timer reliability with Chrome Alarms API

### Download
- **GitHub Releases:** https://github.com/zant0p/tab-keeper/releases/latest
- **Chrome Web Store:** Pending submission

---



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

### v1.0.15 (June 2, 2026) - Production Release
- ✅ Fixed auto-login to only trigger on target website
- ✅ Updated contact email to zantop@protonmail.com
- ✅ Removed experimental code for Chrome Web Store compliance
- ✅ Fixed GitHub Actions build workflow
- ✅ Improved timer reliability with Chrome Alarms API

### v1.0.5 (May 27, 2026)
- Fixed timer persistence issues
- Improved activity tracking

### v1.0.4 (May 27, 2026)
- Added debug logging for tab switching

### v1.0.3 (May 27, 2026)
- Fixed inconsistent auto-login behavior

### v1.0.2 (May 27, 2026)
- Added persistent timer across browser restarts

### v1.0.1 (May 27, 2026)
- Bug fixes for auto-login timing

### v1.0.0 (April 8, 2026) - Initial Release
- Tab monitoring with configurable timer
- Auto-login with credential storage
- Settings page and status popup

## Support & Contact

**Email:** zantop@protonmail.com  
**GitHub:** https://github.com/zant0p/tab-keeper  
**Issues:** https://github.com/zant0p/tab-keeper/issues

For bugs, feature requests, or questions, please open a GitHub issue or contact via email.

---

## License

MIT - Feel free to modify and distribute.
