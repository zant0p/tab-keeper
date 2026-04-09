# Tab Keeper - GitHub Actions Auto-Release Guide

## 🎯 No Server Access Required!

Everything happens through GitHub. You never need to SSH into the server.

---

## 🚀 Quick Start: Release a New Version

### Step 1: Update Version in `manifest.json`

On your local machine (or wherever you edit the code):

```json
{
  "manifest_version": 3,
  "name": "Tab Keeper",
  "version": "1.0.1",  // ← Bump this version
  ...
}
```

### Step 2: Commit & Push to GitHub

```bash
git add chrome-extensions/tab-keeper/manifest.json
git commit -m "Bump version to 1.0.1"
git push
```

### Step 3: Create & Push Tag

```bash
git tag v1.0.1
git push origin v1.0.1
```

### Step 4: GitHub Actions Takes Over! 🤖

1. Go to: https://github.com/YOUR_USERNAME/tab-keeper/actions
2. You'll see the **"Auto-Release Chrome Extension"** workflow running
3. Wait ~1-2 minutes for it to complete
4. The workflow will:
   - ✅ Build the extension ZIP
   - ✅ Create a GitHub Release
   - ✅ Upload the ZIP package
   - ✅ Update `updates.xml` automatically

### Step 5: Download & Install

Once the workflow completes:

1. Go to: https://github.com/YOUR_USERNAME/tab-keeper/releases
2. Click the latest release (v1.0.1)
3. Download `tab-keeper-1.0.1.zip` from **Assets**
4. Unzip locally
5. In Chrome:
   - `chrome://extensions/` → Developer mode
   - **First time:** Click "Pack extension" → Select folder → Install `.crx`
   - **Updates:** Chrome auto-updates if already installed!

---

## 📋 Complete Workflow

```
Local Machine                          GitHub
┌──────────────┐                    ┌─────────────────┐
│ 1. Edit code │                    │                 │
│ 2. Bump ver  │                    │                 │
│ 3. Commit    │────git push ──────▶│ 4. Code pushed │
│ 4. git tag   │────git push tag───▶│ 5. Tag received│
│              │                    │                 │
│              │                    │ 6. Actions runs │
│              │                    │ 7. Build ZIP    │
│              │                    │ 8. Create rel.  │
│              │                    │ 9. Update XML   │
│              │                    │                 │
│ 10.Download◀│─────release─────────│ 11.Release done│
│ 11.Install   │                    │                 │
└──────────────┘                    └─────────────────┘
```

---

## 🔧 Alternative: Manual Workflow Trigger

If you want to trigger a release without creating a tag:

1. Go to: https://github.com/YOUR_USERNAME/tab-keeper/actions
2. Click **"Auto-Release Chrome Extension"** workflow
3. Click **"Run workflow"** button
4. Enter version number (e.g., `1.0.1`)
5. Click **"Run workflow"**
6. Workflow builds and releases automatically!

---

## 📦 What Gets Built

The GitHub Actions workflow creates:

```
tab-keeper-1.0.1.zip
├── manifest.json      # Extension config
├── background.js      # Service worker
├── content.js         # Content script
├── popup.html         # Popup UI
├── popup.js           # Popup logic
├── options.html       # Settings page
├── options.js         # Settings logic
└── icons/             # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

**Excluded files:**
- README.md, guides, scripts (not needed for installation)
- `.git`, `__pycache__` (development artifacts)

---

## 🔄 Auto-Update Flow

Once users have the extension installed:

```
Chrome Browser                    GitHub
     │                               │
     │──── Every ~5 hours ──────────▶│
     │   Check updates.xml           │
     │                               │
     │◀──── Return version info ─────│
     │                               │
     │   New version?                │
     │     │                         │
     │     ├─ YES: Download .crx ───▶│ Releases
     │     │        Install          │
     │     │                         │
     │     └─ NO: Do nothing         │
     │                               │
```

**No user action required!** Chrome handles everything.

---

## 🎯 Version Management

### Semantic Versioning

Use `MAJOR.MINOR.PATCH` format:

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features (backwards compatible)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes

### Example Release Cycle

```bash
# Bug fix release
git add manifest.json
git commit -m "Fix: Auto-login timing issue"
git tag v1.0.1
git push && git push --tags

# Feature release
git add manifest.json background.js
git commit -m "Feat: Add custom timer intervals"
git tag v1.1.0
git push && git push --tags

# Major release
git add manifest.json
git commit -m "Breaking: New manifest v3 architecture"
git tag v2.0.0
git push && git push --tags
```

---

## ⚠️ Important Notes

### First Installation vs Updates

**First Installation:**
- Requires manual CRX creation (`.pem` key)
- User must install once
- Done locally on each device

**Subsequent Updates:**
- **Fully automatic** via GitHub
- Chrome downloads and installs
- No user action needed

### The .pem Key

**Critical:** The `.pem` file is your extension's signing key.

- **Generated:** When you first "Pack extension" in Chrome
- **Required:** For creating CRX files
- **Keep safe:** Losing it breaks auto-update for existing users
- **Never commit:** Don't upload to GitHub

**Recommendation:**
- Store `.pem` in password manager or encrypted backup
- Label it clearly: "Tab Keeper Extension Key - DO NOT LOSE"

### Chrome Web Store vs GitHub

**Don't mix approaches:**

| Method | Update Source | Best For |
|--------|--------------|----------|
| Chrome Web Store | Google servers | Public distribution |
| GitHub Releases | GitHub | Private/internal use |

Choose one. If using Chrome Web Store, remove `update_url` from manifest.

---

## 🔍 Monitoring Releases

### Check Workflow Status

```
https://github.com/YOUR_USERNAME/tab-keeper/actions
```

- ✅ Green checkmark = Success
- ❌ Red X = Failed (click to see error)
- 🟡 Yellow = Running

### View Release

```
https://github.com/YOUR_USERNAME/tab-keeper/releases
```

- See all versions
- Download ZIP packages
- View release notes

### Check updates.xml

```
https://raw.githubusercontent.com/YOUR_USERNAME/tab-keeper/main/updates.xml
```

- Verify version is updated
- Check CRX URL is correct

---

## 🐛 Troubleshooting

### Workflow Fails

**Common causes:**
1. **Version mismatch:** Tag version ≠ manifest.json version
   - Fix: Update manifest.json to match tag
2. **Build error:** Missing files in repository
   - Fix: Ensure all extension files are committed

**Check logs:**
- Go to Actions tab
- Click failed workflow run
- Read error message in logs

### Auto-Update Not Working

**Check:**
1. Extension installed from CRX (not unpacked)?
2. `update_url` in manifest.json correct?
3. `updates.xml` accessible? (test URL in browser)
4. Extension ID matches in `updates.xml`?

**Force update:**
```
chrome://extensions/ → Developer mode → "Update" button
```

### Users Report Not Getting Updates

**Chrome checks every ~5 hours**, but you can:
1. Ask them to force update (see above)
2. Restart Chrome
3. Check `chrome://extensions/?id=lndhaffkdjabbhnoebbmifhmbcgfmbnp`

---

## 📚 Quick Reference

### Commands

```bash
# Create release
git tag vX.Y.Z
git push origin vX.Y.Z

# View workflow
https://github.com/YOUR_USERNAME/tab-keeper/actions

# Download latest release
https://github.com/YOUR_USERNAME/tab-keeper/releases/latest

# Check updates.xml
curl https://raw.githubusercontent.com/YOUR_USERNAME/tab-keeper/main/updates.xml
```

### Important URLs

| Purpose | URL |
|---------|-----|
| GitHub Actions | https://github.com/YOUR_USERNAME/tab-keeper/actions |
| Releases | https://github.com/YOUR_USERNAME/tab-keeper/releases |
| Update Manifest | https://raw.githubusercontent.com/YOUR_USERNAME/tab-keeper/main/updates.xml |
| Extension ID | `lndhaffkdjabbhnoebbmifhmbcgfmbnp` |

---

## 🎉 Summary

**You never need server access!**

1. **Edit code** → Commit → Push
2. **Create tag** → `git tag v1.0.1 && git push --tags`
3. **GitHub Actions** → Builds, packages, releases
4. **Download ZIP** → Install (first time only)
5. **Chrome auto-updates** → Forever! 🚀

---

**Questions?** Check the workflow logs or open an issue on GitHub.

**Last Updated:** April 9, 2026  
**Extension:** Tab Keeper
