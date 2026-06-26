# Tab Keeper - Chrome Extension

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-v2.0.3-blue?style=flat-square)](https://chromewebstore.google.com/detail/tab-keeper/ldjdfkbdllhdbpmpegiaelmabmpnhcoi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Enterprise Ready](https://img.shields.io/badge/Enterprise-Ready-green?style=flat-square)](ENTERPRISE_DEPLOYMENT.md)
[![Privacy Policy](https://img.shields.io/badge/Privacy-Policy-lightgrey?style=flat-square)](PRIVACY.md)

---

## Latest Release: v2.0.3 - Chrome Web Store Enterprise Edition

**📅 Released:** June 26, 2026  
**🚀 Chrome Web Store:** 🔄 Ready for Submission (Private - Domain Only)  
**🔒 Security:** No hardcoded credentials - Enterprise policy injection

### ✨ What's New in v2.0.3

| Feature | Description |
|---------|-------------|
| 🔒 **Enterprise Security** | Removed all hardcoded credentials - uses chrome.storage.managed |
| 🏢 **Web Store Compliant** | Ready for Chrome Web Store private domain-only publishing |
| 📱 **PWA Wrapper** | Included PWA for ChromeOS kiosk deployments |
| 📄 **Privacy Policy** | Complete privacy policy for Web Store submission |
| ⚙️ **Managed Config** | All settings via enterprise policy or user configuration |

**Major Changes:**
This version is specifically built for Chrome Web Store enterprise deployment:
- ✅ No hardcoded credentials (security compliance)
- ✅ Privacy policy included (Web Store requirement)
- ✅ Manifest V3 compliant (no key/update_url fields)
- ✅ Enterprise policy support via chrome.storage.managed
- ✅ PWA wrapper for ChromeOS kiosk mode

---

## 📖 Overview

**Tab Keeper** keeps your important tabs alive and accessible. Perfect for kiosks, monitoring stations, and enterprise deployments where specific web apps need to stay open and logged in.

### 🎯 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  ⭐ PRIMARY TAB (Safe Zone)                                 │
│  └─ Timer stops here - your "home base"                    │
│                                                             │
│  🔹 SECONDARY TAB (Monitored)                               │
│  └─ Auto-reopens if closed, but timer still runs           │
│                                                             │
│  ⏰ SMART TIMER (1-60 min)                                  │
│  └─ Away from primary? Timer starts → Auto-switch back     │
│                                                             │
│  🔄 AUTO-REOPEN                                             │
│  └─ Closed a target tab? We reopen it automatically        │
│                                                             │
│  🔐 AUTO-LOGIN                                              │
│  └─ Credentials auto-filled on login pages                 │
└─────────────────────────────────────────────────────────────┘
```

### 🏢 Enterprise Ready

Built for Chrome Enterprise environments:
- **Managed Guest Sessions**: Policies survive restarts & cache clears
- **Admin Console Deployment**: Force-install + pre-configure
- **Centralized Management**: Update all devices from one place
- **No User Configuration Needed**: Set it once, deploy everywhere

👉 See [ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md](ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md) for complete deployment guide.

---

## ✨ Features

| Icon | Feature | Description |
|------|---------|-------------|
| ⭐ | **Primary Tab Safe Zone** | Timer only stops on primary URL - your anchor tab |
| 🔹 | **Secondary Monitoring** | Optional 2nd tab monitored & auto-reopened |
| 🔄 | **Auto-Reopen** | Target tabs reopen automatically if closed |
| ⏰ | **Smart Timer** | Configurable 1-60 min inactivity timer |
| 🔐 | **Auto-Login** | Credentials auto-filled on login detection |
| 📊 | **Status Popup** | Real-time status & countdown display |
| 🏢 | **Enterprise Policies** | Admin Console deployment & management |
| 💾 | **Persistent Config** | Survives cache clears & restarts (managed) |

---

## Installation

### Option 1: Chrome Web Store (Production - Recommended)

**For Enterprise Customers:**

1. Visit Chrome Web Store (private domain-only listing)
2. Extension ID: `ldjdfkbdllhdbpmpegiaelmabmpnhcoi`
3. Click **Add to Chrome**
4. Pin extension to toolbar for easy access

**Note:** This is a private enterprise deployment. Contact your IT administrator for access.

### Option 2: Load Unpacked (Development)

1. Clone this repo or download the ZIP
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → Select this folder
5. Extension icon appears in toolbar

### Option 3: Enterprise Deployment

See [ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md](ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md) for:
- Admin Console policy configuration
- Force-install via GPO/MDM
- Pre-configured settings deployment
- Managed storage schema

---

## 🔒 Security & Privacy

### No Hardcoded Credentials

v2.0.3 removes all hardcoded credentials for security compliance:

- ✅ **Enterprise Policy Injection** - Credentials via `chrome.storage.managed`
- ✅ **User Configuration** - Optional manual setup via options page
- ✅ **No External Transmission** - All data stays on device
- ✅ **Encrypted Storage** - Chrome's built-in encryption

See [PRIVACY.md](PRIVACY.md) for complete privacy policy.

### Permissions Explained

| Permission | Why We Need It |
|------------|----------------|
| `tabs` | Monitor and manage target tabs |
| `storage` | Store configuration and credentials |
| `activeTab` | Temporary access for auto-login |
| `scripting` | Inject content scripts for form filling |
| `alarms` | Periodic tab monitoring without battery drain |

**We do NOT request:** `history`, `cookies`, `webRequest`, `downloads`, `bookmarks`

---

## 🛠️ Development

### Build & Package

```bash
# Package for distribution
# Creates dist/tab-keeper-v2.0.3.zip
```

### Testing Checklist

- [ ] Primary tab detection works correctly
- [ ] Timer starts when switching away from primary
- [ ] Timer resets on activity (non-primary tabs only)
- [ ] Auto-switch back fires after timer expires
- [ ] No duplicate tabs created on switch-back
- [ ] Auto-reopen works when target tab is closed
- [ ] Auto-login fills credentials correctly
- [ ] Enterprise policies load from managed storage
- [ ] Fallback to local storage when no policies

---

## 📋 Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| 2.0.3 | Jun 26, 2026 | 🔒 Enterprise security, Web Store compliant, PWA wrapper |
| 1.0.18 | Jun 18, 2026 | 🐛 Fixed duplicate tab creation bug |
| 1.0.17 | Jun 18, 2026 | 🎨 UI refresh, auto-login fix |
| 1.0.16 | Jun 17, 2026 | 🏢 Enterprise support, dual-tab monitoring |
| 1.0.15 | Jun 17, 2026 | Initial Chrome Store release |

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file.

## 🙋 Support

- **Issues:** https://github.com/zant0p/tab-keeper/issues
- **Email:** zantop@protonmail.com
- **Documentation:** See `docs/` folder for detailed guides
- **Privacy Policy:** [PRIVACY.md](PRIVACY.md)
- **Enterprise Deployment:** [ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md](ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md)

---

## 📥 Downloads

- **GitHub Releases:** https://github.com/zant0p/tab-keeper/releases/latest
- **Chrome Web Store:** Coming soon (Private domain-only deployment)
- **FTP Server:** http://192.168.1.123:8765/tab-keeper/latest/

---

*Last Updated: June 26, 2026*
