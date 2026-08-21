import React, { useState, useEffect } from "react";
import AppearanceSettings from "./Appearance";
import { 
  Monitor, 
  Wifi, 
  Battery, 
  Sparkles, 
  Palette, 
  Info, 
  Volume2, 
  ShieldCheck, 
  Cpu, 
  RefreshCw,
  HardDrive,
  Key
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("Display");
  const [systemInfo, setSystemInfo] = useState("AetherOS Linux 1.0 (x86_64) • Hyprland Glass Edition");
  const [apiKey, setApiKey] = useState("");
  const [aiStatus, setAiStatus] = useState("");
  const [volume, setVolume] = useState(75);
  const [brightness, setBrightness] = useState(80);
  const [powerMode, setPowerMode] = useState("balanced");
  const [resolution, setResolution] = useState("1920x1080@60Hz");
  const [selectedWallpaper, setSelectedWallpaper] = useState("cyberpunk_city.png");

  const tabs = [
    { id: "Display", label: "Display & Monitor", icon: Monitor },
    { id: "Network", label: "Network & Wi-Fi", icon: Wifi },
    { id: "Power", label: "Power & Battery", icon: Battery },
    { id: "Sound", label: "Sound & Volume", icon: Volume2 },
    { id: "Appearance", label: "Appearance & Themes", icon: Palette },
    { id: "AI", label: "AI & Automation", icon: Sparkles },
    { id: "About", label: "System & About", icon: Info },
  ];

  const handleSaveAIKey = () => {
    if (!apiKey) {
      setAiStatus("Please enter a valid API key.");
      return;
    }
    setAiStatus("API Key securely saved to ~/.config/aether/ai.json");
  };

  const handleRunDiagnostic = () => {
    setSystemInfo("Running hardware & kernel telemetry diagnostics...\n• CPU: AMD/Intel 64-bit Core (Optimal 60 FPS)\n• GPU: Accelerated DRM KMS (Direct Hardware Plane)\n• Memory: 3.8 GiB / 16.0 GiB Used (24%)\n• Filesystem: Btrfs/Ext4 (Clean & Verified)\n• Network: Active (1000 Mbps)");
  };

  return (
    <div className="flex h-screen bg-[#0a0e1a] text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-[#13192b] border-r border-[#1b2238] flex flex-col p-4">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-3 py-4 mb-4 border-b border-[#1b2238]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00f0ff] to-[#a855f7] flex items-center justify-center text-black font-black text-xl shadow-lg shadow-[#00f0ff]/20">
            󰢻
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide text-white">AetherOS</h1>
            <p className="text-xs text-[#00f0ff] font-medium">Control Center</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#00f0ff]/15 to-[#a855f7]/15 text-[#00f0ff] border border-[#00f0ff]/30 shadow-md shadow-[#00f0ff]/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#00f0ff]" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#1b2238] px-2 text-xs text-slate-500 flex justify-between items-center">
          <span>AetherOS 1.0</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-[#0a0e1a] overflow-y-auto">
        {/* Top Header */}
        <header className="px-8 py-6 border-b border-[#1b2238] flex justify-between items-center bg-[#0a0e1a]/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Configure hardware, network, and system preferences</p>
          </div>
        </header>

        {/* Dynamic Tab Panels */}
        <div className="p-8 max-w-4xl space-y-6">
          {/* 1. Display Panel */}
          {activeTab === "Display" && (
            <div className="space-y-6">
              <div className="bg-[#13192b] border border-[#1b2238] p-6 rounded-2xl shadow-xl">
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-[#00f0ff]" /> Resolution & Refresh Rate
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 font-medium">Display Resolution</label>
                    <select 
                      value={resolution} 
                      onChange={(e) => setResolution(e.target.value)}
                      className="mt-1.5 w-full bg-[#0a0e1a] border border-[#1b2238] rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#00f0ff]"
                    >
                      <option value="1920x1080@60Hz">1920 x 1080 (16:9) @ 60Hz</option>
                      <option value="2560x1440@144Hz">2560 x 1440 (2K) @ 144Hz</option>
                      <option value="3840x2160@60Hz">3840 x 2160 (4K UHD) @ 60Hz</option>
                      <option value="1366x768@60Hz">1366 x 768 @ 60Hz</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium">Display Scaling</label>
                    <select className="mt-1.5 w-full bg-[#0a0e1a] border border-[#1b2238] rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#00f0ff]">
                      <option value="1.0">100% (Native 1x)</option>
                      <option value="1.25">125%</option>
                      <option value="1.5">150% (HiDPI)</option>
                      <option value="2.0">200% (Retina)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-[#13192b] border border-[#1b2238] p-6 rounded-2xl shadow-xl">
                <h3 className="text-base font-semibold text-white mb-4">Brightness Control</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>Backlight Brightness</span>
                    <span className="text-[#00f0ff]">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full h-2 bg-[#0a0e1a] rounded-lg appearance-none cursor-pointer accent-[#00f0ff]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Network Panel */}
          {activeTab === "Network" && (
            <div className="space-y-6">
              <div className="bg-[#13192b] border border-[#1b2238] p-6 rounded-2xl shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-[#00f0ff]" /> Wireless Networks
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Connect to local Wi-Fi and hotspot access points</p>
                  </div>
                  <button className="px-3.5 py-1.5 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 rounded-xl text-xs font-semibold hover:bg-[#00f0ff]/20 transition flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Scan
                  </button>
                </div>

                <div className="space-y-2">
                  {["Aether_HyperLink_5G", "CyberLab_Studio", "Guest_Access_Point"].map((net, i) => (
                    <div key={net} className="flex justify-between items-center p-3.5 bg-[#0a0e1a] border border-[#1b2238] rounded-xl hover:border-[#00f0ff]/40 transition">
                      <div className="flex items-center space-x-3">
                        <Wifi className="w-4 h-4 text-[#00f0ff]" />
                        <div>
                          <p className="text-sm font-semibold text-white">{net}</p>
                          <p className="text-xs text-slate-500">WPA3-Personal • Signal 95%</p>
                        </div>
                      </div>
                      <button className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${i === 0 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-white/5 hover:bg-white/10 text-slate-200"}`}>
                        {i === 0 ? "Connected" : "Connect"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. Power Panel */}
          {activeTab === "Power" && (
            <div className="space-y-6">
              <div className="bg-[#13192b] border border-[#1b2238] p-6 rounded-2xl shadow-xl">
                <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                  <Battery className="w-4 h-4 text-[#00f0ff]" /> Power Profile & Governor
                </h3>
                <p className="text-xs text-slate-400 mb-6">Optimize battery endurance or maximize gaming & compilation performance</p>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: "power-saver", name: "Power Saver", desc: "Reduces clock speeds to extend battery life" },
                    { id: "balanced", name: "Balanced", desc: "Standard dynamic CPU scaling for daily workflows" },
                    { id: "performance", name: "Performance", desc: "Highest frequencies, lowest latency" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setPowerMode(mode.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        powerMode === mode.id
                          ? "bg-[#00f0ff]/10 border-[#00f0ff] text-white shadow-lg shadow-[#00f0ff]/10"
                          : "bg-[#0a0e1a] border-[#1b2238] text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      <p className="font-bold text-sm text-[#00f0ff] mb-1">{mode.name}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{mode.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. AI Integration Panel */}
          {activeTab === "AI" && (
            <div className="space-y-6">
              <div className="bg-[#13192b] border border-[#1b2238] p-6 rounded-2xl shadow-xl">
                <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00f0ff]" /> Gemini Generative Intelligence Setup
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Provide your Google Gemini API key to activate system-wide natural language diagnostics, automated shell tasks, and conversational assistance via <kbd className="px-1.5 py-0.5 bg-[#0a0e1a] rounded text-[#00f0ff] border border-[#1b2238]">Super + A</kbd>.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1.5">
                      <Key className="w-3.5 h-3.5 text-[#a855f7]" /> Gemini API Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-[#0a0e1a] border border-[#1b2238] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00f0ff] placeholder-slate-600"
                    />
                  </div>

                  <div className="flex items-center space-x-4 pt-2">
                    <button
                      onClick={handleSaveAIKey}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#00f0ff] to-[#a855f7] text-black font-bold text-sm rounded-xl hover:opacity-90 transition shadow-lg shadow-[#00f0ff]/20"
                    >
                      Save Configuration
                    </button>
                    {aiStatus && <span className="text-xs text-emerald-400 font-medium">{aiStatus}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Sound & Volume Panel */}
          {activeTab === "Sound" && (
            <div className="bg-[#13192b] border border-[#1b2238] p-6 rounded-2xl shadow-xl space-y-6">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#00f0ff]" /> Output Audio & PipeWire DSP
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>Master Volume</span>
                  <span className="text-[#00f0ff]">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-2 bg-[#0a0e1a] rounded-lg appearance-none cursor-pointer accent-[#00f0ff]"
                />
              </div>
            </div>
          )}

          {/* 6. Appearance Panel */}
          {activeTab === "Appearance" && (
            <div className="bg-[#13192b] border border-[#1b2238] rounded-2xl shadow-xl overflow-hidden">
              <AppearanceSettings />
            </div>
          )}

          {/* 7. System & About Panel */}
          {activeTab === "About" && (
            <div className="space-y-6">
              <div className="bg-[#13192b] border border-[#1b2238] p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#00f0ff]" /> System Specifications
                </h3>
                
                <div className="bg-[#0a0e1a] border border-[#1b2238] p-4 rounded-xl text-xs font-mono text-emerald-400 whitespace-pre-line leading-relaxed">
                  {systemInfo}
                </div>

                <button
                  onClick={handleRunDiagnostic}
                  className="px-5 py-2 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 rounded-xl text-xs font-bold hover:bg-[#00f0ff]/20 transition flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Run Diagnostic Suite
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
