# Tab Keeper - Chrome Web Store Publishing Guide

## ✅ Pre-Publishing Checklist

### Required Files (All Complete ✅)
- [x] `manifest.json` - Updated with icons and version 1.0.0
- [x] `icons/` - Icon set (16px, 48px, 128px)
- [x] `privacy-policy.md` - Privacy policy (required for credential storage)
- [x] `background.js` - Service worker
- [x] `content.js` - Content script
- [x] `popup.html` + `popup.js` - Extension popup
- [x] `options.html` + `options.js` - Settings page
- [x] `README.md` - Documentation

### Required for CWS Submission
- [ ] **Developer Account** - $5 one-time fee
- [ ] **Promo Images** - See specifications below
- [ ] **Screenshots** - At least 1 (1280x800 or 640x400)
- [ ] **Description** - Compelling store listing

---

## 📝 Step-by-Step Publishing Process

### Step 1: Register Developer Account

1. Go to: https://chrome.google.com/webstore/devconsole
2. Sign in with your Google account
3. Pay the **$5 one-time registration fee**
4. Complete developer profile

**Note:** One account can publish up to 20 extensions.

### Step 2: Prepare Store Listing Assets

#### Screenshots (Required)
- **Minimum:** 1 screenshot
- **Recommended:** 2-4 screenshots
- **Sizes:** 1280x800 or 640x400 (PNG or JPEG)
- **Capture:**
  - Extension popup
  - Options/settings page
  - Extension in action (target tab visible)

#### Promo Tile (Optional but Recommended)
- **Size:** 440x280 pixels
- **Format:** PNG or JPEG
- **Purpose:** Featured placements

#### Small Promo Tile (Optional)
- **Size:** 920x380 pixels
- **Format:** PNG or JPEG

### Step 3: Create Store Listing

1. **Basic Info:**
   - **Name:** Tab Keeper
   - **Short Description:** Keeps a designated tab active, auto-switches back after inactivity
   - **Category:** Productivity

2. **Full Description:**
   ```
   Tab Keeper helps you maintain focus on a specific tab by automatically switching back after a configurable period of inactivity. Perfect for:
   
   • Monitoring dashboards
   • Kiosk displays
   • Keeping important pages active
   • Auto-login for monitored systems
   
   Features:
   ✅ Automatic tab switching after inactivity
   ✅ Configurable timer (1-60 minutes)
   ✅ Auto-login support for credential-based sites
   ✅ Easy-to-use settings page
   ✅ Lightweight background operation
   
   Privacy: All data stored locally. No data collection or transmission.
   
   How to use:
   1. Click extension icon → Settings
   2. Enter your target URL
   3. Set return timer (default: 10 min)
   4. Optionally configure auto-login credentials
   5. Enable Tab Keeper
   
   The extension will monitor your active tab and switch back to the target URL when the timer expires.
   ```

3. **Privacy Policy:**
   - Upload `privacy-policy.md` content
   - Or host on a website and provide URL

4. **Upload Screenshots & Promo Images**

### Step 4: Package & Upload

**Option A: Upload ZIP (Recommended)**
```bash
cd path/to/your/chrome-extensions/
zip -r tab-keeper-cws.zip tab-keeper/ -x "*.git*" -x "*.md" -x "generate-icons.py"
```

**Option B: Upload CRX**
1. Go to `chrome://extensions/`
2. Enable Developer mode
3. Click "Pack extension"
4. Select tab-keeper folder
5. Upload generated `.crx` file

### Step 5: Submit for Review

1. Fill out content rating questionnaire
2. Confirm you have rights to all content
3. Submit for review

**Review Time:** Typically 1-3 business days

---

## 🎨 Asset Generation

### Generate Icons (Already Done ✅)
```bash
cd path/to/your/chrome-extensions/tab-keeper
python3 generate-icons.py
```

### Capture Screenshots

**Method 1: Manual Screenshots**
1. Load extension in Chrome (Developer mode)
2. Configure with test URL
3. Use screenshot tool (Print Screen, Snipping Tool, etc.)
4. Crop to required dimensions

**Method 2: Automated with Browser Tool**
Use OpenClaw browser tool to capture extension UI.

### Create Promo Tile (Optional)

Use Canva, Figma, or similar tools:
- **Dimensions:** 440x280px
- **Include:** Extension name + simple visual
- **Style:** Clean, professional, matches icon colors

---

## ⚠️ Important Notes

### Content Policy Compliance
- ✅ No misleading functionality
- ✅ No hidden features
- ✅ Accurate description
- ✅ Privacy policy provided
- ⚠️ **Credential storage disclosed** (done in privacy policy)

### Security Considerations
Since Tab Keeper stores credentials:
- CWS may flag for additional review
- Be transparent in privacy policy
- Consider adding a warning in options page
- Users may see "This extension requests access to all websites"

### Version Updates
- Increment version in `manifest.json` for each update
- Document changes in README
- Test thoroughly before each submission

---

## 🔗 Useful Links

- **Chrome Web Store Developer Dashboard:** https://chrome.google.com/webstore/devconsole
- **Developer Program Policies:** https://developer.chrome.com/webstore/program-policies
- **Content Policies:** https://developer.chrome.com/webstore/content-policies
- **Best Practices:** https://developer.chrome.com/webstore/best-practices

---

## 📦 Quick Package Command

```bash
# Create CWS-ready ZIP (excludes dev files)
cd path/to/your/chrome-extensions/
zip -r tab-keeper-cws.zip tab-keeper/ \
  -x "*.git*" \
  -x "tab-keeper/*.md" \
  -x "tab-keeper/generate-icons.py" \
  -x "tab-keeper/icons/*.xcf" \
  -x "tab-keeper/*.pyc"

# Verify contents
unzip -l tab-keeper-cws.zip
```

---

## 🚀 After Publishing

1. **Share Extension URL** with users
2. **Monitor Reviews** in developer dashboard
3. **Update Regularly** based on feedback
4. **Track Installation Stats** in dashboard

**Extension URL Format:**
`https://chrome.google.com/webstore/detail/tab-keeper/[EXTENSION_ID]`

---

**Good luck with your submission! 🎉**
