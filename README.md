````markdown
# AetherOS

<p align="center">
  <img src="branding/logos/aetheros-logo.png" alt="AetherOS" width="180">
</p>

<p align="center">
  <strong>A Fedora-based, Hyprland-first Linux distribution for modern desktop users, developers, creators and power users.</strong>
</p>

<p align="center">
  Fedora • Linux • Wayland • Hyprland • GNOME • systemd • PipeWire • Tauri
</p>

---

## Overview

**AetherOS** is a Fedora-based Linux distribution designed to provide a modern, customizable and developer-friendly desktop experience while retaining the reliability and hardware compatibility of the Fedora ecosystem.

AetherOS is **not a Linux kernel or operating system written from scratch**. Instead, it builds on Fedora's existing kernel, RPM packages, drivers, system services and infrastructure, and adds an AetherOS-specific layer containing desktop configuration, system services, graphical applications, automation, branding and distribution tooling.

```text
┌──────────────────────────────────────────────────────────────┐
│                         AetherOS UX                           │
│                                                              │
│ Settings • Software Center • Driver Manager • Security       │
│ Snapshots • VPN • AI Assistant • Power • System Tools        │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                     AetherOS System Layer                     │
│                                                              │
│ Aether Services • CLI • systemd • Polkit • Update Engine     │
│ Battery • Firewall • VPN • Snapshots • Telemetry • Drivers   │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                       Desktop Layer                           │
│                                                              │
│ Hyprland • Wayland • Waybar • GNOME • GDM/SDDM • PipeWire    │
│ GTK • Portals • Kitty • Rofi/Wofi • Notifications             │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                      Linux System Layer                       │
│                                                              │
│ Linux Kernel • systemd • DNF • RPM • NetworkManager           │
│ Mesa • udev • Polkit • SELinux • firewalld • PipeWire         │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                        Fedora Base                            │
│                                                              │
│ Fedora repositories • Fedora packages • Fedora kernel         │
└──────────────────────────────────────────────────────────────┘
````

---

## Features

### Desktop

* Hyprland-first Wayland desktop
* Waybar
* GNOME components and applications
* GDM / SDDM configuration
* GTK integration
* XDG Desktop Portals
* Kitty
* Rofi / Wofi
* Dunst / SwayNC
* Hypridle
* Hyprlock
* Kanshi
* Custom wallpapers, themes, icons and branding

### System

* Fedora Linux base
* Linux kernel
* systemd
* DNF / RPM
* NetworkManager
* PipeWire / WirePlumber
* Polkit
* SELinux
* firewalld
* udev
* Mesa
* Hardware and firmware support

### AetherOS Tools

* Aether Settings
* Aether Software Center
* Aether Driver Manager
* Aether Security Center
* Aether Snapshot Manager
* Aether VPN Manager
* Aether Power Menu
* Aether Update Engine
* Aether Battery Service
* Aether CLI
* Aether AI foundation
* Wallpaper and theme management
* System diagnostics and utilities

### Applications

The distribution can include commonly used applications such as:

* Firefox
* LibreOffice
* VLC
* Steam
* OBS Studio
* GIMP

along with development tools including:

* Git
* Neovim
* Node.js
* Python
* Rust
* Go
* Java
* GCC
* Clang
* Docker

---

# Architecture

AetherOS follows a modular layered architecture.

```text
                         AETHEROS
                            │
             ┌──────────────┼──────────────┐
             │              │              │
          Desktop         System          Build
             │              │              │
       ┌─────┼─────┐   ┌────┼─────┐   ┌────┼──────┐
       │     │     │   │    │      │   │    │      │
   Hyprland GNOME Waybar DNF systemd SELinux Kickstart Overlay
       │     │     │   │    │      │   │    │      │
       └─────┼─────┘   └────┼──────┘   └────┼──────┘
             │              │              │
             └──────────────┼──────────────┘
                            │
                     AetherOS Layer
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
    Aether CLI          Aether Services      Aether Apps
        │                   │                    │
        │             ┌─────┼─────┐        ┌────┼──────┐
        │             │     │     │        │    │      │
        │          Battery Update VPN   Settings AI Software
        │             │     │     │        │    │      │
        └─────────────┴─────┴─────┴────────┴────┴──────┘
                            │
                            ▼
                     Fedora Linux Base
                            │
                            ▼
                    Linux Kernel / Hardware
```

---

# Repository Structure

```text
AetherOS/
│
├── .github/
│   └── workflows/
│       ├── deploy-repo.yml
│       ├── release-build.yml
│       └── release.yml
│
├── aether/
│   ├── ai/
│   ├── api/
│   ├── backup/
│   ├── battery/
│   ├── benchmark/
│   ├── bin/
│   ├── cloud/
│   ├── daemon/
│   ├── diagnostics/
│   ├── driver-manager/
│   ├── firewall/
│   ├── gaming/
│   ├── installer/
│   ├── login/
│   ├── notifications/
│   ├── package-manager/
│   ├── powermenu/
│   ├── recovery/
│   ├── restore/
│   ├── security-center/
│   ├── settings/
│   ├── setup/
│   ├── snapshots/
│   ├── software-center/
│   ├── telemetry/
│   ├── update-engine/
│   ├── virtualization/
│   └── vpn/
│
├── applications/
│
├── assets/
│
├── branding/
│   ├── fonts/
│   ├── grub/
│   ├── icons/
│   ├── logos/
│   ├── marketing/
│   ├── plymouth/
│   ├── sounds/
│   └── wallpapers/
│
├── build/
│   ├── aetheros.ks
│   ├── aetheros.generated.ks
│   ├── aether-kickstart.ks
│   ├── flat-aetheros.ks
│   ├── build-iso.sh
│   ├── create-live-iso.sh
│   └── package-image.sh
│
├── configs/
│   ├── bluetooth/
│   ├── calamares/
│   ├── dnf/
│   ├── dracut/
│   ├── firewall/
│   ├── flatpak/
│   ├── gdm/
│   ├── grub/
│   ├── gtk/
│   ├── hyprland/
│   ├── kernel/
│   ├── kitty/
│   ├── networkmanager/
│   ├── pipewire/
│   ├── plymouth/
│   ├── polkit/
│   ├── rofi/
│   ├── sddm/
│   ├── selinux/
│   ├── systemd/
│   ├── waybar/
│   ├── wayland/
│   ├── wofi/
│   └── xdg-desktop-portal/
│
├── desktop/
│   ├── files/
│   ├── icons/
│   ├── themes/
│   ├── wallpapers/
│   ├── widgets/
│   └── sddm/
│
├── docs/
│
├── drivers/
│   ├── amd/
│   ├── intel/
│   ├── nvidia/
│   ├── audio/
│   ├── bluetooth/
│   ├── ethernet/
│   ├── firmware/
│   ├── wifi/
│   ├── webcam/
│   ├── usb/
│   ├── nvme/
│   └── thunderbolt/
│
├── installer/
│
└── iso-overlay/
    ├── etc/
    └── usr/
```

---

# AetherOS Core Layer

The `aether/` directory contains distribution-specific functionality.

```text
aether/
```

is separated into independent components so that each feature can evolve without requiring changes to the entire operating system.

Examples:

```text
aether/bin/
aether/battery/
aether/driver-manager/
aether/firewall/
aether/security-center/
aether/settings/
aether/snapshots/
aether/software-center/
aether/update-engine/
aether/vpn/
aether/ai/
```

Some directories are already implemented while others provide the architecture for future functionality.

---

# Aether CLI

The main AetherOS command layer is located in:

```text
aether/bin/
```

It provides native Linux utilities for common system operations.

Examples include:

```text
aether
aether-appearance
aether-backup-core
aether-driver-core
aether-files
aether-firewall-core
aether-game-optim
aether-installer
aether-powermenu
aether-screenshot
aether-setup-core
aether-snapshot-core
aether-theme-manager
aether-update-engine
aether-vpn-core
aether-wallpaper
```

The design is:

```text
Aether CLI
    │
    ▼
Linux APIs / Commands
    │
    ├── DNF
    ├── systemctl
    ├── nmcli
    ├── firewall-cmd
    ├── snapper
    ├── wg
    └── other native tools
```

AetherOS does not attempt to replace the entire Linux ecosystem. It provides a unified interface above existing Linux technologies.

---

# Graphical Application Architecture

AetherOS graphical applications use the following stack:

```text
React
  │
  ▼
TypeScript
  │
  ▼
Vite
  │
  ▼
Web UI
  │
  ▼
Tauri
  │
  ▼
Rust
  │
  ▼
Native Linux
```

Applications include:

```text
Settings
Software Center
Security Center
Driver Manager
Snapshots
Setup
Power Menu
```

This provides a modern web-based UI while allowing the applications to communicate with native Linux functionality.

---

# Desktop Architecture

The desktop is based on Wayland.

```text
Applications
     │
     ▼
Wayland
     │
     ▼
Hyprland
     │
 ┌───┼───────────────────────────┐
 │   │                           │
 ▼   ▼                           ▼
Waybar Portals              Notifications
 │       │                       │
 ▼       ▼                       ▼
Status   File/Screen        Dunst/SwayNC
Bar      Integration
```

Hyprland configuration is located under:

```text
configs/hyprland/
```

Important configuration files include:

```text
hyprland.conf
hypridle.conf
hyprlock.conf
hyprpaper.conf
monitors.conf
```

---

# GNOME

AetherOS uses GNOME components where appropriate.

GNOME provides mature desktop technologies and applications such as:

```text
GNOME Shell
GNOME Session
GNOME Terminal
Nautilus
GNOME Control Center
GNOME Tweaks
GNOME Extensions
```

AetherOS remains an independent project.

**GNOME is not relicensed by AetherOS**, and GNOME components remain under their respective upstream licenses.

GNOME trademarks and logos are subject to the GNOME Foundation's policies.

---

# System Services

AetherOS integrates its own services with `systemd`.

Examples include:

```text
aether-battery.service
aether-firstboot.service
aether-telemetry.service
aether-update-engine.service
```

Architecture:

```text
systemd
   │
   ├── Aether Battery
   ├── Aether First Boot
   ├── Aether Update Engine
   └── Aether Telemetry
```

This allows AetherOS components to use standard Linux service management.

---

# Privilege Management

AetherOS uses **Polkit** rather than running graphical applications as root.

```text
Aether Application
       │
       ▼
     Polkit
       │
       ▼
Privileged Operation
       │
       ▼
 Linux System
```

This is used for operations such as:

* driver management
* firewall changes
* system updates
* snapshots
* power management
* system configuration

Polkit configuration is stored under:

```text
configs/polkit/
```

---

# Security Architecture

AetherOS combines Fedora and Linux security technologies.

```text
                 AetherOS Security
                        │
       ┌────────────────┼────────────────┐
       │                │                │
    SELinux          firewalld         Polkit
       │                │                │
       ▼                ▼                ▼
 Mandatory          Network          Privilege
 Access Control     Filtering        Management
       │                │                │
       └────────────────┼────────────────┘
                        ▼
                    Linux Kernel
```

Primary security components:

* SELinux
* firewalld
* Polkit
* systemd
* Linux permissions
* kernel security mechanisms

---

# Networking

AetherOS uses NetworkManager for network management.

```text
Aether VPN / Network UI
          │
          ▼
    NetworkManager
          │
     ┌────┴─────┐
     │          │
 WireGuard   OpenVPN
     │          │
     └────┬─────┘
          ▼
       Network
```

The VPN functionality is located under:

```text
aether/vpn/
```

and integrates with:

```text
nmcli
wg
wg-quick
```

---

# Audio

AetherOS uses PipeWire and WirePlumber.

```text
Applications
      │
      ▼
   PipeWire
      │
      ▼
 WirePlumber
      │
      ▼
 ALSA / Hardware
```

This provides:

* audio playback
* microphone input
* Bluetooth audio
* PulseAudio compatibility
* modern Wayland desktop integration

---

# GPU and Hardware

AetherOS uses Fedora's hardware stack and Linux kernel drivers.

Supported driver ecosystems include:

```text
AMD
Intel
NVIDIA
Mesa
Vulkan
```

The repository contains driver management infrastructure under:

```text
drivers/
aether/driver-manager/
```

The intended architecture is:

```text
Hardware
   │
   ▼
Firmware
   │
   ▼
Linux Kernel
   │
   ▼
udev
   │
   ▼
GPU / Device Driver
   │
   ▼
AetherOS Driver Manager
```

---

# Snapshot Architecture

AetherOS contains snapshot and rollback infrastructure.

Relevant components include:

```text
aether/snapshots/
aether/bin/aether-snapshot-core
aether/bin/aether-snapper-pre
aether/bin/aether-snapper-post
aether/bin/aether-snapper-rollback
```

The intended architecture uses:

```text
Btrfs
  │
  ▼
Snapper
  │
  ├── Create Snapshot
  ├── List Snapshots
  └── Rollback
```

Btrfs and snapshot functionality should be considered dependent on the specific image/Kickstart configuration used to build the distribution.

---

# Battery and Power Management

The AetherOS battery service monitors Linux power-supply information.

```text
/sys/class/power_supply
            │
            ▼
 Aether Battery Service
            │
            ▼
      Power Profile
       ┌────┼─────┐
       │    │     │
 Power Saver Balanced Performance
```

This can provide different behavior depending on whether the machine is:

* plugged in
* running on battery
* operating at low battery levels

---

# Update Architecture

The Aether Update Engine provides a distribution-specific update interface.

```text
             Aether Update Engine
                      │
              ┌───────┴───────┐
              │               │
             DNF           Flatpak
              │               │
              ▼               ▼
        Fedora Packages   Applications
              │               │
              └───────┬───────┘
                      ▼
                Updated System
```

The underlying Fedora package infrastructure remains DNF/RPM.

---

# AI Architecture

AetherOS contains an AI assistant foundation under:

```text
aether/ai/
```

The architecture is designed to eventually support:

```text
User
 │
 ▼
Aether AI
 │
 ▼
Intent / Tool System
 │
 ├── System Information
 ├── Applications
 ├── Updates
 ├── Files
 ├── Settings
 ├── Terminal
 └── System Utilities
```

Future implementations can support:

* local LLMs
* remote AI APIs
* tool calling
* terminal integration
* desktop automation
* contextual assistance
* permission-aware actions

AI operations that require system privileges should continue to use the AetherOS permission architecture rather than unrestricted root access.

---

# Installer

AetherOS includes installer configuration under:

```text
installer/
configs/calamares/
iso-overlay/etc/calamares/
```

The architecture uses Calamares as the graphical installer.

```text
AetherOS Live Environment
          │
          ▼
       Calamares
          │
     ┌────┼───────────┐
     │    │           │
Partition User      Bootloader
     │    │           │
     ▼    ▼           ▼
 Filesystem        EFI / GRUB
          │
          ▼
     Installed System
```

---

# Boot Architecture

The intended boot process is:

```text
UEFI Firmware
      │
      ▼
GRUB / EFI
      │
      ▼
Linux Kernel
      │
      ▼
Dracut / initramfs
      │
      ▼
systemd
      │
      ├── NetworkManager
      ├── firewalld
      ├── Bluetooth
      ├── Aether Services
      └── graphical.target
                  │
                  ▼
            Display Manager
                  │
             ┌────┴────┐
             │         │
          Hyprland   GNOME
```

Plymouth provides the graphical boot experience.

---

# Configuration Layer

All major system configuration is stored under:

```text
configs/
```

This includes:

```text
GRUB
Plymouth
Hyprland
Waybar
GDM
SDDM
PipeWire
NetworkManager
Polkit
SELinux
firewalld
systemd
Kitty
Rofi
Wofi
GTK
XDG portals
DNF
Dracut
```

Keeping configuration separate from application code makes the distribution easier to maintain.

---

# Branding

AetherOS branding is separated from the underlying Fedora system.

```text
branding/
```

contains resources such as:

```text
logos
wallpapers
icons
fonts
Plymouth
GRUB
sounds
marketing assets
```

This makes it possible to change the visual identity without changing the underlying Linux architecture.

---

# ISO Build System

AetherOS is assembled using Fedora's image-building infrastructure and Kickstart.

Main build files:

```text
build/build-iso.sh
build/aetheros.ks
build/aetheros.generated.ks
build/aether-kickstart.ks
build/flat-aetheros.ks
build/create-live-iso.sh
build/package-image.sh
```

The build process is approximately:

```text
Developer
    │
    ▼
build/build-iso.sh
    │
    ├── Validate build environment
    ├── Build Aether applications
    ├── Stage Aether binaries
    ├── Stage configurations
    ├── Stage desktop files
    ├── Stage branding
    ├── Prepare Kickstart
    ├── Build Fedora filesystem
    ├── Apply AetherOS overlay
    ├── Generate boot configuration
    └── Generate ISO
             │
             ▼
        AetherOS ISO
```

---

# Kickstart

The Kickstart file defines the operating-system image.

```text
build/aetheros.ks
```

It controls things such as:

* repositories
* packages
* users
* language
* keyboard
* timezone
* bootloader
* services
* security
* filesystem configuration
* post-install configuration

The overall model is:

```text
Fedora Packages
       │
       ▼
   Kickstart
       │
       ▼
 Fedora Filesystem
       │
       ▼
 AetherOS Overlay
       │
       ▼
  Bootable ISO
```

---

# ISO Overlay

The:

```text
iso-overlay/
```

directory contains files that are staged into the resulting operating-system filesystem.

Typical locations include:

```text
/etc/
/usr/local/bin/
/usr/share/applications/
/usr/share/backgrounds/
/usr/share/icons/
/usr/share/plymouth/
```

This provides a clean separation between source configuration and the final operating-system filesystem.

---

# Build Requirements

AetherOS should be built on a Fedora Linux environment.

Recommended requirements:

* Fedora Linux
* root/sudo access
* loop device support
* virtualization support for testing
* network connection
* at least ~15 GB free disk space
* additional space for build artifacts

Install the primary image-building tools:

```bash
sudo dnf install -y lorax livemedia-creator
```

For Tauri applications:

```bash
sudo dnf install -y nodejs npm rust cargo
```

Additional development packages may be required depending on the application being built.

---

# Building

Clone the repository:

```bash
git clone https://github.com/charanbalaji2005/AetherOS.git
cd AetherOS
```

Build the ISO:

```bash
sudo bash build/build-iso.sh
```

The build process compiles the required applications, stages system files and creates the bootable AetherOS image.

---

# Testing

Always test the ISO in a virtual machine before installing it on physical hardware.

Recommended platforms:

```text
QEMU / KVM
VirtualBox
VMware
```

Test:

* UEFI boot
* GRUB
* Plymouth
* graphical session
* networking
* Wi-Fi
* audio
* GPU detection
* package management
* system services
* installer
* reboot
* shutdown
* permissions
* security configuration

---

# Development

AetherOS is intentionally modular.

When adding functionality:

```text
System configuration → configs/

System utility       → aether/bin/

System service       → aether/<service>/

GUI application      → aether/<application>/

Desktop resource     → desktop/

Branding             → branding/

ISO modification     → build/ / iso-overlay/

Installer            → installer/ / configs/calamares/

Documentation        → docs/
```

Avoid unnecessarily modifying Fedora components. Prefer existing Linux APIs and services wherever possible.

---

# Development Principles

AetherOS follows these principles:

### Fedora compatibility

Use Fedora's existing ecosystem instead of rebuilding the Linux foundation.

### Native Linux integration

Prefer:

```text
systemd
DNF
RPM
NetworkManager
PipeWire
Polkit
SELinux
firewalld
```

over parallel custom implementations.

### Modular design

Each major AetherOS feature should be independently maintainable.

### Security

Do not run graphical applications as root. Use Polkit and appropriate system services for privileged operations.

### Performance

Keep the desktop responsive and avoid unnecessary background processes.

### Transparency

Clearly distinguish between implemented features and planned functionality.

### User control

Users should be able to understand and control system-level operations.

---

# Current Status

AetherOS is an active development project.

### Core infrastructure

* [x] Fedora-based build system
* [x] Kickstart configuration
* [x] AetherOS branding
* [x] Desktop configuration
* [x] system configuration
* [x] Aether CLI infrastructure
* [x] systemd integration
* [x] Polkit configuration
* [x] security configuration
* [x] installer configuration
* [x] CI/CD foundation

### Desktop

* [x] Wayland configuration
* [x] Hyprland configuration
* [x] Waybar
* [x] GNOME components
* [x] PipeWire
* [x] display-manager configuration
* [ ] final unified desktop experience

### Aether Applications

* [x] Settings foundation
* [x] Software Center foundation
* [x] Driver Manager foundation
* [x] Security Center foundation
* [x] Snapshot tooling
* [x] Power Menu
* [x] VPN tooling
* [x] Update Engine
* [x] Battery service
* [ ] complete production integration

### Future

* [ ] Aether AI assistant
* [ ] AetherOS package repository
* [ ] complete backup system
* [ ] recovery environment
* [ ] virtualization manager
* [ ] gaming optimization
* [ ] complete diagnostics center
* [ ] automated hardware testing
* [ ] reproducible builds
* [ ] signed packages
* [ ] signed releases

---

# Roadmap

## Phase 1 — Stable Base

* Boot reliably
* Fix package conflicts
* Validate GPU support
* Validate networking
* Validate audio
* Validate installer
* Test on physical hardware

## Phase 2 — Desktop

* Finalize Hyprland-first experience
* Finalize display-manager strategy
* Complete Waybar
* Complete notifications
* Finalize themes
* Complete wallpaper system
* Complete power menu

## Phase 3 — System Center

* Complete Settings
* Complete Software Center
* Complete Driver Manager
* Complete Security Center
* Complete Snapshot Manager
* Complete Backup Manager
* Complete Firewall Manager
* Complete VPN Manager

## Phase 4 — Aether AI

* Local LLM support
* Remote model support
* Tool calling
* Terminal integration
* Desktop automation
* Context-aware assistance
* Permission-aware actions

## Phase 5 — Distribution Infrastructure

* AetherOS RPM repository
* Automated builds
* Automated testing
* Signed packages
* Signed ISO releases
* Reproducible builds
* Hardware compatibility testing
* Stable release channels

---

# Third-Party Software

AetherOS is built using and/or alongside many open-source projects, including:

* Fedora
* Linux
* GNOME
* Hyprland
* Wayland
* systemd
* PipeWire
* NetworkManager
* Mesa
* GRUB
* Plymouth
* Calamares
* Snapper
* Flatpak
* React
* TypeScript
* Vite
* Tailwind CSS
* Tauri
* Rust

Third-party software remains under its own applicable licenses.

AetherOS does **not** relicense third-party software.

---

# GNOME Notice

AetherOS uses GNOME components and applications.

GNOME remains an independent upstream project.

**AetherOS is not an official GNOME product or official GNOME distribution.**

GNOME software remains under its respective upstream licenses.

GNOME names, logos and trademarks are subject to the applicable GNOME Foundation trademark policies.

---

# License

AetherOS is licensed under the:

**GNU Affero General Public License v3.0 or later**

SPDX identifier:

```text
AGPL-3.0-or-later
```

Copyright:

```text
Copyright (C) 2026 Charan Balaji
```

Original repository:

```text
https://github.com/charanbalaji2005/AetherOS
```

The AGPL permits users to use, study, modify and redistribute AetherOS subject to the terms of the license.

Redistributors and derivative projects must comply with the applicable AGPL requirements, including the requirements concerning source code and network use.

AetherOS-specific attribution and branding requirements are described in the project's `NOTICE` file.

---

# Attribution

When redistributing AetherOS or a derivative project, preserve the original AetherOS copyright and license notices.

The original project should remain identifiable.

Recommended attribution:

```text
Based on AetherOS

Original author:
Charan Balaji

Original repository:
https://github.com/charanbalaji2005/AetherOS
```

Modified distributions should clearly identify themselves as modified or derivative versions.

For example:

```text
AetherOS Community Edition
```

or:

```text
AetherOS — Modified Edition by <Name>
```

A derivative project must not falsely represent itself as the official, original or unmodified AetherOS distribution.

Your own modifications may be attributed to you, but original AetherOS attribution must not be removed or obscured.

---

# Trademark and Branding

The AetherOS source code license does not automatically grant rights to use AetherOS trademarks, logos or branding in any manner.

Official AetherOS releases should be distinguished from independent forks and modified distributions.

Modified distributions are encouraged to use their own branding while clearly stating their relationship to AetherOS.

Similarly, AetherOS does not grant rights to third-party trademarks such as GNOME, Fedora or other upstream projects.

---

# Contributing

Contributions are welcome.

Areas include:

```text
Linux
Fedora
Hyprland
GNOME
Wayland
Rust
Tauri
React
TypeScript
Python
Shell
System Administration
Security
Packaging
Installer
Desktop Development
Testing
Documentation
```

Workflow:

```text
Fork
  │
  ▼
Feature Branch
  │
  ▼
Development
  │
  ▼
Testing
  │
  ▼
Pull Request
  │
  ▼
Review
  │
  ▼
Merge
```

Please document significant architectural changes and test system-level modifications before submitting a pull request.

---

# Disclaimer

AetherOS is provided under the terms of the GNU Affero General Public License.

The project is under active development and may contain experimental, incomplete or changing functionality.

Always test AetherOS in a virtual machine or on non-critical hardware before deploying it to a production system.

---

# AetherOS

```text
Fedora
   +
Wayland
   +
Hyprland
   +
GNOME
   +
systemd
   +
AetherOS
   =
A modern Linux distribution
```

**AetherOS — Build your system. Own your workflow.**

**Copyright © 2026 Charan Balaji**

**AGPL-3.0-or-later**

**Original Repository:**
`https://github.com/charanbalaji2005/AetherOS`

```
```
