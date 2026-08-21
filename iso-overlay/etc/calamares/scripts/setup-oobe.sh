#!/usr/bin/env bash
# /etc/calamares/scripts/setup-oobe.sh
# Runs inside the target SSD/NVMe rootfs during Calamares installation

set -euo pipefail

echo "Configuring Aether OS First-Boot OOBE on target disk..."

# 1. Create the First-Boot OOBE User
useradd -m -c "Aether Setup" -s /bin/bash aether-setup 2>/dev/null || true
passwd -d aether-setup 2>/dev/null || true
usermod -aG wheel aether-setup 2>/dev/null || true

# 2. Configure Hyprland for the Welcome Wizard (Kiosk Mode)
mkdir -p /home/aether-setup/.config/hypr/
cat <<EOF > /home/aether-setup/.config/hypr/hyprland.conf
env = WLR_NO_HARDWARE_CURSORS,1
monitor=,preferred,auto,1
windowrulev2 = fullscreen, class:^(aether-welcome)$
animations { enabled = no }
exec-once = /usr/local/bin/aether-welcome
EOF
chown -R aether-setup:aether-setup /home/aether-setup/.config 2>/dev/null || true

# 3. Set SDDM to auto-login to the setup wizard on the target disk
mkdir -p /etc/sddm.conf.d
cat <<EOF > /etc/sddm.conf.d/autologin.conf
[Autologin]
User=aether-setup
Session=hyprland
EOF

# 4. Remove the liveuser from the installed system
userdel -r liveuser 2>/dev/null || true

echo "Target disk OOBE successfully prepared."
