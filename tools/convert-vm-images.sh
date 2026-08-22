#!/usr/bin/env bash
# tools/convert-vm-images.sh
# Convert AetherOS raw disk / ISO image into VMware (.vmdk) and QEMU (.qcow2) images
set -euo pipefail

OUTPUT_DIR="build/output"
mkdir -p "$OUTPUT_DIR"

echo "========================================================"
echo "         AetherOS Virtual Machine Image Generator        "
echo "========================================================"

if ! command -v qemu-img &>/dev/null; then
    echo "Installing qemu-img conversion utilities..."
    sudo dnf install -y qemu-img 2>/dev/null || sudo apt-get install -y qemu-utils 2>/dev/null || true
fi

# Locate the generated disk image or root image
RAW_IMAGE=$(ls -t /var/lmc/lmc-disk-*.img 2>/dev/null | head -n 1 || true)
if [ -z "$RAW_IMAGE" ] && [ -f "$OUTPUT_DIR/AetherOS-1.0-x86_64.raw" ]; then
    RAW_IMAGE="$OUTPUT_DIR/AetherOS-1.0-x86_64.raw"
fi

if [ -n "$RAW_IMAGE" ] && [ -f "$RAW_IMAGE" ]; then
    echo "--> Source image found: $RAW_IMAGE"
    
    # 1. Convert to VMware Workstation / ESXi VMDK
    echo "--> Converting to VMware VMDK ($OUTPUT_DIR/AetherOS-1.0-x86_64.vmdk)..."
    qemu-img convert -p -f raw -O vmdk -o subformat=monolithicSparse,compat6 "$RAW_IMAGE" "$OUTPUT_DIR/AetherOS-1.0-x86_64.vmdk"
    
    # 2. Convert to QEMU / KVM QCOW2
    echo "--> Converting to QEMU QCOW2 ($OUTPUT_DIR/AetherOS-1.0-x86_64.qcow2)..."
    qemu-img convert -p -f raw -O qcow2 -c "$RAW_IMAGE" "$OUTPUT_DIR/AetherOS-1.0-x86_64.qcow2"
    
    echo "========================================================"
    echo "✅ VMDK & QCOW2 Images successfully generated!"
    echo "📁 Output directory: $OUTPUT_DIR/"
    ls -lh "$OUTPUT_DIR"
    echo "========================================================"
else
    echo "--> ISO is available at: $OUTPUT_DIR/AetherOS-1.0-x86_64.iso"
    echo "You can boot this ISO directly inside VMware Workstation or VirtualBox."
fi
