#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTDIR="$PROJECT_ROOT/build/out"
IMG_FILE="$(ls -1t "$OUTDIR"/lmc-disk-*.img 2>/dev/null | head -n 1)"
ISO_PATH="$OUTDIR/AetherOS.iso"

if [[ -z "$IMG_FILE" || ! -f "$IMG_FILE" ]]; then
    echo "Error: No disk image found in $OUTDIR"
    exit 1
fi

echo "=== 1. Preparing staging environment ==="
STAGING_DIR="$PROJECT_ROOT/build/staging"
umount -f "$STAGING_DIR/rootfs" 2>/dev/null || true
umount -f /mnt/aether_root 2>/dev/null || true
losetup -D 2>/dev/null || true

mkdir -p "$STAGING_DIR/iso/LiveOS"
mkdir -p "$STAGING_DIR/iso/isolinux"
mkdir -p "$STAGING_DIR/iso/EFI/BOOT"
mkdir -p "$STAGING_DIR/iso/boot/grub"
mkdir -p "$STAGING_DIR/rootfs"

echo "=== 2. Mounting installed rootfs ==="
e2fsck -fy "$IMG_FILE" || true
mount -o loop "$IMG_FILE" "$STAGING_DIR/rootfs"

echo "=== 3. Building Live-enabled Initramfs with dmsquash-live ==="
mount -t proc proc "$STAGING_DIR/rootfs/proc" 2>/dev/null || true
mount -t sysfs sys "$STAGING_DIR/rootfs/sys" 2>/dev/null || true
mount --bind /dev "$STAGING_DIR/rootfs/dev" 2>/dev/null || true

mkdir -p "$STAGING_DIR/rootfs/etc/dracut.conf.d"
cat > "$STAGING_DIR/rootfs/etc/dracut.conf.d/99-aetheros-live.conf" <<'EOF'
add_dracutmodules+=" dmsquash-live dm "
EOF

KERNEL_VER="$(ls -1 "$STAGING_DIR/rootfs/lib/modules" | head -n 1)"
chroot "$STAGING_DIR/rootfs" dracut --force --add "dmsquash-live dm" /boot/initramfs-live.img "$KERNEL_VER"

umount "$STAGING_DIR/rootfs/proc" 2>/dev/null || true
umount "$STAGING_DIR/rootfs/sys" 2>/dev/null || true
umount "$STAGING_DIR/rootfs/dev" 2>/dev/null || true

KERNEL="$(ls -1t "$STAGING_DIR/rootfs/boot"/vmlinuz-*.x86_64 | head -n 1)"
INITRD="$STAGING_DIR/rootfs/boot/initramfs-live.img"

cp "$KERNEL" "$STAGING_DIR/iso/isolinux/vmlinuz"
cp "$INITRD" "$STAGING_DIR/iso/isolinux/initrd.img"

echo "=== 4. Creating LiveOS SquashFS filesystem with LiveOS/rootfs.img ==="
umount -f "$STAGING_DIR/rootfs" 2>/dev/null || true
losetup -D 2>/dev/null || true

# Shrink ext4 image to minimize size and optimize compression
e2fsck -fy "$IMG_FILE" || true
resize2fs -M "$IMG_FILE" || true

mkdir -p "$STAGING_DIR/squash_root/LiveOS"
rm -f "$STAGING_DIR/squash_root/LiveOS/rootfs.img"
cp --sparse=always "$IMG_FILE" "$STAGING_DIR/squash_root/LiveOS/rootfs.img"

rm -f "$STAGING_DIR/iso/LiveOS/squashfs.img"
mksquashfs "$STAGING_DIR/squash_root" "$STAGING_DIR/iso/LiveOS/squashfs.img" -comp zstd -Xcompression-level 3 -noappend -b 1048576

rm -rf "$STAGING_DIR/squash_root"

echo "=== 5. Setting up BIOS & EFI Bootloaders ==="
cat > "$STAGING_DIR/iso/isolinux/isolinux.cfg" <<'EOF'
default vesamenu.c32
timeout 60

menu title AetherOS 1.0 Live

label live
  menu label ^Start AetherOS 1.0 (Hyprland Desktop)
  menu default
  kernel vmlinuz
  append initrd=initrd.img root=live:CDLABEL=AETHEROS rd.live.image rw selinux=0 enforcing=0 quiet splash

label safe
  menu label Start AetherOS 1.0 (^Basic Graphics)
  kernel vmlinuz
  append initrd=initrd.img root=live:CDLABEL=AETHEROS rd.live.image rw selinux=0 enforcing=0 nomodeset quiet
EOF

# Copy isolinux binaries
for d in /usr/lib/ISOLINUX /usr/lib/syslinux/modules/bios /usr/lib/syslinux/bios /usr/lib/syslinux; do
    if [ -f "$d/isolinux.bin" ]; then
        cp "$d/isolinux.bin" "$STAGING_DIR/iso/isolinux/" 2>/dev/null || true
    fi
    if [ -f "$d/isohdpfx.bin" ]; then
        cp "$d/isohdpfx.bin" "$STAGING_DIR/iso/isolinux/" 2>/dev/null || true
    fi
done

for f in ldlinux.c32 libcom32.c32 libutil.c32 vesamenu.c32 menu.c32; do
    find /usr/lib/syslinux/ /usr/lib/ISOLINUX/ -name "$f" -exec cp {} "$STAGING_DIR/iso/isolinux/" \; 2>/dev/null || true
done

cat > "$STAGING_DIR/iso/boot/grub/grub.cfg" <<'EOF'
set default="0"
set timeout=5

menuentry 'Start AetherOS 1.0 (Live Desktop)' --class fedora --class gnu-linux --class gnu --class os {
    linux /isolinux/vmlinuz root=live:CDLABEL=AETHEROS rd.live.image rw selinux=0 enforcing=0 quiet splash
    initrd /isolinux/initrd.img
}

menuentry 'Start AetherOS 1.0 (Basic Graphics Mode)' --class fedora --class gnu-linux --class gnu --class os {
    linux /isolinux/vmlinuz root=live:CDLABEL=AETHEROS rd.live.image rw selinux=0 enforcing=0 nomodeset quiet
    initrd /isolinux/initrd.img
}
EOF

cp "$STAGING_DIR/iso/boot/grub/grub.cfg" "$STAGING_DIR/iso/EFI/BOOT/grub.cfg"

if command -v grub-mkimage >/dev/null; then
    grub-mkimage -o "$STAGING_DIR/iso/EFI/BOOT/BOOTX64.EFI" -p "/EFI/BOOT" -O x86_64-efi fat iso9660 part_gpt part_msdos normal boot linux search search_fs_file
    dd if=/dev/zero of="$STAGING_DIR/iso/isolinux/efiboot.img" bs=1M count=10
    mkfs.vfat "$STAGING_DIR/iso/isolinux/efiboot.img"
    mmd -i "$STAGING_DIR/iso/isolinux/efiboot.img" ::EFI ::EFI/BOOT
    mcopy -i "$STAGING_DIR/iso/isolinux/efiboot.img" "$STAGING_DIR/iso/EFI/BOOT/BOOTX64.EFI" ::EFI/BOOT/
    mcopy -i "$STAGING_DIR/iso/isolinux/efiboot.img" "$STAGING_DIR/iso/boot/grub/grub.cfg" ::EFI/BOOT/
fi

echo "=== 6. Authoring Hybrid ISO image with xorriso ==="
MBR_BIN=""
for b in /usr/lib/ISOLINUX/isohdpfx.bin /usr/lib/syslinux/bios/isohdpfx.bin /usr/lib/syslinux/isohdpfx.bin; do
    if [ -f "$b" ]; then
        MBR_BIN="$b"
        break
    fi
done

if [ -n "$MBR_BIN" ] && [ -f "$STAGING_DIR/iso/isolinux/isolinux.bin" ]; then
    xorriso -as mkisofs \
        -iso-level 3 \
        -full-iso9660-filenames \
        -volid "AETHEROS" \
        -eltorito-boot isolinux/isolinux.bin \
        -eltorito-catalog isolinux/boot.cat \
        -no-emul-boot -boot-load-size 4 -boot-info-table \
        -isohybrid-mbr "$MBR_BIN" \
        -eltorito-alt-boot \
        -e isolinux/efiboot.img \
        -no-emul-boot -isohybrid-gpt-basdat \
        -output "$ISO_PATH" \
        "$STAGING_DIR/iso"
else
    xorriso -as mkisofs \
        -iso-level 3 \
        -volid "AETHEROS" \
        -output "$ISO_PATH" \
        "$STAGING_DIR/iso"
fi

echo "=== Live ISO Created Successfully! ==="
echo "ISO Location: $ISO_PATH"
ls -lh "$ISO_PATH"
