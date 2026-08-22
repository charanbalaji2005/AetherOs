#!/usr/bin/env bash
# tools/generate-release-manifest.sh
# Generates a signed update.json for GitHub Releases and Tauri Auto-Updater
set -euo pipefail

VERSION="${1:-1.0.0}"
NOTES="${2:-AetherOS System and Application Update}"
REPO="charanbalaji2005/AetherOs"
PUB_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat <<EOF > release/update.json
{
  "version": "${VERSION}",
  "notes": "${NOTES}",
  "pub_date": "${PUB_DATE}",
  "platforms": {
    "linux-x86_64": {
      "signature": "${SIGNATURE:-}",
      "url": "https://github.com/${REPO}/releases/download/v${VERSION}/aether-software_${VERSION}_amd64.AppImage.tar.gz"
    }
  }
}
EOF

echo "Generated release/update.json for v${VERSION}."
