# Tab Keeper - Azure Blob Storage Deployment Guide

## Problem: CRX File Installation Errors

When hosting CRX files on Azure Blob Storage, Chrome throws installation errors. This is caused by **incorrect MIME type** and missing CORS headers.

## Root Causes

1. **Wrong Content-Type**: Azure Blob Storage defaults to `application/octet-stream` for `.crx` files
2. **Chrome requires**: `application/x-chrome-extension`
3. **Missing CORS headers**: Chrome needs proper CORS configuration for extension installation

## Solution

### Option 1: Fix MIME Type on Existing Blob (Recommended)

#### Using Azure Portal
1. Go to your Storage Account → Containers → select your container
2. Find the `.crx` file blob
3. Click the blob → **Properties**
4. Edit **Content-Type** field
5. Change from `application/octet-stream` to `application/x-chrome-extension`
6. Save changes

#### Using Azure CLI
```bash
az storage blob update \
  --account-name <your-storage-account> \
  --container-name <your-container> \
  --name tab-keeper.crx \
  --content-type application/x-chrome-extension
```

#### Using PowerShell
```powershell
$ctx = New-AzStorageContext -StorageAccountName <your-storage-account> -StorageAccountKey <your-key>
Set-AzStorageBlobContent `
  -File "tab-keeper.crx" `
  -Container "<your-container>" `
  -Blob "tab-keeper.crx" `
  -ContentType "application/x-chrome-extension" `
  -Context $ctx `
  -Force
```

### Option 2: Upload with Correct MIME Type from Start

#### Using Azure CLI
```bash
az storage blob upload \
  --account-name <your-storage-account> \
  --container-name <your-container> \
  --name tab-keeper.crx \
  --file ./tab-keeper.crx \
  --content-type application/x-chrome-extension
```

#### Using PowerShell
```powershell
$ctx = New-AzStorageContext -StorageAccountName <your-storage-account> -StorageAccountKey <your-key>
Set-AzStorageBlobContent `
  -File "tab-keeper.crx" `
  -Container "<your-container>" `
  -Blob "tab-keeper.crx" `
  -ContentType "application/x-chrome-extension" `
  -Context $ctx `
  -Force
```

### Option 3: Use Azure Static Web Apps (Better Alternative)

Azure Static Web Apps automatically handles MIME types and provides CDN:

1. Create Static Web App in Azure Portal
2. Configure build output folder to serve CRX files
3. Add `staticwebapp.config.json`:
```json
{
  "mimeTypes": {
    ".crx": "application/x-chrome-extension",
    ".zip": "application/zip"
  }
}
```

## Verify MIME Type

### Test with curl
```bash
curl -I https://<your-storage-account>.blob.core.windows.net/<container>/tab-keeper.crx
```

Look for:
```
Content-Type: application/x-chrome-extension
```

### Test in Browser
1. Open DevTools (F12) → Network tab
2. Navigate to the CRX URL
3. Check Response Headers → Content-Type should be `application/x-chrome-extension`

## Configure Chrome Enterprise Policy

After fixing MIME type, configure Chrome Admin Console:

### ExtensionInstallForcesList
```json
{
  "ExtensionInstallForcesList": [
    {
      "app_id": "<YOUR_EXTENSION_ID>",
      "update_url": "https://<your-storage-account>.blob.core.windows.net/<container>/updates.xml"
    }
  ]
}
```

### ExtensionSettings
```json
{
  "ExtensionSettings": {
    "<YOUR_EXTENSION_ID>": {
      "installation_mode": "force_installed",
      "update_url": "https://<your-storage-account>.blob.core.windows.net/<container>/updates.xml"
    }
  }
}
```

## Create updates.xml

Create an `updates.xml` file in the same container:

```xml
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='<YOUR_EXTENSION_ID>'>
    <updatecheck codebase='https://<your-storage-account>.blob.core.windows.net/<container>/tab-keeper.crx' version='2.0.0' />
  </app>
</gupdate>
```

Also set Content-Type for XML:
```bash
az storage blob update \
  --account-name <your-storage-account> \
  --container-name <your-container> \
  --name updates.xml \
  --content-type application/xml
```

## Get Extension ID

1. Package your extension as CRX
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Drag and drop the CRX file
5. Copy the Extension ID (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

Or calculate from public key:
```bash
cd /root/.openclaw/workspace/tab-keeper
./scripts/calculate-extension-id.sh
```

## CORS Configuration (If Needed)

If you still get errors, configure CORS on the storage account:

```bash
az storage cors add \
  --services b \
  --methods GET OPTIONS \
  --allowed-origins * \
  --allowed-headers Content-Type \
  --max-age 3600 \
  --account-name <your-storage-account>
```

## Troubleshooting Checklist

- [ ] Content-Type is `application/x-chrome-extension` (not `application/octet-stream`)
- [ ] Blob URL is publicly accessible (container permissions set to Blob or Container)
- [ ] Extension ID in policy matches the CRX file's actual ID
- [ ] updates.xml has correct version and codebase URL
- [ ] Chrome policy is applied (`chrome://policy/` → Reload policies)
- [ ] Device is managed (`chrome://management/`)
- [ ] No firewall/proxy blocking the blob storage URL

## Common Error Messages

### "CRX_FILE_INVALID"
**Cause**: Wrong MIME type  
**Fix**: Set Content-Type to `application/x-chrome-extension`

### "EXTENSION_ID_MISMATCH"
**Cause**: Extension ID in policy doesn't match CRX  
**Fix**: Get correct ID from chrome://extensions/ after manual install

### "UPDATE_URL_INVALID"
**Cause**: updates.xml not accessible or wrong format  
**Fix**: Verify XML is accessible and has correct Content-Type (`application/xml`)

### "INSTALLATION_BLOCKED_BY_POLICY"
**Cause**: Extension not in allowlist  
**Fix**: Add to ExtensionInstallAllowlist or ExtensionSettings

## Quick Fix Script

Save as `fix-crx-mimetype.sh`:

```bash
#!/bin/bash
# Fix CRX MIME type on Azure Blob Storage

STORAGE_ACCOUNT="<your-storage-account>"
CONTAINER="<your-container>"
BLOB_NAME="tab-keeper.crx"

echo "Fixing MIME type for $BLOB_NAME..."

az storage blob update \
  --account-name "$STORAGE_ACCOUNT" \
  --container-name "$CONTAINER" \
  --name "$BLOB_NAME" \
  --content-type application/x-chrome-extension

echo "✅ MIME type updated!"
echo ""
echo "Verify with:"
echo "curl -I https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINER}/${BLOB_NAME}"
```

## References

- [Chrome Extension Hosting Docs](https://developer.chrome.com/docs/extensions/mv3/hosting/)
- [Azure Blob Storage Content-Type](https://learn.microsoft.com/en-us/rest/api/storageservices/set-blob-properties)
- [Chrome Enterprise Policies](https://chromeenterprise.google/policies/)
- [Self-hosting Chromium Extensions](https://www.meziantou.net/self-hosting-chromium-extensions.htm)
