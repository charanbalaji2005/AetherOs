#!/usr/bin/env bash
# Build the AetherOS ISO from the kickstart file.
# MUST be run as root on a Fedora host (bare metal or Fedora VM/container
# with nested virt, NOT this sandbox — it needs real kernel/loop device access).
set -euo pipefail

RELEASEVER="41"
KS_FILE="$(dirname "$0")/aetheros.ks"
OUTDIR="$(dirname "$0")/out"
ISO_NAME="AetherOS.iso"

if [[ $EUID -ne 0 ]]; then
  echo "Run this as root: sudo $0" >&2
  exit 1
fi

command -v livemedia-creator >/dev/null || {
  echo "Installing required build tools..."
  dnf install -y lorax livemedia-creator anaconda anaconda-dracut
}

rm -rf "$OUTDIR"

livemedia-creator \
  --ks "$KS_FILE" \
  --no-virt \
  --resultdir "$OUTDIR" \
  --project "AetherOS" \
  --make-iso \
  --iso-only \
  --iso-name "$ISO_NAME" \
  --releasever "$RELEASEVER"

echo "Generating SHA256 checksum..."
sha256sum "$OUTDIR/$ISO_NAME" > "$OUTDIR/$ISO_NAME.sha256"

echo "Done. ISO at: $OUTDIR/$ISO_NAME"
echo "Checksum file at: $OUTDIR/$ISO_NAME.sha256"
