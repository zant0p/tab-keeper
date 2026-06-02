# Tab Keeper v1.0.13 - Clean Release

## Changes in This Version

### Removed Features
- **Removed all password popup dismissal code** - This code was removed to comply with Google Chrome Web Store submission requirements. The extension no longer attempts to automatically dismiss Chrome's "Change your password" popup.

### Core Functionality (Unchanged)
✅ **Inactivity Timer** - Switches back to target tab after 10 minutes of inactivity on non-target tabs
✅ **Auto-Login** - Automatically fills username and password when login page is detected
✅ **Persistent Settings** - Remembers target URL, username, password across browser restarts
✅ **Timer Persistence** - Uses chrome.alarms API for reliable timer that survives service worker restarts
✅ **Activity Tracking** - Monitors mouse, keyboard, scroll, and touch activity on non-target tabs

## Installation

**Download:** http://192.168.1.123:8080/downloads/tab-keeper/tab-keeper-v1.0.13-clean.zip

1. Go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Remove the old Tab Keeper extension
4. Click "Load unpacked"
5. Select the `/home/zantop/.openclaw/workspace/tab-keeper-review` folder
6. Configure your target URL, username, and password

## Important Note

**Chrome's "Change your password" popup:** This popup will appear after login if you haven't changed your password recently. The extension will NOT dismiss it automatically anymore. 

**Solution:** Change your password on the target website to prevent this popup from appearing, or manually close it when it appears.

## Files Modified

- `background.js` - Removed popup dismissal tracking and handlers
- `content.js` - Removed `dismissPasswordPopup()` function and related message handlers
- `popup.html` - Removed manual dismiss button
- `popup.js` - Removed dismiss button event handler

## Clean Codebase

This version contains only the core Tab Keeper functionality:
- No experimental features
- No unused code paths
- Ready for Chrome Web Store submission

## Testing Checklist

- [ ] Extension switches back after inactivity timer expires
- [ ] Auto-login works when credentials are saved
- [ ] Timer shows accurate countdown in popup
- [ ] Extension remembers settings after Chrome restart
- [ ] Opening/closing popup doesn't affect timer timing
