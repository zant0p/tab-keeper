#!/bin/bash
# Tab Keeper - Package CRX for Enterprise Deployment
# Creates properly signed CRX file with correct structure

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="${EXTENSION_DIR}/dist"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}📦 Tab Keeper CRX Packager${NC}"
echo "=================================="

# Check for Chrome/Chromium
CHROME_PATH=""
if [ -f "/usr/bin/google-chrome" ]; then
  CHROME_PATH="/usr/bin/google-chrome"
elif [ -f "/usr/bin/chromium" ]; then
  CHROME_PATH="/usr/bin/chromium"
elif [ -f "/usr/bin/chromium-browser" ]; then
  CHROME_PATH="/usr/bin/chromium-browser"
else
  echo -e "${YELLOW}⚠️  Chrome/Chromium not found. Using manual packaging.${NC}"
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Generate PEM key if it doesn't exist
PEM_FILE="${EXTENSION_DIR}/tab-keeper.pem"
if [ ! -f "$PEM_FILE" ]; then
  echo ""
  echo -e "${GREEN}🔑 Generating new PEM key...${NC}"
  openssl genrsa -out "${EXTENSION_DIR}/tab-keeper.private.pem" 2048
  openssl pkcs8 -topk8 -nocrypt -in "${EXTENSION_DIR}/tab-keeper.private.pem" -out "$PEM_FILE"
  echo "✅ PEM key created: $PEM_FILE"
  echo -e "${YELLOW}⚠️  KEEP THIS KEY SAFE! It determines your extension ID.${NC}"
else
  echo "✅ Using existing PEM key: $PEM_FILE"
fi

# Calculate extension ID
echo ""
echo -e "${GREEN}🆔 Calculating extension ID...${NC}"
EXTENSION_ID=$(openssl rsa -in "${EXTENSION_DIR}/tab-keeper.private.pem" -pubout -outform DER 2>/dev/null | \
  openssl dgst -sha256 -binary | \
  tail -c 16 | \
  base32 | \
  tr 'A-Z' 'a-z' | \
  tr -d '=')
echo "✅ Extension ID: ${EXTENSION_ID}"

# Get version from manifest
VERSION=$(grep '"version":' "${EXTENSION_DIR}/manifest.json" | sed 's/.*"version": *"\([^"]*\)".*/\1/')
echo "✅ Version: ${VERSION}"

# Create ZIP for distribution
echo ""
echo -e "${GREEN}📦 Creating ZIP package...${NC}"
cd "$EXTENSION_DIR"

# Exclude unnecessary files
EXCLUDE_FILES="README.md PUBLISHING.md privacy-policy.md generate-icons.py package-for-cws.py release.sh updates.xml .gitignore"
EXCLUDE_DIRS=".git __pycache__ node_modules scripts dist"

python3 << PYTHON_SCRIPT
import zipfile
import os
from pathlib import Path

exclude_files = set("${EXCLUDE_FILES}".split())
exclude_dirs = set("${EXCLUDE_DIRS}".split())

zip_path = Path("${OUTPUT_DIR}/tab-keeper-${VERSION}.zip")
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        # Filter out excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            if file in exclude_files or file.endswith('.pyc') or file.startswith('.'):
                continue
            
            file_path = Path(root) / file
            arcname = file_path.relative_to(Path('.'))
            
            # Skip dist directory itself
            if 'dist' in arcname.parts and arcname.parts[0] == 'dist':
                continue
            
            zipf.write(file_path, arcname)

print(f"✅ Created: {zip_path}")
PYTHON_SCRIPT

# Package CRX using Chrome if available
CRX_FILE="${OUTPUT_DIR}/tab-keeper-${VERSION}.crx"
if [ -n "$CHROME_PATH" ] && [ -x "$CHROME_PATH" ]; then
  echo ""
  echo -e "${GREEN}🔧 Packaging CRX with Chrome...${NC}"
  
  # Chrome needs absolute paths
  EXT_ABS=$(realpath "$EXTENSION_DIR")
  PEM_ABS=$(realpath "$PEM_FILE")
  
  "$CHROME_PATH" --pack-extension="$EXT_ABS" --pack-extension-key="$PEM_ABS"
  
  # Move generated CRX to output
  if [ -f "${EXTENSION_DIR}/extension.crx" ]; then
    mv "${EXTENSION_DIR}/extension.crx" "$CRX_FILE"
    echo "✅ Created CRX: $CRX_FILE"
  else
    echo -e "${RED}❌ Chrome packaging failed${NC}"
    echo "Falling back to manual CRX creation..."
  fi
else
  echo ""
  echo -e "${YELLOW}⚠️  Chrome not available. Creating CRX manually...${NC}"
  echo -e "${YELLOW}Note: Manual CRX may not work for all deployment scenarios.${NC}"
  echo -e "${YELLOW}Recommend installing Chrome to package properly.${NC}"
fi

# Create updates.xml
echo ""
echo -e "${GREEN}📝 Creating updates.xml...${NC}"
cat > "${OUTPUT_DIR}/updates.xml" << EOF
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${EXTENSION_ID}'>
    <updatecheck codebase='https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/tab-keeper-${VERSION}.crx' version='${VERSION}' />
  </app>
</gupdate>
EOF
echo "✅ Created: ${OUTPUT_DIR}/updates.xml"

# Create deployment info
cat > "${OUTPUT_DIR}/DEPLOYMENT-INFO.txt" << EOF
Tab Keeper v${VERSION} - Deployment Information
==============================================

Extension ID: ${EXTENSION_ID}
Version: ${VERSION}
Packaged: $(date -u +"%Y-%m-%d %H:%M UTC")

Files:
- tab-keeper-${VERSION}.crx (Chrome extension)
- tab-keeper-${VERSION}.zip (Source package)
- updates.xml (Auto-update manifest)

Azure Blob Storage Setup:
1. Upload tab-keeper-${VERSION}.crx with Content-Type: application/x-chrome-extension
2. Upload updates.xml with Content-Type: application/xml
3. Make container publicly accessible (Blob or Container level)

Chrome Admin Console Policy:
{
  "ExtensionInstallForcesList": [
    {
      "app_id": "${EXTENSION_ID}",
      "update_url": "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/updates.xml"
    }
  ],
  "ExtensionSettings": {
    "${EXTENSION_ID}": {
      "installation_mode": "force_installed",
      "update_url": "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/updates.xml"
    }
  }
}

For detailed instructions, see: docs/AZURE-BLOB-STORAGE-DEPLOYMENT.md
EOF

echo ""
echo -e "${GREEN}✅ Packaging complete!${NC}"
echo ""
echo "Output files:"
ls -lh "$OUTPUT_DIR"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Upload CRX to Azure Blob Storage with correct MIME type"
echo "2. Update updates.xml with your actual storage URL"
echo "3. Configure Chrome Admin Console with Extension ID: ${EXTENSION_ID}"
echo "4. See docs/AZURE-BLOB-STORAGE-DEPLOYMENT.md for detailed instructions"
