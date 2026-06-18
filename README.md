# Tab Keeper - Chrome Extension

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-v1.0.18-blue?style=flat-square)](https://chromewebstore.google.com/detail/tab-keeper/jlaiolmcjkaipeccefpmmliacjbmeadf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Enterprise Ready](https://img.shields.io/badge/Enterprise-Ready-green?style=flat-square)](ENTERPRISE_DEPLOYMENT.md)

## Latest Release: v1.0.18

**📅 Released:** June 18, 2026  
**🚀 Chrome Web Store:** 🔄 Ready for Submission

### ✨ What's New in v1.0.18

| Feature | Description |
|---------|-------------|
| 🐛 **Duplicate Tab Fix** | Eliminated primary tab duplication when timer ends |
| 🎯 **Exact URL Matching** | Primary tabs use strict matching (no domain-level fallback) |
| ✅ **Smart Reopen Check** | Verifies tab doesn't exist before auto-reopening |
| 🔒 **Stricter Safe Zone** | Only exact/base URL matches count as primary (prevents false positives) |

**Bug Fixed:**
Previously, when the timer fired, the extension could create duplicate primary tabs due to:
- Domain-level URL matching fallback (matched any tab on same domain)
- No duplicate check before reopening closed tabs
- Race condition in tab switch detection

v1.0.18 fixes all three issues with exact matching and duplicate prevention.

---

## Previous: v1.0.17 - UI/UX Refresh

**📅 Released:** June 18, 2026

| Feature | Description |
|---------|-------------|
| 🎨 **Modern UI/UX** | Beautiful gradient purple theme with glassmorphism effects |
| 🖼️ **New Logo** | Fresh gradient design with tab/bookmark motif |
| 🔐 **Auto-Login Fix** | Properly clicks submit button (triggers JS validation) |
| 🎯 **Primary-Only Login** | Auto-login only on primary URL, never secondary |
| 💫 **Improved UX** | Redesigned popup and options page with modern styling |

### Download
- **Chrome Web Store:** https://chromewebstore.google.com/detail/tab-keeper/jlaiolmcjkaipeccefpmmliacjbmeadf
- **GitHub Releases:** https://github.com/zant0p/tab-keeper/releases/latest

---

## Previous: v1.0.16 - Enterprise Release

**📅 Released:** June 17, 2026

| Feature | Description |
|---------|-------------|
| 🏢 **Enterprise Support** | Chrome Admin Console policy configuration |
| 🎯 **Dual Tab Monitoring** | Primary + Secondary target URLs |
| 🔄 **Auto-Reopen** | Automatically reopens target tabs if closed |
| ⭐ **Smart Timer** | Only primary tab is "safe zone" - timer runs everywhere else |
| 💾 **Persistent Storage** | Enterprise policies survive cache clears & restarts |
| ✅ **Backward Compatible** | All previous v1.0.15 features retained |

### Download
- **Chrome Web Store:** https://chromewebstore.google.com/detail/tab-keeper/jlaiolmcjkaipeccefpmmliacjbmeadf
- **GitHub Releases:** https://github.com/zant0p/tab-keeper/releases/latest

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

👉 See [ENTERPRISE_DEPLOYMENT.md](ENTERPRISE_DEPLOYMENT.md) for complete deployment guide.

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

## Installation

### Option 1: Load Unpacked (Development)

1. Clone this repo or download the ZIP
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → Select this folder
5. Extension icon appears in toolbar

### Option 2: Chrome Web Store (Production)

1. Visit: https://chromewebstore.google.com/detail/tab-keeper/jlaiolmcjkaipeccefpmmliacjbmeadf
2. Click **Add to Chrome**
3. Pin extension to toolbar for easy access

### Option 3: Enterprise Deployment

See [ENTERPRISE_DEPLOYMENT.md](ENTERPRISE_DEPLOYMENT.md) for:
- Admin Console policy configuration
- Force-install via GPO/MDM
- Pre-configured settings deployment
- Managed storage schema

---

## 🛠️ Development

### Build & Package

```bash
# Install dependencies (if any)
npm install

# Package for distribution
npm run build   # Creates dist/tab-keeper-v1.0.18.zip
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
| 1.0.18 | Jun 18, 2026 | 🐛 Fixed duplicate tab creation bug |
| 1.0.17 | Jun 18, 2026 | 🎨 UI refresh, auto-login fix |
| 1.0.16 | Jun 17, 2026 | 🏢 Enterprise support, dual-tab monitoring |
| 1.0.15 | Jun 17, 2026 | Initial Chrome Store release |

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file.

## 🙋 Support

- **Issues:** https://github.com/zant0p/tab-keeper/issues
- **Email:** [Your contact here]
- **Documentation:** See `docs/` folder for detailed guides
