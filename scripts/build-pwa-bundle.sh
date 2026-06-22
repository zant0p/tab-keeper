#!/bin/bash
# Tab Keeper - Build PWA Web Bundle for Chrome Enterprise
# Creates signed .webbundle file with Web Bundle ID

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="${EXTENSION_DIR}/dist-pwa"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 Tab Keeper PWA Web Bundle Builder${NC}"
echo "========================================"
echo ""

# Check for web-bundler
if ! command -v web-bundler &> /dev/null; then
  echo -e "${YELLOW}⚠️  web-bundler not found${NC}"
  echo ""
  echo "Install with one of these commands:"
  echo "  npm install -g web-bundler"
  echo "  pip install webbundle"
  echo ""
  echo "Then re-run this script."
  exit 1
fi

echo -e "${GREEN}✅ web-bundler found${NC}"

# Create dist directory
echo ""
echo -e "${GREEN}📁 Creating dist-pwa directory...${NC}"
mkdir -p "$DIST_DIR"

# Copy PWA files
echo "Copying PWA files..."
cp "$EXTENSION_DIR/options.html" "$DIST_DIR/"
cp "$EXTENSION_DIR/popup.html" "$DIST_DIR/"
cp "$EXTENSION_DIR/pwa-manifest.json" "$DIST_DIR/manifest.webmanifest"
cp "$EXTENSION_DIR/sw-pwa.js" "$DIST_DIR/"
cp "$EXTENSION_DIR/pwa-install.js" "$DIST_DIR/"
cp "$EXTENSION_DIR/options.js" "$DIST_DIR/"
cp "$EXTENSION_DIR/popup.js" "$DIST_DIR/"
cp -r "$EXTENSION_DIR/icons" "$DIST_DIR/"

echo -e "${GREEN}✅ Files copied${NC}"

# Create index.html if it doesn't exist
if [ ! -f "$DIST_DIR/index.html" ]; then
  cp "$EXTENSION_DIR/options.html" "$DIST_DIR/index.html"
  echo "✅ Created index.html (copy of options.html)"
fi

# Build web bundle
echo ""
echo -e "${GREEN}🔧 Building web bundle...${NC}"

cd "$DIST_DIR"

# Try to build with web-bundler
if web-bundler bundle \
  --input . \
  --output tab-keeper-pwa.webbundle \
  --base-url "https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/" \
  --manifest manifest.webmanifest \
  --version 2.0.0 2>/dev/null; then
  
  echo -e "${GREEN}✅ Web bundle created${NC}"
  
  # Extract Web Bundle ID
  echo ""
  echo -e "${BLUE}🆔 Extracting Web Bundle ID...${NC}"
  
  WEB_BUNDLE_ID=$(web-bundler id tab-keeper-pwa.webbundle 2>/dev/null || echo "NOT_FOUND")
  
  if [ "$WEB_BUNDLE_ID" != "NOT_FOUND" ] && [ -n "$WEB_BUNDLE_ID" ]; then
    echo -e "${GREEN}✅ Web Bundle ID: ${WEB_BUNDLE_ID}${NC}"
    
    # Save to file for reference
    echo "$WEB_BUNDLE_ID" > web-bundle-id.txt
    echo ""
    echo -e "${YELLOW}💾 Web Bundle ID saved to: dist-pwa/web-bundle-id.txt${NC}"
    
    # Update pwa-updates.xml template
    echo ""
    echo -e "${GREEN}📝 Creating updated pwa-updates.xml...${NC}"
    
    cat > "$EXTENSION_DIR/pwa-updates-updated.xml" << EOF
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${WEB_BUNDLE_ID}'>
    <updatecheck codebase='https://YOUR_STORAGE_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/tab-keeper-pwa.webbundle' version='2.0.0' />
  </app>
</gupdate>
EOF
    
    echo -e "${GREEN}✅ Created: pwa-updates-updated.xml${NC}"
    echo -e "${YELLOW}⚠️  Remember to replace YOUR_STORAGE_ACCOUNT and YOUR_CONTAINER with actual values${NC}"
    
  else
    echo -e "${RED}❌ Could not extract Web Bundle ID${NC}"
    echo "You may need to manually calculate it from the signing key"
  fi
  
else
  echo -e "${RED}❌ Failed to create web bundle${NC}"
  echo ""
  echo "Try manual creation:"
  echo "1. Check that all required files exist in dist-pwa/"
  echo "2. Verify manifest.webmanifest is valid JSON"
  echo "3. Ensure icons exist and are valid PNG files"
  exit 1
fi

# Show summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Build Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "📦 Output files:"
ls -lh "$DIST_DIR"/*.webbundle 2>/dev/null || echo "  (webbundle not created)"
echo ""
if [ -f "$DIST_DIR/web-bundle-id.txt" ]; then
  echo "🆔 Web Bundle ID: $(cat $DIST_DIR/web-bundle-id.txt)"
fi
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Upload to Azure Blob Storage:"
echo "   az storage blob upload \\"
echo "     --account-name YOUR_ACCOUNT \\"
echo "     --container-name YOUR_CONTAINER \\"
echo "     --name tab-keeper-pwa.webbundle \\"
echo "     --file ./dist-pwa/tab-keeper-pwa.webbundle \\"
echo "     --content-type application/webbundle"
echo ""
echo "2. Upload update manifest:"
echo "   az storage blob upload \\"
echo "     --account-name YOUR_ACCOUNT \\"
echo "     --container-name YOUR_CONTAINER \\"
echo "     --name pwa-updates.xml \\"
echo "     --file ./pwa-updates-updated.xml \\"
echo "     --content-type application/xml"
echo ""
echo "3. Configure Chrome Admin Console:"
echo "   Policy: IsolatedWebAppList"
echo "   ID: $(cat $DIST_DIR/web-bundle-id.txt 2>/dev/null || echo 'YOUR_WEB_BUNDLE_ID')"
echo "   Update URL: https://YOUR_ACCOUNT.blob.core.windows.net/YOUR_CONTAINER/pwa-updates.xml"
echo ""
echo "4. Verify at chrome://isolated-web-apps/"
echo ""
echo -e "${GREEN}✅ Done!${NC}"
