#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTDIR="$PROJECT_ROOT/build/out"
IMG_FILE="$(ls -1t /var/tmp/aetheros-build-*/result/lmc-disk-*.img "$OUTDIR"/lmc-disk-*.img /var/tmp/lmc-disk-*.img 2>/dev/null | head -n 1 || true)"
ISO_PATH="$OUTDIR/AetherOS.iso"

if [[ -z "$IMG_FILE" || ! -f "$IMG_FILE" ]]; then
    echo "Error: No disk image found in /var/tmp or $OUTDIR"
    exit 1
fi
mkdir -p "$OUTDIR"

echo "=== 1. Preparing staging environment ==="
STAGING_DIR="/var/tmp/aetheros-staging-$$"
mkdir -p "$STAGING_DIR"

umount -l /var/tmp/aetheros-staging-*/rootfs/* 2>/dev/null || true
umount -l /var/tmp/aetheros-staging-*/rootfs 2>/dev/null || true
umount -l /mnt/sysimage 2>/dev/null || true
umount -l /mnt/aether_staging 2>/dev/null || true
losetup -D 2>/dev/null || true

truncate -s 16G "$IMG_FILE"
e2fsck -fy "$IMG_FILE" || true

mkdir -p "$STAGING_DIR/iso/LiveOS"
mkdir -p "$STAGING_DIR/iso/isolinux"
mkdir -p "$STAGING_DIR/iso/EFI/BOOT"
mkdir -p "$STAGING_DIR/iso/boot/grub"
mkdir -p "$STAGING_DIR/rootfs"

echo "=== 2. Mounting rootfs & injecting latest AetherOS desktop suite ==="
mount -o loop "$IMG_FILE" "$STAGING_DIR/rootfs"

# Hyprland configs
mkdir -p "$STAGING_DIR/rootfs/etc/skel/.config/hypr"
install -Dm644 "$PROJECT_ROOT/configs/hyprland/hyprland.conf" "$STAGING_DIR/rootfs/etc/skel/.config/hypr/hyprland.conf"
install -Dm644 "$PROJECT_ROOT/configs/hyprland/hyprlock.conf" "$STAGING_DIR/rootfs/etc/skel/.config/hypr/hyprlock.conf"
install -Dm644 "$PROJECT_ROOT/configs/hyprland/monitors.conf" "$STAGING_DIR/rootfs/etc/skel/.config/hypr/monitors.conf"

# Waybar configs & scripts
mkdir -p "$STAGING_DIR/rootfs/etc/skel/.config/waybar/scripts"
install -Dm644 "$PROJECT_ROOT/configs/waybar/config.jsonc" "$STAGING_DIR/rootfs/etc/skel/.config/waybar/config.jsonc"
install -Dm644 "$PROJECT_ROOT/configs/waybar/style.css" "$STAGING_DIR/rootfs/etc/skel/.config/waybar/style.css"
if [ -d "$PROJECT_ROOT/configs/waybar/scripts" ]; then
    cp -rf "$PROJECT_ROOT/configs/waybar/scripts/"* "$STAGING_DIR/rootfs/etc/skel/.config/waybar/scripts/"
fi
chmod +x "$STAGING_DIR/rootfs/etc/skel/.config/waybar/scripts/"*.sh 2>/dev/null || true

# Wofi, Rofi, Dunst, Kitty
mkdir -p "$STAGING_DIR/rootfs/etc/skel/.config/wofi"
install -Dm644 "$PROJECT_ROOT/configs/wofi/config" "$STAGING_DIR/rootfs/etc/skel/.config/wofi/config"
install -Dm644 "$PROJECT_ROOT/configs/wofi/style.css" "$STAGING_DIR/rootfs/etc/skel/.config/wofi/style.css"

mkdir -p "$STAGING_DIR/rootfs/etc/skel/.config/rofi"
if [ -d "$PROJECT_ROOT/configs/rofi" ]; then
    cp -rf "$PROJECT_ROOT/configs/rofi/"* "$STAGING_DIR/rootfs/etc/skel/.config/rofi/"
fi

mkdir -p "$STAGING_DIR/rootfs/etc/skel/.config/dunst"
install -Dm644 "$PROJECT_ROOT/configs/dunst/dunstrc" "$STAGING_DIR/rootfs/etc/skel/.config/dunst/dunstrc"

mkdir -p "$STAGING_DIR/rootfs/etc/skel/.config/kitty"
install -Dm644 "$PROJECT_ROOT/configs/kitty/kitty.conf" "$STAGING_DIR/rootfs/etc/skel/.config/kitty/kitty.conf"

if [ -f "$PROJECT_ROOT/configs/mime/mimeapps.list" ]; then
    install -Dm644 "$PROJECT_ROOT/configs/mime/mimeapps.list" "$STAGING_DIR/rootfs/etc/skel/.config/mimeapps.list"
fi

# Fastfetch and Shell configurations
mkdir -p "$STAGING_DIR/rootfs/etc/skel/.config/fastfetch"
if [ -d "$PROJECT_ROOT/configs/fastfetch" ]; then
    cp -rf "$PROJECT_ROOT/configs/fastfetch/"* "$STAGING_DIR/rootfs/etc/skel/.config/fastfetch/"
fi

if [ -f "$PROJECT_ROOT/configs/shell/.zshrc" ]; then
    install -Dm644 "$PROJECT_ROOT/configs/shell/.zshrc" "$STAGING_DIR/rootfs/etc/skel/.zshrc"
fi
if [ -f "$PROJECT_ROOT/configs/shell/.bashrc" ]; then
    install -Dm644 "$PROJECT_ROOT/configs/shell/.bashrc" "$STAGING_DIR/rootfs/etc/skel/.bashrc"
fi

# Populate active user directories
for u in aether liveuser; do
    if [ -d "$STAGING_DIR/rootfs/home/$u" ]; then
        mkdir -p "$STAGING_DIR/rootfs/home/$u/.config"
        cp -rf "$STAGING_DIR/rootfs/etc/skel/.config/"* "$STAGING_DIR/rootfs/home/$u/.config/"
        chown -R 1000:1000 "$STAGING_DIR/rootfs/home/$u" 2>/dev/null || true
        chmod +x "$STAGING_DIR/rootfs/home/$u/.config/waybar/scripts/"*.sh 2>/dev/null || true
    fi
done

# Aether Binaries & Desktop Overlays
install -Dm755 "$PROJECT_ROOT/aether/bin/aether"              "$STAGING_DIR/rootfs/usr/local/bin/aether"
install -Dm755 "$PROJECT_ROOT/aether/bin/aether-splash"       "$STAGING_DIR/rootfs/usr/local/bin/aether-splash"
install -Dm755 "$PROJECT_ROOT/aether/bin/aether-desktop-overlay" "$STAGING_DIR/rootfs/usr/local/bin/aether-desktop-overlay"
install -Dm755 "$PROJECT_ROOT/aether/bin/aether-files"        "$STAGING_DIR/rootfs/usr/local/bin/aether-files"
install -Dm755 "$PROJECT_ROOT/aether/bin/aether-powermenu"    "$STAGING_DIR/rootfs/usr/local/bin/aether-powermenu"
install -Dm755 "$PROJECT_ROOT/aether/bin/aether-screenshot"   "$STAGING_DIR/rootfs/usr/local/bin/aether-screenshot"
install -Dm755 "$PROJECT_ROOT/aether/bin/aether-installer"    "$STAGING_DIR/rootfs/usr/local/bin/aether-installer"
install -Dm755 "$PROJECT_ROOT/aether/settings/aether-settings" "$STAGING_DIR/rootfs/usr/local/bin/aether-settings"
install -Dm755 "$PROJECT_ROOT/aether/software-center/aether-software" "$STAGING_DIR/rootfs/usr/local/bin/aether-software"
install -Dm755 "$PROJECT_ROOT/aether/setup/aether-welcome"    "$STAGING_DIR/rootfs/usr/local/bin/aether-welcome"
install -Dm755 "$PROJECT_ROOT/aether/ai/aether-ai"            "$STAGING_DIR/rootfs/usr/local/bin/aether-ai"
install -Dm755 "$PROJECT_ROOT/aether/battery/aether-battery-daemon"   "$STAGING_DIR/rootfs/usr/local/bin/aether-battery-daemon"
install -Dm755 "$PROJECT_ROOT/aether/telemetry/aether-telemetry-daemon" "$STAGING_DIR/rootfs/usr/local/bin/aether-telemetry-daemon"
install -Dm755 "$PROJECT_ROOT/aether/update-engine/aether-update-engine" "$STAGING_DIR/rootfs/usr/local/bin/aether-update-engine"
install -Dm755 "$PROJECT_ROOT/aether/update-engine/aether-updater"       "$STAGING_DIR/rootfs/usr/local/bin/aether-updater"
install -Dm755 "$PROJECT_ROOT/aether/setup/aether-firstboot"             "$STAGING_DIR/rootfs/usr/local/bin/aether-firstboot"
install -Dm644 "$PROJECT_ROOT/configs/systemd/aether-firstboot.service"     "$STAGING_DIR/rootfs/etc/systemd/system/aether-firstboot.service"
install -Dm644 "$PROJECT_ROOT/configs/systemd/aether-battery.service"       "$STAGING_DIR/rootfs/etc/systemd/system/aether-battery.service"
install -Dm644 "$PROJECT_ROOT/configs/systemd/aether-telemetry.service"     "$STAGING_DIR/rootfs/etc/systemd/system/aether-telemetry.service"
install -Dm644 "$PROJECT_ROOT/configs/systemd/aether-update-engine.service" "$STAGING_DIR/rootfs/etc/systemd/system/aether-update-engine.service"

mkdir -p "$STAGING_DIR/rootfs/usr/share/aetheros/desktop/widgets"
cp -r "$PROJECT_ROOT/desktop/widgets/"* "$STAGING_DIR/rootfs/usr/share/aetheros/desktop/widgets/"

mkdir -p "$STAGING_DIR/rootfs/usr/share/aetheros/desktop/files"
cp -r "$PROJECT_ROOT/desktop/files/"* "$STAGING_DIR/rootfs/usr/share/aetheros/desktop/files/"

# Calamares Configuration & Branding
if [ -d "$PROJECT_ROOT/configs/calamares" ]; then
    mkdir -p "$STAGING_DIR/rootfs/etc/calamares"
    cp -rf "$PROJECT_ROOT/configs/calamares/"* "$STAGING_DIR/rootfs/etc/calamares/"
fi

# Polkit Rules
if [ -d "$PROJECT_ROOT/configs/polkit" ]; then
    mkdir -p "$STAGING_DIR/rootfs/etc/polkit-1/rules.d"
    cp -rf "$PROJECT_ROOT/configs/polkit/"* "$STAGING_DIR/rootfs/etc/polkit-1/rules.d/"
    chmod 755 "$STAGING_DIR/rootfs/etc/polkit-1/rules.d"
    chmod 644 "$STAGING_DIR/rootfs/etc/polkit-1/rules.d/"*.rules 2>/dev/null || true
fi

# Wallpapers & Assets
mkdir -p "$STAGING_DIR/rootfs/usr/share/backgrounds/aetheros"
cp -r "$PROJECT_ROOT/assets/backgrounds/"* "$STAGING_DIR/rootfs/usr/share/backgrounds/aetheros/"
if [ -f "$PROJECT_ROOT/assets/avatar.png" ]; then
    cp -f "$PROJECT_ROOT/assets/avatar.png" "$STAGING_DIR/rootfs/usr/share/backgrounds/aetheros/avatar.png"
fi
if [ -f "$PROJECT_ROOT/assets/after_dark.png" ]; then
    cp -f "$PROJECT_ROOT/assets/after_dark.png" "$STAGING_DIR/rootfs/usr/share/backgrounds/aetheros/after_dark.png"
fi

# Applications & Sessions
mkdir -p "$STAGING_DIR/rootfs/usr/share/applications"
install -Dm644 "$PROJECT_ROOT/applications/aether-settings.desktop"  "$STAGING_DIR/rootfs/usr/share/applications/aether-settings.desktop"
install -Dm644 "$PROJECT_ROOT/applications/aether-files.desktop"     "$STAGING_DIR/rootfs/usr/share/applications/aether-files.desktop"
install -Dm644 "$PROJECT_ROOT/applications/aether-software.desktop"  "$STAGING_DIR/rootfs/usr/share/applications/aether-software.desktop"
install -Dm644 "$PROJECT_ROOT/applications/aether-welcome.desktop"   "$STAGING_DIR/rootfs/usr/share/applications/aether-welcome.desktop"
install -Dm644 "$PROJECT_ROOT/applications/aether-ai.desktop"        "$STAGING_DIR/rootfs/usr/share/applications/aether-ai.desktop"
install -Dm644 "$PROJECT_ROOT/applications/aether-installer.desktop" "$STAGING_DIR/rootfs/usr/share/applications/aether-installer.desktop"

mkdir -p "$STAGING_DIR/rootfs/usr/share/wayland-sessions"
cat > "$STAGING_DIR/rootfs/usr/share/wayland-sessions/hyprland.desktop" <<'EOF'
[Desktop Entry]
Name=Hyprland
Comment=An intelligent dynamic tiling Wayland compositor
Exec=Hyprland
Type=Application
DesktopNames=Hyprland
EOF

# SDDM theme & configuration
mkdir -p "$STAGING_DIR/rootfs/usr/share/sddm/themes/aetheros-glass"
cp -r "$PROJECT_ROOT/desktop/sddm/aetheros-glass/"* "$STAGING_DIR/rootfs/usr/share/sddm/themes/aetheros-glass/"
mkdir -p "$STAGING_DIR/rootfs/etc/sddm.conf.d"
cp -f "$PROJECT_ROOT/configs/wayland/sddm.conf.d/aetheros.conf" "$STAGING_DIR/rootfs/etc/sddm.conf.d/"
cp -f "$PROJECT_ROOT/configs/wayland/sddm.conf" "$STAGING_DIR/rootfs/etc/sddm.conf"

echo "=== 3. Building Live-enabled Initramfs with dmsquash-live ==="
KERNEL_VER="$(ls -1 "$STAGING_DIR/rootfs/lib/modules" | head -n 1)"
KERNEL="$(ls -1t "$STAGING_DIR/rootfs/boot"/vmlinuz-6*.x86_64 "$STAGING_DIR/rootfs/boot"/vmlinuz-*.x86_64 2>/dev/null | grep -v rescue | head -n 1)"

echo "Building Live initramfs for kernel $KERNEL_VER..."
DRACUT_KMODDIR_OVERRIDE=1 dracut \
    --kmoddir "$STAGING_DIR/rootfs/lib/modules/$KERNEL_VER" \
    -a "dmsquash-live dm base lvm" \
    -o "anaconda multipath fcoe fcoe-uefi qemu qemu-net" \
    --no-hostonly \
    --force \
    "$STAGING_DIR/iso/isolinux/initrd.img" \
    "$KERNEL_VER"

cp -f "$KERNEL" "$STAGING_DIR/iso/isolinux/vmlinuz"

echo "Live Initramfs created at $STAGING_DIR/iso/isolinux/initrd.img"

echo "=== 4. Creating LiveOS SquashFS filesystem ==="
sync
umount -f "$STAGING_DIR/rootfs" 2>/dev/null || true
losetup -D 2>/dev/null || true

e2fsck -fy "$IMG_FILE" || true

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

menu title AetherOS 1.0 Live (Fedora Edition)

label live
  menu label ^Start AetherOS 1.0 (Live Desktop)
  menu default
  kernel vmlinuz
  append initrd=initrd.img root=live:CDLABEL=AETHEROS rd.live.image rd.live.overlay.overlayfs=1 selinux=0 enforcing=0 audit=0 mitigations=off quiet splash

label safe
  menu label Start AetherOS 1.0 (^Basic Graphics)
  kernel vmlinuz
  append initrd=initrd.img root=live:CDLABEL=AETHEROS rd.live.image rd.live.overlay.overlayfs=1 selinux=0 enforcing=0 nomodeset audit=0 mitigations=off quiet
EOF

# Copy isolinux binaries
for d in /usr/share/syslinux /usr/lib/ISOLINUX /usr/lib/syslinux/modules/bios /usr/lib/syslinux/bios /usr/lib/syslinux; do
    if [ -f "$d/isolinux.bin" ]; then
        cp "$d/isolinux.bin" "$STAGING_DIR/iso/isolinux/" 2>/dev/null || true
    fi
    if [ -f "$d/isohdpfx.bin" ]; then
        cp "$d/isohdpfx.bin" "$STAGING_DIR/iso/isolinux/" 2>/dev/null || true
    fi
done

for f in ldlinux.c32 libcom32.c32 libutil.c32 vesamenu.c32 menu.c32; do
    find /usr/share/syslinux/ /usr/lib/syslinux/ /usr/lib/ISOLINUX/ -name "$f" -exec cp {} "$STAGING_DIR/iso/isolinux/" \; 2>/dev/null || true
done

cat > "$STAGING_DIR/iso/boot/grub/grub.cfg" <<'EOF'
set default="0"
set timeout=5

menuentry 'Start AetherOS 1.0 (Live Desktop)' --class fedora --class gnu-linux --class gnu --class os {
    linux /isolinux/vmlinuz root=live:CDLABEL=AETHEROS rd.live.image rd.live.overlay.overlayfs=1 selinux=0 enforcing=0 audit=0 mitigations=off quiet splash
    initrd /isolinux/initrd.img
}

menuentry 'Start AetherOS 1.0 (Basic Graphics Mode)' --class fedora --class gnu-linux --class gnu --class os {
    linux /isolinux/vmlinuz root=live:CDLABEL=AETHEROS rd.live.image rd.live.overlay.overlayfs=1 selinux=0 enforcing=0 nomodeset audit=0 mitigations=off quiet
    initrd /isolinux/initrd.img
}
EOF

cp "$STAGING_DIR/iso/boot/grub/grub.cfg" "$STAGING_DIR/iso/EFI/BOOT/grub.cfg"

GRUB_BIN=""
if command -v grub2-mkimage >/dev/null 2>&1; then
    GRUB_BIN="grub2-mkimage"
elif command -v grub-mkimage >/dev/null 2>&1; then
    GRUB_BIN="grub-mkimage"
fi

if [ -n "$GRUB_BIN" ]; then
    $GRUB_BIN -o "$STAGING_DIR/iso/EFI/BOOT/BOOTX64.EFI" -p "/EFI/BOOT" -O x86_64-efi fat iso9660 part_gpt part_msdos normal boot linux search search_fs_file
    dd if=/dev/zero of="$STAGING_DIR/iso/isolinux/efiboot.img" bs=1M count=10
    mkfs.vfat "$STAGING_DIR/iso/isolinux/efiboot.img"
    mmd -i "$STAGING_DIR/iso/isolinux/efiboot.img" ::EFI ::EFI/BOOT
    mcopy -i "$STAGING_DIR/iso/isolinux/efiboot.img" "$STAGING_DIR/iso/EFI/BOOT/BOOTX64.EFI" ::EFI/BOOT/
    mcopy -i "$STAGING_DIR/iso/isolinux/efiboot.img" "$STAGING_DIR/iso/boot/grub/grub.cfg" ::EFI/BOOT/
fi

echo "=== 6. Authoring Hybrid ISO image with xorriso ==="
MBR_BIN=""
for b in /usr/share/syslinux/isohdpfx.bin /usr/lib/ISOLINUX/isohdpfx.bin /usr/lib/syslinux/bios/isohdpfx.bin /usr/lib/syslinux/isohdpfx.bin; do
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
        -no-emul-boot \
        -boot-load-size 4 \
        -boot-info-table \
        -isohybrid-mbr "$MBR_BIN" \
        -eltorito-alt-boot \
        -e isolinux/efiboot.img \
        -no-emul-boot \
        -isohybrid-gpt-basdat \
        -output "$ISO_PATH" \
        "$STAGING_DIR/iso"
else
    xorriso -as mkisofs \
        -iso-level 3 \
        -volid "AETHEROS" \
        -output "$ISO_PATH" \
        "$STAGING_DIR/iso"
fi

rm -rf "$STAGING_DIR" 2>/dev/null || true
sha256sum "$ISO_PATH" > "$ISO_PATH.sha256"

echo "=== Live ISO Created Successfully! ==="
echo "ISO Location: $ISO_PATH"
ls -lh "$ISO_PATH"
