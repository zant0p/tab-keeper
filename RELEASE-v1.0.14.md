# Tab Keeper v1.0.14

**Released:** June 2, 2026

## 🎯 Production Release - Ready for Chrome Web Store Submission

This is the first production-ready release of Tab Keeper, featuring critical bug fixes and cleanup for Chrome Web Store submission.

---

## ✨ What's New

### Bug Fixes
- **🔧 Auto-Login Target Fix**: Auto-login now ONLY triggers on the configured target website, preventing credentials from being filled on unrelated login pages
- **⚡ Service Worker Stability**: Fixed syntax errors that prevented extension from loading in Chrome

### Improvements
- **📧 Updated Contact**: Support email updated to zantop@protonmail.com
- **🧹 Code Cleanup**: Removed experimental password popup dismissal code to meet Chrome Web Store requirements
- **📝 Better Logging**: Improved activity tracking and debugging capabilities

### Security
- **🔒 Local Storage Only**: All data stored locally in browser (no external transmission)
- **✅ Clean Codebase**: No unused or experimental features that could trigger Chrome Web Store rejection

---

## 📦 Installation

### For Testing (Load Unpacked)
1. Download this ZIP file
2. Extract to a folder
3. Go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the extracted folder

### For Production (Chrome Web Store)
Coming soon to [Chrome Web Store](https://chrome.google.com/webstore)

---

## ⚙️ Configuration

After installation:
1. Right-click extension icon → **Options**
2. Set your **Target URL** (the tab you want to keep active)
3. Configure **Username/Password** for auto-login (optional)
4. Adjust **Return Timer** (default: 10 minutes)

---

## 🐛 Known Issues

- Chrome's "Change your password" popup may appear after login - manually dismiss it
- First tab switch may take 1-2 seconds longer while service worker initializes

---

## 📋 Technical Details

### Manifest Version: 3
### Permissions Required:
- `tabs` - Monitor and switch tabs
- `storage` - Save settings locally
- `activeTab` - Access current tab URL
- `scripting` - Inject auto-login script
- `alarms` - Background timer for reliability
- `<all_urls>` - Support any target website

### Files Changed:
- `background.js` - Core timer and tab switching logic
- `content.js` - Auto-login detection and execution
- `popup.js/html` - User interface
- `options.js/html` - Configuration page
- `manifest.json` - Extension metadata

---

## 🔗 Links

- **Source Code:** https://github.com/zant0p/tab-keeper
- **Issues:** https://github.com/zant0p/tab-keeper/issues
- **Documentation:** See README.md in source repository

---

## 📞 Support

**Email:** zantop@protonmail.com

For bugs, feature requests, or questions, please open an issue on GitHub.

---

## 📄 License

MIT License - See LICENSE file in repository
