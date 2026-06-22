#!/bin/bash
# Tab Keeper - Diagnose CRX Installation Issues
# Checks common problems with self-hosted Chrome extensions

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Tab Keeper CRX Diagnostic Tool${NC}"
echo "======================================"
echo ""

# Configuration
EXTENSION_DIR="/root/.openclaw/workspace/tab-keeper"
DIST_DIR="${EXTENSION_DIR}/dist"
CRX_FILE="${DIST_DIR}/tab-keeper-2.0.0.crx"
ZIP_FILE="${DIST_DIR}/tab-keeper-2.0.0.zip"
UPDATES_XML="${DIST_DIR}/updates.xml"

# Check 1: Files exist
echo -e "${YELLOW}Check 1: Required files${NC}"
if [ -f "$ZIP_FILE" ]; then
  echo -e "${GREEN}✅ ZIP file exists:${NC} $ZIP_FILE"
  echo "   Size: $(ls -lh "$ZIP_FILE" | awk '{print $5}')"
else
  echo -e "${RED}❌ ZIP file missing:${NC} $ZIP_FILE"
  echo "   Run: ./scripts/package-crx.sh"
fi

if [ -f "$UPDATES_XML" ]; then
  echo -e "${GREEN}✅ updates.xml exists:${NC} $UPDATES_XML"
else
  echo -e "${RED}❌ updates.xml missing:${NC} $UPDATES_XML"
fi
echo ""

# Check 2: Extension ID
echo -e "${YELLOW}Check 2: Extension ID${NC}"
if [ -f "${EXTENSION_DIR}/tab-keeper.private.pem" ]; then
  EXTENSION_ID=$(openssl rsa -in "${EXTENSION_DIR}/tab-keeper.private.pem" -pubout -outform DER 2>/dev/null | \
    openssl dgst -sha256 -binary | \
    tail -c 16 | \
    base32 | \
    tr 'A-Z' 'a-z' | \
    tr -d '=')
  echo -e "${GREEN}✅ Extension ID:${NC} $EXTENSION_ID"
  echo "   Use this in Chrome Admin Console policies"
else
  echo -e "${RED}❌ PEM key missing:${NC} ${EXTENSION_DIR}/tab-keeper.private.pem"
  echo "   Extension ID cannot be calculated"
fi
echo ""

# Check 3: Manifest version
echo -e "${YELLOW}Check 3: Manifest version${NC}"
if [ -f "${EXTENSION_DIR}/manifest.json" ]; then
  VERSION=$(grep '"version":' "${EXTENSION_DIR}/manifest.json" | sed 's/.*"version": *"\([^"]*\)".*/\1/')
  echo -e "${GREEN}✅ Version:${NC} $VERSION"
else
  echo -e "${RED}❌ manifest.json missing${NC}"
fi
echo ""

# Check 4: updates.xml content
echo -e "${YELLOW}Check 4: updates.xml configuration${NC}"
if [ -f "$UPDATES_XML" ]; then
  APP_ID=$(grep -oP "appid='\K[^']+" "$UPDATES_XML" || echo "NOT FOUND")
  CODEBASE=$(grep -oP "codebase='\K[^']+" "$UPDATES_XML" || echo "NOT FOUND")
  XML_VERSION=$(grep -oP "version='\K[^']+" "$UPDATES_XML" || echo "NOT FOUND")
  
  echo "   App ID: $APP_ID"
  if [ "$APP_ID" = "$EXTENSION_ID" ]; then
    echo -e "   ${GREEN}✅ App ID matches extension ID${NC}"
  else
    echo -e "   ${RED}❌ App ID mismatch!${NC}"
    echo "      Expected: $EXTENSION_ID"
  fi
  
  echo "   Codebase: $CODEBASE"
  if [[ "$CODEBASE" == *"YOUR_STORAGE_ACCOUNT"* ]]; then
    echo -e "   ${YELLOW}⚠️  Codebase URL needs to be updated${NC}"
    echo "      Replace YOUR_STORAGE_ACCOUNT and YOUR_CONTAINER with actual values"
  fi
  
  echo "   Version: $XML_VERSION"
else
  echo -e "${RED}❌ updates.xml not found${NC}"
fi
echo ""

# Check 5: Azure Blob Storage (if URL provided)
echo -e "${YELLOW}Check 5: Azure Blob Storage check${NC}"
echo "To test your Azure Blob Storage, provide the CRX URL:"
echo "Example: https://account.blob.core.windows.net/container/tab-keeper-2.0.0.crx"
echo ""
read -p "Enter CRX URL (or press Enter to skip): " CRX_URL

if [ -n "$CRX_URL" ]; then
  echo ""
  echo "Testing: $CRX_URL"
  
  # Test HTTP headers
  HEADERS=$(curl -sI "$CRX_URL" 2>/dev/null || echo "FAILED")
  
  if [ "$HEADERS" = "FAILED" ]; then
    echo -e "${RED}❌ Cannot access URL${NC}"
    echo "   Check:"
    echo "   - Container has public read access"
    echo "   - URL is correct"
    echo "   - Network connectivity"
  else
    echo -e "${GREEN}✅ URL is accessible${NC}"
    
    # Check Content-Type
    CONTENT_TYPE=$(echo "$HEADERS" | grep -i "^content-type:" | head -1)
    echo "   $CONTENT_TYPE"
    
    if [[ "$CONTENT_TYPE" == *"application/x-chrome-extension"* ]]; then
      echo -e "   ${GREEN}✅ MIME type is correct${NC}"
    elif [[ "$CONTENT_TYPE" == *"application/octet-stream"* ]]; then
      echo -e "   ${RED}❌ MIME type is wrong (application/octet-stream)${NC}"
      echo "      Fix with: az storage blob update --content-type application/x-chrome-extension"
    else
      echo -e "   ${YELLOW}⚠️  MIME type may be incorrect${NC}"
      echo "      Should be: application/x-chrome-extension"
    fi
    
    # Check for nosniff header
    if echo "$HEADERS" | grep -qi "X-Content-Type-Options.*nosniff"; then
      echo -e "   ${RED}❌ X-Content-Type-Options: nosniff detected${NC}"
      echo "      This blocks CRX installation! Remove this header from Azure config."
    else
      echo -e "   ${GREEN}✅ No X-Content-Type-Options: nosniff${NC}"
    fi
  fi
fi
echo ""

# Check 6: Chrome policy status
echo -e "${YELLOW}Check 6: Chrome Enterprise Policy${NC}"
echo "On the target Chrome device, verify:"
echo ""
echo "1. Go to: chrome://policy/"
echo "2. Click 'Reload policies'"
echo "3. Check for these policies:"
echo "   - ExtensionInstallSources (should include your Azure URL)"
echo "   - ExtensionInstallAllowlist (should include: $EXTENSION_ID)"
echo "   - ExtensionSettings (should have force_installed)"
echo ""
echo "4. Verify status shows 'Mandatory' not 'Recommended'"
echo ""
echo "Example policy JSON:"
cat << EOF
{
  "ExtensionInstallSources": [
    "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/*"
  ],
  "ExtensionInstallAllowlist": [
    "$EXTENSION_ID"
  ],
  "ExtensionSettings": {
    "$EXTENSION_ID": {
      "installation_mode": "force_installed",
      "update_url": "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/updates.xml"
    }
  }
}
EOF
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Summary & Next Steps${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "If you're getting CRX installation errors:"
echo ""
echo "1. ${GREEN}MIME Type:${NC} Must be application/x-chrome-extension"
echo "2. ${GREEN}Enterprise Policy:${NC} Must configure ExtensionInstallSources"
echo "3. ${GREEN}Allowlist:${NC} Must add extension ID to ExtensionInstallAllowlist"
echo "4. ${GREEN}Force Install:${NC} Use ExtensionInstallForcesList or ExtensionSettings"
echo ""
echo "📖 Full documentation:"
echo "   ${EXTENSION_DIR}/docs/CRX-ERROR-FIX-AZURE-GITHUB.md"
echo ""
echo "💡 Key insight: MIME type is necessary but NOT sufficient."
echo "   Chrome requires Enterprise policies to bypass signature verification."
echo ""
