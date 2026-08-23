# aetheros.ks
# Aether OS - Fedora 40/44 Custom Kickstart Master Manifest

lang en_US.UTF-8
keyboard us
timezone UTC

# Security, User and Network Defaults
network --bootproto=dhcp --activate --onboot=on
rootpw --plaintext aetheros
user --name=liveuser --groups=wheel --plaintext --password=""
selinux --enforcing
firewall --enabled --service=mdns

# Bootloader and partitioning for the Live image build environment
bootloader --location=mbr
zerombr
clearpart --all
part / --size=15360 --fstype=ext4

# Repositories (Fedora 40 base, updates & RPM Fusion via metalinks)
url --metalink="https://mirrors.fedoraproject.org/metalink?repo=fedora-40&arch=x86_64"
repo --name="fedora" --metalink="https://mirrors.fedoraproject.org/metalink?repo=fedora-40&arch=x86_64"
repo --name="updates" --metalink="https://mirrors.fedoraproject.org/metalink?repo=updates-released-f40&arch=x86_64"
repo --name="rpmfusion-free" --metalink="https://mirrors.rpmfusion.org/metalink?repo=free-fedora-40&arch=x86_64"
repo --name="rpmfusion-nonfree" --metalink="https://mirrors.rpmfusion.org/metalink?repo=nonfree-fedora-40&arch=x86_64"

%packages --ignoremissing
@core
@hardware-support
@standard
@fonts
@workstation-product-environment

# Kernel and Boot Tools
kernel
kernel-modules
kernel-modules-extra
dracut-live
dracut-squash
dracut-config-generic
grub2-efi
grub2-efi-x64
grub2-tools
grub2-tools-extra
efibootmgr
shim

# GPU Drivers & Secure Boot Signing
akmods
mokutil
kmodtool
openssl
akmod-nvidia
xorg-x11-drv-nvidia-cuda

# Core Desktop Environment & Display Manager
hyprland
hyprlock
hypridle
gdm
kitty
waybar
swww

# GNOME Desktop Environment (Dual Session Support)
gnome-shell
gnome-session
gnome-terminal
nautilus
gnome-control-center
gnome-tweaks
gnome-extensions-app
gnome-shell-extension-dash-to-dock
gnome-shell-extension-appindicator
gnome-shell-extension-blur-my-shell
gnome-shell-extension-user-theme
zenity

# Qt & SDDM Glassmorphic Theme Dependencies
qt5-qtgraphicaleffects
qt5-qtquickcontrols2
qt5-qtdeclarative
qt5-qtsvg
qt6-qt5compat
qt6-qtdeclarative
qt6-qtsvg
qt6-qtquickcontrols2

# Aether OS Background Daemons
swaync
polkit-kde
udiskie
network-manager-applet
blueman
wl-clipboard
cliphist
swayosd
kanshi
dconf
socat
plymouth
plymouth-core-libs
plymouth-plugin-two-step
plymouth-system-theme

# Audio & Portals
pipewire
pipewire-pulse
pipewire-alsa
wireplumber
pamixer
xdg-desktop-portal-hyprland
xdg-desktop-portal-gtk

# Multimedia Codecs & Players
ffmpeg
gstreamer1-plugins-bad-freeworld
gstreamer1-plugins-ugly
vlc
amberol

# Virtualization & Hardware Drivers
open-vm-tools
open-vm-tools-desktop
xorg-x11-drv-vmware
mesa-dri-drivers
mesa-vulkan-drivers
spice-vdagent
qemu-guest-agent
brightnessctl
thermald
kernel-tools

# Fonts & Icons
jetbrains-mono-fonts-all
fira-code-fonts
fontawesome-fonts-all
google-noto-sans-fonts
google-noto-color-emoji-fonts
papirus-icon-theme

# Customization Tooling & Version Control
python3-pywal
git
unzip
rsync

# System Installers, Dual-Boot & Btrfs Snapper
calamares
efibootmgr
os-prober
grub2-efi-x64
grub2-tools
grub2-tools-extra
flatpak
snapper
grub-btrfs
libdnf5-plugin-actions
fedora-third-party
fedora-workstation-repositories

# Security, VPN & Gaming Daemons
firewalld
wireguard-tools
NetworkManager-openvpn
gamemode
mangohud
%end


# ---------------------------------------------------------
# NOCHROOT POST-INSTALL: Inject the Overlay from /tmp/aether-staging
# ---------------------------------------------------------
%post --nochroot
echo "Injecting Aether OS overlay (including all hidden dotfiles) from /tmp/aether-staging..."
if [ -d /tmp/aether-staging ]; then
    cp -a /tmp/aether-staging/. $INSTALL_ROOT/
    rm -rf /tmp/aether-staging
fi
%end


# ---------------------------------------------------------
# CHROOT POST-INSTALL: Configure the System
# ---------------------------------------------------------
%post --erroronfail
echo "Applying Aether OS configurations..."

# 1. Make all custom Aether binaries executable
chmod +x /usr/local/bin/aether-* 2>/dev/null || true

# 2. Secure the Polkit rules (Strictly requires root ownership and 644)
chown root:root /etc/polkit-1/rules.d/*.rules 2>/dev/null || true
chmod 644 /etc/polkit-1/rules.d/*.rules 2>/dev/null || true

# 3. Dynamic Dotfiles Sync from GitHub Repository
mkdir -p /tmp/os-dotfiles
if git clone --depth 1 https://github.com/charanbalaji2005/AetherOs.git /tmp/os-dotfiles 2>/dev/null; then
    echo "--> Successfully pulled latest dotfiles from GitHub!"
    mkdir -p /etc/skel/.config
    if [ -d /tmp/os-dotfiles/configs/hyprland ]; then
        mkdir -p /etc/skel/.config/hypr
        cp -f /tmp/os-dotfiles/configs/hyprland/* /etc/skel/.config/hypr/ 2>/dev/null || true
    fi
    if [ -d /tmp/os-dotfiles/configs/waybar ]; then
        mkdir -p /etc/skel/.config/waybar
        cp -rf /tmp/os-dotfiles/configs/waybar/* /etc/skel/.config/waybar/ 2>/dev/null || true
    fi
    if [ -d /tmp/os-dotfiles/configs/kitty ]; then
        mkdir -p /etc/skel/.config/kitty
        cp -rf /tmp/os-dotfiles/configs/kitty/* /etc/skel/.config/kitty/ 2>/dev/null || true
    fi
    if [ -d /tmp/os-dotfiles/configs/wofi ]; then
        mkdir -p /etc/skel/.config/wofi
        cp -rf /tmp/os-dotfiles/configs/wofi/* /etc/skel/.config/wofi/ 2>/dev/null || true
    fi
    if [ -d /tmp/os-dotfiles/configs/dunst ]; then
        mkdir -p /etc/skel/.config/dunst
        cp -rf /tmp/os-dotfiles/configs/dunst/* /etc/skel/.config/dunst/ 2>/dev/null || true
    fi
    rm -rf /tmp/os-dotfiles
fi

# Setup the Live ISO User (Autostarts Calamares Installer on Boot)
useradd -m -c "Live User" -s /bin/bash liveuser 2>/dev/null || true
passwd -d liveuser 2>/dev/null || true
usermod -aG wheel liveuser 2>/dev/null || true

# Force-copy all /etc/skel dotfiles to liveuser with correct permissions
mkdir -p /home/liveuser/.config
if [ -d /etc/skel/.config ]; then
    cp -a /etc/skel/.config/. /home/liveuser/.config/ 2>/dev/null || true
fi

# Configure Hyprland for liveuser to autostart Calamares installer
mkdir -p /home/liveuser/.config/hypr/
cat <<EOF > /home/liveuser/.config/hypr/hyprland.conf
source = /etc/skel/.config/hypr/hyprland.conf
exec-once = sudo calamares -d
EOF

chown -R liveuser:liveuser /home/liveuser
chmod -R 755 /home/liveuser/.config 2>/dev/null || true

# 4. Force SDDM to auto-login to liveuser during the Live ISO session
mkdir -p /etc/sddm.conf.d
cat <<EOF > /etc/sddm.conf.d/autologin.conf
[Autologin]
User=liveuser
Session=hyprland
EOF

# 5. GTK/Qt Theme Unification (System-wide default)
mkdir -p /etc/dconf/profile
cat <<EOF > /etc/dconf/profile/user
user-db:user
system-db:local
EOF
mkdir -p /etc/dconf/db/local.d
cat <<EOF > /etc/dconf/db/local.d/00-aether-theme
[org/gnome/desktop/interface]
color-scheme='prefer-dark'
gtk-theme='Adwaita-dark'
icon-theme='Papirus-Dark'
font-name='Noto Sans 11'
enable-animations=true

[org/gnome/desktop/wm/preferences]
button-layout='appmenu:minimize,maximize,close'

[org/gnome/shell]
enabled-extensions=['dash-to-dock@micxgx.gmail.com', 'blur-my-shell@aunetx', 'appindicatorsupport@rgcjonas.gmail.com']
favorite-apps=['firefox.desktop', 'aether-software.desktop', 'aether-files.desktop', 'aether-settings.desktop', 'org.gnome.Terminal.desktop', 'kitty.desktop']
EOF
dconf update 2>/dev/null || true

# 6. Configure Silent Flicker-Free Boot with GRUB & Nvidia KMS
sed -i 's/GRUB_CMDLINE_LINUX="/GRUB_CMDLINE_LINUX="quiet splash loglevel=3 rd.udev.log_priority=3 vt.global_cursor_default=0 nvidia-drm.modeset=1 /g' /etc/default/grub 2>/dev/null || true
echo "GRUB_TIMEOUT=0" >> /etc/default/grub
echo "GRUB_HIDDEN_TIMEOUT=1" >> /etc/default/grub
grub2-mkconfig -o /boot/grub2/grub.cfg 2>/dev/null || true

# 7. Add Flathub repository globally
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo 2>/dev/null || true

# 8. Pre-compile Nvidia Kernel Modules, Setup Plymouth & Rebuild Dracut Initramfs
/usr/sbin/kmodgenca -a 2>/dev/null || true
systemctl enable akmods.service 2>/dev/null || true

# Set Custom AetherOS Boot Screen & Prevent Plymouth/SDDM Race Condition
sed -i 's/Conflicts=plymouth-quit.service/After=plymouth-quit.service/' /usr/lib/systemd/system/sddm.service 2>/dev/null || true
plymouth-set-default-theme aetheros -R 2>/dev/null || true

KERNEL_VER=$(rpm -q --qf "%{VERSION}-%{RELEASE}.%{ARCH}\n" kernel 2>/dev/null | head -n 1)
if [ -n "$KERNEL_VER" ]; then
    echo "Pre-compiling akmod drivers and initramfs for kernel $KERNEL_VER..."
    akmods --force --kernels "$KERNEL_VER" 2>/dev/null || true
    dracut --force --kver "$KERNEL_VER" 2>/dev/null || true
fi

# 9. Enable critical system services & CPU Performance Scaling
systemctl enable cpupower.service 2>/dev/null || true
mkdir -p /etc/sysconfig
echo 'CPUPOWER_START_OPTS="frequency-set -g performance"' > /etc/sysconfig/cpupower 2>/dev/null || true
systemctl disable sddm.service 2>/dev/null || true
systemctl enable gdm.service 2>/dev/null || true
systemctl enable NetworkManager.service 2>/dev/null || true
systemctl enable bluetooth.service 2>/dev/null || true
systemctl enable fstrim.timer 2>/dev/null || true
systemctl enable systemd-timesyncd.service 2>/dev/null || true
systemctl enable power-profiles-daemon.service 2>/dev/null || true
systemctl enable thermald.service 2>/dev/null || true
systemctl enable vmtoolsd.service 2>/dev/null || true

# 10. Restore SELinux security contexts across custom files
restorecon -Rv /etc 2>/dev/null || true
restorecon -Rv /usr/local/bin 2>/dev/null || true
restorecon -Rv /home 2>/dev/null || true

echo "Aether OS successfully configured."
%end
