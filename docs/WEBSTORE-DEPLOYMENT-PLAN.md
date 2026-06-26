# Tab Keeper - Chrome Web Store Deployment Plan

**Version:** 2.0.3-webstore  
**Date:** 2026-06-26  
**Status:** Ready for implementation

---

## 🎯 Project Overview

Transform Tab Keeper from a self-hosted extension with hardcoded credentials into a Chrome Web Store-published extension that:
- Passes review on first submission
- Works in ChromeOS Managed Guest Session mode
- Receives credentials via enterprise policy (not hardcoded)
- Auto-manages PointClickCare tabs for healthcare facility kiosks

---

## 📋 Requirements Recap

### Core Functions (Must Preserve)
1. **Auto-login** to PointClickCare with credentials from enterprise policy
2. **Click login button** automatically after credential fill
3. **Remove popup warnings** (session timeout alerts, etc.)
4. **Dual-tab management:**
   - Primary target: `https://10.1.129.207/*` (AL or SNF)
   - Secondary target: `https://login.pointclickcare.com/*`
   - Both tabs stay open (1 copy each, no duplicates)
5. **10-minute timer:** Return focus to primary target automatically
6. **Tab resurrection:** Reopen tabs if user closes them
7. **Zero user interaction** after kiosk provisioning

### Deployment Model
- **ChromeOS Mode:** Managed Guest Session (auto-launch)
- **Extension Distribution:** Chrome Web Store (Private - Domain Only)
- **Credential Management:** `chrome.storage.managed` policy injection
- **Installation:** Force-installed via Admin Console policy

---

## 🔧 Phase 1: Code Refactoring

### Step 1.1: Remove Hardcoded Credentials

**Files to modify:**
- `background.js` - Remove any hardcoded username/password
- `content.js` - Remove any hardcoded credentials
- Any config files with embedded credentials

**Replace with:**
```javascript
// Read credentials from enterprise policy
chrome.storage.managed.get(['username', 'password'], (result) => {
  if (!result.username || !result.password) {
    console.error('Tab Keeper: No credentials found in managed storage');
    return;
  }
  // Use credentials for auto-login
  performLogin(result.username, result.password);
});
```

### Step 1.2: Verify managed_storage_schema.json

Current schema should define:
```json
{
  "type": "object",
  "properties": {
    "username": {
      "type": "string",
      "description": "PointClickCare username for auto-login"
    },
    "password": {
      "type": "string",
      "description": "PointClickCare password for auto-login"
    },
    "primaryUrl": {
      "type": "string",
      "description": "Primary target URL (AL or SNF variant)"
    },
    "timerMinutes": {
      "type": "integer",
      "description": "Minutes before returning to primary tab",
      "default": 10
    }
  }
}
```

### Step 1.3: Update manifest.json

**Remove:**
- `"key"` field (Chrome Admin manages signing)
- `"update_url"` field (Admin Console manages updates)

**Keep:**
- `"storage"` permission (for chrome.storage.managed)
- `"tabs"` permission (for tab management)
- `"alarms"` permission (for 10-minute timer)
- Host permissions for PointClickCare domains

---

## 📚 Phase 2: Documentation Creation

### Document 1: TESTING_GUIDE.md

**Purpose:** How BJ can test locally before Web Store submission

**Contents:**
1. Load unpacked extension in Chrome
2. Set up local managed storage policy (registry/JSON file)
3. Test auto-login functionality
4. Verify tab management features
5. Troubleshooting common issues

**Location:** `/root/.openclaw/workspace/tab-keeper/TESTING_GUIDE.md`

---

### Document 2: WEBSTORE_SUBMISSION_GUIDE.md

**Purpose:** Exact Q&A and requirements for Chrome Web Store submission

**Contents:**

#### A. Developer Dashboard Setup
- [ ] Create Chrome Web Store Developer Account ($5 one-time fee)
- [ ] Enable domain publishing in Admin Console
- [ ] Verify domain ownership (if required)

#### B. Store Listing Requirements
- **Title:** "Tab Keeper for PointClickCare"
- **Description:** 
  ```
  Tab management tool for healthcare facilities using PointClickCare.
  Automatically manages login sessions and keeps tabs active for kiosk deployments.
  
  Features:
  - Auto-login with enterprise-managed credentials
  - Dual-tab management (AL/SNF + login portal)
  - Automatic tab refocus every 10 minutes
  - Tab resurrection if closed
  
  NOT affiliated with PointClickCare. Requires enterprise policy configuration.
  Private deployment for [YOUR_DOMAIN] only.
  ```
- **Category:** Productivity
- **Privacy Policy URL:** (see below)
- **Screenshots:** 3-5 images showing popup, options page, tab behavior

#### C. Privacy Policy Requirements
Even for internal tools, must have privacy policy URL. Options:
1. Simple GitHub Pages page on zant0p.github.io
2. Page on grumpybear website
3. Google Doc (public link)

**Template:**
```
Tab Keeper Privacy Policy

This extension is deployed privately by [ORGANIZATION_NAME] for internal use only.

Data Collection:
- Does NOT collect any user data
- Does NOT transmit data to external servers
- Credentials stored locally via chrome.storage.managed (enterprise policy)

Data Usage:
- Credentials used only for auto-login functionality
- No analytics, tracking, or telemetry

Data Sharing:
- No data shared with third parties
- Extension operates entirely within organization's network

Contact: [ADMIN_EMAIL]
```

#### D. Submission Checklist
- [ ] No hardcoded credentials in code
- [ ] Privacy policy URL set in dashboard
- [ ] Description clarifies "Not affiliated with PointClickCare"
- [ ] Visibility: "Private - Only to my domain"
- [ ] All manifest permissions justified
- [ ] Screenshots uploaded
- [ ] ZIP file contains all files from manifest

#### E. Review Process Timeline
- Submission → Review (1-3 business days for private extensions)
- Approval → Visible in private Chrome Web Store
- Admin Console can then force-install

**Location:** `/root/.openclaw/workspace/tab-keeper/WEBSTORE_SUBMISSION_GUIDE.md`

---

### Document 3: ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md

**Purpose:** Step-by-step deployment to ChromeOS kiosks via Admin Console

**Contents:**

#### A. Prerequisites
- ChromeOS devices enrolled in Admin Console
- ChromeOS Enterprise Upgrade license (for Managed Guest Session)
- Extension approved in Chrome Web Store (private/domain-only)

#### B. Configure Managed Guest Session
1. Admin Console → Devices → Chrome → Settings → Managed Guest Session
2. Enable: "Allow managed guest sessions"
3. Enable: "Auto-launch managed guest session"
4. Set session name (e.g., "PointClickCare Kiosk")
5. Configure idle timeout, session length, etc.

#### C. Deploy Extension via Policy
1. Admin Console → Apps → Chrome → Extensions & apps
2. Click "+" → Find "Tab Keeper for PointClickCare"
3. Configure:
   - **Installation mode:** Force install
   - **Extension ID:** (from Web Store after approval)

#### D. Configure Credentials Policy
1. Admin Console → Devices → Chrome → Policies
2. Navigate to organizational unit
3. Add policy: `3rdPartyExtensions`
4. JSON format:
```json
{
  "ldjdfkbdllhdbpmpegiaelmabmpnhcoi": {
    "username": "facility_al_user",
    "password": "secure_password",
    "primaryUrl": "https://10.1.129.207/AL",
    "timerMinutes": 10
  }
}
```

#### E. Test Deployment
1. Reboot kiosk device
2. Should auto-launch Managed Guest Session
3. Extension should auto-open PointClickCare tabs
4. Verify auto-login works
5. Verify 10-minute timer returns to primary tab
6. Verify tabs reopen if closed

#### F. Multiple Facilities (AL vs SNF)
Option A: Separate policies per OU
- Create OU for AL facilities
- Create OU for SNF facilities
- Different credential policies per OU

Option B: Single extension, different policies
- Same extension ID
- Different `3rdPartyExtensions` policy per OU/facility

**Location:** `/root/.openclaw/workspace/tab-keeper/ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md`

---

## 🔍 Phase 3: Chrome Web Store Research Tasks

### Before Starting Work Tomorrow

1. **Review latest submission requirements:**
   - Fetch: https://developer.chrome.com/docs/webstore/publish
   - Check for 2026 policy changes
   - Review enterprise-specific requirements

2. **Verify privacy policy requirements:**
   - Can it be a simple static page?
   - Must it be on organization domain?
   - Is GitHub Pages acceptable?

3. **Check screenshot requirements:**
   - Minimum dimensions
   - Number required
   - Content guidelines

4. **Review common rejection reasons for enterprise extensions:**
   - Search recent forum posts
   - Check Chromium extensions group

5. **Verify Manifest V3 compliance:**
   - All APIs used are MV3-compatible
   - Service worker (not background page)
   - No remotely-hosted code

---

## 🚀 Phase 4: GitHub Workflow

### Branch Strategy
```bash
git checkout -b feature/chrome-webstore-deployment
# All work on this branch
# Main branch stays stable
```

### Commit Messages
- `refactor: remove hardcoded credentials for Web Store compliance`
- `feat: implement chrome.storage.managed credential injection`
- `docs: add testing guide for local development`
- `docs: add Web Store submission guide`
- `docs: add Admin Console deployment guide`
- `chore: update manifest for Chrome Admin Console deployment`

### Release Process
1. Complete all work on feature branch
2. BJ tests locally
3. Merge to main: `git merge feature/chrome-webstore-deployment`
4. Create tag: `v2.0.3-webstore`
5. Create GitHub Release with ZIP upload
6. Submit ZIP to Chrome Web Store

---

## ✅ Success Criteria

### Code Quality
- [ ] No hardcoded credentials anywhere in repo
- [ ] All credentials via chrome.storage.managed
- [ ] Manifest V3 compliant
- [ ] No excessive permissions

### Documentation Quality
- [ ] Testing guide clear enough for BJ to test in <30 min
- [ ] Web Store guide answers ALL submission questions
- [ ] Deployment guide has screenshots/copy-paste JSON

### Web Store Submission
- [ ] First submission passes review (no rejections)
- [ ] Visible in private Chrome Web Store for domain
- [ ] Extension ID documented

### Kiosk Deployment
- [ ] Device boots to logged-in PointClickCare
- [ ] Both tabs stay open (no duplicates)
- [ ] 10-minute timer returns to primary tab
- [ ] Closed tabs reopen automatically
- [ ] Works after device restart (policy persists)

---

## 📞 Support Resources

### Chrome Web Store Developer Support
- Contact form: https://support.google.com/chrome_webstore/contact/one_stop_support
- For rejection appeals or clarification

### Enterprise Deployment Forums
- Chrome Enterprise Community: https://support.google.com/chrome/a/community
- Chromium Extensions Group: https://groups.google.com/a/chromium.org/g/chromium-extensions

### Documentation References
- ExtensionSettings Policy: https://support.google.com/chrome/a/answer/9867568
- Managed Guest Sessions: https://support.google.com/chrome/a/answer/3017014
- chrome.storage.managed: https://developer.chrome.com/docs/extensions/reference/api/storage/managed

---

## ⚠️ Critical Reminders

1. **RESEARCH FIRST** - Always check official docs before making changes
2. **NO HARDCODED CREDS** - This is the #1 rejection reason
3. **PRIVACY POLICY REQUIRED** - Even for internal tools
4. **DOMAIN-ONLY PUBLISHING** - Not public release
5. **TEST LOCALLY FIRST** - Don't submit untested code
6. **DOCUMENT EVERYTHING** - For future BJ and future-me

---

**Next Session Start:** Begin with Phase 1 (Code Refactoring) after reviewing this doc.
