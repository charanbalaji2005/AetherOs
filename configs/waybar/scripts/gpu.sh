#!/usr/bin/env bash
# Outputs JSON for waybar custom/gpu module: {"text": "GPU 12%", "tooltip": "..."}
set -euo pipefail

if command -v nvidia-smi >/dev/null 2>&1 && nvidia-smi -L >/dev/null 2>&1; then
  util=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits | head -n1)
  temp=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits | head -n1)
  name=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -n1)
  printf '{"text":"GPU %s%%","tooltip":"%s\\n%sC"}\n' "$util" "$name" "$temp"
elif [[ -d /sys/class/drm/card0/device ]] && [[ -f /sys/class/drm/card0/device/gpu_busy_percent ]]; then
  util=$(cat /sys/class/drm/card0/device/gpu_busy_percent 2>/dev/null || echo "0")
  printf '{"text":"GPU %s%%","tooltip":"AMD GPU"}\n' "$util"
else
  printf '{"text":"GPU --","tooltip":"No GPU utilization sensor found"}\n'
fi
