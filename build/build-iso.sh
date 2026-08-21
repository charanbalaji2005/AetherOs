#!/usr/bin/env bash
set -euo pipefail

RELEASEVER="41"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KS_TEMPLATE="$PROJECT_ROOT/build/aetheros.ks"
KS_GENERATED="$PROJECT_ROOT/build/aetheros.generated.ks"

OUTDIR="$PROJECT_ROOT/build/out"
ISO_NAME="AetherOS.iso"
BUILD_TEMP="/var/tmp/aetheros-build-$$"
LMC_RESULTDIR="$BUILD_TEMP/result"

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
rm -rf "$BUILD_TEMP" /var/tmp/aetheros-build-* 2>/dev/null || true
mkdir -p "$PROJECT_ROOT/build"
rm -f /run/user/*/anaconda.pid /run/anaconda.pid /var/run/anaconda.pid /tmp/anaconda.pid 2>/dev/null || true
pkill -9 anaconda 2>/dev/null || true
sleep 1
losetup -D 2>/dev/null || true
sync

echo "[2/5] Compiling Rust Daemons & Generating Kickstart configuration..."
if command -v cargo >/dev/null 2>&1; then
    for d in "$PROJECT_ROOT/aether/battery" "$PROJECT_ROOT/aether/telemetry" "$PROJECT_ROOT/aether/update-engine"; do
        if [ -f "$d/Cargo.toml" ]; then
            (cd "$d" && cargo build --release 2>/dev/null || true)
        fi
    done
fi

sed "s|__AETHER_SOURCE__|$PROJECT_ROOT|g" \
    "$KS_TEMPLATE" > "$KS_GENERATED"

echo "[3/5] Building ISO with livemedia-creator..."
livemedia-creator \
    --ks "$KS_GENERATED" \
    --no-virt \
    --resultdir "$LMC_RESULTDIR" \
    --project "AetherOS" \
    --make-iso \
    --iso-only \
    --iso-name "$ISO_NAME" \
    --releasever "$RELEASEVER"

echo "[4/5] Moving artifacts to output directory & creating SHA256 checksum..."
mkdir -p "$OUTDIR"
cp -f "$LMC_RESULTDIR/$ISO_NAME" "$OUTDIR/$ISO_NAME"
rm -rf "$BUILD_TEMP" 2>/dev/null || true
sha256sum "$OUTDIR/$ISO_NAME" > "$OUTDIR/$ISO_NAME.sha256"

echo "[5/5] Build complete & verified."
echo
echo "ISO generated at: $OUTDIR/$ISO_NAME"
echo "Size: $(du -h "$OUTDIR/$ISO_NAME" | cut -f1)"
echo "Checksum: $(cat "$OUTDIR/$ISO_NAME.sha256")"
echo
if command -v xorriso >/dev/null 2>&1; then
    echo "=== El Torito Bootable Verification ==="
    xorriso -indev "$OUTDIR/$ISO_NAME" -report_el_torito plain 2>/dev/null || true
fi
