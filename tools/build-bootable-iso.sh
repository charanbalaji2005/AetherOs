#!/usr/bin/env bash
# tools/build-bootable-iso.sh
# Assembles the bootable UEFI/BIOS hybrid AetherOS ISO image
set -euo pipefail

OUTPUT_DIR="build/output"
mkdir -p "$OUTPUT_DIR"
ISO_NAME="AetherOS-1.0-x86_64.iso"
FINAL_ISO="$OUTPUT_DIR/$ISO_NAME"

echo "=========================================================="
echo "           AetherOS Bootable ISO Generator                "
echo "=========================================================="

# Check for existing ISO from livemedia-creator
if [ -f "/var/lmc/$ISO_NAME" ]; then
    echo "--> Moving completed ISO from /var/lmc/ to $FINAL_ISO..."
    mv -f "/var/lmc/$ISO_NAME" "$FINAL_ISO"
elif [ -f "/var/tmp/$ISO_NAME" ]; then
    mv -f "/var/tmp/$ISO_NAME" "$FINAL_ISO"
fi

if [ -f "$FINAL_ISO" ]; then
    echo "=========================================================="
    echo "✅ Bootable ISO is ready!"
    echo "📁 Location: $FINAL_ISO"
    ls -lh "$FINAL_ISO"
    echo "=========================================================="
    exit 0
fi

# Fallback: Run livemedia-creator in ISO mode
echo "--> Generating bootable ISO via livemedia-creator..."
sudo ./build/build-iso.sh --skip-ui
