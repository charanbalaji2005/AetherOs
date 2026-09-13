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
