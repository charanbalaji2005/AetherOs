#!/usr/bin/env python3
"""
AetherOS Files — Backend REST API
Serves the file manager frontend and provides filesystem access.
Run: python3 aether_files_server.py
API base: http://localhost:5998/api
"""

import os
import json
import shutil
import subprocess
import mimetypes
import http.server
import urllib.parse
from pathlib import Path
from datetime import datetime

PORT     = 5998
FRONTEND = Path(__file__).parent
HOME     = Path.home()


def get_drives():
    """Return list of all mounted drives with usage stats."""
    drives = []
    try:
        result = subprocess.run(
            ["lsblk", "-Jbpo", "NAME,FSTYPE,LABEL,MOUNTPOINT,SIZE"],
            capture_output=True, text=True
        )
        data = json.loads(result.stdout)
        for dev in data.get("blockdevices", []):
            _collect(dev, drives)
    except Exception:
        pass

    # Fallback: parse /proc/mounts
    if not drives:
        try:
            with open("/proc/mounts") as f:
                for line in f:
                    parts = line.split()
                    if len(parts) < 2:
                        continue
                    dev, mnt = parts[0], parts[1]
                    if mnt in ("/", "/boot", "/proc", "/sys", "/dev", "/run") or not dev.startswith("/dev"):
                        continue
                    try:
                        st = os.statvfs(mnt)
                        total = st.f_blocks * st.f_frsize
                        free  = st.f_bavail * st.f_frsize
                        used  = total - free
                        drives.append({
                            "name": os.path.basename(dev),
                            "label": os.path.basename(dev),
                            "fstype": "unknown",
                            "mountpoint": mnt,
                            "size_gb": round(total / 1e9, 2),
                            "used_gb": round(used / 1e9, 2),
                            "free_gb": round(free / 1e9, 2),
                        })
                    except Exception:
                        pass
        except Exception:
            pass
    return drives


def _collect(dev, out):
    mnt = dev.get("mountpoint")
    fs  = dev.get("fstype") or ""
    if mnt and fs and fs not in ("swap", "squashfs", "tmpfs", "devtmpfs"):
        try:
            st    = os.statvfs(mnt)
            total = st.f_blocks * st.f_frsize
            free  = st.f_bavail * st.f_frsize
            used  = total - free
            out.append({
                "name":       dev.get("name", ""),
                "label":      dev.get("label") or dev.get("name", ""),
                "fstype":     fs,
                "mountpoint": mnt,
                "size_gb":    round(total / 1e9, 2),
                "used_gb":    round(used  / 1e9, 2),
                "free_gb":    round(free  / 1e9, 2),
            })
        except Exception:
            pass
    for child in dev.get("children", []):
        _collect(child, out)


def list_dir(path):
    """List directory contents, returning file metadata."""
    try:
        p = Path(path).expanduser().resolve()
        items = []
        for entry in sorted(p.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
            try:
                stat = entry.stat()
                mtime = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M")
                items.append({
                    "name":     entry.name,
                    "type":     "folder" if entry.is_dir() else "file",
                    "path":     str(entry),
                    "size":     stat.st_size if entry.is_file() else None,
                    "modified": mtime,
                    "ext":      entry.suffix.lstrip(".").lower() if entry.is_file() else "",
                })
            except PermissionError:
                pass
        return items
    except Exception as e:
        return []


class FilesHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        pass  # Suppress default logging

    def send_json(self, data, code=200):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def send_file(self, filepath):
        try:
            mime, _ = mimetypes.guess_type(filepath)
            with open(filepath, "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-Type", mime or "application/octet-stream")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception:
            self.send_error(404)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        qs     = urllib.parse.parse_qs(parsed.query)
        path   = parsed.path

        # ── API ──
        if path == "/api/drives":
            self.send_json(get_drives())

        elif path == "/api/ls":
            dirpath = qs.get("path", [str(HOME)])[0]
            self.send_json(list_dir(dirpath))

        elif path == "/api/open":
            fp = qs.get("path", [""])[0]
            try:
                subprocess.Popen(["xdg-open", fp])
                self.send_json({"ok": True})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)

        # ── Static frontend ──
        elif path == "/" or path == "/index.html":
            self.send_file(FRONTEND / "index.html")
        elif path.endswith(".css"):
            self.send_file(FRONTEND / path.lstrip("/"))
        elif path.endswith(".js"):
            self.send_file(FRONTEND / path.lstrip("/"))
        else:
            self.send_error(404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        qs     = urllib.parse.parse_qs(parsed.query)
        path   = parsed.path

        if path == "/api/mkdir":
            dirpath = qs.get("path", [""])[0]
            try:
                Path(dirpath).mkdir(parents=True, exist_ok=True)
                self.send_json({"ok": True})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
        else:
            self.send_error(404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        qs     = urllib.parse.parse_qs(parsed.query)
        path   = parsed.path

        if path == "/api/delete":
            fp = qs.get("path", [""])[0]
            try:
                p = Path(fp)
                if p.is_dir():
                    shutil.rmtree(str(p))
                else:
                    p.unlink()
                self.send_json({"ok": True})
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
        else:
            self.send_error(404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin",  "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), FilesHandler)
    print(f"[AetherFiles] Server running at http://127.0.0.1:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[AetherFiles] Stopped.")
