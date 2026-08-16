#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTDIR="$PROJECT_ROOT/build/out"
IMG_FILE="$(ls -1t "$OUTDIR"/lmc-disk-*.img 2>/dev/null | head -n 1)"

if [[ -z "$IMG_FILE" || ! -f "$IMG_FILE" ]]; then
    echo "Error: No disk image found in $OUTDIR"
    exit 1
fi

echo "=== Staging latest AetherOS files into image ==="
MOUNT_DIR="/mnt/aether_staging"
mkdir -p "$MOUNT_DIR"

losetup -d /dev/loop0 2>/dev/null || true
e2fsck -fy "$IMG_FILE" || true
mount -o loop "$IMG_FILE" "$MOUNT_DIR"

# 1. Install Aether CLI and GUI Settings
install -Dm755 "$PROJECT_ROOT/aether/bin/aether" "$MOUNT_DIR/usr/local/bin/aether"
install -Dm755 "$PROJECT_ROOT/aether/settings/aether-settings" "$MOUNT_DIR/usr/local/bin/aether-settings"

# 2. Install Wallpapers
mkdir -p "$MOUNT_DIR/usr/share/backgrounds/aetheros"
cp -r "$PROJECT_ROOT/assets/backgrounds/"* "$MOUNT_DIR/usr/share/backgrounds/aetheros/"
chmod 644 "$MOUNT_DIR/usr/share/backgrounds/aetheros/"*

# 3. Install Configs into /etc/skel
mkdir -p "$MOUNT_DIR/etc/skel/.config/hypr"
install -Dm644 "$PROJECT_ROOT/configs/hyprland/hyprland.conf" "$MOUNT_DIR/etc/skel/.config/hypr/hyprland.conf"
install -Dm644 "$PROJECT_ROOT/configs/hyprland/monitors.conf" "$MOUNT_DIR/etc/skel/.config/hypr/monitors.conf"

mkdir -p "$MOUNT_DIR/etc/skel/.config/waybar/scripts"
install -Dm644 "$PROJECT_ROOT/configs/waybar/config.jsonc" "$MOUNT_DIR/etc/skel/.config/waybar/config.jsonc"
install -Dm644 "$PROJECT_ROOT/configs/waybar/style.css" "$MOUNT_DIR/etc/skel/.config/waybar/style.css"
install -Dm755 "$PROJECT_ROOT/configs/waybar/scripts/gpu.sh" "$MOUNT_DIR/etc/skel/.config/waybar/scripts/gpu.sh"
install -Dm755 "$PROJECT_ROOT/configs/waybar/scripts/notifications.sh" "$MOUNT_DIR/etc/skel/.config/waybar/scripts/notifications.sh"
install -Dm755 "$PROJECT_ROOT/configs/waybar/scripts/quicksettings.sh" "$MOUNT_DIR/etc/skel/.config/waybar/scripts/quicksettings.sh"

mkdir -p "$MOUNT_DIR/etc/skel/.config/kitty"
install -Dm644 "$PROJECT_ROOT/configs/kitty/kitty.conf" "$MOUNT_DIR/etc/skel/.config/kitty/kitty.conf"

# 4. Install Desktop Entry
mkdir -p "$MOUNT_DIR/usr/share/applications"
install -Dm644 "$PROJECT_ROOT/applications/aether-settings.desktop" "$MOUNT_DIR/usr/share/applications/aether-settings.desktop"

# 5. Populate user /home/aether if exists
if [ -d "$MOUNT_DIR/home/aether" ]; then
    mkdir -p "$MOUNT_DIR/home/aether/.config"
    cp -r "$MOUNT_DIR/etc/skel/.config/"* "$MOUNT_DIR/home/aether/.config/"
    chown -R 1000:1000 "$MOUNT_DIR/home/aether" 2>/dev/null || true
    chmod +x "$MOUNT_DIR/home/aether/.config/waybar/scripts/"*.sh 2>/dev/null || true
fi

# 6. SDDM configuration & wayland sessions
mkdir -p "$MOUNT_DIR/etc/sddm.conf.d"
cat > "$MOUNT_DIR/etc/sddm.conf.d/aetheros.conf" <<EOF
[General]
DisplayServer=wayland

[Autologin]
Relogin=false
EOF

mkdir -p "$MOUNT_DIR/usr/share/wayland-sessions"
cat > "$MOUNT_DIR/usr/share/wayland-sessions/hyprland.desktop" <<EOF
[Desktop Entry]
Name=Hyprland
Comment=An intelligent dynamic tiling Wayland compositor
Exec=Hyprland
Type=Application
DesktopNames=Hyprland
EOF

sync
umount "$MOUNT_DIR"
echo "=== Disk image staging complete! ==="

echo "=== Converting to VMware VMDK disk ==="
qemu-img convert -O vmdk -p "$IMG_FILE" "$OUTDIR/AetherOS.vmdk"

echo "=== Converting to QEMU QCOW2 disk ==="
qemu-img convert -O qcow2 -c -p "$IMG_FILE" "$OUTDIR/AetherOS.qcow2"

echo "=== Generating Bootable ISO ==="
# Install xorriso if needed
command -v xorriso >/dev/null || apt-get install -y xorriso isolinux 2>/dev/null || true

# Copy raw image to .iso for hybrid raw boot or create ISO
cp "$IMG_FILE" "$OUTDIR/AetherOS-raw.img"

echo "=== Packaging Complete ==="
echo "VMware Disk: $OUTDIR/AetherOS.vmdk"
echo "QEMU Disk:   $OUTDIR/AetherOS.qcow2"
