# Tab Keeper Kiosk Deployment Guide

## ✅ Solution: Tab Keeper Extension as Kiosk App

**This is the definitive deployment method.** Tab Keeper runs as a standalone CRX kiosk app on ChromeOS devices. No user accounts, no auto-signin, no PWA configuration needed.

---

## 🎯 How It Works

1. **Device boots** → ChromeOS loads kiosk mode
2. **Tab Keeper launches** → Runs as the kiosk app (CRX type 1)
3. **onStartup fires** → `background.js` opens both target URLs automatically
4. **Content scripts inject** → Auto-login happens via built-in credentials
5. **Timer runs** → Extension switches between tabs, keeps them alive
6. **Auto-reopen** → If tabs close, Tab Keeper reopens them

---

## 📋 Prerequisites

- ChromeOS devices enrolled in Chrome Enterprise
- Admin access to Google Admin Console
- Tab Keeper v2.0.2+ deployed to GitHub releases
- All devices in the same Organizational Unit (OU)

---

## 🔧 Step-by-Step Configuration

### **Step 1: Verify DeviceLocalAccounts Policy**

Your `DeviceLocalAccounts` should already have Tab Keeper configured:

```json
{
  "DeviceLocalAccounts": [{
    "id": "gjjokecbclbdhnhldnhfdmbagkbgmnia",
    "kiosk_app_id": "gjjokecbclbdhnhldnhfdmbagkbgmnia",
    "kiosk_app_update_url": "https://github.com/zant0p/tab-keeper/releases/download/*/updates.xml",
    "type": 1
  }]
}
```

**Verify in Admin Console:**
- Go to **Devices → Chrome → Settings**
- Select your OU
- Scroll to **Kiosk settings**
- You should see Tab Keeper listed as an available kiosk app

---

### **Step 2: Remove Web Kiosk App**

If you have a web kiosk app configured, **remove it**:

1. Go to **Devices → Chrome → Apps & extensions**
2. Select your OU
3. Find the web kiosk entry for `https://10.1.129.207/Arial/#/login`
4. Click the **trash can** or **"Remove"** button
5. Click **Save**

⚠️ **Critical:** You cannot have both a web kiosk and CRX kiosk for the same use case. Remove the web kiosk.

---

### **Step 3: Set Auto-Launch Kiosk App**

Configure Tab Keeper as the auto-launch app:

1. Go to **Devices → Chrome → Settings**
2. Select your OU
3. Scroll to **Kiosk settings**
4. Under **"Auto-launch kiosk app"**, select:
   - **Tab Keeper** (the extension with ID `gjjokecbclbdhnhldnhfdmbagkbgmnia`)
5. Click **Save**

---

### **Step 4: Configure ExtensionInstallSources**

Allow Chrome to install from your self-hosted location:

1. Go to **Devices → Chrome → Apps & extensions**
2. Select your OU
3. Scroll to **"Additional app settings"**
4. Find **"App and extension install sources"**
5. Click **"Configure"** or **"Add"**
6. Enter the wildcard URL:
   ```
   https://github.com/zant0p/tab-keeper/releases/download/*/updates.xml
   ```
7. Click **Save**

---

### **Step 5: Configure Tab Keeper Policies**

Force-install and configure Tab Keeper:

1. Still in **Apps & extensions** with your OU selected
2. Find **Tab Keeper** in the apps list
3. **Click on Tab Keeper** to open the side panel
4. Configure these settings:

   **Installation policy:** `Force install`
   
   **Update URL:** 
   ```
   https://github.com/zant0p/tab-keeper/releases/download/*/updates.xml
   ```
   
   **Managed configuration** (paste this JSON):
   ```json
   {
     "primaryUrl": "https://10.1.129.207/Arial/#/login",
     "secondaryUrl": "https://login.pointclickcare.com/poc/userLogin.xhtml",
     "timerMinutes": 10,
     "autoLoginEnabled": true,
     "username": "",
     "password": ""
   }
   ```

5. Click **Save**

---

### **Step 6: Block Other Extensions (Optional but Recommended)**

Prevent users from installing other extensions:

**Option A: Allow/Block Mode**
1. In **Apps & extensions**, find **"Allow/block mode"** at the top
2. Select: **"Block all apps, admin manages allowlist"**
3. Ensure only Tab Keeper is in your allowlist

**Option B: ExtensionInstallBlocklist**
1. Go to **Additional app settings**
2. Find **"ExtensionInstallBlocklist"**
3. Set to: `["*"]`
4. Click **Save**

---

### **Step 7: Configure Power & Display Settings**

Keep kiosks running 24/7:

1. Go to **Devices → Chrome → Settings → Device settings**
2. Select your OU
3. Configure:

   **Power settings:**
   - When idle: `Keep display on`
   - When lid is closed: `Keep running`
   - Sleep when inactive: `Never`

   **Display settings:**
   - Screen rotation: `0°` (landscape)
   - Display size: Appropriate for your screens

4. Click **Save**

---

## 🚀 Deploy to Test Device

### **On One Test ChromeOS Device:**

1. **Powerwash the device** (if needed):
   - At login screen: **Ctrl + Alt + Shift + R**
   - Click **"Powerwash"** → **"Restart"**

2. **Ensure device is enrolled** in Chrome Enterprise

3. **Move device to your OU**:
   - Admin Console → Devices → Chrome → Devices
   - Select device → **Move to** → Your OU

4. **Reboot the device**

5. **Observe boot process:**
   - Device should auto-launch Tab Keeper kiosk app
   - Both target URLs should open automatically
   - Auto-login should happen via content scripts
   - Tab Keeper should switch between tabs per timer

---

## ✅ Verification Checklist

On the test device, verify:

- [ ] **Kiosk launches automatically** → No login screen, goes straight to Tab Keeper
- [ ] **Both tabs open** → `https://10.1.129.207/Arial/#/login` AND `https://login.pointclickcare.com/poc/userLogin.xhtml`
- [ ] **Auto-login works** → Credentials are entered automatically
- [ ] **Tab switching works** → Extension switches between tabs per timer
- [ ] **Auto-reopen works** → Close a tab, it reopens automatically
- [ ] **No sleep** → Display stays on indefinitely
- [ ] **Policies applied** → Check `chrome://policy` → Reload policies

---

## 🔍 Troubleshooting

### **Kiosk doesn't launch Tab Keeper**

**Check:**
1. `chrome://policy` → Is `DeviceLocalAccounts` present?
2. Kiosk settings → Is Tab Keeper selected as auto-launch app?
3. Device OU → Is device in the correct OU?

**Fix:**
- Wait 10-15 minutes for policies to propagate
- Reboot device
- Re-check policy status

---

### **Tabs don't open automatically**

**Check:**
1. `chrome://extensions` → Find Tab Keeper → Click "Service Worker" → Inspect
2. Console logs → Look for `[Tab Keeper] Extension started` and `[Tab Keeper] Background script loaded`
3. Check for errors in console

**Expected logs:**
```
[Tab Keeper] Background script loaded
[Tab Keeper] Primary tab not found - creating it
[Tab Keeper] Secondary tab not found - creating it
```

**Fix:**
- If no logs appear, extension isn't running as kiosk
- Verify `DeviceLocalAccounts` policy is applied
- Ensure Tab Keeper is set as auto-launch app (not web kiosk)

---

### **Auto-login doesn't work**

**Check:**
1. `content.js` → Does it have login logic?
2. Credentials → Do they match your system? (`alstaff`/`alstaff`)
3. Login page structure → Has it changed?

**Fix:**
- Inspect content script execution in DevTools
- Verify credentials are correct for your environment
- Update selectors in `content.js` if page structure changed

---

### **Tabs don't stay open / Keep closing**

**Check:**
1. `chrome://extensions` → Tab Keeper → Check for errors
2. Alarm system → Is timer running?
3. Power settings → Is display sleep enabled?

**Fix:**
- Check power settings (keep display on)
- Verify Tab Keeper's managed config has correct timerMinutes
- Check extension logs for alarm firing

---

## 📊 Roll Out to All 20 Devices

Once test device works perfectly:

### **Option A: Push Policies to All Devices**

1. Ensure all 20 devices are in the **same OU**
2. Policies will automatically propagate (wait 10-15 minutes)
3. Reboot each device
4. Verify each device launches Tab Keeper correctly

### **Option B: Clone Test Device**

If devices support imaging/cloning:
1. Powerwash working test device
2. Create image of configured state
3. Deploy image to remaining 19 devices
4. Reboot all devices

---

## 🔒 Security Considerations

### **Credentials in Extension**

Tab Keeper has built-in credentials (`alstaff`/`alstaff`). This is acceptable for kiosk deployments because:

- ✅ Extension code is only distributed to your enrolled devices
- ✅ Devices are physically secured
- ✅ Kiosk mode prevents code inspection by end users
- ✅ Credentials are for kiosk-specific accounts, not admin accounts

### **Physical Security**

- Secure devices physically (locks, enclosures)
- Disable USB ports via policy
- Disable developer mode
- Use BIOS/firmware passwords

### **Network Security**

- Use dedicated kiosk VLAN
- Firewall rules to limit outbound traffic
- Monitor network traffic from kiosk devices

---

## 📝 Policy Reference

### **DeviceLocalAccounts**
- **Location:** Devices → Chrome → Settings → Kiosk settings
- **Purpose:** Defines kiosk apps available on device
- **Type:** CRX kiosk app (type 1)
- **ID:** `gjjokecbclbdhnhldnhfdmbagkbgmnia`

### **ExtensionInstallSources**
- **Location:** Apps & extensions → Additional app settings
- **Purpose:** Allow installation from self-hosted URL
- **Value:** `https://github.com/zant0p/tab-keeper/releases/download/*/updates.xml`

### **ExtensionSettings (via Tab Keeper panel)**
- **Location:** Apps & extensions → Tab Keeper → Installation policy
- **Purpose:** Force-install extension with update URL
- **Mode:** `force_installed`

### **Managed Configuration**
- **Location:** Apps & extensions → Tab Keeper → Managed configuration
- **Purpose:** Pre-configure Tab Keeper settings
- **Format:** JSON with URLs, timer, credentials

---

## 🆘 Support

If issues persist after following this guide:

1. **Check GitHub Issues:** https://github.com/zant0p/tab-keeper/issues
2. **Review Chrome Enterprise Docs:** https://support.google.com/chrome/a/answer/1360534
3. **Inspect Extension Logs:** `chrome://extensions` → Tab Keeper → Service Worker → Inspect
4. **Verify Policies:** `chrome://policy` → Reload policies → Check for errors

---

## 📞 Quick Reference Card

| Setting | Value | Location |
|---------|-------|----------|
| **Kiosk App ID** | `gjjokecbclbdhnhldnhfdmbagkbgmnia` | DeviceLocalAccounts |
| **Primary URL** | `https://10.1.129.207/Arial/#/login` | Managed Config |
| **Secondary URL** | `https://login.pointclickcare.com/poc/userLogin.xhtml` | Managed Config |
| **Update URL** | `https://github.com/zant0p/tab-keeper/releases/download/*/updates.xml` | Multiple places |
| **Timer** | `10 minutes` | Managed Config |
| **Credentials** | `alstaff` / `alstaff` | Built into extension |
| **Auto-Launch** | Tab Keeper | Kiosk settings |

---

**Last Updated:** 2026-06-26  
**Version:** 2.0.2  
**GitHub:** https://github.com/zant0p/tab-keeper
