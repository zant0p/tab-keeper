#!/bin/bash
# Calculate Chrome Extension ID from PEM key
# Usage: ./calculate-extension-id.sh extension.pem

if [ -z "$1" ]; then
  echo "Usage: $0 <pem-file>"
  echo "Example: $0 extension.pem"
  exit 1
fi

PEM_FILE="$1"

if [ ! -f "$PEM_FILE" ]; then
  echo "Error: File not found: $PEM_FILE"
  exit 1
fi

echo "Calculating extension ID from: $PEM_FILE"
echo ""

# Extract public key and calculate ID
EXTENSION_ID=$(openssl rsa -in "$PEM_FILE" -pubout -outform DER 2>/dev/null | \
  openssl dgst -sha256 -binary | \
  tail -c 16 | \
  base32 | \
  tr 'A-Z' 'a-z' | \
  tr -d '=')

echo "✅ Extension ID: $EXTENSION_ID"
echo ""
echo "Use this ID in:"
echo "  1. Chrome Admin Console ExtensionSettings policy"
echo "  2. updates.xml file (appid attribute)"
echo ""
echo "Example updates.xml:"
cat << EOF
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='$EXTENSION_ID'>
    <updatecheck codebase='https://github.com/YOUR_REPO/releases/download/v1.0.19/tab-keeper-1.0.19.crx' version='1.0.19' />
  </app>
</gupdate>
EOF
