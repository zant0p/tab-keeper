# Quick Fix: CRX Installation Error on Azure Blob Storage

## 🚨 The Problem

When you try to install a CRX file downloaded from Azure Blob Storage, Chrome throws an error because:

**Azure Blob Storage serves `.crx` files with the wrong MIME type:**
- ❌ Azure default: `application/octet-stream`
- ✅ Chrome requires: `application/x-chrome-extension`

## ✅ Immediate Fix (5 minutes)

### Step 1: Fix the MIME Type on Azure

**Option A: Azure Portal (Easiest)**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your **Storage Account** → **Containers**
3. Open your container → Find the `.crx` file
4. Click the CRX blob → **Properties** (three dots menu)
5. Edit **Content-Type** field
6. Change to: `application/x-chrome-extension`
7. Click **Save**

**Option B: Azure CLI**
```bash
az storage blob update \
  --account-name YOUR_STORAGE_ACCOUNT \
  --container-name YOUR_CONTAINER \
  --name tab-keeper-2.0.0.crx \
  --content-type application/x-chrome-extension
```

**Option C: PowerShell**
```powershell
$ctx = New-AzStorageContext -StorageAccountName "YOUR_STORAGE_ACCOUNT" -StorageAccountKey "YOUR_KEY"
Set-AzStorageBlobContent `
  -File "tab-keeper-2.0.0.crx" `
  -Container "YOUR_CONTAINER" `
  -Blob "tab-keeper-2.0.0.crx" `
  -ContentType "application/x-chrome-extension" `
  -Context $ctx `
  -Force
```

### Step 2: Verify the Fix

Test with curl:
```bash
curl -I https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/tab-keeper-2.0.0.crx
```

You should see:
```
Content-Type: application/x-chrome-extension
```

### Step 3: Also Fix updates.xml

Don't forget to set the correct MIME type for your update manifest:

```bash
az storage blob update \
  --account-name YOUR_STORAGE_ACCOUNT \
  --container-name YOUR_CONTAINER \
  --name updates.xml \
  --content-type application/xml
```

### Step 4: Test Installation

1. Download the CRX file again from Azure
2. Go to `chrome://extensions/`
3. Enable **Developer mode**
4. Drag and drop the CRX file
5. ✅ Should install without error!

## 📋 Your Extension Info

From the packaging run:

- **Extension ID**: `4nsinwkb7e5khfdund5hlutwfa`
- **Version**: `2.0.0`
- **PEM Key**: `/root/.openclaw/workspace/tab-keeper/tab-keeper.pem` ⚠️ **KEEP THIS SAFE!**

## 🔧 Chrome Admin Console Policy

Use this JSON in your Chrome Admin Console:

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
  }
}
```

Replace:
- `YOUR_STORAGE_ACCOUNT` with your Azure storage account name
- `YOUR_CONTAINER` with your container name

## 📁 Files Created

Located in `/root/.openclaw/workspace/tab-keeper/dist/`:

- ✅ `tab-keeper-2.0.0.zip` - Extension package (ready to upload)
- ✅ `updates.xml` - Auto-update manifest (edit with your Azure URL)
- ✅ `DEPLOYMENT-INFO.txt` - Quick reference with your extension ID

## 📖 Full Documentation

For complete deployment guide, see:
- `docs/AZURE-BLOB-STORAGE-DEPLOYMENT.md` - Comprehensive guide
- `docs/QUICK-FIX-CRX-ERROR.md` - This file (quick fix)

## ⚠️ Important Notes

1. **PEM Key**: The generated `tab-keeper.pem` determines your extension ID. Never lose it!
2. **Re-uploading**: If you re-upload the CRX to Azure, ensure Content-Type is still correct
3. **Public Access**: Your container must allow public read access (Blob or Container level)
4. **HTTPS Only**: Chrome requires HTTPS for extension hosting (Azure Blob provides this)

## 🆘 Still Getting Errors?

Check these common issues:

| Error | Cause | Fix |
|-------|-------|-----|
| `CRX_FILE_INVALID` | Wrong MIME type | Set Content-Type to `application/x-chrome-extension` |
| `EXTENSION_ID_MISMATCH` | Policy has wrong ID | Use ID: `4nsinwkb7e5khfdund5hlutwfa` |
| `UPDATE_URL_INVALID` | Can't access updates.xml | Verify URL and Content-Type (`application/xml`) |
| `INSTALLATION_BLOCKED` | Not in allowlist | Add to ExtensionInstallAllowlist |

## 🔍 Debug Steps

1. Check if device is managed: `chrome://management/`
2. Verify policies applied: `chrome://policy/` → Click "Reload policies"
3. Inspect network request: DevTools → Network → Check Content-Type header
4. Test direct download: Paste CRX URL in new incognito window

---

**Need help?** See full guide: `docs/AZURE-BLOB-STORAGE-DEPLOYMENT.md`
