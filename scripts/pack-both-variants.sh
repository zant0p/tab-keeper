#!/bin/bash
# Tab Keeper - Pack Both AL and SNF Variants
# Uses existing PEM key to maintain same Extension ID

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$(dirname "$SCRIPT_DIR")"
PEM_FILE="${EXTENSION_DIR}/tab-keeper.pem"

echo "📦 Tab Keeper - Packing Both Variants"
echo "======================================"
echo ""

if [ ! -f "$PEM_FILE" ]; then
  echo "❌ PEM file not found: $PEM_FILE"
  echo "Please run package-crx.sh first to generate it."
  exit 1
fi

echo "✅ Using existing PEM key (preserves Extension ID)"
echo ""

# Calculate Extension ID
EXTENSION_ID=$(openssl rsa -in "$PEM_FILE" -pubout -outform DER 2>/dev/null | \
  openssl dgst -sha256 -binary | \
  tail -c 16 | \
  base32 | \
  tr 'A-Z' 'a-z' | \
  tr -d '=')

echo "🆔 Extension ID: $EXTENSION_ID"
echo ""

# Pack AL Variant
echo "🟢 Packing AL Variant..."
cd "$EXTENSION_DIR"

# Update background.js for AL
sed -i "s/^const VARIANT = '.*'/const VARIANT = 'AL'/" background.js

# Create dist-al folder
mkdir -p dist-al

# Pack with Chrome if available
if command -v google-chrome &> /dev/null; then
  google-chrome --pack-extension="$EXTENSION_DIR" --pack-extension-key="$PEM_FILE"
  mv extension.crx dist-al/tab-keeper-AL-2.0.0.crx
  echo "✅ AL CRX created: dist-al/tab-keeper-AL-2.0.0.crx"
else
  echo "⚠️  Chrome not found. Creating ZIP only..."
  python3 << 'PYTHON'
import zipfile
import os
from pathlib import Path

exclude = {'README.md', 'PUBLISHING.md', 'privacy-policy.md', 'generate-icons.py', 
           'package-for-cws.py', 'release.sh', 'updates.xml', '.gitignore',
           'dist', 'dist-al', 'dist-snf', 'docs-pwa', 'pwa-docs', 'documentation'}

with zipfile.ZipFile('dist-al/tab-keeper-AL-2.0.0.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude]
        for file in files:
            if file in exclude or file.endswith('.pyc') or file.startswith('.'):
                continue
            if 'dist' in root.split(os.sep):
                continue
            file_path = Path(root) / file
            arcname = file_path.relative_to(Path('.'))
            zipf.write(file_path, arcname)

print("✅ AL ZIP created: dist-al/tab-keeper-AL-2.0.0.zip")
PYTHON
fi

# Pack SNF Variant
echo ""
echo "🔵 Packing SNF Variant..."

# Update background.js for SNF
sed -i "s/^const VARIANT = '.*'/const VARIANT = 'SNF'/" background.js

# Create dist-snf folder
mkdir -p dist-snf

if command -v google-chrome &> /dev/null; then
  google-chrome --pack-extension="$EXTENSION_DIR" --pack-extension-key="$PEM_FILE"
  mv extension.crx dist-snf/tab-keeper-SNF-2.0.0.crx
  echo "✅ SNF CRX created: dist-snf/tab-keeper-SNF-2.0.0.crx"
else
  echo "⚠️  Chrome not found. Creating ZIP only..."
  python3 << 'PYTHON'
import zipfile
import os
from pathlib import Path

exclude = {'README.md', 'PUBLISHING.md', 'privacy-policy.md', 'generate-icons.py', 
           'package-for-cws.py', 'release.sh', 'updates.xml', '.gitignore',
           'dist', 'dist-al', 'dist-snf', 'docs-pwa', 'pwa-docs', 'documentation'}

with zipfile.ZipFile('dist-snf/tab-keeper-SNF-2.0.0.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude]
        for file in files:
            if file in exclude or file.endswith('.pyc') or file.startswith('.'):
                continue
            if 'dist' in root.split(os.sep):
                continue
            file_path = Path(root) / file
            arcname = file_path.relative_to(Path('.'))
            zipf.write(file_path, arcname)

print("✅ SNF ZIP created: dist-snf/tab-keeper-SNF-2.0.0.zip")
PYTHON
fi

# Restore background.js to AL (default)
sed -i "s/^const VARIANT = '.*'/const VARIANT = 'AL'/" background.js

echo ""
echo "═══════════════════════════════════════"
echo "✅ Both variants packed!"
echo "═══════════════════════════════════════"
echo ""
echo "Extension ID (both variants): $EXTENSION_ID"
echo ""
echo "Output files:"
ls -lh dist-al/ 2>/dev/null || true
ls -lh dist-snf/ 2>/dev/null || true
echo ""
echo "⚠️  Note: Chrome not found, so only ZIP files created."
echo "   To create CRX files:"
echo "   1. Install Chrome/Chromium"
echo "   2. Re-run this script"
echo "   3. Or manually pack via chrome://extensions/"
echo ""
