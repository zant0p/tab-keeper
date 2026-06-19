# Enterprise Deployment Guide

## Automated CRX Build with GitHub Actions

This workflow automatically builds a signed `.crx` file for Chrome Enterprise deployment.

### How It Works

1. **Tag a release**: `git tag v1.0.19 && git push origin v1.0.19`
2. **GitHub Actions builds**: Creates signed CRX, ZIP, and updates.xml
3. **Release created**: Files available in GitHub Releases
4. **Deploy via Admin Console**: Use the release URL in ExtensionSettings policy

---

## Setup Instructions

### Step 1: Configure GitHub Secrets (First Time Only)

**Option A: Let the workflow generate a key (Easiest)**
- Run the workflow once without `EXTENSION_KEY` secret
- Download the generated `extension.pem` from artifacts
- **⚠️ BACKUP THIS KEY SECURELY** - you'll need it for all future updates!
- Add it as a secret for subsequent builds

**Option B: Generate your own key (Recommended for Production)**

```bash
# Generate PEM private key
openssl genrsa -out extension.pem 2048

# Keep this file secure - never commit to git!
```

Then add to GitHub Secrets:
1. Go to: `https://github.com/zant0p/tab-keeper/settings/secrets/actions`
2. Click "New repository secret"
3. Name: `EXTENSION_KEY`
4. Value: Paste contents of `extension.pem`
5. Click "Add secret"

### Step 2: Create a Release

```bash
# Make sure manifest.json version is updated
# Then create and push a tag:
git tag v1.0.19
git push origin v1.0.19
```

This triggers the workflow automatically!

### Step 3: Download Release Assets

After workflow completes (~2 minutes):
1. Go to: `https://github.com/zant0p/tab-keeper/releases`
2. Download assets:
   - `tab-keeper-1.0.19.crx` ← **For enterprise deployment**
   - `tab-keeper-1.0.19.zip` ← For local testing
   - `updates.xml` ← For auto-updates
   - `extension.pem` ← **BACKUP THIS!** (if newly generated)

### Step 4: Get Extension ID

**Method 1: From CRX file (before upload)**
```bash
# The extension ID is derived from the public key
# You can extract it from the CRX or PEM
```

**Method 2: After first upload to Chrome Web Store**
- Upload to Chrome Web Store (even as private)
- Copy the extension ID from the dashboard
- Format: 32-character string like `jlaio...meadf`

**Method 3: From unpacked load**
1. Load unpacked extension in Chrome
2. Go to `chrome://extensions/`
3. Enable Developer Mode
4. Copy the ID shown under the extension name

### Step 5: Configure Chrome Admin Console

1. **Login to Google Admin Console**: https://admin.google.com
2. Navigate to: **Devices** → **Chrome** → **Apps & extensions**
3. Select the organizational unit (e.g., "All users")
4. Click the **+** button to add policy
5. Select **Add by ID** or **Custom policy**

**ExtensionSettings Policy JSON:**

```json
{
  "YOUR_EXTENSION_ID": {
    "installation_mode": "force_installed",
    "update_url": "https://github.com/zant0p/tab-keeper/releases/download/v1.0.19/updates.xml"
  }
}
```

**Or use the inline editor:**
- Extension ID: `YOUR_EXTENSION_ID`
- Installation mode: `Force installed`
- Update URL: `https://github.com/zant0p/tab-keeper/releases/download/v1.0.19/updates.xml`

### Step 6: Update updates.xml with Extension ID

Edit `updates.xml` and replace `PENDING_EXTENSION_ID` with your actual extension ID:

```xml
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='YOUR_ACTUAL_EXTENSION_ID_HERE'>
    <updatecheck codebase='https://github.com/zant0p/tab-keeper/releases/download/v1.0.19/tab-keeper-1.0.19.crx' version='1.0.19' />
  </app>
</gupdate>
```

Upload the updated `updates.xml` to a permanent URL (or host on your own server).

---

## Alternative: Host on Your Own Server

If you prefer not to use GitHub Releases for hosting:

1. **Download the CRX** from GitHub Releases
2. **Upload to your server**: e.g., `http://192.168.1.123:8765/tab-keeper-1.0.19.crx`
3. **Host updates.xml** at: `http://192.168.1.123:8765/updates.xml`
4. **Configure Admin Console**:
   ```json
   {
     "YOUR_EXTENSION_ID": {
       "installation_mode": "force_installed",
       "update_url": "http://192.168.1.123:8765/updates.xml"
     }
   }
   ```

---

## Updating the Extension

For future updates:

1. **Update version in manifest.json**: `"version": "1.0.20"`
2. **Commit and tag**: `git tag v1.0.20 && git push origin v1.0.20`
3. **Workflow runs automatically** - new CRX built with same key
4. **Update the policy** in Admin Console (or use auto-update via updates.xml)

**⚠️ Critical:** Always use the same `extension.pem` key! Otherwise Chrome won't recognize it as an update and will install as a separate extension.

---

## Testing Before Deployment

### Load Unpacked (Development)
```bash
# Download the ZIP from releases
unzip tab-keeper-1.0.19.zip -d tab-keeper-test/

# In Chrome:
# 1. Go to chrome://extensions/
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select tab-keeper-test folder
```

### Install CRX Locally (Staging)
1. Download `tab-keeper-1.0.19.crx`
2. Drag and drop onto `chrome://extensions/` (Developer Mode enabled)
3. Verify functionality before enterprise deployment

---

## Troubleshooting

### "Extension signature invalid"
- Ensure you're using the same `extension.pem` key for all versions
- Re-download the key from previous release artifacts if lost

### "Update failed"
- Check that `updates.xml` has the correct extension ID
- Verify the CRX URL is publicly accessible (or accessible to your network)
- Check Chrome browser logs: `chrome://system/` → `extensions`

### Extension not force-installing
- Verify ExtensionSettings policy is applied to correct OU
- Check policy status: `chrome://policy/`
- Force refresh policies: `chrome://policy/` → "Reload policies"

---

## Manual Workflow Trigger

You can also run the workflow manually:

1. Go to: `https://github.com/zant0p/tab-keeper/actions/workflows/build-crx.yml`
2. Click "Run workflow"
3. Enter version number (e.g., `1.0.19`)
4. Click "Run workflow"

Useful for testing without creating a git tag.
