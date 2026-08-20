#!/usr/bin/env python3
"""
AetherOS Cyberpunk Hyprland Desktop Environment Overlay Server & Runner
Serves live hardware telemetry, executes interactive Hyprland controls,
and renders the glassmorphic desktop environment on Wayland.
"""

import os
import sys
import json
import time
import subprocess
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 5999
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))
if STATIC_DIR not in sys.path:
    sys.path.insert(0, STATIC_DIR)

from hardware_detector import HardwareDetector
detector = HardwareDetector()

class DesktopOverlayHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def do_GET(self):
        if self.path == "/api/telemetry":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            data = detector.get_all_metrics()
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return
        elif self.path == "/assets/after_dark.png":
            img_path = os.path.join(STATIC_DIR, "assets", "after_dark.png")
            if os.path.exists(img_path):
                self.send_response(200)
                self.send_header("Content-Type", "image/png")
                self.end_headers()
                with open(img_path, "rb") as f:
                    self.wfile.write(f.read())
                return

        return super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        if self.path == "/api/hyprctl":
            cmd = payload.get("command", "")
            if cmd:
                subprocess.Popen(["hyprctl"] + cmd.split(), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self._send_json_ok()
            return
        elif self.path == "/api/launch":
            cmd = payload.get("command", "")
            if cmd:
                subprocess.Popen(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self._send_json_ok()
            return
        elif self.path == "/api/media":
            action = payload.get("action", "")
            if action:
                subprocess.Popen(["playerctl", action], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self._send_json_ok()
            return
        elif self.path == "/api/volume":
            vol = payload.get("volume", 75)
            subprocess.Popen(["wpctl", "set-volume", "@DEFAULT_AUDIO_SINK@", f"{vol}%"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self._send_json_ok()
            return

        self.send_response(404)
        self.end_headers()

    def _send_json_ok(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(b'{"status":"ok"}')

    def log_message(self, format, *args):
        pass # Suppress noisy request logs

def start_server():
    server = HTTPServer(("127.0.0.1", PORT), DesktopOverlayHandler)
    server.serve_forever()

def launch_overlay_window():
    """Launch the WebKit / Browser / GTK layer window."""
    time.sleep(0.5)
    url = f"http://127.0.0.1:{PORT}/index.html"
    
    # Try lightweight Wayland WebKit launcher if installed
    if subprocess.run(["which", "qutebrowser"], capture_output=True).returncode == 0:
        subprocess.Popen(["qutebrowser", "--target", "window", "--set", "window.hide_decoration", "true", url])
        return

    # Fallback to Chromium / Firefox in app mode or background window
    if subprocess.run(["which", "chromium"], capture_output=True).returncode == 0:
        subprocess.Popen(["chromium", f"--app={url}", "--start-fullscreen", "--class=aether-desktop-overlay"])
        return
    elif subprocess.run(["which", "firefox"], capture_output=True).returncode == 0:
        subprocess.Popen(["firefox", "--kiosk", url])
        return

def main():
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    print(f"[+] AetherOS Cyberpunk Desktop Server running on http://127.0.0.1:{PORT}")

    if len(sys.argv) > 1 and sys.argv[1] == "--server-only":
        while True:
            time.sleep(1)
    else:
        launch_overlay_window()
        while True:
            time.sleep(1)

if __name__ == "__main__":
    main()
