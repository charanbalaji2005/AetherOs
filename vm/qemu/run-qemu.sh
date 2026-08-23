#!/usr/bin/env bash
# vm/qemu/run-qemu.sh
# Instant AetherOS live preview in QEMU with 3D acceleration and Wayland support
set -euo pipefail

ISO_PATH="build/output/AetherOS-1.0-x86_64.iso"
QCOW2_PATH="build/output/AetherOS-1.0-x86_64.qcow2"

MODE="${1:-iso}"

if ! command -v qemu-system-x86_64 &>/dev/null; then
    echo "Installing QEMU utilities..."
    sudo dnf install -y qemu-system-x86 qemu-kvm 2>/dev/null || sudo apt-get install -y qemu-system-x86 2>/dev/null || true
fi

# Check if KVM acceleration is available
ACCEL_FLAG="-enable-kvm"
if [ ! -e /dev/kvm ] || [ ! -w /dev/kvm ]; then
    ACCEL_FLAG=""
    echo "Notice: KVM hardware acceleration not accessible; running with TCG."
fi

if [ "$MODE" = "qcow2" ] && [ -f "$QCOW2_PATH" ]; then
    echo "--> Booting AetherOS from QCOW2 virtual disk ($QCOW2_PATH)..."
    qemu-system-x86_64 \
        $ACCEL_FLAG \
        -m 4096 \
        -smp 4 \
        -vga virtio \
        -display default,show-cursor=on \
        -net nic,model=virtio -net user \
        -drive file="$QCOW2_PATH",format=qcow2,if=virtio
elif [ -f "$ISO_PATH" ]; then
    echo "--> Booting AetherOS Live from ISO ($ISO_PATH)..."
    qemu-system-x86_64 \
        $ACCEL_FLAG \
        -m 4096 \
        -smp 4 \
        -vga virtio \
        -display default,show-cursor=on \
        -net nic,model=virtio -net user \
        -cdrom "$ISO_PATH" \
        -boot d
else
    echo "Error: ISO not found at $ISO_PATH."
    exit 1
fi
