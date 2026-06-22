# CRX Installation Error Fix - Beyond MIME Type

## 🎯 The Real Problem

If you've already fixed the MIME type (`application/x-chrome-extension`) and **still getting CRX errors**, the issue is **CRX signature verification**, not MIME type.

## 🔍 Why This Happens

Chrome requires CRX files to be signed with a **Google Web Store publisher key** by default. When you create a CRX locally:

1. ✅ It's signed with **your private PEM key**
2. ❌ It's **NOT signed by Google's publisher key**
3. 🚫 Chrome blocks installation with `CRX_REQUIRED_PROOF_MISSING` or "Package is invalid"

This happens on **GitHub Pages, Azure Blob Storage, or any self-hosted solution**.

## ✅ Solutions (Choose One)

### Solution 1: Chrome Enterprise Policy (RECOMMENDED for Enterprise)

Use Chrome Admin Console to bypass the signature requirement:

#### Step 1: Configure ExtensionInstallSources Policy

This tells Chrome to trust extensions from your domain:

**Windows Registry:**
```reg
[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\ExtensionInstallSources]
"1"="https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/*"
```

**Chrome Admin Console JSON:**
```json
{
  "ExtensionInstallSources": [
    "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/*"
  ],
  "ExtensionInstallAllowlist": [
    "4nsinwkb7e5khfdund5hlutwfa"
  ]
}
```

**Linux (/etc/opt/chrome/policies/managed/extension_policy.json):**
```json
{
  "ExtensionInstallSources": ["https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/*"],
  "ExtensionInstallAllowlist": ["4nsinwkb7e5khfdund5hlutwfa"]
}
```

⚠️ **Critical**: Policy file must be **read-only** (not world-writable) to be considered MANDATORY:
```bash
sudo chmod 644 /etc/opt/chrome/policies/managed/extension_policy.json
sudo chown root:root /etc/opt/chrome/policies/managed/extension_policy.json
```

#### Step 2: Verify Policy is Applied

1. Go to `chrome://policy/`
2. Click **"Reload policies"**
3. Verify `ExtensionInstallSources` and `ExtensionInstallAllowlist` appear
4. Check status shows **"Mandatory"** not "Recommended"

#### Step 3: Install Extension

Now you can install the CRX by:
- Dragging it to `chrome://extensions/` (Developer mode enabled)
- Or clicking a direct link to the CRX file

---

### Solution 2: Publish to Chrome Web Store (Most Secure)

1. Publish your extension to Chrome Web Store
2. Download the official `.crx` from Developer Dashboard
3. Host that CRX on Azure/GitHub
4. Use the official update URL: `https://clients2.google.com/service/update2/crx`

The downloaded CRX is **signed by Google**, so it works everywhere.

---

### Solution 3: Use ZIP + Load Unpacked (Development Only)

For testing only, not enterprise deployment:

1. Download the ZIP file from Azure/GitHub
2. Extract to a folder
3. Go to `chrome://extensions/`
4. Enable Developer mode
5. Click **"Load unpacked"** → Select the folder

❌ **Not suitable for enterprise** - doesn't persist across sessions

---

### Solution 4: Use .zip Instead of .crx (Linux Only)

Linux Chrome allows installing from ZIP files with proper policy:

```json
{
  "ExtensionInstallSources": [
    "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/*.zip"
  ]
}
```

---

## 🚫 What DOESN'T Work

These are common misconceptions:

| Myth | Reality |
|------|---------|
| "Fix the MIME type" | Necessary but NOT sufficient |
| "Use HTTPS" | Already required, doesn't solve signature |
| "Add CORS headers" | Helps with downloads, not signature verification |
| "Change Content-Disposition" | Irrelevant to signature check |
| "Use different browser" | All Chromium browsers have same requirement |

---

## 🔧 Your Specific Setup

### Extension Info
- **Extension ID**: `4nsinwkb7e5khfdund5hlutwfa`
- **Version**: `2.0.0`
- **Files**: `/root/.openclaw/workspace/tab-keeper/dist/`

### Azure Blob Storage Setup

**Upload files with correct MIME types:**

```bash
# Upload CRX
az storage blob upload \
  --account-name YOUR_STORAGE_ACCOUNT \
  --container-name YOUR_CONTAINER \
  --name tab-keeper-2.0.0.crx \
  --file ./dist/tab-keeper-2.0.0.zip \
  --content-type application/x-chrome-extension

# Upload updates.xml
az storage blob upload \
  --account-name YOUR_STORAGE_ACCOUNT \
  --container-name YOUR_CONTAINER \
  --name updates.xml \
  --file ./dist/updates.xml \
  --content-type application/xml
```

**Configure container for public access:**
```bash
az storage container set-permission \
  --account-name YOUR_STORAGE_ACCOUNT \
  --name YOUR_CONTAINER \
  --public-access blob
```

### Chrome Enterprise Policy Configuration

**Create policy file:**

```json
{
  "ExtensionInstallForcesList": [
    {
      "app_id": "4nsinwkb7e5khfdund5hlutwfa",
      "update_url": "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/updates.xml"
    }
  ],
  "ExtensionSettings": {
    "4nsinwkb7e5khfdund5hlutwfa": {
      "installation_mode": "force_installed",
      "update_url": "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/updates.xml"
    }
  },
  "ExtensionInstallSources": [
    "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/*"
  ],
  "ExtensionInstallAllowlist": [
    "4nsinwkb7e5khfdund5hlutwfa"
  ]
}
```

---

## 🧪 Testing Checklist

After applying Solution 1 (Enterprise Policy):

- [ ] Policy shows as **"Mandatory"** in `chrome://policy/`
- [ ] Extension ID matches: `4nsinwkb7e5khfdund5hlutwfa`
- [ ] Blob URL is accessible (test in browser)
- [ ] Content-Type header is correct (check with curl -I)
- [ ] Container has public read access
- [ ] Try installing CRX via drag-and-drop to `chrome://extensions/`

---

## 🆘 Debug Steps

### Check if policy is mandatory:

```bash
# Linux
ls -la /etc/opt/chrome/policies/managed/
cat /etc/opt/chrome/policies/managed/*.json

# Should show:
# -rw-r--r-- root root (NOT world-writable)
```

### Test CRX download:

```bash
curl -I https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/tab-keeper-2.0.0.crx

# Expected headers:
# Content-Type: application/x-chrome-extension
# Accept-Ranges: bytes
# (no X-Content-Type-Options: nosniff)
```

### Check Chrome error details:

1. Open `chrome://extensions/`
2. Enable Developer mode
3. Try to install CRX
4. Look for error message in notification
5. Check DevTools Console for detailed error

### Common Errors:

| Error | Cause | Fix |
|-------|-------|-----|
| `CRX_REQUIRED_PROOF_MISSING` | Missing Enterprise policy | Add ExtensionInstallSources |
| `EXTENSION_ID_MISMATCH` | Wrong ID in policy | Use correct extension ID |
| `UPDATE_URL_INVALID` | Can't access updates.xml | Check URL and permissions |
| `INSTALLATION_BLOCKED_BY_POLICY` | Not in allowlist | Add to ExtensionInstallAllowlist |
| `PACKAGE_IS_INVALID` | Corrupted CRX or wrong signature | Re-package with Chrome, use Enterprise policy |

---

## 📖 References

- [Chrome Extensions: Finding the missing proof](https://blog.janestreet.com/chrome-extensions-finding-the-missing-proof/)
- [Chromium Deep Dive: Fixing CRX_REQUIRED_PROOF_MISSING](https://www.plasmo.com/blog/posts/crx-required-proof-missing)
- [Self-host Extensions on Linux](https://developer.chrome.com/docs/extensions/how-to/distribute/host-on-linux)
- [Chrome Enterprise Policies](https://chromeenterprise.google/policies/)

---

## 💡 Key Takeaway

**MIME type is just step 1.** The real blocker is Chrome's signature verification. For enterprise deployment, you **must** use Chrome Admin Console policies to whitelist your extension and hosting domain.

Without Enterprise policies, Chrome will always reject self-signed CRX files, regardless of where they're hosted (Azure, GitHub, your own server, etc.).
