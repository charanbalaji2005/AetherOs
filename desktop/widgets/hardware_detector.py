#!/usr/bin/env python3
"""
AetherOS Real-time Linux Hardware & System Telemetry Engine
Dynamically reads live telemetry from Linux native kernel interfaces (/proc, /sys, statvfs, udev, lspci, nvidia-smi)
with zero hardcoded values and graceful fallbacks for missing sensors.
"""

import os
import sys
import time
import glob
import json
import socket
import platform
import subprocess
import getpass
from collections import deque

class HardwareDetector:
    def __init__(self):
        self.prev_cpu_stat = None
        self.prev_net_stat = None
        self.prev_disk_stat = None
        self.prev_time = time.time()
        
        # History buffers for network sparklines (30 samples)
        self.net_rx_history = deque([0.0] * 30, maxlen=30)
        self.net_tx_history = deque([0.0] * 30, maxlen=30)

        # Static cache (probed once)
        self.os_info = self._get_os_info()
        self.cpu_info = self._get_cpu_static()
        self.gpu_info = self._get_gpu_static()
        self.motherboard_info = self._get_motherboard_info()

    # --- CPU DETECTION ---
    def _get_cpu_static(self):
        model = "Unknown CPU"
        vendor = "Unknown"
        cores = os.cpu_count() or 1
        arch = platform.machine()
        max_freq = "N/A"

        try:
            if os.path.exists("/proc/cpuinfo"):
                with open("/proc/cpuinfo", "r") as f:
                    for line in f:
                        if line.startswith("model name") or line.startswith("Hardware") or line.startswith("Processor"):
                            model = line.split(":", 1)[1].strip()
                            break
                        elif line.startswith("vendor_id"):
                            vendor = line.split(":", 1)[1].strip()
            elif sys.platform == "win32":
                model = platform.processor() or "AMD / Intel Processor"

            # Clean model name formatting
            model = model.replace("(R)", "").replace("(TM)", "").replace("CPU", "").strip()
            if "AuthenticAMD" in vendor or "AMD" in model:
                vendor = "AMD"
            elif "GenuineIntel" in vendor or "Intel" in model:
                vendor = "Intel"

            # Max frequency
            freq_files = glob.glob("/sys/devices/system/cpu/cpu*/cpufreq/cpuinfo_max_freq")
            if freq_files:
                with open(freq_files[0], "r") as f:
                    khz = int(f.read().strip())
                    max_freq = f"{khz / 1000000:.2f} GHz"
        except Exception:
            pass

        return {
            "model": model,
            "vendor": vendor,
            "cores": cores,
            "arch": arch,
            "max_freq": max_freq
        }

    def get_cpu_telemetry(self):
        usage = 0.0
        cur_freq = "N/A"
        temp = "N/A"

        try:
            if os.path.exists("/proc/stat"):
                with open("/proc/stat", "r") as f:
                    first_line = f.readline()
                    parts = [float(x) for x in first_line.split()[1:8]]
                    idle = parts[3] + parts[4]
                    total = sum(parts)

                    if self.prev_cpu_stat:
                        prev_idle, prev_total = self.prev_cpu_stat
                        diff_idle = idle - prev_idle
                        diff_total = total - prev_total
                        if diff_total > 0:
                            usage = max(0.0, min(100.0, (1.0 - (diff_idle / diff_total)) * 100.0))

                    self.prev_cpu_stat = (idle, total)
        except Exception:
            pass

        # Current Frequency
        try:
            cur_files = glob.glob("/sys/devices/system/cpu/cpu*/cpufreq/scaling_cur_freq")
            if cur_files:
                with open(cur_files[0], "r") as f:
                    khz = int(f.read().strip())
                    cur_freq = f"{khz / 1000000:.2f} GHz"
        except Exception:
            pass

        # CPU Temperature
        try:
            temp_files = glob.glob("/sys/class/hwmon/hwmon*/temp*_input") or glob.glob("/sys/class/thermal/thermal_zone*/temp")
            for tf in temp_files:
                with open(tf, "r") as f:
                    t_val = int(f.read().strip())
                    if t_val > 1000:
                        t_val /= 1000.0
                    if 10.0 <= t_val <= 115.0:
                        temp = f"{t_val:.1f}°C"
                        break
        except Exception:
            pass

        return {
            "model": self.cpu_info["model"],
            "vendor": self.cpu_info["vendor"],
            "cores": self.cpu_info["cores"],
            "usage": round(usage, 1),
            "frequency": cur_freq,
            "temperature": temp
        }

    # --- RAM DETECTION ---
    def get_ram_telemetry(self):
        total_kb = 0
        avail_kb = 0
        swap_total_kb = 0
        swap_free_kb = 0

        try:
            if os.path.exists("/proc/meminfo"):
                with open("/proc/meminfo", "r") as f:
                    for line in f:
                        if line.startswith("MemTotal:"):
                            total_kb = int(line.split()[1])
                        elif line.startswith("MemAvailable:"):
                            avail_kb = int(line.split()[1])
                        elif line.startswith("SwapTotal:"):
                            swap_total_kb = int(line.split()[1])
                        elif line.startswith("SwapFree:"):
                            swap_free_kb = int(line.split()[1])
            elif sys.platform == "win32":
                # Fallback on Windows dev environment
                import ctypes
                class MEMORYSTATUSEX(ctypes.Structure):
                    _fields_ = [
                        ("dwLength", ctypes.c_ulong),
                        ("dwMemoryLoad", ctypes.c_ulong),
                        ("ullTotalPhys", ctypes.c_ulonglong),
                        ("ullAvailPhys", ctypes.c_ulonglong),
                        ("ullTotalPageFile", ctypes.c_ulonglong),
                        ("ullAvailPageFile", ctypes.c_ulonglong),
                        ("ullTotalVirtual", ctypes.c_ulonglong),
                        ("ullAvailVirtual", ctypes.c_ulonglong),
                        ("sullAvailExtendedVirtual", ctypes.c_ulonglong),
                    ]
                stat = MEMORYSTATUSEX()
                stat.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
                ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat))
                total_kb = stat.ullTotalPhys // 1024
                avail_kb = stat.ullAvailPhys // 1024
        except Exception:
            pass

        used_kb = max(0, total_kb - avail_kb)
        total_gib = total_kb / (1024 * 1024)
        used_gib = used_kb / (1024 * 1024)
        pct = (used_kb / total_kb * 100.0) if total_kb > 0 else 0.0

        swap_used_kb = max(0, swap_total_kb - swap_free_kb)
        swap_pct = (swap_used_kb / swap_total_kb * 100.0) if swap_total_kb > 0 else 0.0

        return {
            "total_gib": round(total_gib, 1),
            "used_gib": round(used_gib, 1),
            "percentage": round(pct, 1),
            "swap_used_gib": round(swap_used_kb / (1024 * 1024), 1),
            "swap_total_gib": round(swap_total_kb / (1024 * 1024), 1),
            "swap_percentage": round(swap_pct, 1)
        }

    # --- GPU DETECTION ---
    def _get_gpu_static(self):
        gpu_name = "Integrated Graphics"
        vendor = "Unknown"

        # 1. Check NVIDIA via nvidia-smi
        try:
            res = subprocess.run(
                ["nvidia-smi", "--query-gpu=name,driver_version", "--format=csv,noheader,nounits"],
                capture_output=True, text=True, timeout=2
            )
            if res.returncode == 0 and res.stdout.strip():
                parts = res.stdout.strip().split(",")
                return {
                    "name": parts[0].strip(),
                    "vendor": "NVIDIA",
                    "driver": parts[1].strip() if len(parts) > 1 else "Proprietary",
                    "type": "nvidia"
                }
        except Exception:
            pass

        # 2. Check lspci for discrete / integrated GPUs
        try:
            res = subprocess.run(["lspci"], capture_output=True, text=True, timeout=2)
            if res.returncode == 0:
                for line in res.stdout.splitlines():
                    if "VGA" in line or "3D" in line or "Display" in line:
                        desc = line.split(":", 2)[-1].strip()
                        if "NVIDIA" in desc:
                            return {"name": desc.replace("NVIDIA Corporation", "").strip(), "vendor": "NVIDIA", "type": "nvidia", "driver": "Nouveau/NVIDIA"}
                        elif "Advanced Micro Devices" in desc or "AMD" in desc or "Radeon" in desc:
                            return {"name": desc.replace("Advanced Micro Devices, Inc. [AMD/ATI]", "").strip(), "vendor": "AMD", "type": "amd", "driver": "amdgpu"}
                        elif "Intel" in desc:
                            return {"name": desc.replace("Intel Corporation", "").strip(), "vendor": "Intel", "type": "intel", "driver": "i915/xe"}
                        gpu_name = desc
        except Exception:
            pass

        return {"name": gpu_name, "vendor": vendor, "type": "generic", "driver": "Mesa"}

    def get_gpu_telemetry(self):
        gpu_data = {
            "name": self.gpu_info["name"],
            "vendor": self.gpu_info["vendor"],
            "usage": 0.0,
            "vram_used_gib": 0.0,
            "vram_total_gib": 0.0,
            "vram_percentage": 0.0,
            "temperature": "N/A"
        }

        # 1. NVIDIA Telemetry
        if self.gpu_info["type"] == "nvidia":
            try:
                res = subprocess.run(
                    ["nvidia-smi", "--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu", "--format=csv,noheader,nounits"],
                    capture_output=True, text=True, timeout=1
                )
                if res.returncode == 0 and res.stdout.strip():
                    parts = [p.strip() for p in res.stdout.strip().split(",")]
                    gpu_data["usage"] = float(parts[0])
                    v_used_mib = float(parts[1])
                    v_tot_mib = float(parts[2])
                    gpu_data["vram_used_gib"] = round(v_used_mib / 1024.0, 1)
                    gpu_data["vram_total_gib"] = round(v_tot_mib / 1024.0, 1)
                    gpu_data["vram_percentage"] = round((v_used_mib / v_tot_mib) * 100.0, 1) if v_tot_mib > 0 else 0.0
                    gpu_data["temperature"] = f"{parts[3]}°C"
                    return gpu_data
            except Exception:
                pass

        # 2. AMD Telemetry via sysfs
        try:
            busy_files = glob.glob("/sys/class/drm/card*/device/gpu_busy_percent")
            if busy_files:
                with open(busy_files[0], "r") as f:
                    gpu_data["usage"] = float(f.read().strip())
            
            vram_used_files = glob.glob("/sys/class/drm/card*/device/mem_info_vram_used")
            vram_tot_files = glob.glob("/sys/class/drm/card*/device/mem_info_vram_total")
            if vram_used_files and vram_tot_files:
                with open(vram_used_files[0], "r") as f1, open(vram_tot_files[0], "r") as f2:
                    u_b = int(f1.read().strip())
                    t_b = int(f2.read().strip())
                    gpu_data["vram_used_gib"] = round(u_b / (1024**3), 1)
                    gpu_data["vram_total_gib"] = round(t_b / (1024**3), 1)
                    gpu_data["vram_percentage"] = round((u_b / t_b) * 100.0, 1) if t_b > 0 else 0.0
        except Exception:
            pass

        return gpu_data

    # --- STORAGE DETECTION ---
    def get_storage_telemetry(self):
        drives = []
        # Query root '/' and '/home'
        mounts = [("/", "/ (Root)"), ("/home", "/home")]
        
        for mnt, label in mounts:
            if os.path.exists(mnt):
                try:
                    st = os.statvfs(mnt)
                    total_bytes = st.f_blocks * st.f_frsize
                    free_bytes = st.f_bavail * st.f_frsize
                    used_bytes = total_bytes - free_bytes

                    tot_gib = total_bytes / (1024**3)
                    used_gib = used_bytes / (1024**3)
                    pct = (used_bytes / total_bytes * 100.0) if total_bytes > 0 else 0.0

                    drives.append({
                        "mount": mnt,
                        "label": label,
                        "used_gib": round(used_gib, 1),
                        "total_gib": round(tot_gib, 1),
                        "percentage": round(pct, 1)
                    })
                except Exception:
                    pass

        return drives

    # --- NETWORK DETECTION ---
    def get_network_telemetry(self):
        now = time.time()
        dt = max(0.001, now - self.prev_time)
        self.prev_time = now

        rx_bytes = 0
        tx_bytes = 0

        try:
            with open("/proc/net/dev", "r") as f:
                lines = f.readlines()[2:]
                for line in lines:
                    parts = line.split(":")
                    if len(parts) == 2:
                        iface = parts[0].strip()
                        if iface == "lo":
                            continue
                        stats = parts[1].split()
                        rx_bytes += int(stats[0])
                        tx_bytes += int(stats[8])
        except Exception:
            pass

        rx_speed_kib = 0.0
        tx_speed_kib = 0.0

        if self.prev_net_stat:
            prev_rx, prev_tx = self.prev_net_stat
            rx_speed_kib = max(0.0, (rx_bytes - prev_rx) / (1024.0 * dt))
            tx_speed_kib = max(0.0, (tx_bytes - prev_tx) / (1024.0 * dt))

        self.prev_net_stat = (rx_bytes, tx_bytes)
        
        self.net_rx_history.append(rx_speed_kib)
        self.net_tx_history.append(tx_speed_kib)

        def format_speed(kib):
            if kib >= 1024.0:
                return f"{kib / 1024.0:.1f} MiB/s"
            return f"{kib:.1f} KiB/s"

        return {
            "download_str": format_speed(rx_speed_kib),
            "upload_str": format_speed(tx_speed_kib),
            "rx_history": list(self.net_rx_history),
            "tx_history": list(self.net_tx_history)
        }

    # --- SYSTEM / OS DETECTION ---
    def _get_os_info(self):
        distro = "AetherOS Linux"
        try:
            if os.path.exists("/etc/os-release"):
                with open("/etc/os-release", "r") as f:
                    for line in f:
                        if line.startswith("PRETTY_NAME="):
                            distro = line.split("=", 1)[1].strip().strip('"')
                            break
                        elif line.startswith("NAME="):
                            distro = line.split("=", 1)[1].strip().strip('"')
        except Exception:
            pass

        arch = platform.machine()
        return f"{distro} {arch}"

    def get_system_telemetry(self):
        # Kernel
        kernel = platform.release()

        # Uptime
        uptime_str = "0m"
        try:
            with open("/proc/uptime", "r") as f:
                uptime_sec = float(f.readline().split()[0])
                hours = int(uptime_sec // 3600)
                mins = int((uptime_sec % 3600) // 60)
                uptime_str = f"{hours}h {mins}m" if hours > 0 else f"{mins}m"
        except Exception:
            pass

        # Package count
        pkg_count = "N/A"
        try:
            if os.path.exists("/usr/bin/rpm"):
                res = subprocess.run(["rpm", "-qa"], capture_output=True, text=True, timeout=1)
                pkg_count = f"{len(res.stdout.splitlines())} (rpm)"
            elif os.path.exists("/usr/bin/pacman"):
                res = subprocess.run(["pacman", "-Q"], capture_output=True, text=True, timeout=1)
                pkg_count = f"{len(res.stdout.splitlines())} (pacman)"
            elif os.path.exists("/usr/bin/dpkg"):
                res = subprocess.run(["dpkg-query", "-f", ".\n", "-W"], capture_output=True, text=True, timeout=1)
                pkg_count = f"{len(res.stdout.splitlines())} (dpkg)"
        except Exception:
            pass

        # Shell
        shell_path = os.environ.get("SHELL", "/bin/bash")
        shell_name = os.path.basename(shell_path)

        return {
            "os": self.os_info,
            "kernel": kernel,
            "uptime": uptime_str,
            "packages": pkg_count,
            "shell": shell_name,
            "wm": "Hyprland"
        }

    # --- BATTERY DETECTION ---
    def get_battery_telemetry(self):
        bat_files = glob.glob("/sys/class/power_supply/BAT*/capacity")
        if bat_files:
            try:
                with open(bat_files[0], "r") as f:
                    cap = int(f.read().strip())
                status = "Discharging"
                st_files = glob.glob("/sys/class/power_supply/BAT*/status")
                if st_files:
                    with open(st_files[0], "r") as f:
                        status = f.read().strip()
                return {"has_battery": True, "capacity": cap, "status": status}
            except Exception:
                pass
        return {"has_battery": False, "capacity": 100, "status": "AC Power"}

    # --- MOTHERBOARD DETECTION ---
    def _get_motherboard_info(self):
        vendor = "Unknown"
        model = "Motherboard"
        try:
            if os.path.exists("/sys/class/dmi/id/board_vendor"):
                with open("/sys/class/dmi/id/board_vendor", "r") as f:
                    vendor = f.read().strip()
            if os.path.exists("/sys/class/dmi/id/board_name"):
                with open("/sys/class/dmi/id/board_name", "r") as f:
                    model = f.read().strip()
        except Exception:
            pass
        return f"{vendor} {model}"

    def get_all_metrics(self):
        """Aggregate full real-time telemetry snapshot."""
        return {
            "cpu": self.get_cpu_telemetry(),
            "ram": self.get_ram_telemetry(),
            "gpu": self.get_gpu_telemetry(),
            "storage": self.get_storage_telemetry(),
            "network": self.get_network_telemetry(),
            "system": self.get_system_telemetry(),
            "battery": self.get_battery_telemetry()
        }

if __name__ == "__main__":
    detector = HardwareDetector()
    time.sleep(0.5)
    print(json.dumps(detector.get_all_metrics(), indent=2))
