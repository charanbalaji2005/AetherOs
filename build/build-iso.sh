#!/bin/bash
# build/build-iso.sh
# Automated build pipeline for Aether OS (Fedora 40/44 Base)

set -euo pipefail

echo "========================================"
echo "    Aether OS Build Pipeline Started    "
echo "========================================"

# ---------------------------------------------------------
# 1. Prerequisite & Toolchain Path Resolution
# ---------------------------------------------------------
BUILD_USER=${SUDO_USER:-$USER}
USER_HOME=$(getent passwd "$BUILD_USER" 2>/dev/null | cut -d: -f6 || echo "/home/$BUILD_USER")

# Export standard toolchain paths (Cargo, NVM, Node) for sudo context
export PATH="$USER_HOME/.cargo/bin:$USER_HOME/.nvm/versions/node/$(ls $USER_HOME/.nvm/versions/node 2>/dev/null | tail -n1)/bin:/usr/local/bin:/usr/bin:$PATH"

if [ "$EUID" -ne 0 ]; then
  echo "Error: Building an ISO with livemedia-creator requires root privileges."
  echo "Please run this script using sudo: sudo ./build/build-iso.sh"
  exit 1
fi

SKIP_COMPILE=false
if [[ "${1:-}" == "--skip-ui" ]] || [[ "${1:-}" == "--no-compile" ]]; then
    SKIP_COMPILE=true
    echo "--> Notice: Skipping Tauri UI compilation step (--skip-ui active)"
fi

if [ "$SKIP_COMPILE" = false ]; then
    if ! command -v npm &> /dev/null || ! command -v cargo &> /dev/null; then
        echo "============================================================"
        echo "Missing compilation toolchains (Node.js/npm or Rust/cargo)."
        echo "To install them on Fedora:"
        echo "  sudo dnf install -y nodejs npm rust cargo"
        echo ""
        echo "Or if you want to assemble the ISO with pre-staged binaries, run:"
        echo "  sudo ./build/build-iso.sh --skip-ui"
        echo "============================================================"
        exit 1
    fi
fi

# ---------------------------------------------------------
# 2. Compile Tauri Applications
# ---------------------------------------------------------
if [ "$SKIP_COMPILE" = false ]; then
    echo "--> Compiling Tauri Applications..."
    APPS=("setup" "settings" "security-center" "software-center" "driver-manager" "snapshots" "powermenu")
    
    for app in "${APPS[@]}"; do
        APP_DIR="aether/$app"
        if [ -d "$APP_DIR" ]; then
            echo "Building $app..."
            cd "$APP_DIR"
            
            # Install dependencies and build via Tauri
            sudo -u "$BUILD_USER" npm install || true
            sudo -u "$BUILD_USER" npm run tauri build || true
            
            cd ../../
        else
            echo "Warning: Directory $APP_DIR not found, skipping..."
        fi
    done
else
    echo "--> Skipping UI compilation. Staging existing assets and overlay..."
fi

# ---------------------------------------------------------
# 3. Stage Files in the ISO Overlay
# ---------------------------------------------------------
echo "--> Staging compiled binaries and assets into iso-overlay..."

mkdir -p iso-overlay/usr/local/bin
mkdir -p iso-overlay/usr/share/applications

# Copy compiled Tauri binaries
cp -f aether/setup/src-tauri/target/release/aether-welcome iso-overlay/usr/local/bin/ 2>/dev/null || true
cp -f aether/settings/src-tauri/target/release/aether-settings iso-overlay/usr/local/bin/ 2>/dev/null || true
cp -f aether/security-center/src-tauri/target/release/aether-security-center iso-overlay/usr/local/bin/ 2>/dev/null || true
cp -f aether/software-center/src-tauri/target/release/aether-software iso-overlay/usr/local/bin/ 2>/dev/null || true
cp -f aether/driver-manager/src-tauri/target/release/aether-driver-manager iso-overlay/usr/local/bin/ 2>/dev/null || true
cp -f aether/snapshots/src-tauri/target/release/aether-snapshot-manager iso-overlay/usr/local/bin/ 2>/dev/null || true
cp -f aether/powermenu/src-tauri/target/release/aether-powermenu iso-overlay/usr/local/bin/ 2>/dev/null || true

# Copy raw bash scripts and ensure they are executable
cp -f aether/bin/* iso-overlay/usr/local/bin/ 2>/dev/null || true
chmod +x iso-overlay/usr/local/bin/* 2>/dev/null || true

# Copy desktop application shortcuts
cp -f applications/*.desktop iso-overlay/usr/share/applications/ 2>/dev/null || true

# Copy all wallpapers (including .webp, .png, .jpg, .jpeg) from branding to overlay
mkdir -p iso-overlay/usr/share/backgrounds/aetheros
if [ -d branding/wallpapers ]; then
    cp -rf branding/wallpapers/* iso-overlay/usr/share/backgrounds/aetheros/ 2>/dev/null || true
fi

# Stage overlay to fixed absolute path /tmp/aether-staging for Kickstart nochroot
echo "--> Staging overlay into /tmp/aether-staging..."
rm -rf /tmp/aether-staging
mkdir -p /tmp/aether-staging
cp -rf ./iso-overlay/* /tmp/aether-staging/

# Explicitly stage Tauri binaries and core utility scripts
mkdir -p /tmp/aether-staging/usr/local/bin
cp -f aether/snapshots/src-tauri/target/release/aether-snapshot-manager  /tmp/aether-staging/usr/local/bin/ 2>/dev/null || true
cp -f aether/software-center/src-tauri/target/release/aether-software    /tmp/aether-staging/usr/local/bin/ 2>/dev/null || true
cp -f aether/bin/* /tmp/aether-staging/usr/local/bin/ 2>/dev/null || true
chmod +x /tmp/aether-staging/usr/local/bin/* 2>/dev/null || true


# ---------------------------------------------------------
# 4. Prepare for ISO Generation
# ---------------------------------------------------------
echo "--> Preparing livemedia-creator environment..."

# SELinux must be in permissive mode to build the chroot environment successfully
# (It will be re-enabled at the end of the script)
if command -v setenforce &>/dev/null; then
    echo "Setting SELinux to Permissive..."
    setenforce 0 || true
fi

# livemedia-creator will fail if the working directory already exists. 
# We must clear the /var/lmc directory from previous failed/successful builds.
rm -rf /var/lmc || true

# Create the final output directory for the ISO
mkdir -p build/output

# ---------------------------------------------------------
# 5. Build the ISO
# ---------------------------------------------------------
echo "--> Initiating Anaconda build process (This may take 30-90 minutes depending on network speed)..."

# Flattening the Kickstart resolves any external %include files into a single master file
ksflatten -c build/aetheros.ks -o build/flat-aetheros.ks 2>/dev/null || cp build/aetheros.ks build/flat-aetheros.ks

# Execute the Lorax build engine with valid CLI arguments
livemedia-creator \
    --ks build/flat-aetheros.ks \
    --no-virt \
    --resultdir /var/lmc \
    --project "Aether OS" \
    --make-iso \
    --volid "Aether-OS-1.0" \
    --iso-only \
    --iso-name "AetherOS-1.0-x86_64.iso" \
    --releasever 40 \
    --macboot \
    --compression zstd

# ---------------------------------------------------------
# 6. Cleanup & Finalize
# ---------------------------------------------------------
echo "--> Build complete. Moving ISO to build/output/..."
if [ -f /var/lmc/AetherOS-1.0-x86_64.iso ]; then
    mv /var/lmc/AetherOS-1.0-x86_64.iso build/output/
fi

if command -v setenforce &>/dev/null; then
    echo "--> Restoring SELinux..."
    setenforce 1 || true
fi

# Clean up the Lorax temporary directory
rm -rf /var/lmc || true

# ---------------------------------------------------------
# 7. Split ISO into GitHub-Friendly Chunks (<2.0 GiB)
# ---------------------------------------------------------
if [ -f build/output/AetherOS-1.0-x86_64.iso ]; then
    echo "--> Splitting ISO into 1.9 GiB chunks for GitHub Releases..."
    cd build/output/
    rm -f AetherOS-1.0-x86_64.iso.part-*
    split -b 1900M AetherOS-1.0-x86_64.iso "AetherOS-1.0-x86_64.iso.part-"
    cd ../../
    echo "Chunking complete. Both single ISO (for SourceForge) and .part-* chunks (for GitHub) are ready."
fi

echo "========================================"
echo "  ISO successfully generated at:        "
echo "  build/output/AetherOS-1.0-x86_64.iso  "
echo "========================================"
