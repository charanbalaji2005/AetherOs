# AetherOS

A Fedora-based, Hyprland-first Linux distribution.

## How this actually works

AetherOS is **not** a from-scratch kernel or OS — no realistic project is.
Fedora, Ultramarine, Nobara, and every other indie distro are built the same
way: take Fedora's own packages and installer tooling, and define a custom
selection + branding via a **kickstart file**. That's `build/aetheros.ks`.
Using real Fedora RPMs means you get real, working NVIDIA/AMD/Intel drivers,
a real kernel, and a real Hyprland session — not placeholder code.

## Requirements to build

- A **Fedora Linux machine** (bare metal or VM) — this cannot be built inside
  a sandboxed chat environment, since it needs loop devices, root, and several
  GB of disk.
- `sudo dnf install lorax livemedia-creator`
- ~15 GB free disk space, ~20–40 minutes build time

## Build

```bash
sudo bash build/build-iso.sh
```

Output ISO lands in `build/out/AetherOS.iso`. Boot it in a VM (QEMU/VirtualBox)
or `dd` it to a USB stick to test on real hardware.

## What's in this milestone

- Btrfs root/home subvolumes, GRUB2 EFI boot
- Hyprland + Waybar + SDDM + PipeWire desktop stack
- All three GPU driver stacks installed (correct one binds to your hardware)
- Dev toolchain: git, neovim, VS Code, Node, Python, Rust, Go, Java, GCC/Clang, Docker
- Firefox, LibreOffice, VLC, Steam, OBS, GIMP
- SELinux enforcing, firewalld enabled
- `/etc/os-release` branded as AetherOS

## Honest scope notes

Things like a custom AI assistant, theme/extension stores, a graphical
installer UI, and custom Plymouth boot animations are real, buildable
features — but each is its own software project (a systemd service + app,
a web-based Anaconda screen, a Plymouth theme package) layered on top of this
base, not something that ships from a single kickstart. Once this ISO boots
cleanly, the next milestones would be:

1. Test-boot the ISO in a VM, fix any package/dependency conflicts
2. Custom Plymouth boot theme + GRUB theme (branding/)
3. Anaconda installer customization (or keep Fedora's stock installer)
4. AI assistant as a systemd user service + terminal integration
5. RPM packaging for the AetherOS-specific bits, then CI via GitHub Actions

Say which of these you want to tackle next and I'll build it out.
