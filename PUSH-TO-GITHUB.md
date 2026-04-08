# 🚀 Push Tab Keeper to GitHub

## Option 1: Using GitHub CLI (Easiest)

```bash
# Install gh if not already installed
sudo dnf install gh   # Fedora/RHEL
# or
sudo apt install gh   # Debian/Ubuntu

# Authenticate
gh auth login

# Create repo and push
gh repo create tab-keeper --public --source=. --push
```

**Done!** Your repo will be at: `https://github.com/zantop/tab-keeper`

---

## Option 2: Manual GitHub Setup

### Step 1: Create Repository on GitHub

1. Go to: https://github.com/new
2. **Repository name:** `tab-keeper`
3. **Description:** Chrome extension that keeps a tab active and auto-logins
4. **Visibility:** Public (or Private if you prefer)
5. **DO NOT** initialize with README, .gitignore, or license
6. Click **Create repository**

### Step 2: Push from Terminal

```bash
cd /home/zantop/.openclaw/workspace/chrome-extensions/tab-keeper-repo

# Add GitHub as remote (uses your SSH key)
git remote add origin git@github.com:zantop/tab-keeper.git

# Rename branch to main (optional, but standard)
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## After Pushing

Your extension will be available at:
**https://github.com/zantop/tab-keeper**

**To download:**
1. Go to the repo URL
2. Click **Code** → **Download ZIP**
3. Extract and load in Chrome

---

## Quick Install Commands

Run this in the repo folder to do it all at once:

```bash
cd /home/zantop/.openclaw/workspace/chrome-extensions/tab-keeper-repo
git remote add origin git@github.com:zantop/tab-keeper.git
git branch -M main
git push -u origin main
```

If you get an SSH error, make sure your SSH key is added to GitHub:
- Go to: https://github.com/settings/keys
- Add your key: `~/.ssh/id_ed25519.pub` (or grumpybear-github.pub)
