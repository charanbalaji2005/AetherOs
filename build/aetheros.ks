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
repo --name=rpmfusion-nonfree-steam --mirrorlist=https://mirrors.rpmfusion.org/mirrorlist?repo=nonfree-fedora-steam-$releasever&arch=$basearch

# Microsoft VS Code & Docker CE Repositories
repo --name=vscode --baseurl=https://packages.microsoft.com/yumrepos/vscode
repo --name=docker-ce --baseurl=https://download.docker.com/linux/fedora/$releasever/$basearch/stable
repo --name=copr-kylegospo-grub-btrfs --baseurl=https://download.copr.fedorainfracloud.org/results/kylegospo/grub-btrfs/fedora-$releasever-$basearch/

# --- Filesystem: Root partition ---
zerombr
clearpart --all --initlabel
part /boot/efi --fstype=efi --size=600
part /boot --fstype=ext4 --size=1024
part / --fstype=btrfs --grow --size=15360

bootloader --location=mbr --timeout=5 --append="rhgb quiet splash loglevel=3 vga=current"
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
grub2-pc
grub2-pc-modules
grub2-tools
syslinux
grubby
btrfs-progs
grub-btrfs
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
libdnf5-plugin-actions
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
rofi-wayland
thunar
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
swww
hyprpaper
hyprlock
hypridle
hyprpolkitagent
xorg-x11-server-Xwayland
swaync
udiskie
cliphist
python3-pywal
dunst
nautilus
brightnessctl
pamixer
kitty
sddm
polkit-kde
polkit-gnome
pipewire
pipewire-pulseaudio
wireplumber
pavucontrol
cava
qt5-qtwayland
qt6-qtwayland
qt5-qtquickcontrols2
qt5-qtgraphicaleffects
python3-gobject
python3-tkinter
calamares
calamares-libs
plymouth
plymouth-plugin-script
plymouth-theme-spinner

# --- GPU drivers & Video Acceleration: install all so the correct one activates per hardware ---
mesa-dri-drivers
mesa-vulkan-drivers
xorg-x11-drv-amdgpu
xorg-x11-drv-intel
libva-intel-media-driver
libva-utils
vulkan-tools

# --- Developer, Cloud & Database Stack ---
git
curl
wget
gcc
gcc-c++
make
cmake
nodejs
npm
php
php-cli
mariadb-server
python3
python3-pip
python3-devel
cargo
rustc
podman
podman-docker
podman-compose
vulkan-loader

# --- Complete Fedora Workstation Core Tools & CLI Utilities ---
wget2-wget
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
fontawesome-fonts-all
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

# --- Core Apps & Media ---
firefox
thunar
thunar-archive-plugin
thunar-volman
tumbler
file-roller
gnome-text-editor
loupe
evince
mpv
swappy
wf-recorder
libreoffice
vlc
steam
obs-studio
gimp
unzip
zip
p7zip
p7zip-plugins
papirus-icon-theme
adwaita-icon-theme
fira-code-fonts
google-noto-sans-fonts
google-noto-color-emoji-fonts

%end

# --- Copy project files from host workspace into ISO image ---
%post --nochroot --log=/tmp/aetheros-copy.log
set -eux

SOURCE="__AETHER_SOURCE__"
TARGET="$INSTALL_ROOT"

# Aether CLI, GUI Settings, Splash, Desktop Overlay, Files, PowerMenu, Screenshot, and First-Boot
install -Dm755 "$SOURCE/aether/bin/aether" "$TARGET/usr/local/bin/aether"
install -Dm755 "$SOURCE/aether/settings/aether-settings" "$TARGET/usr/local/bin/aether-settings"
install -Dm755 "$SOURCE/aether/software-center/aether-software" "$TARGET/usr/local/bin/aether-software"
install -Dm755 "$SOURCE/aether/setup/aether-welcome" "$TARGET/usr/local/bin/aether-welcome"
install -Dm755 "$SOURCE/aether/ai/aether-ai" "$TARGET/usr/local/bin/aether-ai"
install -Dm755 "$SOURCE/aether/battery/aether-battery-daemon" "$TARGET/usr/local/bin/aether-battery-daemon"
install -Dm755 "$SOURCE/aether/telemetry/aether-telemetry-daemon" "$TARGET/usr/local/bin/aether-telemetry-daemon"
install -Dm755 "$SOURCE/aether/update-engine/aether-update-engine" "$TARGET/usr/local/bin/aether-update-engine"
install -Dm755 "$SOURCE/aether/update-engine/aether-updater" "$TARGET/usr/local/bin/aether-updater"
install -Dm755 "$SOURCE/aether/bin/aether-splash" "$TARGET/usr/local/bin/aether-splash"
install -Dm755 "$SOURCE/aether/bin/aether-desktop-overlay" "$TARGET/usr/local/bin/aether-desktop-overlay"
install -Dm755 "$SOURCE/aether/bin/aether-files" "$TARGET/usr/local/bin/aether-files"
install -Dm755 "$SOURCE/aether/bin/aether-powermenu" "$TARGET/usr/local/bin/aether-powermenu"
install -Dm755 "$SOURCE/aether/bin/aether-screenshot" "$TARGET/usr/local/bin/aether-screenshot"
install -Dm755 "$SOURCE/aether/setup/aether-firstboot" "$TARGET/usr/local/bin/aether-firstboot"
install -Dm644 "$SOURCE/configs/systemd/aether-firstboot.service"     "$TARGET/etc/systemd/system/aether-firstboot.service"
install -Dm644 "$SOURCE/configs/systemd/aether-battery.service"       "$TARGET/etc/systemd/system/aether-battery.service"
install -Dm644 "$SOURCE/configs/systemd/aether-telemetry.service"     "$TARGET/etc/systemd/system/aether-telemetry.service"
install -Dm644 "$SOURCE/configs/systemd/aether-update-engine.service" "$TARGET/etc/systemd/system/aether-update-engine.service"

mkdir -p "$TARGET/usr/share/aetheros/desktop/widgets"
cp -r "$SOURCE/desktop/widgets/"* "$TARGET/usr/share/aetheros/desktop/widgets/"

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

# Rofi
mkdir -p "$TARGET/etc/skel/.config/rofi"
if [ -f "$SOURCE/configs/rofi/config.rasi" ]; then
    install -Dm644 "$SOURCE/configs/rofi/config.rasi" "$TARGET/etc/skel/.config/rofi/config.rasi"
fi

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
install -Dm644 "$SOURCE/applications/aether-software.desktop" "$TARGET/usr/share/applications/aether-software.desktop"
install -Dm644 "$SOURCE/applications/aether-welcome.desktop" "$TARGET/usr/share/applications/aether-welcome.desktop"
install -Dm644 "$SOURCE/applications/aether-ai.desktop" "$TARGET/usr/share/applications/aether-ai.desktop"
install -Dm644 "$SOURCE/applications/aether-installer.desktop" "$TARGET/usr/share/applications/aether-installer.desktop"

# Calamares Installer Configuration
if [ -d "$SOURCE/configs/calamares" ]; then
    mkdir -p "$TARGET/etc/calamares"
    cp -rf "$SOURCE/configs/calamares/"* "$TARGET/etc/calamares/"
fi

# Polkit Rules
if [ -d "$SOURCE/configs/polkit" ]; then
    mkdir -p "$TARGET/etc/polkit-1/rules.d"
    cp -rf "$SOURCE/configs/polkit/"* "$TARGET/etc/polkit-1/rules.d/"
    chmod 755 "$TARGET/etc/polkit-1/rules.d"
    chmod 644 "$TARGET/etc/polkit-1/rules.d/"*.rules 2>/dev/null || true
fi

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
echo "=== Configuring Plymouth Boot Splash ==="
plymouth-set-default-theme aether 2>/dev/null || true
dracut -f --no-hostonly --regenerate-all 2>/dev/null || true

# Mask services incompatible with Live environments & optimize boot speed
systemctl mask systemd-homed.service 2>/dev/null || true
systemctl mask systemd-journal-flush.service 2>/dev/null || true
systemctl mask NetworkManager-wait-online.service 2>/dev/null || true
systemctl disable NetworkManager-wait-online.service 2>/dev/null || true
systemctl mask plymouth-quit-wait.service 2>/dev/null || true
systemctl disable ModemManager.service 2>/dev/null || true

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
systemctl enable aether-battery.service 2>/dev/null || true
systemctl enable aether-telemetry.service 2>/dev/null || true
systemctl enable aether-update-engine.service 2>/dev/null || true
systemctl enable mariadb.service 2>/dev/null || true
systemctl enable podman.socket 2>/dev/null || true
systemctl enable vmtoolsd.service 2>/dev/null || true
systemctl enable qemu-guest-agent.service 2>/dev/null || true

# Pre-populate default user 'aether' configuration if user directory exists
if [ -d /home/aether ]; then
  mkdir -p /home/aether/.config
  cp -r /etc/skel/.config/* /home/aether/.config/
  chown -R aether:aether /home/aether
  chmod +x /home/aether/.config/waybar/scripts/*.sh 2>/dev/null || true
fi

# Enable Flathub Flatpak repository
if command -v flatpak >/dev/null 2>&1; then
  flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo 2>/dev/null || true
  flatpak update --appstream -y 2>/dev/null || true
fi

# Live ISO Calamares Autostart
mkdir -p /home/liveuser/.config/hypr/
cat <<EOF > /home/liveuser/.config/hypr/hyprland.conf
source = /etc/skel/.config/hypr/hyprland.conf
exec-once = sudo calamares -d
EOF
chown -R liveuser:liveuser /home/liveuser/.config 2>/dev/null || true

# Temporary Setup User for Out-Of-Box Experience (OOBE) Kiosk Mode
useradd -m -s /bin/bash aether-setup 2>/dev/null || true
mkdir -p /etc/sddm.conf.d/
cat <<EOF > /etc/sddm.conf.d/autologin.conf
[Autologin]
User=aether-setup
Session=hyprland
EOF

mkdir -p /home/aether-setup/.config/hypr/
cat <<EOF > /home/aether-setup/.config/hypr/hyprland.conf
monitor=,preferred,auto,1
windowrulev2 = fullscreen, class:^(aether-welcome)$
animations {
    enabled = no
}
exec-once = /usr/local/bin/aether-welcome
EOF
chown -R aether-setup:aether-setup /home/aether-setup/.config 2>/dev/null || true

# Configure grub-btrfs for Fedora Grub paths
mkdir -p /etc/default
cat <<EOF > /etc/default/grub-btrfs
GRUB_BTRFS_GRUB_DIRNAME="/boot/grub2"
GRUB_BTRFS_MKCONFIG=/sbin/grub2-mkconfig
GRUB_BTRFS_SCRIPT_CHECK=grub2-script-check
EOF

systemctl enable grub-btrfs.path 2>/dev/null || true

%end
