# Tab Keeper Auto-Update Guide

## ✅ Yes, Auto-Updates Work!

When you use the GitHub Actions workflow to build CRX files, **Chrome browsers will automatically update** when you release a new version.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. You create new release (git tag v1.0.20)                     │
│    ↓                                                            │
│ 2. GitHub Actions builds new CRX + updates.xml                 │
│    ↓                                                            │
│ 3. Chrome checks updates.xml every few hours                   │
│    ↓                                                            │
│ 4. Chrome sees version 1.0.20 > 1.0.19                         │
│    ↓                                                            │
│ 5. Chrome downloads & installs update silently                  │
│    ↓                                                            │
│ 6. Users restart browser → new version active                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Critical Requirements

### 1. **Same PEM Key for All Versions** ⚠️

Chrome verifies that updates are from the same developer by checking the signature. If you use different keys, Chrome treats it as a different extension.

**✅ DO:**
- Save `extension.pem` from first build
- Add it as `EXTENSION_KEY` secret in GitHub
- Use it for ALL future builds

**❌ DON'T:**
- Lose the PEM key
- Generate a new key for each version
- Commit PEM key to git (it's private!)

### 2. **Extension ID Must Match**

The extension ID is calculated from your PEM key's public key. It stays the same as long as you use the same key.

**After first build:**
```bash
# Download extension.pem from workflow artifacts
# Run this to get your extension ID:
openssl rsa -in extension.pem -pubout -outform DER 2>/dev/null | \
  openssl dgst -sha256 -binary | \
  tail -c 16 | \
  base32 | \
  tr 'A-Z' 'a-z' | \
  tr -d '='
```

**Or use the included script:**
```bash
chmod +x scripts/calculate-extension-id.sh
./scripts/calculate-extension-id.sh extension.pem
```

### 3. **updates.xml Must Be Accessible**

Chrome needs to fetch `updates.xml` from a public URL (or your internal network).

**GitHub Releases URL (Recommended):**
```
https://github.com/zant0p/tab-keeper/releases/download/v1.0.20/updates.xml
```

**Or self-host:**
```
http://192.168.1.123:8765/updates.xml
```

---

## Setup Steps

### Step 1: First Build (Generates Key)

1. Run workflow manually or tag release
2. Download `extension.pem` from artifacts
3. **BACKUP THIS FILE SECURELY!**
4. Calculate extension ID (see above)

### Step 2: Add Secret to GitHub

1. Go to: https://github.com/zant0p/tab-keeper/settings/secrets/actions
2. Click "New repository secret"
3. Name: `EXTENSION_KEY`
4. Value: Paste entire contents of `extension.pem`
5. Click "Add secret"

### Step 3: Configure Chrome Admin Console

**ExtensionSettings Policy:**
```json
{
  "YOUR_EXTENSION_ID_HERE": {
    "installation_mode": "force_installed",
    "update_url": "https://github.com/zant0p/tab-keeper/releases/latest/download/updates.xml"
  }
}
```

**Replace `YOUR_EXTENSION_ID_HERE` with your actual ID.**

### Step 4: Deploy to Test Machine

1. Install extension via Admin Console policy
2. Verify extension ID matches your calculated ID
3. Check `chrome://policy/` shows policy applied

### Step 5: Test Auto-Update

1. Create new version: Update `manifest.json` to `1.0.20`
2. Tag and push: `git tag v1.0.20 && git push origin v1.0.20`
3. Wait for workflow to complete (~2 min)
4. On test machine, wait up to 6 hours OR force check:
   - Go to `chrome://extensions/`
   - Enable Developer Mode
   - Click "Update" button

---

## Update Flow Timeline

| Time | What Happens |
|------|--------------|
| T+0 | You push tag v1.0.20 |
| T+2min | Workflow completes, release published |
| T+2min-6hrs | Chrome checks updates.xml (varies) |
| T+6hrs | Chrome downloads update in background |
| T+next restart | New version active |

**To force immediate update check:**
```
chrome://extensions/ → Developer Mode → "Update" button
```

---

## Troubleshooting

### Extension Not Updating

**Check 1: Version Numbers**
```bash
# In updates.xml, verify version is higher than installed
cat updates.xml
# Should show: version='1.0.20' if current is 1.0.19
```

**Check 2: Extension ID Match**
```bash
# In Chrome, go to chrome://extensions/
# Check ID matches what's in updates.xml appid=""
```

**Check 3: PEM Key Consistency**
```bash
# Make sure EXTENSION_KEY secret contains same key as first build
# Download old PEM from previous release artifacts and compare
```

**Check 4: URL Accessibility**
```bash
# Test that Chrome can reach updates.xml
curl -I https://github.com/zant0p/tab-keeper/releases/latest/download/updates.xml
# Should return HTTP 200
```

**Check 5: Chrome Policy Status**
```
chrome://policy/
→ Click "Reload policies"
→ Check ExtensionSettings shows your extension
```

### "Extension signature invalid" Error

This means the PEM key changed between versions.

**Fix:**
1. Download original `extension.pem` from first release
2. Update GitHub secret `EXTENSION_KEY` with original key
3. Rebuild the CRX with correct key

### Auto-Update Works But Users Still Have Old Version

Chrome only applies updates after browser restart.

**Solutions:**
- Wait for users to restart naturally
- Encourage restart via communication
- For kiosks: Schedule daily restarts

---

## Best Practices

### 1. **Backup PEM Key Multiple Places**
- Password manager
- Encrypted USB drive
- Secure cloud storage (not in git!)

### 2. **Use `/releases/latest/download/` URL**
```json
"update_url": "https://github.com/zant0p/tab-keeper/releases/latest/download/updates.xml"
```
This always points to most recent release - no need to update policy for each version!

### 3. **Test Before Wide Deployment**
- Deploy to test OU/machines first
- Verify auto-update works
- Then deploy to production OU

### 4. **Monitor Releases**
- Watch GitHub Actions workflow runs
- Verify updates.xml generated correctly
- Check release assets uploaded

### 5. **Version Numbering**
- Use semantic versioning: `1.0.19`, `1.0.20`, `1.1.0`, `2.0.0`
- Chrome compares numerically: `1.0.2` < `1.0.10` < `1.0.20`

---

## Example: Complete Update Cycle

```bash
# 1. Make changes to code
git add .
git commit -m "Fix bug in auto-login"

# 2. Update manifest.json version
# Edit manifest.json: "version": "1.0.20"
git add manifest.json
git commit -m "Bump version to 1.0.20"

# 3. Create release tag
git tag v1.0.20
git push origin dev --tags

# 4. Wait for workflow (~2 min)
# Watch: https://github.com/zant0p/tab-keeper/actions

# 5. Verify release created
# Check: https://github.com/zant0p/tab-keeper/releases

# 6. Chrome auto-updates within 6 hours
# Or force: chrome://extensions/ → Update
```

---

## Advanced: Self-Hosted Updates

If you prefer not to use GitHub Releases for hosting:

### Host on Your Server

```bash
# After workflow builds CRX, download and upload to your server
scp tab-keeper-1.0.20.crx user@server:/var/www/extensions/
scp updates.xml user@server:/var/www/extensions/

# Update Admin Console policy:
{
  "YOUR_EXTENSION_ID": {
    "installation_mode": "force_installed",
    "update_url": "https://your-server.com/extensions/updates.xml"
  }
}
```

### Benefits of Self-Hosting
- No reliance on GitHub availability
- Internal network only (more secure)
- Faster downloads on local network
- Full control over update timing

### Drawbacks
- More infrastructure to maintain
- Need to ensure high availability
- Manual upload step (unless you automate it)

---

## Questions?

- **Workflow issues:** Check `.github/workflows/build-crx.yml`
- **Policy questions:** See `README-ENTERPRISE.md`
- **Extension ID help:** Run `scripts/calculate-extension-id.sh`
