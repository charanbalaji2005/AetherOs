#!/usr/bin/env bash
# Outputs JSON for waybar custom/notifications module.
# Left click (handled in config "on-click") toggles do-not-disturb.
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
