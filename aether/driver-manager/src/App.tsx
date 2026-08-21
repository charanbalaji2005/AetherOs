import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface HardwareState {
  nvidia: boolean;
  broadcom: boolean;
}

export default function DriverManager() {
  const [hardware, setHardware] = useState<HardwareState | null>(null);
  const [secureBoot, setSecureBoot] = useState(false);
  const [mokPassword, setMokPassword] = useState("");
  const [mokStaged, setMokStaged] = useState(false);
  const [status, setStatus] = useState("Scanning system PCI bus for hardware devices...");
  const [loading, setLoading] = useState(false);

  const scanHardware = () => {
    setLoading(true);
    setStatus("Scanning system PCI bus for hardware devices...");
    
    // Check Secure Boot
    invoke<boolean>("check_secure_boot")
      .then((sb) => setSecureBoot(sb))
      .catch(() => setSecureBoot(false));

    // Check Hardware
    invoke<HardwareState>("detect_hardware")
      .then((res) => {
        setHardware(res);
        setStatus("Hardware diagnostic scan complete.");
      })
      .catch((err) => setStatus(`Scan failed: ${err}`))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    scanHardware();
  }, []);

  const handleMokEnrollment = async () => {
    if (mokPassword.length < 4) {
      window.alert("Temporary enrollment password must be at least 4 characters.");
      return;
    }
    setLoading(true);
    setStatus("Generating Aether OS Machine Owner Key (MOK) and staging for UEFI enrollment...");
    try {
      await invoke("enroll_mok", { password: mokPassword });
      setMokStaged(true);
      setStatus("Secure Boot MOK Staged. You may now proceed with Nvidia driver installation.");
    } catch (e) {
      setStatus(`Key staging failed: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (target: string) => {
    setLoading(true);
    setStatus(`Installing ${target.toUpperCase()} drivers via RPM Fusion. This may take several minutes...`);
    try {
      const res = await invoke<string>("install_driver", { target });
      setStatus(res);
      window.alert("Driver installation completed successfully. Please reboot your system to activate.");
    } catch (e) {
      setStatus(`Driver installation failed: ${e}`);
    } finally {
      setLoading(false);
      scanHardware();
    }
  };

  return (
    <div className="p-8 text-gray-100 bg-[#0a0a0f] min-h-screen font-sans select-none flex flex-col">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-2xl font-bold text-orange-400">Aether Hardware & Driver Center</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Detects GPU, wireless chipsets, and proprietary firmware with Secure Boot MOK signing.
          </p>
        </div>
        <button
          onClick={scanHardware}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-orange-400 border border-gray-800 px-3 py-1.5 rounded-lg bg-gray-900/60 transition disabled:opacity-50"
        >
          ↻ Rescan Hardware
        </button>
      </div>

      {/* Hardware Devices List */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {/* SECURE BOOT MOK WARNING & STAGING WIDGET */}
        {hardware?.nvidia && secureBoot && !mokStaged && (
          <div className="bg-amber-500/10 border border-amber-500/50 p-6 rounded-2xl shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⚠️</span>
              <h2 className="text-lg font-bold text-amber-400">Secure Boot is Enabled</h2>
            </div>
            <p className="text-xs text-gray-300 mb-4">
              To load Nvidia kernel modules under Secure Boot, we must enroll a Machine Owner Key (MOK) into your motherboard's UEFI firmware.
            </p>
            <div className="bg-black/60 p-4 rounded-xl text-xs text-gray-300 mb-4 font-mono border border-amber-500/20 leading-relaxed">
              <span className="text-amber-400 font-bold">ON REBOOT:</span> You will see a blue UEFI screen (MokManager). Select <span className="text-white font-bold">"Enroll MOK"</span> → <span className="text-white font-bold">"Continue"</span> → <span className="text-white font-bold">"Yes"</span>, then enter the temporary password below.
            </div>
            <div className="flex gap-3">
              <input
                type="password"
                className="bg-gray-950/80 border border-gray-700 px-4 py-2.5 rounded-xl flex-1 outline-none focus:border-amber-500 text-sm text-gray-200 placeholder-gray-500"
                placeholder="Create a temporary enrollment password..."
                value={mokPassword}
                onChange={(e) => setMokPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMokEnrollment()}
              />
              <button
                onClick={handleMokEnrollment}
                disabled={loading}
                className="bg-amber-500 text-gray-950 font-bold px-6 py-2.5 rounded-xl hover:bg-amber-400 transition text-sm shadow-md active:scale-95 disabled:opacity-50"
              >
                {loading ? "Staging..." : "Stage MOK Key"}
              </button>
            </div>
          </div>
        )}

        {/* NVIDIA INSTALL WIDGET */}
        {hardware?.nvidia && (!secureBoot || mokStaged) && (
          <div className="flex justify-between items-center bg-gray-900/50 p-6 rounded-2xl border border-orange-500/40 shadow-lg backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🎮</span>
                <h2 className="text-lg font-bold text-gray-100">NVIDIA Graphics Processing Unit</h2>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Requires proprietary <code className="text-orange-400 bg-gray-950 px-1.5 py-0.5 rounded">akmod-nvidia</code> kernel modules and CUDA runtime for Wayland hardware acceleration.
              </p>
              {mokStaged && (
                <span className="inline-block mt-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  ✓ MOK Key Staged for Secure Boot
                </span>
              )}
            </div>
            <button
              onClick={() => handleInstall("nvidia")}
              disabled={loading}
              className="bg-orange-500/20 text-orange-400 border border-orange-500/60 px-5 py-2 rounded-xl hover:bg-orange-500 hover:text-gray-950 font-semibold text-xs transition shadow-md active:scale-95 disabled:opacity-50"
            >
              {loading ? "Installing..." : "Install Nvidia Driver"}
            </button>
          </div>
        )}

        {/* BROADCOM WI-FI WIDGET */}
        {hardware?.broadcom && (
          <div className="flex justify-between items-center bg-gray-900/50 p-6 rounded-2xl border border-blue-500/40 shadow-lg backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📡</span>
                <h2 className="text-lg font-bold text-gray-100">Broadcom Wireless Network Adapter</h2>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Requires proprietary <code className="text-blue-400 bg-gray-950 px-1.5 py-0.5 rounded">broadcom-wl</code> kernel modules for high-speed Wi-Fi and Bluetooth.
              </p>
            </div>
            <button
              onClick={() => handleInstall("broadcom")}
              disabled={loading}
              className="bg-blue-500/20 text-blue-400 border border-blue-500/60 px-5 py-2 rounded-xl hover:bg-blue-500 hover:text-white font-semibold text-xs transition shadow-md active:scale-95 disabled:opacity-50"
            >
              {loading ? "Installing..." : "Install Broadcom Wi-Fi"}
            </button>
          </div>
        )}

        {/* NO PROPRIETARY HARDWARE DETECTED */}
        {hardware && !hardware.nvidia && !hardware.broadcom && (
          <div className="p-10 text-center border border-dashed border-gray-800 rounded-2xl bg-gray-900/20">
            <span className="text-3xl block mb-2">✨</span>
            <p className="text-gray-300 font-semibold text-sm">
              All Hardware Natively Supported
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Your system uses fully open-source Mesa / AMD / Intel drivers with kernel-level Wayland acceleration.
            </p>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="mt-4 p-3 rounded-xl bg-gray-900/80 border border-gray-800 text-xs text-orange-300">
        {status}
      </div>
    </div>
  );
}
