# Tab Keeper - ChromeOS Kiosk Solution

[![Version](https://img.shields.io/badge/version-v2.0.4-blue?style=flat-square)](https://github.com/zant0p/tab-keeper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Chrome Web Store Ready](https://img.shields.io/badge/Web_Store-Ready-green?style=flat-square)](https://chromewebstore.google.com)

## Latest Release: v2.0.4

**📅 Released:** June 29, 2026  
**🚀 Status:** Ready for Chrome Web Store Submission  
**📦 Branch:** `dev` (submit from dev, merge to main after approval)

### ✨ What's New in v2.0.4

| Feature | Description |
|---------|-------------|
| 🏢 **PWA + Extension Architecture** | Minimal PWA auto-launches tabs, extension manages them |
| 🔐 **Auto-Detect Variant** | AL/SNF variant detected from URL automatically |
| 🎯 **Default Credentials** | Auto-populates credentials based on variant |
| 🐛 **Missing pwa-install.js** | Added stub file for options page |
| 📊 **Enhanced Debugging** | Detailed logging for autofill troubleshooting |

**Architecture Change:**
- PWA now minimal - only opens primary + secondary tabs on load
- Extension handles all management: timer, autofill, recovery, monitoring
- No duplicate tabs - clean separation of concerns
- Settings configured via Chrome Admin Console (no UI needed)

---

## 📖 Overview

**Tab Keeper** is a ChromeOS kiosk solution that keeps important tabs alive, logged in, and accessible. Perfect for healthcare facilities, monitoring stations, and enterprise deployments.

### 🎯 How It Works

```
ChromeOS Kiosk Boot
    ↓
PWA Auto-Launches (minimal launcher)
    ↓
Opens Primary + Secondary Tabs
    ↓
Extension Monitors & Manages:
├─ ⏰ Smart Timer (switches back on inactivity)
├─ 🔐 Auto-Login (credentials from Admin Console)
├─ 🔄 Tab Recovery (reopens if closed)
└─ 📊 Activity Monitoring (tracks user interaction)
```

### 🏢 Enterprise Deployment

Built for Chrome Enterprise environments:
- **Chrome Admin Console**: Push credentials via managed storage
- **Kiosk Mode**: Auto-launch PWA on device boot
- **No Hardcoded Credentials**: All config via enterprise policies
- **Web Store Compliant**: Zero credentials in extension code

👉 See [CHROME-KIOSK-DEPLOYMENT-STRATEGY.md](/root/.openclaw/shared-files/tab-keeper/CHROME-KIOSK-DEPLOYMENT-STRATEGY.md) for complete deployment guide.

---

## ✨ Features

| Icon | Feature | Description |
|------|---------|-------------|
| 🚀 | **PWA Auto-Launch** | Minimal PWA opens target tabs on kiosk boot |
| ⭐ | **Primary Tab Safe Zone** | Timer stops only on primary URL |
| 🔹 | **Secondary Monitoring** | Optional 2nd tab monitored & auto-reopened |
| 🔄 | **Auto-Recovery** | Target tabs reopen automatically if closed |
| ⏰ | **Smart Timer** | Configurable 1-60 min inactivity timer |
| 🔐 | **Auto-Login** | Credentials injected via Admin Console policies |
| 🏢 | **Managed Storage** | Enterprise policies via chrome.storage.managed |
| 📊 | **Variant Detection** | AL/SNF auto-detected from URL pattern |

---

## Architecture

### Components

1. **PWA** (`pwa/`)
   - Minimal launcher page
   - Auto-opens primary + secondary tabs on load
   - No settings UI (configured via Admin Console)

2. **Extension** (root files)
   - Background service worker (`background.js`)
   - Content script for autofill (`content.js`)
   - Popup for status display (`popup.html`)
   - Managed storage schema (`managed_storage_schema.json`)

3. **Chrome Admin Console**
   - Pushes credentials via managed storage
   - Configures URLs, timer, auto-login
   - Force-installs extension to kiosks

### File Structure

```
tab-keeper/
├── manifest.json              # Extension manifest v3
├── background.js              # Service worker - tab management
├── content.js                 # Content script - autofill
├── popup.html/js              # Status popup
├── options.html/js            # Settings page (reference only)
├── managed_storage_schema.json # Enterprise policy schema
├── pwa/
│   ├── index.html             # Minimal PWA launcher
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
└── icons/                     # Extension icons
```

---

## Installation

### For Development

```bash
# Clone repository
git clone https://github.com/zant0p/tab-keeper.git
cd tab-keeper

# Load unpacked extension
1. Open Chrome → chrome://extensions/
2. Enable Developer mode
3. Click "Load unpacked"
4. Select tab-keeper folder
```

### For Production (Chrome Web Store)

1. Submit `dev` branch to Chrome Web Store
2. Wait for approval (~1-3 business days)
3. Deploy via Chrome Admin Console to kiosks

### For Enterprise Deployment

See [ENTERPRISE_DEPLOYMENT.md](/root/.openclaw/shared-files/tab-keeper/ENTERPRISE_DEPLOYMENT.md):
- Admin Console policy configuration
- Credential injection via managed storage
- Kiosk mode setup
- URL allowlisting

---

## Configuration

### Admin Console Managed Storage Policy

```json
{
  "primaryUrl": "https://10.1.129.207/Arial/#/login",
  "secondaryUrl": "https://login.pointclickcare.com/poc/userLogin.xhtml",
  "timerMinutes": 5,
  "username": "alstaff",
  "password": "***"
}
```

**For SNF Variant:**
```json
{
  "primaryUrl": "https://10.1.129.207/SNF/#/login",
  "username": "snf",
  "password": "***"
}
```

> ⚠️ **Replace credentials with actual values for your facility.**

### Additional Policies (Optional)

```json
{
  "PopupsAllowedForUrls": [
    "https://10.1.129.207/*",
    "https://login.pointclickcare.com/*"
  ]
}
```

---

## Development

### Testing Checklist

- [ ] PWA auto-launches tabs on load
- [ ] Extension detects existing tabs (no duplicates)
- [ ] Autofill works with managed credentials
- [ ] Timer starts when away from primary
- [ ] Auto-switch back fires after timer expires
- [ ] Tab recovery works when closed
- [ ] Variant detection works (AL vs SNF)
- [ ] Admin Console policies apply correctly

### Debug Logging

Extension logs detailed info to browser console:
- `[Tab Keeper]` - General extension logs
- `[Auto-Login]` - Credential injection logs
- `[Options]` - Settings page logs

Access via `chrome://extensions/` → Tab Keeper → "service worker" link → Inspect

---

## Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| **2.0.4** | Jun 29, 2026 | 🏢 PWA+Extension architecture, auto-detect variant |
| 2.0.3 | Jun 27, 2026 | Kiosk auto-launch improvements |
| 2.0.2 | Jun 26, 2026 | Breach popup handler fixes |
| 2.0.1 | Jun 25, 2026 | Kiosk mode support |
| 2.0.0 | Jun 22, 2026 | Manifest V3 migration |
| 1.0.x | Jun 2026 | Initial releases |

---

## Security

✅ **Web Store Compliant:**
- No hardcoded credentials in code
- Credentials via chrome.storage.managed only
- All permissions justified
- Privacy policy included

✅ **Enterprise Secure:**
- Credentials encrypted by Chrome OS
- Admin Console audit logging
- Policy-based access control
- No credentials in public repo

---

## Support

- **GitHub Issues:** https://github.com/zant0p/tab-keeper/issues
- **Documentation:** `/root/.openclaw/shared-files/tab-keeper/`
- **Deployment Guide:** CHROME-KIOSK-DEPLOYMENT-STRATEGY.md

---

## License

MIT License - See [LICENSE](LICENSE) file.

---

**Last Updated:** June 29, 2026  
**Maintainer:** BJ (@zant0p)  
**Status:** Ready for Chrome Web Store Submission ✅
