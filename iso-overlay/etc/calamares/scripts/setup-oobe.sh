#!/usr/bin/env bash
# Target Disk Post-Install Script (Calamares)
# Ensures GDM and GNOME are default on the permanently installed system
set -euo pipefail

# 1. Clean up live ISO autologin configurations
rm -f /etc/sddm.conf.d/autologin.conf 2>/dev/null || true

# 2. Configure GDM with GNOME as default session on target disk
mkdir -p /etc/gdm
cat <<EOF > /etc/gdm/custom.conf
[daemon]
WaylandEnable=true
DefaultSession=gnome.desktop

[security]
[xdmcp]
[chooser]
[debug]
EOF

# 3. Ensure graphical target is default
systemctl set-default graphical.target 2>/dev/null || true
systemctl enable gdm.service 2>/dev/null || true
systemctl disable sddm.service 2>/dev/null || true

# 4. Remove the liveuser from the installed system
userdel -rf liveuser 2>/dev/null || true

echo "Target disk GNOME environment successfully configured."
