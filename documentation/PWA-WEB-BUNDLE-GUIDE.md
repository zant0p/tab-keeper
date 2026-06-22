# Tab Keeper PWA - Web Bundle for Chrome Enterprise

## 🎯 What You Need for Chrome Enterprise PWA

To deploy a PWA as an **Isolated Web App** in Chrome Enterprise, you need:

1. **Web Bundle File** (`.webbundle`) - Signed package of your PWA
2. **Web Bundle ID** - Unique identifier (like extension ID)
3. **Update Manifest URL** (`updates.xml`) - For auto-updates

---

## 📦 Step 1: Install Web Bundler

```bash
# Install web-bundler CLI tool
npm install -g web-bundler

# Or use Python bundler
pip install webbundle
```

---

## 🔧 Step 2: Create Web Bundle

### Option A: Using web-bundler (Node.js)

```bash
cd /root/.openclaw/workspace/tab-keeper

# Create web bundle
web-bundler bundle \
  --input ./ \
  --output dist-pwa/tab-keeper-pwa.webbundle \
  --base-url https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/ \
  --manifest pwa-manifest.json \
  --version 2.0.0
```

### Option B: Using Python webbundle

```bash
cd /root/.openclaw/workspace/tab-keeper

# Create bundle directory
mkdir -p dist-pwa
cp options.html popup.html manifest.webmanifest sw-pwa.js pwa-install.js dist-pwa/
cp -r icons dist-pwa/
cp options.js popup.js dist-pwa/

# Create web bundle
python3 << 'EOF'
import webbundle
import json
from pathlib import Path

# Create bundle
bundle = webbundle.Bundle(
    base_url='https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/',
    manifest_path='pwa-manifest.json'
)

# Add files
for file in Path('dist-pwa').glob('**/*'):
    if file.is_file():
        bundle.add_file(str(file), str(file.relative_to('dist-pwa')))

# Sign and save
bundle.sign_and_save('dist-pwa/tab-keeper-pwa.webbundle')
print(f"✅ Created web bundle: dist-pwa/tab-keeper-pwa.webbundle")
print(f"🆔 Web Bundle ID: {bundle.web_bundle_id}")
EOF
```

### Option C: Manual Creation (Advanced)

```bash
# Create signed web bundle manually
python3 << 'EOF'
import hashlib
import base64
import json
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

# Generate key pair (do this once, save the key!)
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
    backend=default_backend()
)

# Save private key
pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

with open('web-bundle-key.pem', 'wb') as f:
    f.write(pem)

print("✅ Private key saved to: web-bundle-key.pem")
print("⚠️  KEEP THIS KEY SAFE! It determines your Web Bundle ID")

# Calculate Web Bundle ID
public_key = private_key.public_key()
public_key_pem = public_key.public_bytes(
    encoding=serialization.Encoding.SubjectPublicKeyInfo,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

# Hash public key to get bundle ID
hash_obj = hashlib.sha256(public_key_pem)
hash_bytes = hash_obj.digest()
bundle_id = base64.urlsafe_b64encode(hash_bytes).rstrip(b'=').decode('utf-8')

print(f"\n🆔 Your Web Bundle ID: {bundle_id}")
print("\nUse this ID in Chrome Admin Console policies")
EOF
```

---

## 🆔 Step 3: Get Your Web Bundle ID

After creating the bundle, extract the ID:

```bash
# Extract Web Bundle ID from bundle
web-bundler id dist-pwa/tab-keeper-pwa.webbundle

# Or calculate from public key
openssl rsa -in web-bundle-key.pem -pubout -outform DER 2>/dev/null | \
  openssl dgst -sha256 -binary | \
  tail -c 16 | \
  base32 | \
  tr 'A-Z' 'a-z' | \
  tr -d '='
```

**Your Web Bundle ID will look like:** `abcdefghijklmnop1234567890`

⚠️ **Important**: The Web Bundle ID is determined by your signing key. Keep the key safe!

---

## 📝 Step 4: Create Update Manifest

Update the `pwa-updates.xml` file with your actual URLs:

```xml
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='YOUR_WEB_BUNDLE_ID_HERE'>
    <updatecheck codebase='https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/tab-keeper-pwa.webbundle' version='2.0.0' />
  </app>
</gupdate>
```

---

## 🏢 Step 5: Configure Chrome Enterprise Policy

Add the Isolated Web App policy to Chrome Admin Console:

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

### Policy Locations

**Chrome Admin Console:**
1. Devices → Chrome → Settings → User & Browser Settings
2. Scroll to **Isolated Web Apps** section
3. Add your Web Bundle ID and update URL

**Linux Local Policy:**
File: `/etc/opt/chrome/policies/managed/isolated-web-apps.json`

```json
{
  "IsolatedWebAppList": [
    {
      "id": "YOUR_WEB_BUNDLE_ID_HERE",
      "update_url": "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/pwa-updates.xml"
    }
  ]
}
```

**Windows Registry:**
```reg
[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\IsolatedWebAppList]
"1"="YOUR_WEB_BUNDLE_ID_HERE:https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/pwa-updates.xml"
```

---

## ☁️ Step 6: Upload to Azure Blob Storage

```bash
# Upload web bundle
az storage blob upload \
  --account-name YOUR_STORAGE_ACCOUNT \
  --container-name YOUR_CONTAINER \
  --name tab-keeper-pwa.webbundle \
  --file ./dist-pwa/tab-keeper-pwa.webbundle \
  --content-type application/webbundle

# Upload update manifest
az storage blob upload \
  --account-name YOUR_STORAGE_ACCOUNT \
  --container-name YOUR_CONTAINER \
  --name pwa-updates.xml \
  --file ./pwa-updates.xml \
  --content-type application/xml

# Set container permissions
az storage container set-permission \
  --account-name YOUR_STORAGE_ACCOUNT \
  --name YOUR_CONTAINER \
  --public-access blob
```

---

## ✅ Step 7: Verify Installation

1. **Check policy applied:**
   ```
   chrome://policy/
   ```
   Click "Reload policies" → Status should be "Mandatory"

2. **Check Isolated Web Apps:**
   ```
   chrome://isolated-web-apps/
   ```
   Tab Keeper PWA should appear in the list

3. **Launch the app:**
   - Should open in standalone window
   - No browser UI
   - Works offline (Service Worker active)

---

## 🔄 Update Workflow

When you need to update the PWA:

1. **Update version** in `pwa-manifest.json`
2. **Re-build web bundle** with new version
3. **Upload new `.webbundle`** to Azure
4. **Update `pwa-updates.xml`** with new version number
5. **Chrome auto-updates** within a few hours

---

## 🛠️ Complete Build Script

Save as `scripts/build-pwa-bundle.sh`:

```bash
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="${EXTENSION_DIR}/dist-pwa"

echo "📦 Building Tab Keeper PWA Web Bundle..."

# Create dist directory
mkdir -p "$DIST_DIR"

# Copy PWA files
cp "$EXTENSION_DIR"/options.html \
   "$EXTENSION_DIR"/popup.html \
   "$EXTENSION_DIR"/pwa-manifest.json \
   "$EXTENSION_DIR"/sw-pwa.js \
   "$EXTENSION_DIR"/pwa-install.js \
   "$DIST_DIR/"

cp -r "$EXTENSION_DIR/icons" "$DIST_DIR/"
cp "$EXTENSION_DIR"/options.js "$EXTENSION_DIR"/popup.js "$DIST_DIR/"

# Generate web bundle (if web-bundler available)
if command -v web-bundler &> /dev/null; then
  echo "✅ Creating web bundle with web-bundler..."
  
  web-bundler bundle \
    --input "$DIST_DIR" \
    --output "$DIST_DIR/tab-keeper-pwa.webbundle" \
    --base-url "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/" \
    --manifest pwa-manifest.json \
    --version 2.0.0
  
  # Extract Web Bundle ID
  WEB_BUNDLE_ID=$(web-bundler id "$DIST_DIR/tab-keeper-pwa.webbundle")
  
  echo ""
  echo "✅ Web bundle created: $DIST_DIR/tab-keeper-pwa.webbundle"
  echo "🆔 Web Bundle ID: $WEB_BUNDLE_ID"
  echo ""
  echo "Next steps:"
  echo "1. Upload .webbundle to Azure Blob Storage"
  echo "2. Update pwa-updates.xml with your Web Bundle ID"
  echo "3. Configure Chrome Admin Console with IsolatedWebAppList policy"
else
  echo ""
  echo "⚠️  web-bundler not found. Install with: npm install -g web-bundler"
  echo ""
  echo "Manual steps:"
  echo "1. Install web-bundler: npm install -g web-bundler"
  echo "2. Re-run this script"
  exit 1
fi
```

Make it executable:
```bash
chmod +x scripts/build-pwa-bundle.sh
```

---

## 📊 Comparison: Extension vs Isolated Web App

| Feature | Chrome Extension | Isolated Web App (PWA) |
|---------|------------------|------------------------|
| **Package Format** | `.crx` | `.webbundle` |
| **Identifier** | Extension ID | Web Bundle ID |
| **Signing** | PEM key | Web Bundle signing key |
| **API Access** | Full `chrome.*` APIs | Limited (PWA APIs only) |
| **Enterprise Policy** | ExtensionInstallForcesList | IsolatedWebAppList |
| **Update Manifest** | `updates.xml` | `pwa-updates.xml` |
| **Auto-Update** | ✅ Yes | ✅ Yes |
| **Force Install** | ✅ Yes | ✅ Yes |
| **Offline Support** | ⚠️ Limited | ✅ Full (Service Worker) |
| **Mobile Support** | ❌ Desktop only | ✅ iOS/Android/Desktop |
| **Installation Size** | Small | Larger (includes all assets) |

---

## 🐛 Troubleshooting

### Web Bundle ID Not Recognized

**Check:**
1. Bundle was signed correctly
2. Using correct ID from bundle (not extension ID)
3. Policy JSON syntax is valid

### Isolated Web App Not Installing

**Check:**
1. Policy shows as "Mandatory" in `chrome://policy/`
2. Web Bundle URL is accessible (test in browser)
3. Content-Type is `application/webbundle`
4. Update manifest is valid XML

### Update Not Propagating

**Check:**
1. Version number increased in manifest
2. Update manifest accessible
3. Wait a few hours for Chrome to check

---

## 📖 References

- [Isolated Web Apps Documentation](https://developer.chrome.com/docs/extensions/reference/isolatedWebApps/)
- [Web Bundle Specification](https://wicg.github.io/webpackage/)
- [Chrome Enterprise Policies](https://chromeenterprise.google/policies/#IsolatedWebAppList)
- [PWA Builder](https://www.pwabuilder.com/)

---

**Your Next Steps:**
1. Install `web-bundler`: `npm install -g web-bundler`
2. Run build script: `./scripts/build-pwa-bundle.sh`
3. Note the Web Bundle ID
4. Upload to Azure with correct MIME type
5. Configure Chrome Admin Console policy

**Extension ID (CRX):** `4nsinwkb7e5khfdund5hlutwfa`  
**Web Bundle ID (PWA):** Will be generated when you create the bundle
