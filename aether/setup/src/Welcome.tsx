import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface WifiNetwork {
  ssid: string;
  signal: string;
  security: string;
}

export default function WelcomeWizard() {
  const [step, setStep] = useState(1);
  
  // Step 1: Wi-Fi State
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [selectedSsid, setSelectedSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiStatus, setWifiStatus] = useState("");
  const [scanning, setScanning] = useState(false);

  // Step 2: Timezone & Locale State
  const [timezones, setTimezones] = useState<string[]>([]);
  const [selectedTz, setSelectedTz] = useState("UTC");
  const [tzSearch, setTzSearch] = useState("");
  const [selectedLang, setSelectedLang] = useState("en_US.UTF-8");
  const [selectedCountry, setSelectedCountry] = useState("us");

  // Step 3: Identity State
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hostname, setHostname] = useState("aether-station");

  // Step 4: Finalizing
  const [finishing, setFinishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingText, setLoadingText] = useState("Securing credentials...");

  useEffect(() => {
    // Scan Wi-Fi & Load Worldwide IANA Timezones dynamically
    handleScanWifi();

    try {
      if (typeof Intl !== "undefined" && typeof (Intl as any).supportedValuesOf === "function") {
        const ianaTzs: string[] = (Intl as any).supportedValuesOf("timeZone");
        setTimezones(ianaTzs);
        const autoZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (autoZone && ianaTzs.includes(autoZone)) {
          setSelectedTz(autoZone);
        }
      } else {
        throw new Error("Intl fallback");
      }
    } catch {
      invoke<string[]>("get_timezones")
        .then((res) => {
          setTimezones(res);
          if (res.includes("America/New_York")) setSelectedTz("America/New_York");
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (!finishing) return;
    
    // Cycle through system-level status messages
    const messages = [
      "Generating cryptographic keys...",
      "Configuring local timezone...",
      "Staging Secure Boot MOK signing keys...",
      "Initializing Wayland compositor...",
      "Rebooting system..."
    ];
    
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < messages.length) setLoadingText(messages[i]);
    }, 1500);

    return () => clearInterval(interval);
  }, [finishing]);

  const handleScanWifi = async () => {
    setScanning(true);
    setWifiStatus("Scanning for wireless networks...");
    try {
      const res = await invoke<WifiNetwork[]>("scan_wifi");
      setNetworks(res);
      setWifiStatus(res.length ? "Select a network to connect" : "No wireless networks found.");
    } catch (e) {
      setWifiStatus("Network scan completed (Wired / Ethernet may be active).");
    } finally {
      setScanning(false);
    }
  };

  const handleConnectWifi = async () => {
    if (!selectedSsid) return;
    setWifiStatus(`Connecting to ${selectedSsid}...`);
    try {
      await invoke("connect_wifi", { ssid: selectedSsid, password: wifiPassword });
      setWifiStatus(`Connected to ${selectedSsid}!`);
    } catch (e) {
      setWifiStatus(`Connection failed: ${e}`);
    }
  };

  const handleFinishSetup = async () => {
    if (!username || !password) {
      setErrorMessage("Username and password are required.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setFinishing(true);
    setErrorMessage("");

    try {
      await invoke("complete_setup", {
        payload: {
          username: username.toLowerCase().replace(/\s+/g, ""),
          password,
          full_name: fullName || username,
          timezone: selectedTz,
          hostname,
          language: selectedLang,
          country: selectedCountry,
        },
      });

      // Stage Secure Boot MOK key for proprietary Nvidia modules
      await invoke("stage_secure_boot_key").catch(() => {});

      // Finalize setup, remove autologin loop, and trigger graceful reboot
      await invoke("finalize_setup_and_reboot");
    } catch (e) {
      setFinishing(false);
      setErrorMessage(`Setup error: ${e}`);
    }
  };

  const filteredTz = timezones.filter((tz) =>
    tz.toLowerCase().includes(tzSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-950/95 text-white font-sans select-none backdrop-blur-2xl">
      <div className="w-[850px] h-[580px] bg-gray-900/90 border border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Top Navigation & Branding Header */}
        <div className="px-8 py-5 border-b border-gray-800 flex justify-between items-center bg-gray-950/40">
          <div>
            <span className="text-xs uppercase tracking-widest text-orange-400 font-bold">Aether Initial Setup</span>
            <h1 className="text-xl font-bold tracking-wide">
              {step === 1 && "Network Connection"}
              {step === 2 && "Region & Timezone"}
              {step === 3 && "User Account & Security"}
              {step === 4 && "Ready to Launch"}
            </h1>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  step === s ? "bg-orange-500 w-8" : step > s ? "bg-rose-500/60" : "bg-gray-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Body */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* STEP 1: WI-FI */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400">Connect to a local network or proceed with offline setup.</p>
                <button
                  onClick={handleScanWifi}
                  disabled={scanning}
                  className="text-xs text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-lg hover:bg-orange-500/10"
                >
                  {scanning ? "Scanning..." : "Rescan"}
                </button>
              </div>

              <div className="h-48 overflow-y-auto border border-gray-800 rounded-xl bg-gray-950/50 p-2 space-y-1">
                {networks.map((net, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedSsid(String(net.ssid))}
                    className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition ${
                      selectedSsid === net.ssid ? "bg-orange-500/20 border border-orange-500/40" : "hover:bg-gray-800/60"
                    }`}
                  >
                    <span className="font-mono text-sm">{net.ssid}</span>
                    <span className="text-xs text-gray-500">{net.security} • {net.signal}%</span>
                  </div>
                ))}
              </div>

              {selectedSsid && (
                <div className="flex gap-3 pt-2">
                  <input
                    type="password"
                    placeholder="Wi-Fi Password..."
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="bg-gray-950 border border-gray-800 px-4 py-2 rounded-xl flex-1 focus:border-orange-500 outline-none text-sm"
                  />
                  <button
                    onClick={handleConnectWifi}
                    className="bg-orange-500 text-gray-950 font-bold px-6 py-2 rounded-xl hover:bg-orange-400 transition text-sm"
                  >
                    Connect
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 italic">{wifiStatus}</p>
            </div>
          )}

          {/* STEP 2: TIMEZONE & REGION */}
          {step === 2 && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search Timezone (e.g. New_York, London, Tokyo)..."
                value={tzSearch}
                onChange={(e) => setTzSearch(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 px-4 py-2.5 rounded-xl focus:border-orange-500 outline-none text-sm"
              />

              <div className="h-64 overflow-y-auto border border-gray-800 rounded-xl bg-gray-950/50 p-2 grid grid-cols-2 gap-2">
                {filteredTz.slice(0, 40).map((tz) => (
                  <div
                    key={tz}
                    onClick={() => setSelectedTz(tz)}
                    className={`p-3 rounded-lg cursor-pointer text-sm font-mono transition ${
                      selectedTz === tz ? "bg-orange-500/20 border border-orange-500/40 text-orange-300" : "hover:bg-gray-800/60 text-gray-300"
                    }`}
                  >
                    {tz}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">Selected Timezone: <span className="text-orange-400 font-mono">{selectedTz}</span></p>
            </div>
          )}

          {/* STEP 3: USER PROFILE */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Mercer"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (!username) setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""));
                  }}
                  className="w-full bg-gray-950 border border-gray-800 px-4 py-2 rounded-xl focus:border-orange-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Username (sudo user)</label>
                <input
                  type="text"
                  placeholder="e.g. alex"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 px-4 py-2 rounded-xl focus:border-orange-500 outline-none text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 px-4 py-2 rounded-xl focus:border-orange-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 px-4 py-2 rounded-xl focus:border-orange-500 outline-none text-sm"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Device Hostname</label>
                <input
                  type="text"
                  placeholder="aether-station"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 px-4 py-2 rounded-xl focus:border-orange-500 outline-none text-sm font-mono"
                />
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-3 font-mono text-sm">
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-500">USER ACCOUNT</span>
                  <span className="text-orange-400">{username} ({fullName || "User"})</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-500">TIMEZONE</span>
                  <span className="text-gray-300">{selectedTz}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">HOSTNAME</span>
                  <span className="text-gray-300">{hostname}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Clicking "Complete & Launch" will apply configuration, lock the administrator credentials, and initialize the desktop.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Bottom Actions Footer */}
        <div className="px-8 py-4 border-t border-gray-800 bg-gray-950/40 flex justify-between items-center">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || finishing}
            className={`px-5 py-2 rounded-xl text-sm border transition ${
              step === 1 ? "opacity-0 pointer-events-none" : "border-gray-700 text-gray-300 hover:bg-gray-800"
            }`}
          >
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              className="bg-orange-500 text-gray-950 font-bold px-6 py-2 rounded-xl hover:bg-orange-400 transition text-sm shadow-lg shadow-orange-500/20"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleFinishSetup}
              disabled={finishing}
              className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold px-8 py-2 rounded-xl hover:opacity-90 transition text-sm shadow-lg shadow-orange-500/20"
            >
              {finishing ? "Applying Configuration..." : "Complete & Launch"}
            </button>
          )}
        </div>

        {/* FULLSCREEN HOLOGRAPHIC LOADING OVERLAY */}
        {finishing && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950/80 backdrop-blur-xl transition-all duration-500">
            {/* Cyberpunk Concentric Spinner */}
            <div className="relative w-32 h-32 mb-8">
              {/* Outer Orange Ring */}
              <div className="absolute inset-0 border-t-2 border-orange-500 rounded-full animate-spin"></div>
              {/* Middle Rose Ring (Spins backward) */}
              <div className="absolute inset-3 border-r-2 border-rose-500 rounded-full animate-[spin_1.5s_reverse_infinite]"></div>
              {/* Inner Blue Ring */}
              <div className="absolute inset-6 border-b-2 border-blue-500 rounded-full animate-spin"></div>
              {/* Center static core */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-orange-400 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse"></div>
              </div>
            </div>

            {/* Glowing Title */}
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400 mb-3 tracking-widest uppercase">
              Initializing Aether
            </h2>
            
            {/* Cycling Status Text */}
            <p className="text-sm text-gray-400 font-mono animate-pulse">
              {loadingText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
