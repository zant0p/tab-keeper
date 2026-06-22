# Tab Keeper PWA - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Files Ready ✅

These files are now in your workspace:
- `manifest.webmanifest` - PWA manifest
- `sw-pwa.js` - Service Worker
- `pwa-install.js` - Install handler
- `icons/icon192.png` - PWA icon
- `icons/icon512.png` - PWA icon
- `options.html` - Updated with PWA meta tags

### Step 2: Test Locally

```bash
cd /root/.openclaw/workspace/tab-keeper

# Start local server (Python)
python3 -m http.server 8080

# Or use Node.js
npx serve .
```

Navigate to: `http://localhost:8080/options.html`

### Step 3: Install as PWA

**Chrome/Edge:**
1. Look for install icon (⊕) in address bar
2. Click **Install**
3. Opens in standalone window

**Or manually:**
- Chrome: ⋮ → Apps → Install Tab Keeper
- Edge: ⋯ → Apps → Install this site as an app

### Step 4: Deploy to Azure Static Web Apps

```bash
# Create dist folder with PWA files
mkdir -p /root/.openclaw/workspace/tab-keeper/dist-pwa
cd /root/.openclaw/workspace/tab-keeper

# Copy PWA files
cp options.html popup.html manifest.webmanifest sw-pwa.js pwa-install.js dist-pwa/
cp -r icons dist-pwa/
cp options.js popup.js dist-pwa/

# Deploy to Azure Static Web Apps
swa deploy ./dist-pwa --deployment-token YOUR_TOKEN
```

---

## 📱 What You Get

| Feature | Extension | PWA |
|---------|-----------|-----|
| Tab Management | ✅ Full API | ❌ Limited |
| Auto-Login | ✅ Content Scripts | ❌ Manual |
| Offline Support | ❌ No | ✅ Yes |
| Install Anywhere | ❌ Enterprise Only | ✅ Any Device |
| Mobile Support | ❌ Desktop Only | ✅ iOS/Android |
| Push Notifications | ❌ No | ✅ Ready |
| Background Sync | ⚠️ Limited | ✅ Ready |

---

## 🎯 Use Cases

### Use Extension When:
- Enterprise deployment needed
- Tab management required
- Auto-login to PointClickCare
- Managed Guest Sessions

### Use PWA When:
- Personal/testing use
- Mobile access needed
- Offline functionality desired
- Quick deployment without policies

---

## 🔧 Quick Commands

### Generate Icons
```bash
cd /root/.openclaw/workspace/tab-keeper
python3 << 'EOF'
from PIL import Image
img = Image.open('icons/icon128.png')
img.resize((192, 192), Image.LANCZOS).save('icons/icon192.png')
img.resize((512, 512), Image.LANCZOS).save('icons/icon512.png')
print('✅ Icons generated')
EOF
```

### Test Service Worker
```javascript
// Browser console
navigator.serviceWorker.register('/sw-pwa.js')
  .then(r => console.log('SW registered:', r.scope))
  .catch(e => console.error('SW failed:', e));
```

### Check PWA Status
```javascript
// Browser console
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('✅ Running as PWA');
} else {
  console.log('❌ Not installed as PWA');
}
```

---

## 📖 Full Documentation

- **PWA Deployment:** `docs/PWA-DEPLOYMENT.md`
- **Azure Blob Storage:** `docs/AZURE-BLOB-STORAGE-DEPLOYMENT.md`
- **CRX Error Fix:** `docs/CRX-ERROR-FIX-AZURE-GITHUB.md`
- **Enterprise Policies:** `docs/MANAGED-GUEST-SESSION-POLICIES.md`

---

## 💡 Pro Tips

1. **Hybrid Approach**: Deploy both extension AND PWA
   - Extension for enterprise devices
   - PWA for mobile/personal use

2. **Shared Code**: Both use same `options.js` and `popup.js`
   - Maintain once, deploy twice
   - Consistent UI/UX

3. **Progressive Enhancement**: 
   - Start with PWA for testing
   - Add extension for production
   - Same backend/config

4. **Version Sync**: Keep versions matched
   - Extension: `manifest.json` version
   - PWA: `manifest.webmanifest` + Service Worker cache name

---

**Status:** ✅ PWA support added to Tab Keeper v2.0.0  
**Next:** Test locally, then deploy to Azure Static Web Apps
