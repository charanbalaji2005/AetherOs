#!/usr/bin/env bash
set -euo pipefail

RELEASEVER="41"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KS_TEMPLATE="$PROJECT_ROOT/build/aetheros.ks"
KS_GENERATED="$PROJECT_ROOT/build/aetheros.generated.ks"

OUTDIR="$PROJECT_ROOT/build/out"
ISO_NAME="AetherOS.iso"

if [[ $EUID -ne 0 ]]; then
    echo "Run as root:"
    echo "sudo $0"
    exit 1
fi

command -v livemedia-creator >/dev/null || {
    echo "Installing build dependencies..."
    dnf install -y \
        lorax \
        livemedia-creator \
        anaconda \
        anaconda-dracut
}

echo "[1/5] Preparing build directory & cleaning stale locks..."
rm -rf "$OUTDIR"
rm -f /run/user/*/anaconda.pid /run/anaconda.pid /var/run/anaconda.pid /tmp/anaconda.pid 2>/dev/null || true
pkill -9 anaconda 2>/dev/null || true

echo "[2/5] Generating Kickstart configuration from template..."
sed "s|__AETHER_SOURCE__|$PROJECT_ROOT|g" \
    "$KS_TEMPLATE" > "$KS_GENERATED"

echo "[3/5] Building ISO with livemedia-creator..."
livemedia-creator \
    --ks "$KS_GENERATED" \
    --no-virt \
    --resultdir "$OUTDIR" \
    --project "AetherOS" \
    --make-iso \
    --iso-only \
    --iso-name "$ISO_NAME" \
    --releasever "$RELEASEVER"

echo "[4/5] Creating SHA256 checksum..."
sha256sum "$OUTDIR/$ISO_NAME" > "$OUTDIR/$ISO_NAME.sha256"

echo "[5/5] Build complete."
echo
echo "ISO generated at: $OUTDIR/$ISO_NAME"
echo "Checksum: $(cat "$OUTDIR/$ISO_NAME.sha256")"
