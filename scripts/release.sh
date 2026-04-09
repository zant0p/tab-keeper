#!/bin/bash
# Tab Keeper - GitHub Release & Auto-Update Script
# Automates version bumping, packaging, and update manifest generation

set -e

# Configuration
EXTENSION_DIR="/home/zantop/.openclaw/workspace/chrome-extensions/tab-keeper"
GITHUB_REPO="https://github.com/zantop/tab-keeper"
RAW_GITHUB_URL="https://raw.githubusercontent.com/zantop/tab-keeper/main"

cd "$EXTENSION_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Tab Keeper Release Script${NC}"
echo "================================"

# Get current version
CURRENT_VERSION=$(grep '"version":' manifest.json | sed 's/.*"version": *"\([^"]*\)".*/\1/')
echo -e "${YELLOW}Current version:${NC} $CURRENT_VERSION"

# Prompt for new version
echo ""
echo "Enter new version (semantic versioning, e.g., 1.0.1):"
read -p "New version: " NEW_VERSION

if [[ ! $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}❌ Invalid version format. Use X.Y.Z format.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Changes in this release:${NC}"
read -p "Release notes (one line): " RELEASE_NOTES

# Update manifest.json
echo ""
echo -e "${GREEN}📝 Updating manifest.json...${NC}"
sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" manifest.json

# Update updates.xml
echo -e "${GREEN}📝 Updating updates.xml...${NC}"
cat > updates.xml << EOF
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='YOUR_EXTENSION_ID_HERE'>
    <updatecheck codebase='${GITHUB_REPO}/releases/download/v${NEW_VERSION}/tab-keeper.crx' version='${NEW_VERSION}' />
  </app>
</gupdate>
EOF

# Package extension as CRX
echo ""
echo -e "${GREEN}📦 Packaging extension...${NC}"

# First create ZIP for CRX packaging
python3 << PYTHON_SCRIPT
import zipfile
import os
from pathlib import Path

exclude_files = {'README.md', 'PUBLISHING.md', 'privacy-policy.md', 'generate-icons.py', 'package-for-cws.py', 'release.sh', 'updates.xml'}
exclude_dirs = {'.git', '__pycache__', 'node_modules', 'scripts'}

zip_path = Path('tab-keeper.zip')
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file in exclude_files or file.endswith('.pyc'):
                continue
            file_path = Path(root) / file
            arcname = file_path.relative_to(Path('.'))
            zipf.write(file_path, arcname)

print(f"✅ Created {zip_path}")
PYTHON_SCRIPT

echo ""
echo -e "${YELLOW}⚠️  To create .crx file:${NC}"
echo "1. Go to chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Click 'Pack extension'"
echo "4. Extension root: $EXTENSION_DIR"
echo "5. This will generate tab-keeper.crx and .pem (keep .pem safe!)"
echo ""
echo "After creating .crx, run:"
echo "  git add manifest.json updates.xml"
echo "  git commit -m 'Release v${NEW_VERSION}: ${RELEASE_NOTES}'"
echo "  git tag v${NEW_VERSION}"
echo "  git push && git push --tags"
echo ""
echo "Then upload tab-keeper.crx to GitHub Releases: ${GITHUB_REPO}/releases/new"
echo ""
echo -e "${GREEN}✅ Version bumped to ${NEW_VERSION}${NC}"
echo -e "${GREEN}✅ updates.xml ready for auto-updates${NC}"
