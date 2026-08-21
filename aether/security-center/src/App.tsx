import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface FirewallState {
  is_active: boolean;
  zone: string;
  open_ports: string[];
}

export default function SecurityCenter() {
  const [state, setState] = useState<FirewallState | null>(null);
  const [statusMsg, setStatusMsg] = useState("Loading security profiles...");
  const [newPort, setNewPort] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await invoke<FirewallState>("get_firewall_status");
      setState(res);
      setStatusMsg(res.is_active ? "Firewall is enforcing active network rules." : "WARNING: Firewall is currently disabled.");
    } catch (e) {
      setStatusMsg(`Error checking firewall status: ${e}`);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggle = async () => {
    if (!state) return;
    setLoading(true);
    setStatusMsg("Applying firewall changes...");
    try {
      await invoke("toggle_firewall", { enable: !state.is_active });
      await fetchStatus();
    } catch (e) {
      setStatusMsg(`Toggle failed: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = async (preset: string) => {
    setLoading(true);
    setStatusMsg(`Applying ${preset.toUpperCase()} security profile...`);
    try {
      const msg = await invoke<string>("apply_preset", { preset });
      setStatusMsg(msg);
      await fetchStatus();
    } catch (e) {
      setStatusMsg(`Failed to apply profile: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPort = async () => {
    if (!newPort.trim()) return;
    const formattedPort = newPort.includes("/") ? newPort.trim() : `${newPort.trim()}/tcp`;
    setLoading(true);
    try {
      await invoke("configure_port", { action: "add", port: formattedPort });
      setNewPort("");
      await fetchStatus();
    } catch (e) {
      setStatusMsg(`Failed to open port: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePort = async (port: string) => {
    setLoading(true);
    try {
      await invoke("configure_port", { action: "remove", port });
      await fetchStatus();
    } catch (e) {
      setStatusMsg(`Failed to remove port: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 text-gray-100 bg-[#0a0a0f] min-h-screen font-sans select-none flex flex-col">
      {/* Header & Master Toggle */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <h1 className="text-2xl font-bold text-rose-400">Aether Security & Firewall Center</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">{statusMsg}</p>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50 ${
            state?.is_active
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500 hover:text-white shadow-rose-500/10"
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500 hover:text-gray-950 shadow-emerald-500/10"
          }`}
        >
          {state?.is_active ? "Disable Firewall" : "Enable Firewall"}
        </button>
      </div>

      {/* Security Presets */}
      <h2 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
        Active Security Profiles
      </h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Standard Preset */}
        <div
          onClick={() => handlePreset("standard")}
          className={`p-5 rounded-2xl cursor-pointer border transition-all ${
            state?.zone === "public" && state.open_ports.length === 0
              ? "bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              : "bg-gray-900/40 border-gray-800 hover:border-gray-700"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🌐</span>
            <h3 className="text-sm font-bold text-gray-100">Standard</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Default workstation security. Silently blocks unexpected incoming connections.
          </p>
        </div>

        {/* Developer Preset */}
        <div
          onClick={() => handlePreset("developer")}
          className={`p-5 rounded-2xl cursor-pointer border transition-all ${
            state?.open_ports.includes("3000/tcp") || state?.open_ports.includes("5173/tcp")
              ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              : "bg-gray-900/40 border-gray-800 hover:border-gray-700"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">💻</span>
            <h3 className="text-sm font-bold text-gray-100">Developer</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Opens development ports (80, 443, 3000, 5173, 8080) for full-stack programming.
          </p>
        </div>

        {/* Lockdown Preset */}
        <div
          onClick={() => handlePreset("lockdown")}
          className={`p-5 rounded-2xl cursor-pointer border transition-all ${
            state?.zone === "drop"
              ? "bg-rose-500/10 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
              : "bg-gray-900/40 border-gray-800 hover:border-gray-700"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🔒</span>
            <h3 className="text-sm font-bold text-gray-100">Lockdown (Shield)</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Maximum isolation. Drops all incoming traffic across all network interfaces.
          </p>
        </div>
      </div>

      {/* Port Management Box */}
      <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-2xl mb-6 shadow-md backdrop-blur-md">
        <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
          Custom Open Inbound Ports
        </label>
        <div className="flex gap-3 mb-4">
          <input
            className="bg-gray-950/80 border border-gray-700 px-4 py-2 rounded-xl flex-1 focus:border-rose-500 outline-none text-xs text-gray-200 placeholder-gray-500 font-mono"
            placeholder="e.g. 22/tcp or 8000/udp"
            value={newPort}
            onChange={(e) => setNewPort(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddPort()}
          />
          <button
            onClick={handleAddPort}
            disabled={loading}
            className="bg-rose-500/20 text-rose-400 border border-rose-500/50 px-5 py-2 rounded-xl hover:bg-rose-500 hover:text-white font-semibold text-xs transition active:scale-95 disabled:opacity-50"
          >
            Allow Port
          </button>
        </div>

        {/* Port Chips */}
        <div className="flex gap-2 flex-wrap min-h-[32px] items-center">
          {state?.open_ports && state.open_ports.length > 0 ? (
            state.open_ports.map((port) => (
              <span
                key={port}
                className="bg-gray-950 border border-gray-700 px-3 py-1 rounded-lg text-xs text-emerald-400 font-mono flex items-center gap-2"
              >
                {port}
                <button
                  onClick={() => handleRemovePort(port)}
                  className="text-gray-500 hover:text-rose-400 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-xs italic">No custom inbound ports currently exposed.</span>
          )}
        </div>
      </div>

      {/* Footer Zone Indicator */}
      <div className="mt-auto p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex justify-between items-center text-xs text-gray-400 font-mono">
        <span>DEFAULT ZONE: <strong className="text-rose-400">{state?.zone || "unknown"}</strong></span>
        <span>STATUS: <strong className={state?.is_active ? "text-emerald-400" : "text-rose-400"}>{state?.is_active ? "ACTIVE" : "INACTIVE"}</strong></span>
      </div>
    </div>
  );
}
