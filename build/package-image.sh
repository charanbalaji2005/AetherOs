#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTDIR="$PROJECT_ROOT/build/out"
IMG_FILE="$(ls -1t "$OUTDIR"/lmc-disk-*.img /var/tmp/aetheros-build-*/result/lmc-disk-*.img /var/tmp/lmc-disk-*.img 2>/dev/null | head -n 1 || true)"

if [[ -z "$IMG_FILE" || ! -f "$IMG_FILE" ]]; then
    echo "Error: No disk image found in $OUTDIR or /var/tmp"
    exit 1
fi
mkdir -p "$OUTDIR"

# Install qemu-img if missing
if ! command -v qemu-img >/dev/null 2>&1; then
    echo "Installing qemu-img disk converter..."
    dnf install -y qemu-img 2>/dev/null || apt-get install -y qemu-utils 2>/dev/null || true
fi

echo "=== Staging latest AetherOS files into image ==="
MOUNT_DIR="/mnt/aether_staging"
mkdir -p "$MOUNT_DIR"

umount -f "$MOUNT_DIR" 2>/dev/null || true
losetup -D 2>/dev/null || true
mount -o loop "$IMG_FILE" "$MOUNT_DIR"

# 1. Install Aether CLI, GUI Settings, Splash, Desktop Overlay, Files, PowerMenu, Screenshot, and First-Boot
install -Dm755 "$PROJECT_ROOT/aether/bin/aether"              "$MOUNT_DIR/usr/local/bin/aether"
install -Dm755 "$PROJECT_ROOT/aether/bin/aether-splash"       "$MOUNT_DIR/usr/local/bin/aether-splash"
install -Dm755 "$PROJECT_ROOT/aether/bin/aether-desktop-overlay" "$MOUNT_DIR/usr/local/bin/aether-desktop-overlay"
install -Dm755 "$PROJECT_ROOT/aether/bin/aether-files"        "$MOUNT_DIR/usr/local/bin/aether-files"
install -Dm755 "$PROJECT_ROOT/aether/bin/aether-powermenu"    "$MOUNT_DIR/usr/local/bin/aether-powermenu"
install -Dm755 "$PROJECT_ROOT/aether/bin/aether-screenshot"   "$MOUNT_DIR/usr/local/bin/aether-screenshot"
install -Dm755 "$PROJECT_ROOT/aether/settings/aether-settings" "$MOUNT_DIR/usr/local/bin/aether-settings"
install -Dm755 "$PROJECT_ROOT/aether/setup/aether-firstboot"  "$MOUNT_DIR/usr/local/bin/aether-firstboot"
install -Dm644 "$PROJECT_ROOT/configs/systemd/aether-firstboot.service" "$MOUNT_DIR/etc/systemd/system/aether-firstboot.service"

mkdir -p "$MOUNT_DIR/usr/share/aetheros/desktop/widgets"
cp -r "$PROJECT_ROOT/desktop/widgets/"* "$MOUNT_DIR/usr/share/aetheros/desktop/widgets/"

# Install AetherOS File Manager UI
mkdir -p "$MOUNT_DIR/usr/share/aetheros/desktop/files"
cp -r "$PROJECT_ROOT/desktop/files/"* "$MOUNT_DIR/usr/share/aetheros/desktop/files/"

# 2. Install Wallpapers & Assets
mkdir -p "$MOUNT_DIR/usr/share/backgrounds/aetheros"
cp -r "$PROJECT_ROOT/assets/backgrounds/"* "$MOUNT_DIR/usr/share/backgrounds/aetheros/"
if [ -f "$PROJECT_ROOT/assets/avatar.png" ]; then
    cp -f "$PROJECT_ROOT/assets/avatar.png" "$MOUNT_DIR/usr/share/backgrounds/aetheros/avatar.png"
fi
if [ -f "$PROJECT_ROOT/assets/after_dark.png" ]; then
    cp -f "$PROJECT_ROOT/assets/after_dark.png" "$MOUNT_DIR/usr/share/backgrounds/aetheros/after_dark.png"
fi
chmod 644 "$MOUNT_DIR/usr/share/backgrounds/aetheros/"*

# 3. Install Configs into /etc/skel
mkdir -p "$MOUNT_DIR/etc/skel/.config/hypr"
install -Dm644 "$PROJECT_ROOT/configs/hyprland/hyprland.conf" "$MOUNT_DIR/etc/skel/.config/hypr/hyprland.conf"
install -Dm644 "$PROJECT_ROOT/configs/hyprland/hyprlock.conf" "$MOUNT_DIR/etc/skel/.config/hypr/hyprlock.conf"
install -Dm644 "$PROJECT_ROOT/configs/hyprland/monitors.conf" "$MOUNT_DIR/etc/skel/.config/hypr/monitors.conf"

mkdir -p "$MOUNT_DIR/etc/skel/.config/waybar/scripts"
install -Dm644 "$PROJECT_ROOT/configs/waybar/config.jsonc" "$MOUNT_DIR/etc/skel/.config/waybar/config.jsonc"
install -Dm644 "$PROJECT_ROOT/configs/waybar/style.css" "$MOUNT_DIR/etc/skel/.config/waybar/style.css"
install -Dm755 "$PROJECT_ROOT/configs/waybar/scripts/gpu.sh" "$MOUNT_DIR/etc/skel/.config/waybar/scripts/gpu.sh"
install -Dm755 "$PROJECT_ROOT/configs/waybar/scripts/notifications.sh" "$MOUNT_DIR/etc/skel/.config/waybar/scripts/notifications.sh"
install -Dm755 "$PROJECT_ROOT/configs/waybar/scripts/quicksettings.sh" "$MOUNT_DIR/etc/skel/.config/waybar/scripts/quicksettings.sh"

mkdir -p "$MOUNT_DIR/etc/skel/.config/wofi"
install -Dm644 "$PROJECT_ROOT/configs/wofi/config" "$MOUNT_DIR/etc/skel/.config/wofi/config"
install -Dm644 "$PROJECT_ROOT/configs/wofi/style.css" "$MOUNT_DIR/etc/skel/.config/wofi/style.css"

mkdir -p "$MOUNT_DIR/etc/skel/.config/dunst"
install -Dm644 "$PROJECT_ROOT/configs/dunst/dunstrc" "$MOUNT_DIR/etc/skel/.config/dunst/dunstrc"

mkdir -p "$MOUNT_DIR/etc/skel/.config/kitty"
install -Dm644 "$PROJECT_ROOT/configs/kitty/kitty.conf" "$MOUNT_DIR/etc/skel/.config/kitty/kitty.conf"

# 4. Install Desktop Entries
mkdir -p "$MOUNT_DIR/usr/share/applications"
install -Dm644 "$PROJECT_ROOT/applications/aether-settings.desktop" "$MOUNT_DIR/usr/share/applications/aether-settings.desktop"
install -Dm644 "$PROJECT_ROOT/applications/aether-files.desktop"    "$MOUNT_DIR/usr/share/applications/aether-files.desktop"

# 5. Populate user /home/aether if exists
if [ -d "$MOUNT_DIR/home/aether" ]; then
    mkdir -p "$MOUNT_DIR/home/aether/.config"
    cp -r "$MOUNT_DIR/etc/skel/.config/"* "$MOUNT_DIR/home/aether/.config/"
    chown -R 1000:1000 "$MOUNT_DIR/home/aether" 2>/dev/null || true
    chmod +x "$MOUNT_DIR/home/aether/.config/waybar/scripts/"*.sh 2>/dev/null || true
fi

# 6. SDDM theme, configuration & wayland sessions
mkdir -p "$MOUNT_DIR/usr/share/sddm/themes/aetheros-glass"
cp -r "$PROJECT_ROOT/desktop/sddm/aetheros-glass/"* "$MOUNT_DIR/usr/share/sddm/themes/aetheros-glass/"

mkdir -p "$MOUNT_DIR/etc/sddm.conf.d"
cp -f "$PROJECT_ROOT/configs/wayland/sddm.conf.d/aetheros.conf" "$MOUNT_DIR/etc/sddm.conf.d/"
cp -f "$PROJECT_ROOT/configs/wayland/sddm.conf" "$MOUNT_DIR/etc/sddm.conf"

# 7. Plymouth Boot Theme & Sudoers Feedback
mkdir -p "$MOUNT_DIR/usr/share/plymouth/themes/aetheros-glow"
cp -r "$PROJECT_ROOT/branding/plymouth/aetheros-glow/"* "$MOUNT_DIR/usr/share/plymouth/themes/aetheros-glow/"

mkdir -p "$MOUNT_DIR/etc/plymouth"
cp -f "$PROJECT_ROOT/configs/plymouth/plymouthd.conf" "$MOUNT_DIR/etc/plymouth/plymouthd.conf"

mkdir -p "$MOUNT_DIR/etc/sudoers.d"
chmod 750 "$MOUNT_DIR/etc/sudoers.d"
install -Dm440 "$PROJECT_ROOT/configs/sudoers.d/01-pwfeedback" "$MOUNT_DIR/etc/sudoers.d/01-pwfeedback"

# Hyprlock config
install -Dm644 "$PROJECT_ROOT/configs/hyprland/hyprlock.conf" "$MOUNT_DIR/etc/skel/.config/hypr/hyprlock.conf"

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
qemu-img convert -O vmdk -o subformat=streamOptimized -p "$IMG_FILE" "$OUTDIR/AetherOS.vmdk"

echo "=== Converting to QEMU QCOW2 disk ==="
qemu-img convert -O qcow2 -c -p "$IMG_FILE" "$OUTDIR/AetherOS.qcow2"

echo "=== Packaging Complete ==="
echo "VMware Disk: $OUTDIR/AetherOS.vmdk"
echo "QEMU Disk:   $OUTDIR/AetherOS.qcow2"
echo "Live ISO:    $OUTDIR/AetherOS.iso"

