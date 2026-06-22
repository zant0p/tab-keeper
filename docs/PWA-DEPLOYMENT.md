# Tab Keeper - PWA + Chrome Extension Hybrid Deployment

## Overview

Tab Keeper v2.0.0 now supports **dual deployment**:

1. **Chrome Extension** (`.crx`) - Full extension API access
2. **Progressive Web App (PWA)** - Installable web app with offline support

Both share the same codebase and can be deployed to the same hosting platform.

---

## 🎯 What's New in PWA Mode

### Features
- ✅ **Install as standalone app** (no browser UI)
- ✅ **Offline support** via Service Worker caching
- ✅ **Push notifications** (future-ready)
- ✅ **Background sync** (future-ready)
- ✅ **Home screen icon** on mobile/desktop
- ✅ **Auto-update** via Service Worker
- ✅ **Same UI** as extension popup/options

### Limitations vs Extension
- ❌ No `chrome.tabs` API (can't manage other tabs)
- ❌ No `chrome.storage` (uses localStorage instead)
- ❌ No content scripts (can't auto-login to PCC)
- ❌ No background service worker (limited background functionality)

### Best Use Cases
- **Extension**: Enterprise deployment, tab management, auto-login
- **PWA**: Personal use, testing, mobile access, offline demo

---

## 📦 Files Added for PWA Support

```
tab-keeper/
├── manifest.webmanifest      # PWA manifest
├── sw-pwa.js                 # Service Worker
├── pwa-install.js            # PWA install handler
├── options.html              # Updated with PWA meta tags
└── docs/PWA-DEPLOYMENT.md    # This file
```

---

## 🚀 Deploy as PWA

### Step 1: Upload to Web Server

Upload these files to your web server (Azure Static Web Apps, GitHub Pages, Netlify, etc.):

```
├── options.html
├── popup.html
├── manifest.webmanifest
├── sw-pwa.js
├── pwa-install.js
├── options.js
├── popup.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   ├── icon192.png
│   └── icon512.png
```

### Step 2: Configure HTTPS

PWA requires **HTTPS** (or `localhost` for testing).

- Azure Static Web Apps: HTTPS automatic
- GitHub Pages: HTTPS automatic
- Netlify/Vercel: HTTPS automatic

### Step 3: Test PWA Installation

1. Navigate to your deployed URL
2. Look for install prompt (Chrome/Edge)
3. Click "Install" or use browser menu:
   - Chrome: ⋮ → Apps → Install Tab Keeper
   - Edge: ⋯ → Apps → Install this site as an app
   - Safari: Share → Add to Home Screen

### Step 4: Verify Installation

After installing:
- Opens in standalone window (no browser UI)
- Works offline (Service Worker active)
- Shows in app launcher/start menu
- Can be pinned to taskbar/dock

---

## 🔧 Generate PWA Icons

Create larger icons for PWA:

```bash
cd /root/.openclaw/workspace/tab-keeper

# Generate 192x192 and 512x512 from existing icon
python3 << 'EOF'
from PIL import Image
import os

# Load base icon
base_icon = 'icons/icon128.png'
if os.path.exists(base_icon):
    img = Image.open(base_icon)
    
    # Generate 192x192
    img_192 = img.resize((192, 192), Image.LANCZOS)
    img_192.save('icons/icon192.png')
    print('✅ Created icons/icon192.png')
    
    # Generate 512x512
    img_512 = img.resize((512, 512), Image.LANCZOS)
    img_512.save('icons/icon512.png')
    print('✅ Created icons/icon512.png')
else:
    print('⚠️ Base icon not found, run generate-icons.py first')
EOF
```

---

## 🌐 Deployment Platforms

### Azure Static Web Apps (Recommended)

```bash
# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Deploy
swa deploy ./dist --deployment-token YOUR_TOKEN
```

**Configuration:**
- Build output: `/dist`
- API location: (empty)
- App location: `/dist`

### GitHub Pages

1. Push to `main` branch
2. Go to Settings → Pages
3. Source: Deploy from branch → `main` → `/docs` folder
4. Enable GitHub Actions for auto-deploy

### Netlify

1. Connect GitHub repo
2. Build command: (none needed)
3. Publish directory: `/dist`
4. Deploy!

### Vercel

```bash
npm install -g vercel
vercel --prod
```

---

## 📱 Mobile Testing

### iOS Safari
1. Open site in Safari
2. Tap **Share** button
3. Scroll down → **Add to Home Screen**
4. Name it "Tab Keeper"
5. Tap **Add**

### Android Chrome
1. Open site in Chrome
2. Tap **⋮** menu
3. Tap **Install app** or **Add to Home screen**
4. Confirm installation

### Desktop Chrome/Edge
1. Look for install icon in address bar (⊕)
2. Or go to ⋮ → Apps → Install Tab Keeper
3. Click **Install**

---

## 🔄 Update Strategy

### Extension Updates
- Auto-updates via `updates.xml`
- Chrome checks every few hours
- Force update: `chrome://extensions/` → Update now

### PWA Updates
- Service Worker checks for updates on load
- New version installs in background
- Activates on next page load
- Users may need to refresh/restart app

### Version Sync
Keep both versions in sync:
- Same version number in `manifest.json` and `manifest.webmanifest`
- Same `CACHE_NAME` in `sw-pwa.js`
- Document changes in `CHANGES-vX.X.X.md`

---

## 🧪 Testing Checklist

Before deploying PWA:

- [ ] Icons generated (192x192, 512x512)
- [ ] `manifest.webmanifest` linked in HTML
- [ ] Service Worker registered successfully
- [ ] Install prompt appears
- [ ] App installs and opens standalone
- [ ] Works offline (test with DevTools → Network Offline)
- [ ] Cache updates on version change
- [ ] All buttons/features work in PWA mode

---

## 🐛 Troubleshooting

### Install Prompt Not Showing

**Check:**
1. HTTPS enabled?
2. `manifest.webmanifest` valid and accessible?
3. Service Worker registered?
4. User interaction occurred first?

**Debug:**
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(console.log);
fetch('manifest.webmanifest').then(r => r.json()).then(console.log);
```

### Service Worker Not Caching

**Check:**
1. SW file path correct? (`/sw-pwa.js`)
2. Assets paths correct in `ASSETS_TO_CACHE`?
3. No CORS issues?

**Debug:**
```javascript
// Check cache
caches.keys().then(console.log);
caches.open('tab-keeper-v2.0.0').then(c => c.keys().then(console.log));
```

### App Not Opening Standalone

**Check:**
1. `display: "standalone"` in manifest?
2. Installed from HTTPS origin?
3. Cleared old cache/SW?

**Force standalone test:**
```javascript
// In console before reload
window.matchMedia('(display-mode: standalone)').matches
// Should return true after install
```

---

## 📊 Analytics & Monitoring

Track PWA installations:

```javascript
// In pwa-install.js
window.addEventListener('appinstalled', () => {
  // Send analytics event
  gtag('event', 'pwa_installed', {
    'event_category': 'PWA',
    'event_label': 'Tab Keeper v2.0.0'
  });
});
```

Monitor Service Worker updates:

```javascript
// In sw-pwa.js
self.addEventListener('updatefound', (event) => {
  console.log('[Tab Keeper PWA] New version available');
  // Notify user of update
});
```

---

## 🎨 Customization

### Change Theme Color

Edit `manifest.webmanifest`:
```json
{
  "background_color": "#667eea",
  "theme_color": "#764ba2"
}
```

Update meta tag in HTML:
```html
<meta name="theme-color" content="#764ba2">
```

### Customize Install Button

Edit `pwa-install.js`:
```javascript
this.installButton.style.cssText = `
  /* Your custom styles */
`;
```

---

## 📖 References

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/)

---

**Next Steps:**
1. Generate larger icons (192x192, 512x512)
2. Test PWA installation locally
3. Deploy to staging environment
4. Test on multiple devices/browsers
5. Deploy to production
