#!/usr/bin/env bash
# vm/qemu/run-qemu.sh
# Instant AetherOS live preview in QEMU with UEFI, 3D acceleration and Wayland support
set -euo pipefail

ISO_PATH="build/output/AetherOS-1.0-x86_64.iso"
QCOW2_PATH="build/output/AetherOS-1.0-x86_64.qcow2"

if ! command -v qemu-system-x86_64 &>/dev/null; then
    echo "Installing QEMU and OVMF UEFI firmware..."
    sudo dnf install -y qemu-system-x86 qemu-kvm edk2-ovmf 2>/dev/null || sudo apt-get install -y qemu-system-x86 ovmf 2>/dev/null || true
fi

# Locate OVMF UEFI firmware
OVMF_CODE=""
for p in /usr/share/OVMF/OVMF_CODE.fd /usr/share/edk2/ovmf/OVMF_CODE.fd /usr/share/ovmf/OVMF.fd; do
    if [ -f "$p" ]; then
        OVMF_CODE="$p"
        break
    fi
done

# Check if KVM acceleration is available
ACCEL_FLAG="-enable-kvm"
if [ ! -e /dev/kvm ] || [ ! -w /dev/kvm ]; then
    ACCEL_FLAG=""
    echo "Notice: KVM hardware acceleration not accessible; running in standard mode."
fi

# Boot from QCOW2 disk if available, otherwise ISO
if [ -f "$QCOW2_PATH" ]; then
    echo "--> Booting AetherOS from QCOW2 virtual disk ($QCOW2_PATH)..."
    qemu-system-x86_64 \
        $ACCEL_FLAG \
        -m 4096 \
        -smp 4 \
        -vga virtio \
        -display default,show-cursor=on \
        -net nic,model=virtio -net user \
        -drive file="$QCOW2_PATH",format=qcow2,if=virtio \
        ${OVMF_CODE:+-bios "$OVMF_CODE"}
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
        -boot d \
        ${OVMF_CODE:+-bios "$OVMF_CODE"}
else
    echo "Error: Neither $QCOW2_PATH nor $ISO_PATH found in build/output/."
    exit 1
fi
