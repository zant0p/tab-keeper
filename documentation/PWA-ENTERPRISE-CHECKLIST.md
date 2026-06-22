# Tab Keeper PWA - Chrome Enterprise Checklist

## 🎯 What You Need

To add Tab Keeper PWA as an **Isolated Web App** in Chrome Enterprise, you need:

### 1. Web Bundle File (`.webbundle`)
**Status:** ⚠️ Needs to be generated

**Command to create:**
```bash
# Install web-bundler first
npm install -g web-bundler

# Then create bundle
cd /root/.openclaw/workspace/tab-keeper
./scripts/build-pwa-bundle.sh
```

### 2. Web Bundle ID
**Status:** ⚠️ Will be generated when you create the bundle

**Format:** Looks like `abcdefghijklmnop1234567890`

**How to get it:**
```bash
web-bundler id dist-pwa/tab-keeper-pwa.webbundle
```

### 3. Update Manifest URL
**Status:** ✅ File created, needs your Azure URL

**File:** `/root/.openclaw/workspace/tab-keeper/pwa-updates.xml`

**Update this file with:**
- Your Azure storage account name
- Your container name
- Your Web Bundle ID (once generated)

---

## 📋 Chrome Enterprise Policy JSON

Once you have the Web Bundle ID, use this policy:

```json
{
  "IsolatedWebAppList": [
    {
      "id": "YOUR_WEB_BUNDLE_ID_HERE",
      "update_url": "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/pwa-updates.xml"
    }
  ],
  "IsolatedWebAppInstallPolicy": {
    "YOUR_WEB_BUNDLE_ID_HERE": {
      "installation_mode": "force_installed",
      "update_url": "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/pwa-updates.xml"
    }
  }
}
```

---

## 🚀 Quick Start Commands

### Step 1: Install web-bundler
```bash
npm install -g web-bundler
```

### Step 2: Build web bundle
```bash
cd /root/.openclaw/workspace/tab-keeper
./scripts/build-pwa-bundle.sh
```

### Step 3: Note the Web Bundle ID
The script will output:
```
🆔 Web Bundle ID: abcdefghijklmnop1234567890
```

### Step 4: Update pwa-updates.xml
Edit `/root/.openclaw/workspace/tab-keeper/pwa-updates.xml`:
- Replace `YOUR_WEB_BUNDLE_ID_HERE` with actual ID
- Replace `YOUR_STORAGE_ACCOUNT` with your Azure account
- Replace `YOUR_CONTAINER` with your container name

### Step 5: Upload to Azure
```bash
az storage blob upload \
  --account-name YOUR_ACCOUNT \
  --container-name YOUR_CONTAINER \
  --name tab-keeper-pwa.webbundle \
  --file ./dist-pwa/tab-keeper-pwa.webbundle \
  --content-type application/webbundle

az storage blob upload \
  --account-name YOUR_ACCOUNT \
  --container-name YOUR_CONTAINER \
  --name pwa-updates.xml \
  --file ./pwa-updates.xml \
  --content-type application/xml
```

### Step 6: Configure Chrome Admin Console
1. Go to admin.google.com
2. Devices → Chrome → Settings → User & Browser Settings
3. Find **Isolated Web Apps** section
4. Add policy with your Web Bundle ID and update URL

---

## 📁 Files Ready

| File | Status | Purpose |
|------|--------|---------|
| `pwa-manifest.json` | ✅ Ready | PWA manifest |
| `pwa-updates.xml` | ⚠️ Needs URLs | Auto-update manifest |
| `sw-pwa.js` | ✅ Ready | Service Worker |
| `pwa-install.js` | ✅ Ready | Install handler |
| `icons/icon192.png` | ✅ Ready | App icon |
| `icons/icon512.png` | ✅ Ready | Large icon |
| `scripts/build-pwa-bundle.sh` | ⚠️ Needs creation | Build script |
| `.webbundle` file | ❌ Not created | Needs web-bundler |

---

## 🔍 Verification

After deployment, verify at:

1. **chrome://policy/** - Policy shows as "Mandatory"
2. **chrome://isolated-web-apps/** - Tab Keeper PWA appears
3. **App launches** - Opens in standalone window

---

## 📖 Full Documentation

- **Complete Guide:** `docs/PWA-WEB-BUNDLE-GUIDE.md`
- **PWA Quick Start:** `docs/PWA-QUICK-START.md`
- **Deployment Architecture:** `docs/DEPLOYMENT-ARCHITECTURE.md`

---

## 💡 Summary

**For Extension (.crx):**
- Extension ID: `4nsinwkb7e5khfdund5hlutwfa`
- Policy: `ExtensionInstallForcesList`

**For PWA (.webbundle):**
- Web Bundle ID: _(generate with web-bundler)_
- Policy: `IsolatedWebAppList`

Both can coexist and be deployed to different device groups!
