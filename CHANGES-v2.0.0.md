# Tab Keeper v2.0.0 - What Changed

## 🎯 Purpose
Built specifically for PointClickCare deployment in healthcare facilities. Maintains two tabs (primary PCC system + secondary login) with automatic authentication.

## 🔑 Key Changes from v1.0.19

### 1. Two Variants (AL & SNF)
- **AL (Assisted Living)**: username=`alstaff`, password=`alstaff`
- **SNF (Skilled Nursing Facility)**: username=`snf`, password=`snf`
- Credentials are **built into the extension** - no password manager needed

### 2. New URLs
- **Primary**: `https://10.1.129.207/Arial/#/login` (internal IP)
- **Secondary**: `https://login.pointclickcare.com/poc/userLogin.xhtml`

### 3. Timer in Seconds
- Changed from minutes to **seconds** (default: 300 seconds = 5 minutes)
- Timer only refocuses to **primary tab** (not secondary)

### 4. Dual-Tab Management
- Keeps **both primary and secondary tabs alive**
- Ensures only **1 copy of each tab** (prevents duplicates)
- Auto-reopens if either tab is closed

### 5. AL-Specific Feature
- Automatically **dismisses Chrome's "password changed due to breach" popup**
- Only active in AL variant

### 6. Simplified Deployment
- Removed managed storage dependency
- Credentials hardcoded per variant
- GitHub Actions builds **both variants** automatically

## 📦 Build Output

The GitHub Actions workflow now produces:

```
tab-keeper-AL-2.0.0.crx       # Assisted Living variant
tab-keeper-AL-2.0.0.zip
updates-AL.xml

tab-keeper-SNF-2.0.0.crx      # Skilled Nursing Facility variant
tab-keeper-SNF-2.0.0.zip
updates-SNF.xml
```

## 🚀 Quick Deploy

1. **Download CRX** from GitHub Releases
2. **Upload to your server** or use GitHub URL
3. **Configure Chrome Admin Console**:
   ```json
   {
     "ExtensionSettings": {
       "<EXTENSION_ID>": {
         "installation_mode": "force_installed",
         "update_url": "https://github.com/zant0p/tab-keeper/releases/download/v2.0.0/updates-AL.xml"
       }
     }
   }
   ```
4. **Replace `<EXTENSION_ID>`** with actual ID from CRX file

## 📝 Testing Checklist

- [ ] Primary tab auto-logs in with credentials
- [ ] Secondary tab stays alive (no login needed)
- [ ] Only 1 copy of each tab exists
- [ ] Timer counts down in seconds
- [ ] Auto-switches to primary when timer expires
- [ ] Closed tabs auto-reopen
- [ ] AL variant dismisses breach popup

## 📄 Files Changed

- `manifest.json` - Updated to v2.0.0, new permissions
- `background.js` - Complete rewrite with variants, creds, dual-tab support
- `content.js` - Improved login detection, breach popup handler
- `popup.html/js` - Shows seconds, displays variant
- `.github/workflows/build-crx.yml` - Builds both AL & SNF variants
- `docs/DEPLOYMENT-GUIDE.md` - New comprehensive deployment guide

## ⚠️ Important Notes

- **No more managed storage** - credentials are hardcoded
- **Choose variant before building** - set `VARIANT` constant in `background.js`
- **GitHub Actions builds both** - no manual variant switching needed for releases
- **Internal IP** - primary URL is on internal network (10.1.129.207)

---

**Status:** ✅ Pushed to dev branch
**Next Step:** Test workflow build, then tag v2.0.0 for release
