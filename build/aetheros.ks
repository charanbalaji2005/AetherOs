#version=RHEL9
# AetherOS - Fedora-based, Hyprland-first Linux distribution
# Build with: sudo livemedia-creator --ks aetheros.ks --no-virt \
#   --resultdir /home/claude/AetherOS/build/out --project AetherOS \
#   --make-iso --iso-only --iso-name AetherOS.iso --releasever 41

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

# --- Filesystem: Btrfs root partition ---
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

# --- Core system ---
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

# Default sddm session -> Hyprland
mkdir -p /etc/sddm.conf.d
cat > /etc/sddm.conf.d/aetheros.conf <<EOF
[Autologin]
Session=hyprland
EOF

# Lid switch configuration
mkdir -p /etc/systemd/logind.conf.d
cat > /etc/systemd/logind.conf.d/aetheros.conf <<EOF
[Login]
HandleLidSwitch=suspend
EOF

# Create required directories for desktop configuration
mkdir -p /usr/share/backgrounds/aetheros
mkdir -p /etc/skel/.config/hypr
mkdir -p /etc/skel/.config/waybar/scripts
mkdir -p /etc/skel/.config/kitty
mkdir -p /usr/share/applications

# Install Hyprland configurations into /etc/skel
cat > /etc/skel/.config/hypr/hyprland.conf <<'EOF'
# AetherOS default Hyprland config

# --- Monitors: auto-detect, override per-machine in monitors.conf ---
monitor=,preferred,auto,1
source = ~/.config/hypr/monitors.conf

# --- Autostart ---
exec-once = waybar
exec-once = dunst
exec-once = /usr/lib/xdg-desktop-portal-hyprland
exec-once = swaybg -i /usr/share/backgrounds/aetheros/default.png -m fill
exec-once = hyprctl setcursor Bibata-Modern-Ice 24
exec-once = /usr/libexec/polkit-kde-authentication-agent-1 || /usr/libexec/polkit-gnome-authentication-agent-1
exec-once = wl-paste --type text --watch cliphist store
exec-once = wl-paste --type image --watch cliphist store

# --- Env ---
env = XCURSOR_SIZE,24
env = XDG_CURRENT_DESKTOP,Hyprland
env = XDG_SESSION_TYPE,wayland
env = QT_QPA_PLATFORM,wayland;xcb
env = GDK_BACKEND,wayland,x11
env = MOZ_ENABLE_WAYLAND,1
env = QT_AUTO_SCREEN_SCALE_FACTOR,1
env = QT_WAYLAND_DISABLE_WINDOWDECORATION,1

# --- Look & feel: glassmorphism per spec ---
general {
    gaps_in = 5
    gaps_out = 12
    border_size = 2
    col.active_border = rgba(56d4ddee) rgba(7cc7ffee) 45deg
    col.inactive_border = rgba(4c556180)
    layout = dwindle
    resize_on_border = true
}

decoration {
    rounding = 12
    blur {
        enabled = true
        size = 6
        passes = 3
        new_optimizations = true
    }
    shadow {
        enabled = true
        range = 20
        render_power = 3
        color = rgba(0d1117aa)
    }
}

animations {
    enabled = true
    bezier = aetherCurve, 0.16, 1, 0.3, 1
    animation = windows, 1, 4, aetherCurve, popin 90%
    animation = fade, 1, 4, aetherCurve
    animation = workspaces, 1, 5, aetherCurve, slide
    animation = border, 1, 6, aetherCurve
}

dwindle {
    pseudotile = true
    preserve_split = true
}

input {
    kb_layout = us
    follow_mouse = 1
    touchpad {
        natural_scroll = true
        tap-to-click = true
    }
    sensitivity = 0
}

gestures {
    workspace_swipe = true
}

# --- Apps ---
$terminal = kitty
$menu = wofi --show drun
$browser = firefox
$fileManager = nautilus
$settings = aether-settings

# --- Keybinds ---
$mod = SUPER

bind = $mod, Return, exec, $terminal
bind = $mod, Q, killactive,
bind = $mod, M, exit,
bind = $mod, E, exec, $fileManager
bind = $mod, I, exec, $settings
bind = $mod, V, togglefloating,
bind = $mod, R, exec, $menu
bind = $mod, F, fullscreen,
bind = $mod, B, exec, $browser
bind = $mod, C, exec, cliphist list | wofi --dmenu | cliphist decode | wl-copy
bind = $mod SHIFT, L, exec, systemctl suspend

# AetherOS command palette + AI assistant
bind = CTRL, Space, exec, kitty --title aether-ai -e aether ai
bind = $mod SHIFT, S, exec, kitty --title aether-doctor -e aether doctor

# Focus movement
bind = $mod, left,  movefocus, l
bind = $mod, right, movefocus, r
bind = $mod, up,    movefocus, u
bind = $mod, down,  movefocus, d

# Workspaces 1-10
bind = $mod, 1, workspace, 1
bind = $mod, 2, workspace, 2
bind = $mod, 3, workspace, 3
bind = $mod, 4, workspace, 4
bind = $mod, 5, workspace, 5
bind = $mod SHIFT, 1, movetoworkspace, 1
bind = $mod SHIFT, 2, movetoworkspace, 2
bind = $mod SHIFT, 3, movetoworkspace, 3
bind = $mod SHIFT, 4, movetoworkspace, 4
bind = $mod SHIFT, 5, movetoworkspace, 5

# Screenshot
bind = , Print, exec, grimblast copy area
bind = SHIFT, Print, exec, grimblast copy screen

# Volume / brightness / media keys
bindel = ,XF86AudioRaiseVolume, exec, wpctl set-volume -l 1.0 @DEFAULT_AUDIO_SINK@ 5%+
bindel = ,XF86AudioLowerVolume, exec, wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-
bindel = ,XF86AudioMute, exec, wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle
bindel = ,XF86MonBrightnessUp, exec, brightnessctl set 5%+
bindel = ,XF86MonBrightnessDown, exec, brightnessctl set 5%-
bindl = , XF86AudioPlay, exec, playerctl play-pause
bindl = , XF86AudioNext, exec, playerctl next
bindl = , XF86AudioPrev, exec, playerctl previous
bindl = , switch:off:Lid Switch, exec, systemctl suspend

# Mouse
bindm = $mod, mouse:272, movewindow
bindm = $mod, mouse:273, resizewindow

# --- Window rules ---
windowrulev2 = float, class:^(pavucontrol)$
windowrulev2 = float, class:^(nm-connection-editor)$
windowrulev2 = float, title:^(aether-ai)$
windowrulev2 = size 700 500, title:^(aether-ai)$
windowrulev2 = center, title:^(aether-ai)$
EOF

cat > /etc/skel/.config/hypr/monitors.conf <<'EOF'
# AetherOS default monitor configuration
monitor=,preferred,auto,1
EOF

# Install Waybar configuration into /etc/skel
cat > /etc/skel/.config/waybar/config.jsonc <<'EOF'
{
    "layer": "top",
    "position": "top",
    "height": 34,
    "margin-top": 6,
    "margin-left": 10,
    "margin-right": 10,
    "spacing": 4,
    "modules-left": ["hyprland/workspaces", "hyprland/window"],
    "modules-center": ["clock"],
    "modules-right": [
        "custom/gpu",
        "cpu",
        "memory",
        "custom/notifications",
        "pulseaudio",
        "network",
        "bluetooth",
        "battery",
        "custom/quicksettings",
        "custom/ai",
        "tray"
    ],
    "hyprland/workspaces": {
        "format": "{icon}",
        "on-click": "activate",
        "format-icons": {
            "active": "",
            "default": "",
            "empty": ""
        },
        "persistent-workspaces": { "*": 5 }
    },
    "hyprland/window": {
        "format": "{title}",
        "max-length": 40,
        "separate-outputs": true
    },
    "clock": {
        "format": "{:%a %d %b  %H:%M}",
        "tooltip-format": "<big>{:%Y %B}</big>\n<tt><small>{calendar}</small></tt>"
    },
    "cpu": {
        "format": " {usage}%",
        "interval": 3,
        "tooltip": true
    },
    "memory": {
        "format": " {percentage}%",
        "tooltip-format": "{used:0.1f}GiB / {total:0.1f}GiB used",
        "interval": 5
    },
    "custom/gpu": {
        "exec": "~/.config/waybar/scripts/gpu.sh",
        "return-type": "json",
        "interval": 3
    },
    "battery": {
        "format": "{icon} {capacity}%",
        "format-icons": ["", "", "", "", ""],
        "format-charging": " {capacity}%",
        "states": { "warning": 20, "critical": 10 },
        "interval": 10
    },
    "network": {
        "format-wifi": " {signalStrength}%",
        "format-ethernet": " Wired",
        "format-disconnected": "󰤭 Offline",
        "tooltip-format-wifi": "{essid} ({signalStrength}%)",
        "on-click": "nm-connection-editor"
    },
    "bluetooth": {
        "format": " {status}",
        "format-connected": " {device_alias}",
        "format-off": "󰂲",
        "on-click": "blueman-manager"
    },
    "pulseaudio": {
        "format": "{icon} {volume}%",
        "format-muted": " muted",
        "format-icons": { "default": ["", "", ""] },
        "on-click": "wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle",
        "on-scroll-up": "wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+",
        "on-scroll-down": "wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-"
    },
    "custom/notifications": {
        "exec": "~/.config/waybar/scripts/notifications.sh",
        "return-type": "json",
        "interval": 5,
        "on-click": "dunstctl set-paused toggle",
        "on-click-right": "dunstctl history-pop"
    },
    "custom/quicksettings": {
        "format": "󰢻",
        "tooltip-format": "Quick Settings",
        "on-click": "~/.config/waybar/scripts/quicksettings.sh"
    },
    "custom/ai": {
        "format": "󰧑 Aether AI",
        "tooltip-format": "Open Aether AI assistant (Ctrl+Space)",
        "on-click": "kitty --title aether-ai -e aether ai"
    },
    "tray": {
        "spacing": 8
    }
}
EOF

cat > /etc/skel/.config/waybar/style.css <<'EOF'
* {
    font-family: "JetBrainsMono Nerd Font";
    font-size: 13px;
    min-height: 0;
}

window#waybar {
    background: rgba(13, 17, 23, 0.72);
    border-radius: 14px;
    border: 1px solid rgba(86, 212, 221, 0.25);
    color: #e6f1f5;
}

#workspaces {
    background: transparent;
    margin: 4px 6px;
}

#workspaces button {
    padding: 0 8px;
    color: #4c5561;
    border-radius: 8px;
}

#workspaces button.active {
    color: #56d4dd;
    background: rgba(86, 212, 221, 0.15);
}

#workspaces button:hover {
    background: rgba(86, 212, 221, 0.10);
}

#window {
    color: #8be9fd;
    padding: 0 10px;
}

#clock,
#cpu,
#memory,
#custom-gpu,
#battery,
#network,
#bluetooth,
#pulseaudio,
#custom-notifications,
#custom-quicksettings,
#custom-ai,
#tray {
    padding: 0 10px;
    margin: 4px 2px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.04);
}

#custom-ai {
    background: rgba(86, 212, 221, 0.18);
    color: #56d4dd;
    font-weight: bold;
}

#custom-ai:hover {
    background: rgba(86, 212, 221, 0.30);
}

#battery.warning {
    color: #f5d76e;
}

#battery.critical {
    color: #ff6b6b;
}

#custom-notifications.has-notifications {
    color: #56d4dd;
}

#tray > .passive {
    -gtk-icon-effect: dim;
}
EOF

# Install Waybar scripts (NVIDIA, AMD, Intel GPU support)
cat > /etc/skel/.config/waybar/scripts/gpu.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

if command -v nvidia-smi >/dev/null 2>&1 && nvidia-smi -L >/dev/null 2>&1; then
  util=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits | head -n1)
  temp=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits | head -n1)
  name=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -n1)
  printf '{"text":"GPU %s%%","tooltip":"%s\\n%sC"}\n' "$util" "$name" "$temp"
elif [[ -d /sys/class/drm/card0/device ]] && [[ -f /sys/class/drm/card0/device/gpu_busy_percent ]]; then
  util=$(cat /sys/class/drm/card0/device/gpu_busy_percent 2>/dev/null || echo "0")
  printf '{"text":"GPU %s%%","tooltip":"AMD GPU"}\n' "$util"
elif [[ -f /sys/class/drm/card0/gt/gt0/rps_act_freq_mhz ]] || [[ -f /sys/class/drm/card0/gt_act_freq_mhz ]]; then
  freq=$(cat /sys/class/drm/card0/gt/gt0/rps_act_freq_mhz 2>/dev/null || cat /sys/class/drm/card0/gt_act_freq_mhz 2>/dev/null || echo "0")
  printf '{"text":"GPU %sMHz","tooltip":"Intel GPU Active Frequency"}\n' "$freq"
else
  printf '{"text":"GPU --","tooltip":"No GPU utilization sensor found"}\n'
fi
EOF

cat > /etc/skel/.config/waybar/scripts/notifications.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

if ! command -v dunstctl >/dev/null 2>&1; then
  printf '{"text":"","tooltip":"dunst not installed"}\n'
  exit 0
fi

count=$(dunstctl count waiting 2>/dev/null || echo 0)
paused=$(dunstctl is-paused 2>/dev/null || echo "false")

icon="󰂚"
[[ "$paused" == "true" ]] && icon="󰂛"

if [[ "$count" -gt 0 ]]; then
  printf '{"text":"%s %s","tooltip":"%s unread notifications","class":"has-notifications"}\n' "$icon" "$count" "$count"
else
  printf '{"text":"%s","tooltip":"No new notifications","class":"empty"}\n' "$icon"
fi
EOF

cat > /etc/skel/.config/waybar/scripts/quicksettings.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

choice=$(printf "%s\n" \
  " Wi-Fi: toggle" \
  " Bluetooth: toggle" \
  " Do Not Disturb: toggle" \
  " Power Profile: cycle" \
  "󰐥 Network settings" \
  | wofi --dmenu --prompt "Quick Settings" --width 300 --height 220)

case "$choice" in
  *"Wi-Fi"*)
    nmcli radio wifi "$(nmcli radio wifi | grep -q enabled && echo off || echo on)" ;;
  *"Bluetooth"*)
    if systemctl is-active --quiet bluetooth; then
      sudo systemctl stop bluetooth
    else
      sudo systemctl start bluetooth
    fi ;;
  *"Do Not Disturb"*)
    dunstctl set-paused toggle ;;
  *"Power Profile"*)
    current=$(powerprofilesctl get)
    case "$current" in
      performance) powerprofilesctl set balanced ;;
      balanced) powerprofilesctl set power-saver ;;
      *) powerprofilesctl set performance ;;
    esac ;;
  *"Network settings"*)
    nm-connection-editor ;;
esac
EOF

# Install Kitty configuration into /etc/skel
cat > /etc/skel/.config/kitty/kitty.conf <<'EOF'
font_family      JetBrainsMono Nerd Font
bold_font        auto
italic_font      auto
font_size        11.0
disable_ligatures never

background_opacity   0.82
dynamic_background_opacity yes
background_blur      64
window_padding_width  10

foreground            #e6f1f5
background            #0d1117
selection_foreground  #0d1117
selection_background  #56d4dd
cursor                #56d4dd
cursor_text_color     #0d1117
color0  #0d1117
color8  #4c5561
color1  #ff6b6b
color9  #ff8787
color2  #57e389
color10 #7bf1a8
color3  #f5d76e
color11 #ffe58f
color4  #56b6ff
color12 #7cc7ff
color5  #c792ea
color13 #dcb4f7
color6  #56d4dd
color14 #8be9fd
color7  #e6f1f5
color15 #ffffff

enable_audio_bell     no
confirm_os_window_close 0
scrollback_lines       10000
allow_remote_control    yes
listen_on               unix:/tmp/kitty
shell_integration       enabled

tab_bar_edge         top
tab_bar_style        powerline
tab_powerline_style  slanted
active_tab_foreground   #0d1117
active_tab_background   #56d4dd

map ctrl+shift+t        new_tab
map ctrl+shift+enter     launch --location=hsplit
map ctrl+alt+enter       launch --location=vsplit
map ctrl+shift+p         show_kitty_command_palette
map ctrl+shift+f         show_scrollback
map ctrl+shift+s         launch --type=overlay aether snapshot save
map ctrl+shift+r         launch --type=overlay aether snapshot restore
map ctrl+space           launch --type=overlay aether ai

startup_session none
EOF

# Make Waybar scripts executable
chmod +x /etc/skel/.config/waybar/scripts/*.sh

# Pre-populate default user 'aether' configuration if directory exists
if [ -d /home/aether ]; then
  mkdir -p /home/aether/.config
  cp -r /etc/skel/.config/* /home/aether/.config/
  chown -R aether:aether /home/aether
  chmod +x /home/aether/.config/waybar/scripts/*.sh
fi

# Install Desktop Entry for AetherOS Settings app
cat > /usr/share/applications/aether-settings.desktop <<'EOF'
[Desktop Entry]
Name=AetherOS Settings
Comment=Control center for AetherOS appearance, display, network, audio, and AI settings
Exec=aether-settings
Icon=preferences-system
Terminal=false
Type=Application
Categories=Settings;System;
Keywords=aether;settings;control;panel;wifi;audio;ai;wallpaper;
EOF

%end


