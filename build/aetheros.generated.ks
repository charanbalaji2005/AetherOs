#version=RHEL9
# AetherOS - Fedora-based, Hyprland-first Linux distribution
# Build with: sudo bash build/build-iso.sh (--releasever 41)

lang en_US.UTF-8
keyboard us
timezone UTC --utc

# --- Repositories ---
url --mirrorlist=https://mirrors.fedoraproject.org/mirrorlist?repo=fedora-$releasever&arch=$basearch
repo --name=fedora --mirrorlist=https://mirrors.fedoraproject.org/mirrorlist?repo=fedora-$releasever&arch=$basearch
repo --name=updates --mirrorlist=https://mirrors.fedoraproject.org/mirrorlist?repo=updates-released-f$releasever&arch=$basearch

# RPM Fusion Repositories for NVIDIA drivers
repo --name=rpmfusion-free --mirrorlist=https://mirrors.rpmfusion.org/mirrorlist?repo=free-fedora-$releasever&arch=$basearch
repo --name=rpmfusion-free-updates --mirrorlist=https://mirrors.rpmfusion.org/mirrorlist?repo=free-fedora-updates-released-$releasever&arch=$basearch
repo --name=rpmfusion-nonfree --mirrorlist=https://mirrors.rpmfusion.org/mirrorlist?repo=nonfree-fedora-$releasever&arch=$basearch
repo --name=rpmfusion-nonfree-updates --mirrorlist=https://mirrors.rpmfusion.org/mirrorlist?repo=nonfree-fedora-updates-released-$releasever&arch=$basearch

# Microsoft VS Code & Docker CE Repositories
repo --name=vscode --baseurl=https://packages.microsoft.com/yumrepos/vscode
repo --name=docker-ce --baseurl=https://download.docker.com/linux/fedora/$releasever/$basearch/stable

# --- Filesystem: Root partition ---
zerombr
clearpart --all --initlabel
part /boot/efi --fstype=efi --size=600
part /boot --fstype=ext4 --size=1024
part / --fstype=btrfs --grow --size=15360

bootloader --location=mbr --timeout=5
network --bootproto=dhcp --activate
rootpw --lock
user --name=aether --groups=wheel,audio,video,input --plaintext --password=aether

selinux --enforcing
firewall --enabled
services --enabled=sddm,NetworkManager,systemd-resolved,firewalld,bluetooth,power-profiles-daemon

%packages
@core

# --- Core system & tools ---
kernel
dracut-live
dracut-config-generic
grub2-efi-x64
shim-x64
grubby
btrfs-progs
NetworkManager
systemd
dnf5
flatpak
podman
curl
pciutils
usbutils
util-linux

# --- Hyprland desktop stack & utilities ---
hyprland
xdg-desktop-portal-hyprland
waybar
wofi
bluez
blueman
network-manager-applet
power-profiles-daemon
jq
jetbrains-mono-fonts
grim
slurp
wl-clipboard
playerctl
swaybg
dunst
nautilus
brightnessctl
kitty
sddm
polkit-kde-agent-1
pipewire
pipewire-pulseaudio
wireplumber
pavucontrol
qt5-qtwayland
qt6-qtwayland
python3-gobject
python3-tkinter

# --- GPU drivers: install all so the correct one activates per hardware ---
mesa-dri-drivers
mesa-vulkan-drivers
xorg-x11-drv-amdgpu
xorg-x11-drv-intel
akmod-nvidia
xorg-x11-drv-nvidia-cuda
vulkan-loader

# --- Dev tools ---
git
neovim
code
nodejs
python3
python3-pip
rust
cargo
golang
java-latest-openjdk
gcc
gcc-c++
clang
docker-ce
gh

# --- Apps ---
firefox
libreoffice
vlc
steam
obs-studio
gimp

%end

# --- Copy project files from host workspace into ISO image ---
%post --nochroot --log=/tmp/aetheros-copy.log
set -eux

SOURCE="/mnt/c/Users/Charan Balaji/Downloads/AetherOS/AetherOS"
TARGET="$INSTALL_ROOT"

# Aether CLI
install -Dm755 \
    "$SOURCE/aether/bin/aether" \
    "$TARGET/usr/local/bin/aether"

# Aether Settings
install -Dm755 \
    "$SOURCE/aether/settings/aether-settings" \
    "$TARGET/usr/local/bin/aether-settings"

# Wallpapers
mkdir -p "$TARGET/usr/share/backgrounds/aetheros"
cp -r "$SOURCE/assets/backgrounds/"* "$TARGET/usr/share/backgrounds/aetheros/"

# Hyprland configuration
install -Dm644 \
    "$SOURCE/configs/hyprland/hyprland.conf" \
    "$TARGET/etc/skel/.config/hypr/hyprland.conf"

install -Dm644 \
    "$SOURCE/configs/hyprland/monitors.conf" \
    "$TARGET/etc/skel/.config/hypr/monitors.conf"

# Waybar
install -Dm644 \
    "$SOURCE/configs/waybar/config.jsonc" \
    "$TARGET/etc/skel/.config/waybar/config.jsonc"

install -Dm644 \
    "$SOURCE/configs/waybar/style.css" \
    "$TARGET/etc/skel/.config/waybar/style.css"

# Waybar scripts
install -Dm755 \
    "$SOURCE/configs/waybar/scripts/gpu.sh" \
    "$TARGET/etc/skel/.config/waybar/scripts/gpu.sh"

install -Dm755 \
    "$SOURCE/configs/waybar/scripts/notifications.sh" \
    "$TARGET/etc/skel/.config/waybar/scripts/notifications.sh"

install -Dm755 \
    "$SOURCE/configs/waybar/scripts/quicksettings.sh" \
    "$TARGET/etc/skel/.config/waybar/scripts/quicksettings.sh"

# Kitty
install -Dm644 \
    "$SOURCE/configs/kitty/kitty.conf" \
    "$TARGET/etc/skel/.config/kitty/kitty.conf"

# Desktop entry
install -Dm644 \
    "$SOURCE/applications/aether-settings.desktop" \
    "$TARGET/usr/share/applications/aether-settings.desktop"

%end

# --- In-target Post-installation system configuration ---
%post --log=/var/log/aetheros-post.log

# Branding
mkdir -p /etc/aetheros
cat > /etc/os-release <<EOF
NAME="AetherOS"
VERSION="1.0"
ID=aetheros
ID_LIKE=fedora
PRETTY_NAME="AetherOS 1.0"
ANSI_COLOR="0;36"
LOGO=aetheros-logo
HOME_URL="https://example.com"
EOF

# Enable core system services
systemctl enable sddm.service
systemctl enable NetworkManager.service
systemctl enable firewalld.service
systemctl enable bluetooth.service
systemctl enable power-profiles-daemon.service

# PipeWire systemd user presets
mkdir -p /etc/systemd/user-preset
cat > /etc/systemd/user-preset/99-aetheros.preset <<EOF
enable pipewire.service
enable pipewire.socket
enable wireplumber.service
enable pipewire-pulse.service
enable pipewire-pulse.socket
EOF

# SDDM Wayland session desktop entry
mkdir -p /usr/share/wayland-sessions
cat > /usr/share/wayland-sessions/hyprland.desktop <<EOF
[Desktop Entry]
Name=Hyprland
Comment=An intelligent dynamic tiling Wayland compositor
Exec=Hyprland
Type=Application
DesktopNames=Hyprland
EOF

# Default sddm session -> Hyprland with autologin for development/testing
mkdir -p /etc/sddm.conf.d
cat > /etc/sddm.conf.d/aetheros.conf <<EOF
[Autologin]
User=aether
Session=hyprland
Relogin=false
EOF

# Lid switch configuration
mkdir -p /etc/systemd/logind.conf.d
cat > /etc/systemd/logind.conf.d/aetheros.conf <<EOF
[Login]
HandleLidSwitch=suspend
EOF

# Pre-populate default user 'aether' configuration if user directory exists
if [ -d /home/aether ]; then
  mkdir -p /home/aether/.config
  cp -r /etc/skel/.config/* /home/aether/.config/
  chown -R aether:aether /home/aether
  chmod +x /home/aether/.config/waybar/scripts/*.sh 2>/dev/null || true
fi

%end
