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

selinux --permissive
firewall --enabled
services --enabled=sddm,NetworkManager,systemd-resolved,firewalld,bluetooth,power-profiles-daemon,dbus-broker

%packages
@core

# --- Core system & tools ---
kernel
dracut
dracut-live
dracut-network
dracut-config-generic
grub2-efi-x64
shim-x64
grubby
btrfs-progs
ntfs-3g
dosfstools
e2fsprogs
rsync
NetworkManager
systemd
systemd-udev
kbd
glibc-langpack-en
dnf5
flatpak
podman
curl
pciutils
usbutils
util-linux

# --- Hardware Firmware & Adapters (Wi-Fi, Bluetooth, Audio DSPs, Storage) ---
linux-firmware
alsa-firmware
alsa-sof-firmware
alsa-utils
nvme-cli
smartmontools
exfatprogs
iw
ethtool
bluez-tools

# --- VM & Hypervisor Integration ---
virtualbox-guest-additions
spice-vdagent
open-vm-tools
open-vm-tools-desktop
qemu-guest-agent
xorg-x11-drv-vmware

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
plymouth
plymouth-plugin-script
plymouth-theme-spinner

# --- GPU drivers & Video Acceleration: install all so the correct one activates per hardware ---
mesa-dri-drivers
mesa-vulkan-drivers
xorg-x11-drv-amdgpu
xorg-x11-drv-intel
intel-media-driver
libva-utils
vulkan-tools
vulkan-loader

# --- Complete Fedora Workstation Core Tools & CLI Utilities ---
wget
htop
btop
fastfetch
ripgrep
fd-find
tar
unzip
p7zip
p7zip-plugins
make
cmake
ninja-build
firewalld
firewall-config
openssl
openssh-clients
openssh-server
bash-completion
zsh
fish
tmux
tree
which
findutils
man-db
man-pages
iputils
bind-utils
nmap
iperf3

# --- Multimedia Codecs & GStreamer ---
gstreamer1-plugins-base
gstreamer1-plugins-good
gstreamer1-plugins-bad-free
gstreamer1-plugins-ugly-free
gstreamer1-plugin-openh264
ffmpeg-free

# --- Premium Modern Fonts ---
fira-code-fonts
fontawesome-fonts
google-noto-sans-fonts
google-noto-color-emoji-fonts

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

SOURCE="__AETHER_SOURCE__"
TARGET="$INSTALL_ROOT"

# Aether CLI
install -Dm755 \
    "$SOURCE/aether/bin/aether" \
    "$TARGET/usr/local/bin/aether"

# Aether Settings
install -Dm755 \
    "$SOURCE/aether/settings/aether-settings" \
    "$TARGET/usr/local/bin/aether-settings"

# Aether Desktop Startup Splash Screen
install -Dm755 \
    "$SOURCE/aether/bin/aether-splash" \
    "$TARGET/usr/local/bin/aether-splash"

# Aether Cyberpunk Desktop Overlay Launcher & Widgets Suite
install -Dm755 \
    "$SOURCE/aether/bin/aether-desktop-overlay" \
    "$TARGET/usr/local/bin/aether-desktop-overlay"

mkdir -p "$TARGET/usr/share/aetheros/desktop/widgets"
cp -r "$SOURCE/desktop/widgets/"* "$TARGET/usr/share/aetheros/desktop/widgets/"

# Aether First-Boot Setup Wizard
mkdir -p "$TARGET/usr/share/aetheros/desktop/files"
cp -r "$SOURCE/desktop/files/"* "$TARGET/usr/share/aetheros/desktop/files/"

# Plymouth Boot Theme & Config
mkdir -p "$TARGET/usr/share/plymouth/themes/aetheros-glow"
cp -r "$SOURCE/branding/plymouth/aetheros-glow/"* "$TARGET/usr/share/plymouth/themes/aetheros-glow/"

mkdir -p "$TARGET/etc/plymouth"
cp -f "$SOURCE/configs/plymouth/plymouthd.conf" "$TARGET/etc/plymouth/plymouthd.conf"

# Wallpapers & Assets
mkdir -p "$TARGET/usr/share/backgrounds/aetheros"
cp -r "$SOURCE/assets/backgrounds/"* "$TARGET/usr/share/backgrounds/aetheros/"
if [ -f "$SOURCE/assets/avatar.png" ]; then
    cp -f "$SOURCE/assets/avatar.png" "$TARGET/usr/share/backgrounds/aetheros/avatar.png"
fi
if [ -f "$SOURCE/assets/after_dark.png" ]; then
    cp -f "$SOURCE/assets/after_dark.png" "$TARGET/usr/share/backgrounds/aetheros/after_dark.png"
fi

# Hyprland configuration
mkdir -p "$TARGET/etc/skel/.config/hypr"
install -Dm644 "$SOURCE/configs/hyprland/hyprland.conf" "$TARGET/etc/skel/.config/hypr/hyprland.conf"
install -Dm644 "$SOURCE/configs/hyprland/hyprlock.conf" "$TARGET/etc/skel/.config/hypr/hyprlock.conf"
install -Dm644 "$SOURCE/configs/hyprland/monitors.conf" "$TARGET/etc/skel/.config/hypr/monitors.conf"

# Waybar
mkdir -p "$TARGET/etc/skel/.config/waybar/scripts"
install -Dm644 "$SOURCE/configs/waybar/config.jsonc" "$TARGET/etc/skel/.config/waybar/config.jsonc"
install -Dm644 "$SOURCE/configs/waybar/style.css" "$TARGET/etc/skel/.config/waybar/style.css"
install -Dm755 "$SOURCE/configs/waybar/scripts/gpu.sh" "$TARGET/etc/skel/.config/waybar/scripts/gpu.sh"
install -Dm755 "$SOURCE/configs/waybar/scripts/notifications.sh" "$TARGET/etc/skel/.config/waybar/scripts/notifications.sh"
install -Dm755 "$SOURCE/configs/waybar/scripts/quicksettings.sh" "$TARGET/etc/skel/.config/waybar/scripts/quicksettings.sh"

# Wofi
mkdir -p "$TARGET/etc/skel/.config/wofi"
install -Dm644 "$SOURCE/configs/wofi/config" "$TARGET/etc/skel/.config/wofi/config"
install -Dm644 "$SOURCE/configs/wofi/style.css" "$TARGET/etc/skel/.config/wofi/style.css"

# Dunst
mkdir -p "$TARGET/etc/skel/.config/dunst"
install -Dm644 "$SOURCE/configs/dunst/dunstrc" "$TARGET/etc/skel/.config/dunst/dunstrc"

# Kitty
mkdir -p "$TARGET/etc/skel/.config/kitty"
install -Dm644 "$SOURCE/configs/kitty/kitty.conf" "$TARGET/etc/skel/.config/kitty/kitty.conf"

# Desktop entries
mkdir -p "$TARGET/usr/share/applications"
install -Dm644 "$SOURCE/applications/aether-settings.desktop" "$TARGET/usr/share/applications/aether-settings.desktop"
install -Dm644 "$SOURCE/applications/aether-files.desktop" "$TARGET/usr/share/applications/aether-files.desktop"

# Modular system configurations
mkdir -p "$TARGET/etc/dracut.conf.d"
cp -f "$SOURCE/configs/dracut/99-aetheros-live.conf" "$TARGET/etc/dracut.conf.d/"

mkdir -p "$TARGET/etc/systemd/journald.conf.d"
cp -f "$SOURCE/configs/systemd/journald.conf.d/00-aetheros-live.conf" "$TARGET/etc/systemd/journald.conf.d/"

mkdir -p "$TARGET/etc/systemd/user-preset"
cp -f "$SOURCE/configs/systemd/user-preset/99-aetheros.preset" "$TARGET/etc/systemd/user-preset/"

mkdir -p "$TARGET/etc/systemd/logind.conf.d"
cp -f "$SOURCE/configs/systemd/logind.conf.d/aetheros.conf" "$TARGET/etc/systemd/logind.conf.d/"

# SDDM Theme & Configuration
mkdir -p "$TARGET/usr/share/sddm/themes/aetheros-glass"
cp -r "$SOURCE/desktop/sddm/aetheros-glass/"* "$TARGET/usr/share/sddm/themes/aetheros-glass/"

mkdir -p "$TARGET/etc/sddm.conf.d"
cp -f "$SOURCE/configs/wayland/sddm.conf.d/aetheros.conf" "$TARGET/etc/sddm.conf.d/"
cp -f "$SOURCE/configs/wayland/sddm.conf" "$TARGET/etc/sddm.conf"

# Hyprlock Configuration
install -Dm644 \
    "$SOURCE/configs/hyprland/hyprlock.conf" \
    "$TARGET/etc/skel/.config/hypr/hyprlock.conf"

mkdir -p "$TARGET/usr/share/wayland-sessions"
cp -f "$SOURCE/configs/wayland/sessions/hyprland.desktop" "$TARGET/usr/share/wayland-sessions/"

mkdir -p "$TARGET/etc/selinux"
cp -f "$SOURCE/configs/selinux/config" "$TARGET/etc/selinux/config"

mkdir -p "$TARGET/etc/ssh/sshd_config.d"
cp -f "$SOURCE/configs/ssh/sshd_config.d/aetheros.conf" "$TARGET/etc/ssh/sshd_config.d/"

mkdir -p "$TARGET/etc/sudoers.d"
chmod 750 "$TARGET/etc/sudoers.d"
install -Dm440 "$SOURCE/configs/sudoers.d/01-pwfeedback" "$TARGET/etc/sudoers.d/01-pwfeedback"

cp -f "$SOURCE/configs/vconsole/vconsole.conf" "$TARGET/etc/vconsole.conf"

mkdir -p "$TARGET/etc/profile.d"
cp -f "$SOURCE/configs/wayland/aether-autostart.sh" "$TARGET/etc/profile.d/"

%end

# --- In-target Post-installation system configuration ---
%post --log=/var/log/aetheros-post.log

# Set default target to graphical desktop
systemctl set-default graphical.target

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

# Set default Plymouth boot splash theme
plymouth-set-default-theme aetheros-glow || true

# Mask services incompatible with Live environments
systemctl mask systemd-homed.service 2>/dev/null || true
systemctl mask systemd-journal-flush.service 2>/dev/null || true

# Ensure messagebus & system accounts exist
getent group messagebus >/dev/null || groupadd -g 81 messagebus 2>/dev/null || true
getent passwd messagebus >/dev/null || useradd -u 81 -g messagebus -d /var/run/dbus -s /sbin/nologin -c "D-Bus System Message Bus" messagebus 2>/dev/null || true

# Pre-generate SSH host keys
ssh-keygen -A 2>/dev/null || true

# Enable core system services
systemctl enable aether-firstboot.service
systemctl enable sddm.service
systemctl enable dbus-broker.service
systemctl enable NetworkManager.service
systemctl enable firewalld.service
systemctl enable bluetooth.service
systemctl enable power-profiles-daemon.service
systemctl enable vmtoolsd.service 2>/dev/null || true
systemctl enable qemu-guest-agent.service 2>/dev/null || true

# Pre-populate default user 'aether' configuration if user directory exists
if [ -d /home/aether ]; then
  mkdir -p /home/aether/.config
  cp -r /etc/skel/.config/* /home/aether/.config/
  chown -R aether:aether /home/aether
  chmod +x /home/aether/.config/waybar/scripts/*.sh 2>/dev/null || true
fi

%end
