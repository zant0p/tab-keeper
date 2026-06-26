# Tab Keeper Privacy Policy

**Last Updated:** June 26, 2026  
**Version:** 2.0.3

---

## Overview

Tab Keeper is a Chrome extension designed for enterprise and healthcare facility deployments. This privacy policy applies to all versions of Tab Keeper distributed through the Chrome Web Store (including private domain-only releases) and GitHub.

**Extension ID:** `ldjdfkbdllhdbpmpegiaelmabmpnhcoi` (Chrome Web Store)  
**Publisher:** BJ (zant0p)  
**Contact:** zantop@protonmail.com

---

## Data Collection

### What We DO NOT Collect

Tab Keeper **does NOT collect, store, or transmit** any of the following:

- ❌ **No User Data** - We do not collect any personally identifiable information
- ❌ **No Browsing History** - We do not track or log your browsing activity
- ❌ **No Analytics** - No tracking pixels, analytics services, or telemetry
- ❌ **No External Transmission** - All data stays on your device
- ❌ **No Third-Party Sharing** - We do not share data with any third parties
- ❌ **No Credentials Storage** - Login credentials are stored ONLY via enterprise policy (`chrome.storage.managed`) or local browser storage

### What We DO Access (Temporarily)

To provide tab management functionality, TabKeeper temporarily accesses:

| Data Type | Purpose | Storage |
|-----------|---------|---------|
| **Tab URLs** | Detect if tabs match configured primary/secondary targets | Not stored - checked in real-time only |
| **Tab IDs** | Track which tabs to monitor and refocus | Not persisted - runtime memory only |
| **Login Credentials** | Auto-fill login forms on target websites | Stored via `chrome.storage.managed` (enterprise policy) or `chrome.storage.local` (user-configured) |

---

## How Credentials Are Handled

### Enterprise Deployments (Recommended)

For enterprise customers using Chrome Admin Console or Group Policy:

1. **Credentials are injected** via `chrome.storage.managed` policy
2. **Stored locally** in browser's managed storage area
3. **Never transmitted** to external servers
4. **Controlled by** your organization's IT administrators
5. **Cleared when** policy is removed or device is wiped

### Individual/User Configuration

For non-enterprise users who configure credentials manually:

1. **Credentials stored** in `chrome.storage.local` (encrypted by Chrome)
2. **Never transmitted** to external servers
3. **Cleared when** extension is removed or user clears data

---

## Extension Functionality & Data Usage

### Tab Management

Tab Keeper monitors and manages tabs to keep them alive and focused:

- **Checks tab URLs** periodically to determine if they match configured targets
- **Tracks tab state** (open/closed) to enable auto-reopen functionality
- **Switches focus** between tabs based on configurable timer
- **Does NOT log** browsing history or transmit URL data anywhere

### Auto-Login Feature

When enabled, Tab Keeper automatically fills credentials on login pages:

- **Reads credentials** from managed storage or local storage
- **Fills form fields** on detected login pages matching configured URLs
- **Submits forms** automatically after credential fill
- **Does NOT store** login success/failure data
- **Does NOT transmit** credentials to any server

### Timer Functionality

The smart timer tracks user activity to determine when to switch back to primary tab:

- **Monitors user activity** (mouse clicks, keyboard input) on non-primary tabs
- **Resets timer** when activity detected
- **Switches focus** to primary tab when timer expires
- **Does NOT track** which sites you visit or what you do on them

---

## Permissions Explained

Tab Keeper requests the following Chrome permissions:

| Permission | Why We Need It | What We Do With It |
|------------|----------------|-------------------|
| `tabs` | Monitor and manage target tabs | Query tabs, detect URLs, switch focus, reopen closed tabs |
| `storage` | Store configuration and credentials | Save/load settings via chrome.storage API |
| `activeTab` | Interact with current tab when needed | Temporary access for auto-login functionality |
| `scripting` | Inject content scripts into target pages | Auto-fill login forms, detect page state |
| `alarms` | Run periodic checks without draining battery | Timer functionality, periodic tab monitoring |

**We do NOT request or use:**
- ❌ `history` - We don't access browsing history
- ❌ `cookies` - We don't read or modify cookies directly
- ❌ `webRequest` - We don't intercept network requests
- ❌ `downloads` - We don't manage downloads
- ❌ `bookmarks` - We don't access bookmarks

---

## Third-Party Services

Tab Keeper **does NOT integrate with** any third-party services:

- ❌ No Google Analytics
- ❌ No Facebook Pixel
- ❌ No Mixpanel, Amplitude, or similar
- ❌ No crash reporting services
- ❌ No advertising networks
- ❌ No data brokers or aggregators

**All functionality is self-contained within the extension.**

---

## Children's Privacy

Tab Keeper is designed for enterprise and professional use cases:

- ❌ **Not directed at children** under 13 years of age
- ❌ **Not marketed** to schools or educational institutions for student use
- ✅ **Intended for** healthcare facilities, businesses, and adult users

We do not knowingly collect data from children under 13. If you believe we have inadvertently collected such data, contact us at zantop@protonmail.com.

---

## Changes to This Policy

We may update this privacy policy from time to time:

1. **Notification:** Significant changes will be noted in the extension's version history
2. **Effective Date:** Updated policy shows "Last Updated" date at top
3. **Continued Use:** Using the extension after changes constitutes acceptance

**Current Version:** 2.0.3 (June 26, 2026)  
**Previous Version:** 1.0.18 (June 18, 2026)

---

## Your Rights

Depending on your jurisdiction, you may have the following rights:

- **Access:** Request information about what data we process
- **Rectification:** Correct inaccurate data (via extension settings)
- **Erasure:** Delete all data by uninstalling the extension
- **Portability:** Export your configuration (via options page)
- **Objection:** Uninstall the extension at any time

**To exercise these rights:**
1. Open extension popup → Options
2. Modify or clear your configuration
3. Uninstall extension to remove all local data

---

## Security Measures

We implement reasonable security practices:

- ✅ **Local Storage Only** - All data stored locally via Chrome's encrypted storage
- ✅ **No External Transmission** - Zero data leaves the user's device
- ✅ **Enterprise Encryption** - Managed storage uses Chrome's enterprise encryption
- ✅ **Minimal Permissions** - Only permissions necessary for functionality
- ✅ **Open Source** - Code available for security audit on GitHub

---

## Contact Information

**For privacy questions or concerns:**

- **Email:** zantop@protonmail.com
- **GitHub:** https://github.com/zant0p/tab-keeper
- **Issues:** https://github.com/zant0p/tab-keeper/issues

**For enterprise deployment questions:**
- See [ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md](https://github.com/zant0p/tab-keeper/blob/main/ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md)
- Contact your IT administrator for policy configuration

---

## Compliance Statement

Tab Keeper is designed with privacy-by-design principles:

- **Data Minimization:** We collect only what's absolutely necessary
- **Purpose Limitation:** Data used only for stated functionality
- **Storage Limitation:** No persistent logs or historical tracking
- **Confidentiality:** All data encrypted by Chrome's storage APIs
- **Transparency:** This policy clearly explains all data practices

**We believe privacy is a fundamental right, even for enterprise tools.**

---

*This privacy policy is hosted at:*  
https://github.com/zant0p/tab-keeper/blob/main/PRIVACY.md

*For Chrome Web Store submission reference.*
