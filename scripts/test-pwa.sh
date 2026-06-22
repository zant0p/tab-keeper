#!/bin/bash
# Tab Keeper - Quick PWA Test Script
# Starts local server for PWA testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Tab Keeper PWA Local Test Server"
echo "===================================="
echo ""

# Check if PWA files exist
if [ ! -f "$EXTENSION_DIR/options.html" ] || [ ! -f "$EXTENSION_DIR/sw-pwa.js" ]; then
  echo "❌ PWA files not found!"
  echo ""
  echo "Make sure you're in the tab-keeper directory with:"
  echo "  - options.html"
  echo "  - sw-pwa.js"
  echo "  - manifest.webmanifest"
  exit 1
fi

echo "✅ PWA files found"
echo ""
echo "📱 Testing URLs:"
echo "   Main:     http://localhost:8080/options.html"
echo "   Popup:    http://localhost:8080/popup.html"
echo "   Manifest: http://localhost:8080/manifest.webmanifest"
echo ""
echo "🧪 Test checklist:"
echo "   1. Open http://localhost:8080/options.html"
echo "   2. Check for install prompt (bottom-right)"
echo "   3. Install and test standalone mode"
echo "   4. DevTools → Network → Offline → Reload"
echo "   5. Verify offline functionality"
echo ""
echo "🔍 Debug URLs:"
echo "   chrome://serviceworker-internals/"
echo "   chrome://app-internals/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$EXTENSION_DIR"
python3 -m http.server 8080
