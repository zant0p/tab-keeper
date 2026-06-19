# Tab Keeper v2.0.0 - Enterprise Deployment Guide

## Overview

Tab Keeper v2.0.0 is designed for healthcare facilities using PointClickCare. It maintains two tabs (primary and secondary) with automatic login and keeps them alive.

## Variants

| Variant | Facility Type | Username | Password |
|---------|--------------|----------|----------|
| **AL** | Assisted Living | `alstaff` | `alstaff` |
| **SNF** | Skilled Nursing Facility | `snf` | `snf` |

## URLs

- **Primary:** `https://10.1.129.207/Arial/#/login` (internal network)
- **Secondary:** `https://login.pointclickcare.com/poc/userLogin.xhtml`

## Features

### Core Functionality
- ✅ **Auto-login** with built-in credentials (no external password manager needed)
- ✅ **Dual-tab management** - keeps both primary and secondary tabs alive
- ✅ **Single instance** - only 1 copy of each tab (prevents duplicates)
- ✅ **Smart timer** - countdown in seconds, refocuses to primary tab only
- ✅ **Auto-recovery** - reopens tabs if accidentally closed
- ✅ **AL-specific** - automatically dismisses Chrome password breach popup

### Enterprise Ready
- Chrome Web Store not required
- Self-hosted CRX deployment
- Auto-update support via GitHub Releases
- Chrome Admin Console compatible

---

## Deployment Options

### Option A: GitHub Releases (Recommended)

1. **Wait for build** after tagging a release:
   ```bash
   git tag v2.0.0
   git push origin v2.0.0
   ```

2. **Download from GitHub Releases:**
   - Go to: https://github.com/zant0p/tab-keeper/releases
   - Download the appropriate CRX file(s):
     - `tab-keeper-AL-2.0.0.crx` (Assisted Living)
     - `tab-keeper-SNF-2.0.0.crx` (Skilled Nursing)

3. **Host the files:**
   - Upload CRX and XML files to your internal server, OR
   - Use GitHub Releases URLs directly (if internet access available)

### Option B: Manual Build

1. **Clone the repository:**
   ```bash
   git clone https://github.com/zant0p/tab-keeper.git
   cd tab-keeper
   ```

2. **Set the variant** in `background.js`:
   ```javascript
   const VARIANT = 'AL'; // or 'SNF'
   ```

3. **Pack the extension:**
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Pack extension"
   - Select the tab-keeper folder
   - Save the `.crx` and `.pem` files

---

## Chrome Enterprise Configuration

### Step 1: Get Extension IDs

After building or downloading the CRX files, calculate the extension ID:

```bash
# For AL variant
openssl rsa -in extension.pem -pubout -outform DER 2>/dev/null | \
  openssl dgst -sha256 -binary | \
  tail -c 16 | \
  base32 | \
  tr 'A-Z' 'a-z' | \
  tr -d '='
```

Or install the CRX locally and check `chrome://extensions/`.

### Step 2: Configure ExtensionSettings Policy

In Chrome Admin Console (`chrome://policy`):

```json
{
  "ExtensionSettings": {
    "<AL_EXTENSION_ID>": {
      "installation_mode": "force_installed",
      "update_url": "https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/updates-AL.xml"
    },
    "<SNF_EXTENSION_ID>": {
      "installation_mode": "force_installed",
      "update_url": "https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/updates-SNF.xml"
    }
  }
}
```

**Replace `<AL_EXTENSION_ID>` and `<SNF_EXTENSION_ID>` with actual IDs.**

### Step 3: Deploy to OUs

- Assign the policy to specific Organizational Units
- Or deploy to all users if needed

---

## Auto-Update Configuration

### How It Works

1. Chrome checks the `update_url` every few hours
2. Fetches `updates-*.xml` to check for newer versions
3. Downloads and installs updates automatically
4. User just needs to restart browser

### Hosting Update Files

Upload these files to your server or use GitHub Releases:

- `updates-AL.xml` (for AL variant)
- `updates-SNF.xml` (for SNF variant)
- `tab-keeper-AL-*.crx` (all versions)
- `tab-keeper-SNF-*.crx` (all versions)

### Using GitHub Releases URLs

```json
{
  "update_url": "https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/updates-AL.xml"
}
```

For continuous updates without changing policy:

```json
{
  "update_url": "https://github.com/zant0p/tab-keeper/releases/latest/download/updates-AL.xml"
}
```

---

## Testing

### Load Unpacked (Development)

1. Extract the ZIP file
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extracted folder

### Test Scenarios

| Scenario | Expected Behavior |
|----------|------------------|
| Open primary URL | Auto-fills credentials and clicks login |
| AL variant breach popup | Popup automatically dismissed |
| Navigate away from tabs | Timer starts (in seconds) |
| Timer expires | Automatically switches back to primary |
| Close primary tab | Automatically reopens |
| Close secondary tab | Automatically reopens |
| Multiple copies of tab | Prevents duplicates |

---

## Troubleshooting

### Extension Not Installing

- Check that CRX is signed with valid PEM key
- Verify ExtensionSettings policy is applied (`chrome://policy`)
- Ensure extension ID matches policy

### Auto-Login Not Working

- Check that credentials are correct for your variant
- Verify primary URL matches exactly
- Check browser console for errors (`F12` → Console)

### Tabs Not Staying Alive

- Ensure extension is enabled
- Check that timer is configured (default 300 seconds)
- Verify only one copy of each tab exists

### Breach Popup Not Dismissing (AL)

- Make sure you're using the AL variant
- Check content script permissions
- May need to update popup selectors if Chrome changes UI

---

## Version History

### v2.0.0 (2026-06-19)
- Complete rewrite for PointClickCare deployment
- Built-in credentials (no managed storage)
- AL and SNF variants
- Timer in seconds instead of minutes
- Auto-dismiss Chrome breach popup (AL)
- Dual-tab management (primary + secondary)
- Single instance enforcement

### v1.0.19 (2026-06-18)
- Auto-login reliability improvements
- Multiple trigger points for login detection

### v1.0.16 (2026-06-17)
- Chrome Enterprise support
- Managed storage configuration

---

## Support

For issues or questions:
- Check GitHub Issues: https://github.com/zant0p/tab-keeper/issues
- Review deployment guide: `/docs/AUTO-UPDATE-GUIDE.md`
