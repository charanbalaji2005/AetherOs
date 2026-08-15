#!/usr/bin/env bash
# Quick Settings popup, launched via waybar custom/quicksettings on-click.
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
