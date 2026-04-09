# Tab Keeper - Auto-Update from GitHub Releases

## Overview

Tab Keeper uses Chrome's **built-in auto-update mechanism** to deliver updates automatically from GitHub releases. No Chrome Web Store required.

**How it works:**
1. Extension includes `update_url` pointing to `updates.xml` on GitHub
2. Chrome checks for updates every few hours
3. When new version detected, Chrome downloads and installs automatically

---

## 🔧 Initial Setup (One-Time)

### Step 1: Get Your Extension ID

**For unpacked extensions:**
1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Load your extension (if not already loaded)
4. Copy the **ID** (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

**For CRX installations:**
1. Install the `.crx` file
2. Go to `chrome://extensions/`
3. Copy the extension ID

### Step 2: Update `updates.xml`

Replace `YOUR_EXTENSION_ID_HERE` and `YOUR_USERNAME` with your actual values:

```xml
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='YOUR_EXTENSION_ID_HERE'>
    <updatecheck codebase='https://github.com/YOUR_USERNAME/tab-keeper/releases/download/v1.0.0/tab-keeper.crx' version='1.0.0' />
  </app>
</gupdate>
```

### Step 3: Package as CRX

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **"Pack extension"**
4. **Extension root:** Select the `tab-keeper` folder
5. Click **"Pack Extension"**
6. Save the generated `.crx` and `.pem` files

⚠️ **CRITICAL:** Keep the `.pem` file safe! You need it to sign all future updates. Losing it means users can't update.

### Step 4: Create First GitHub Release

1. Go to: https://github.com/YOUR_USERNAME/tab-keeper/releases/new
2. **Tag version:** `v1.0.0`
3. **Release title:** Tab Keeper v1.0.0
4. **Description:** Release notes
5. **Upload:** `tab-keeper.crx` file
6. Click **"Publish release"**

### Step 5: Commit & Push Updates

```bash
cd path/to/your/tab-keeper

git add manifest.json updates.xml
git commit -m "Initial release v1.0.0 with auto-update support"
git push
```

### Step 6: Install on Client Devices

**Method A: Manual CRX Installation**
1. Download `tab-keeper.crx` from GitHub releases
2. Go to `chrome://extensions/`
3. Enable Developer mode
4. Drag `.crx` file onto extensions page
5. Extension installs with auto-update enabled

**Method B: Enterprise Policy (For Managed Devices)**
1. Create policy JSON:
```json
{
  "ExtensionSettings": {
    "YOUR_EXTENSION_ID": {
      "update_url": "https://raw.githubusercontent.com/YOUR_USERNAME/tab-keeper/main/updates.xml",
      "installation_mode": "force_installed",
      "online_install_source": "https://github.com/YOUR_USERNAME/tab-keeper/releases"
    }
  }
}
```
2. Deploy via Chrome enterprise policies

---

## 🚀 Publishing Updates (Workflow)

### Automated Release Script

```bash
cd path/to/your/tab-keeper
bash scripts/release.sh
```

The script will:
1. Prompt for new version number
2. Update `manifest.json` and `updates.xml`
3. Package extension as ZIP
4. Provide instructions for CRX creation

### Manual Release Process

**1. Bump Version in `manifest.json`:**
```json
{
  "version": "1.0.1"  // Increment from 1.0.0
}
```

**2. Update `updates.xml`:**
```xml
<updatecheck codebase='https://github.com/YOUR_USERNAME/tab-keeper/releases/download/v1.0.1/tab-keeper.crx' version='1.0.1' />
```

**3. Create CRX:**
- Go to `chrome://extensions/`
- Developer mode → Pack extension
- Use same `.pem` file as before (critical!)

**4. Create GitHub Release:**
- Tag: `v1.0.1`
- Upload: `tab-keeper.crx`
- Publish

**5. Commit & Push:**
```bash
git add manifest.json updates.xml
git commit -m "Release v1.0.1: Bug fixes and improvements"
git tag v1.0.1
git push && git push --tags
```

---

## ⏱️ Update Timing

**Chrome checks for updates:**
- **Default:** Every 5 hours
- **Minimum:** ~30 minutes (varies by Chrome version)
- **Force update:** Go to `chrome://extensions/` → Click "Update" button

**Update flow:**
1. Chrome requests `updates.xml` from GitHub
2. Compares version in XML vs installed version
3. If newer: Downloads `.crx` from GitHub Releases
4. Installs update (may require browser restart)

---

## 🔍 Testing Auto-Update

### Test on Development Machine

1. **Install v1.0.0** from CRX
2. **Check current version:**
   - `chrome://extensions/` → Tab Keeper → Details
   - Or: Extension popup should show version
3. **Publish v1.0.1** to GitHub
4. **Force update:**
   - `chrome://extensions/`
   - Enable Developer mode
   - Click **"Update"** button
5. **Verify:** Version should bump to 1.0.1

### Check Update Logs

```
chrome://extensions/?id=YOUR_EXTENSION_ID
```
- Check "Service worker" status
- Look for update-related logs in DevTools

---

## 📋 Checklist for Each Release

- [ ] Bump version in `manifest.json`
- [ ] Update `updates.xml` with new version & download URL
- [ ] Create CRX with same `.pem` key
- [ ] Test CRX locally (install fresh, verify version)
- [ ] Create GitHub release with tag `vX.Y.Z`
- [ ] Upload `tab-keeper.crx` to release
- [ ] Commit & push changes
- [ ] Create git tag
- [ ] Push tags to GitHub
- [ ] Wait 5+ hours for automatic rollout
- [ ] Verify on client devices

---

## ⚠️ Important Notes

### Security

- **`.pem` file is critical:** Losing it breaks auto-update for all users
- **Backup `.pem`:** Store in secure location (password manager, encrypted backup)
- **Never commit `.pem`** to GitHub

### Chrome Web Store Conflict

- If you publish to Chrome Web Store, **remove `update_url`** from manifest
- Chrome Web Store manages updates automatically
- Can't use both simultaneously

### Enterprise Deployments

For managed devices (schools, businesses):
- Use Chrome Enterprise policies
- Set `installation_mode: "force_installed"`
- Specify `update_url` in policy

### Troubleshooting

**Update not installing:**
- Check `updates.xml` is accessible: `curl https://raw.githubusercontent.com/YOUR_USERNAME/tab-keeper/main/updates.xml`
- Verify extension ID matches
- Ensure `.crx` URL is correct in `updates.xml`
- Check Chrome version (M33+ on Windows requires Web Store OR enterprise policy)

**Version not incrementing:**
- Verify `updates.xml` version > installed version
- Semantic versioning: `1.0.1` > `1.0.0`

---

## 📚 References

- **Chrome Auto-Update Docs:** https://developer.chrome.com/docs/extensions/mv3/hosting/
- **Update Manifest Format:** https://developer.chrome.com/docs/extensions/mv3/hosting/#updates
- **Enterprise Policies:** https://chromeenterprise.googleapis.com/download/latest

---

## 🎯 Quick Commands

```bash
# View current version
grep '"version":' manifest.json

# Test updates.xml
curl https://raw.githubusercontent.com/YOUR_USERNAME/tab-keeper/main/updates.xml

# Force Chrome update check
# Go to chrome://extensions/ → Enable Dev mode → Click "Update"

# Create release (automated)
bash scripts/release.sh
```

---

**Last Updated:** April 9, 2026  
**Extension:** Tab Keeper v1.0.0
