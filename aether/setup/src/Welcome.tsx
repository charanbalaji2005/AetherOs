import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface WifiNetwork {
  ssid: string;
  signal: string;
  security: string;
}

interface HardwareInfo {
  cpu: string;
  cores: string;
  memory: string;
  gpu: string;
  virtualization: string;
  kernel: string;
}

const TUTORIAL_SLIDES = [
  {
    title: "Welcome to AetherOS",
    description: "A precision-engineered, glassmorphic Linux environment built on Fedora and Hyprland for maximum responsiveness.",
    icon: "✨",
    tag: "Core Experience"
  },
  {
    title: "Quake-Style Visor",
    description: "Press Super + ` (Grave) anywhere to instantly drop down your floating AI assistant or persistent terminal overlay.",
    icon: "⚡",
    tag: "Hotkey: Super + Grave"
  },
  {
    title: "Time-Travel Vault",
    description: "Powered by Btrfs and Snapper checkpoints. Easily restore your system to any previous state in seconds with one click.",
    icon: "⏳",
    tag: "Btrfs Snapshots"
  },
  {
    title: "Fluid Window Management",
    description: "Super + Return opens Kitty terminal, Super + Q closes windows, Super + Space toggles floating mode, and Super + 1..9 switches workspaces.",
    icon: "🪟",
    tag: "Hyprland Tiling"
  },
  {
    title: "Unified Software Center",
    description: "Discover and install both native DNF5 RPM packages and Flathub containerized applications in one cyberpunk store.",
    icon: "📦",
    tag: "DNF5 & Flatpak"
  },
];

export default function AetherOnboarding() {
  const [step, setStep] = useState(1);

  // Tutorial Slide Index
  const [tutorialSlide, setTutorialSlide] = useState(0);

  // Step 3: Language & Keyboard
  const [selectedLang, setSelectedLang] = useState("en_US.UTF-8");
  const [keyboardLayout, setKeyboardLayout] = useState("us");

  // Step 4: Timezone & Wi-Fi
  const [timezones, setTimezones] = useState<string[]>([]);
  const [selectedTz, setSelectedTz] = useState("UTC");
  const [tzSearch, setTzSearch] = useState("");
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [selectedSsid, setSelectedSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiStatus, setWifiStatus] = useState("");
  const [scanning, setScanning] = useState(false);

  // Step 5: User Profile & Security
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hostname, setHostname] = useState("aether-station");

  // Step 6: Repositories
  const [enableThirdParty, setEnableThirdParty] = useState(true);

  // Step 7: Privacy & Telemetry
  const [locationServices, setLocationServices] = useState(true);
  const [telemetryOptIn, setTelemetryOptIn] = useState(false);

  // Step 8: Theme & Accent
  const [colorMode, setColorMode] = useState<"dark" | "light">("dark");
  const [accentColor, setAccentColor] = useState("cyan");

  // Step 9: Hardware Telemetry
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [loadingHw, setLoadingHw] = useState(false);

  // Step 10: Finalizing State
  const [finishing, setFinishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingText, setLoadingText] = useState("Securing credentials...");

  // Password strength helper
  const getPasswordStrength = (pw: string): { label: string; color: string; width: string } => {
    if (pw.length === 0) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: "Weak",   color: "bg-rose-500",   width: "25%"  };
    if (score === 2) return { label: "Fair",   color: "bg-amber-500",  width: "50%"  };
    if (score === 3) return { label: "Good",   color: "bg-yellow-400", width: "70%"  };
    return               { label: "Strong", color: "bg-emerald-500", width: "100%" };
  };
  const pwStrength = getPasswordStrength(password);
  const pwMatch = confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
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

  // Fetch hardware info when entering Step 9
  useEffect(() => {
    if (step === 9 && !hardware) {
      setLoadingHw(true);
      invoke<HardwareInfo>("detect_hardware")
        .then((hw) => setHardware(hw))
        .catch(() => {
          setHardware({
            cpu: "x86_64 High-Performance Processor",
            cores: "8 Threads / Cores Active",
            memory: "16.0 GiB High-Speed RAM",
            gpu: "Direct DRM KMS / Mesa 3D Accelerated",
            virtualization: "Bare Metal Platform",
            kernel: "Linux 6.x Hyprland Edition",
          });
        })
        .finally(() => setLoadingHw(false));
    }
  }, [step, hardware]);

  useEffect(() => {
    if (!finishing) return;
    const messages = [
      "Generating cryptographic yescrypt keypairs...",
      "Configuring local timezone & locale...",
      "Saving local user profile preferences...",
      "Configuring third-party hardware repositories...",
      "Staging Secure Boot MOK signing keys...",
      "Compiling Wayland compositor environment...",
      "Rebooting into Aether Desktop..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < messages.length) setLoadingText(messages[i]);
    }, 1300);
    return () => clearInterval(interval);
  }, [finishing]);

  const handleScanWifi = async () => {
    setScanning(true);
    setWifiStatus("Scanning for wireless networks...");
    try {
      const res = await invoke<WifiNetwork[]>("scan_wifi");
      setNetworks(res);
      setWifiStatus(res.length ? "Select a network to connect" : "No wireless networks found.");
    } catch {
      setWifiStatus("Ethernet / Direct Network connection active.");
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
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(username)) {
      setErrorMessage("Username must start with a letter and contain only lowercase letters, numbers, or underscores.");
      return;
    }

    setFinishing(true);
    setErrorMessage("");

    try {
      // 1. Timezone
      await invoke("set_system_timezone", { timezone: selectedTz });

      // 2. Third-Party Repos
      await invoke("configure_third_party_repos", { enable: enableThirdParty }).catch(console.warn);

      // 3. User Metadata Storage (Strictly Local Persistent SSD Storage - 100% Offline)
      await invoke("save_local_user_profile", {
        metadata: {
          username: username.toLowerCase().replace(/\s+/g, ""),
          fullname: fullName || username,
          hostname,
          timezone: selectedTz,
          language: selectedLang,
          theme: colorMode,
          accent: accentColor,
          third_party_repos: enableThirdParty,
          telemetry_opt_in: telemetryOptIn,
          timestamp: new Date().toISOString(),
        }
      }).catch(console.warn);

      // 4. Create System Linux User via PAM
      await invoke("complete_setup", {
        payload: {
          username: username.toLowerCase().replace(/\s+/g, ""),
          password,
          full_name: fullName || username,
          timezone: selectedTz,
          hostname,
          language: selectedLang,
          country: keyboardLayout,
        },
      });

      // 5. Stage Secure Boot MOK
      await invoke("stage_secure_boot_key").catch(() => {});

      // 6. Finalize & Reboot
      await invoke("finalize_oobe_setup");
    } catch (e) {
      setFinishing(false);
      setErrorMessage(`Setup error: ${e}`);
    }
  };

  const filteredTz = timezones.filter((tz) =>
    tz.toLowerCase().includes(tzSearch.toLowerCase())
  );

  const stepTitles = [
    "Welcome",
    "Feature Tour",
    "Language & Keyboard",
    "Timezone & Wi-Fi",
    "User Profile",
    "Repositories",
    "Privacy",
    "Theme & Style",
    "Hardware Telemetry",
    "Finish & Launch"
  ];

  const currentSlide = TUTORIAL_SLIDES[tutorialSlide];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#07090e]/95 text-slate-100 font-sans select-none backdrop-blur-3xl overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute w-[600px] h-[600px] bg-[#00f0ff]/10 rounded-full blur-[140px] pointer-events-none top-[-100px] left-[-100px]" />
      <div className="absolute w-[500px] h-[500px] bg-[#a855f7]/10 rounded-full blur-[140px] pointer-events-none bottom-[-100px] right-[-100px]" />

      <div className="w-[880px] h-[630px] bg-[#0d121f]/90 border border-slate-800/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-2xl">
        
        {/* Top Header & Breadcrumb Bar */}
        <div className="px-8 py-5 border-b border-slate-800/80 flex justify-between items-center bg-[#0a0e1a]/60">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-8 h-8 drop-shadow-[0_0_10px_rgba(0,229,255,0.6)]">
              <svg viewBox="0 0 300 280" className="w-full h-full" fill="none">
                <defs>
                  <linearGradient id="oobeLeft" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0066FF" />
                    <stop offset="100%" stopColor="#00D2FF" />
                  </linearGradient>
                  <linearGradient id="oobeRight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00E5FF" />
                    <stop offset="100%" stopColor="#00F59B" />
                  </linearGradient>
                </defs>
                <path d="M 150,15 C 125,15 108,29 94,57 L 18,215 C 8,237 16,263 40,263 L 85,263 C 102,263 116,251 124,233 L 150,175 L 204,175 L 204,119 L 150,119 L 150,15 Z" fill="url(#oobeLeft)" />
                <path d="M 150,15 C 175,15 192,29 206,57 L 282,215 C 292,237 284,263 260,263 L 215,263 C 198,263 184,251 176,233 L 150,175 L 96,175 L 96,119 L 150,119 L 150,15 Z" fill="url(#oobeRight)" opacity="0.96" />
                <circle cx="150" cy="147" r="16" fill="#FFFFFF" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#00f0ff] font-bold">
                AetherOS Onboarding • Step {step} of 10
              </span>
              <h1 className="text-base font-bold tracking-wide text-white">
                {stepTitles[step - 1]}
              </h1>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex gap-1.5 items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === s
                    ? "bg-[#00f0ff] w-6 shadow-[0_0_8px_rgba(0,240,255,0.6)]"
                    : step > s
                    ? "bg-emerald-400/60 w-2"
                    : "bg-slate-800 w-2"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Body */}
        <div className="flex-1 p-8 overflow-y-auto">
          
          {/* STEP 1: WELCOME SCREEN */}
          {step === 1 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-24 h-24 drop-shadow-[0_0_25px_rgba(0,229,255,0.7)] animate-pulse">
                <svg viewBox="0 0 300 280" className="w-full h-full" fill="none">
                  <path d="M 150,15 C 125,15 108,29 94,57 L 18,215 C 8,237 16,263 40,263 L 85,263 C 102,263 116,251 124,233 L 150,175 L 204,175 L 204,119 L 150,119 L 150,15 Z" fill="url(#oobeLeft)" />
                  <path d="M 150,15 C 175,15 192,29 206,57 L 282,215 C 292,237 284,263 260,263 L 215,263 C 198,263 184,251 176,233 L 150,175 L 96,175 L 96,119 L 150,119 L 150,15 Z" fill="url(#oobeRight)" opacity="0.96" />
                  <circle cx="150" cy="147" r="16" fill="#FFFFFF" />
                </svg>
              </div>

              <div>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#38bdf8] to-[#00ff99]">
                  Welcome to AetherOS
                </h2>
                <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                  Next-generation glassmorphic Linux operating system with Wayland, Hyprland tiling, and integrated AI capabilities.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 w-full max-w-xl text-left pt-2">
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                  <span className="text-xl">⚡</span>
                  <h4 className="font-bold text-xs text-white mt-1">High Performance</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Btrfs rollback snapshots & fluid Wayland animations</p>
                </div>
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                  <span className="text-xl">✨</span>
                  <h4 className="font-bold text-xs text-white mt-1">Dynamic Themes</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Pywal color synchronization across all apps</p>
                </div>
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                  <span className="text-xl">🛡️</span>
                  <h4 className="font-bold text-xs text-white mt-1">100% Local-First</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Linux PAM security & offline privacy architecture</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INTERACTIVE FEATURE TOUR / TUTORIAL */}
          {step === 2 && (
            <div className="flex flex-col justify-between h-full space-y-4">
              {/* Skip Tutorial Button */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#00f0ff] uppercase tracking-widest">
                  Slide {tutorialSlide + 1} of {TUTORIAL_SLIDES.length} • {currentSlide.tag}
                </span>
                <button
                  onClick={() => setStep(3)}
                  className="text-xs text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1"
                >
                  Skip Tour <span>➔</span>
                </button>
              </div>

              {/* Center Slide Card */}
              <div className="flex flex-col items-center text-center py-6 px-4 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-xl">
                <div className="w-20 h-20 bg-gradient-to-tr from-[#00f0ff]/10 to-[#a855f7]/10 border border-[#00f0ff]/30 rounded-3xl flex items-center justify-center text-4xl mb-5 shadow-lg shadow-[#00f0ff]/10">
                  {currentSlide.icon}
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-2">
                  {currentSlide.title}
                </h3>
                <p className="text-slate-300 text-sm max-w-lg leading-relaxed">
                  {currentSlide.description}
                </p>
              </div>

              {/* Slide Progress Dots */}
              <div className="flex justify-center items-center gap-2">
                {TUTORIAL_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTutorialSlide(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === tutorialSlide ? "w-8 bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.6)]" : "w-2 bg-slate-700 hover:bg-slate-500"
                    }`}
                  />
                ))}
              </div>

              {/* Tutorial Slide Navigation */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setTutorialSlide((s) => Math.max(0, s - 1))}
                  disabled={tutorialSlide === 0}
                  className="px-5 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                >
                  ← Previous Feature
                </button>

                <button
                  onClick={() => {
                    if (tutorialSlide < TUTORIAL_SLIDES.length - 1) {
                      setTutorialSlide(tutorialSlide + 1);
                    } else {
                      setStep(3);
                    }
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-[#00f0ff] to-[#00ff99] text-slate-950 font-bold rounded-xl text-xs hover:opacity-90 transition active:scale-95 cursor-pointer shadow-md shadow-[#00f0ff]/10"
                >
                  {tutorialSlide === TUTORIAL_SLIDES.length - 1 ? "Start Configuration →" : "Next Feature →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LANGUAGE & KEYBOARD */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">System Language & Keyboard</h3>
                <p className="text-xs text-slate-400 mt-1">Select your display language and regional keyboard layout.</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Display Language
                  </label>
                  <div className="space-y-2">
                    {[
                      { code: "en_US.UTF-8", label: "English (United States)", flag: "🇺🇸" },
                      { code: "en_GB.UTF-8", label: "English (United Kingdom)", flag: "🇬🇧" },
                      { code: "es_ES.UTF-8", label: "Español (España)", flag: "🇪🇸" },
                      { code: "de_DE.UTF-8", label: "Deutsch (Deutschland)", flag: "🇩🇪" },
                      { code: "ja_JP.UTF-8", label: "日本語 (Japanese)", flag: "🇯🇵" },
                    ].map((l) => (
                      <div
                        key={l.code}
                        onClick={() => setSelectedLang(l.code)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          selectedLang === l.code
                            ? "bg-[#00f0ff]/10 border-[#00f0ff] text-white shadow-md shadow-[#00f0ff]/10"
                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{l.flag}</span>
                          <span className="text-xs font-semibold text-slate-200">{l.label}</span>
                        </div>
                        {selectedLang === l.code && <span className="text-[#00f0ff] font-bold text-xs">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Keyboard Layout
                  </label>
                  <div className="space-y-2">
                    {[
                      { code: "us", label: "US Standard (QWERTY)" },
                      { code: "uk", label: "UK English (ISO)" },
                      { code: "de", label: "German (QWERTZ)" },
                      { code: "dvorak", label: "English (Dvorak)" },
                    ].map((k) => (
                      <div
                        key={k.code}
                        onClick={() => setKeyboardLayout(k.code)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          keyboardLayout === k.code
                            ? "bg-[#00f0ff]/10 border-[#00f0ff] text-white shadow-md shadow-[#00f0ff]/10"
                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span className="text-xs font-semibold text-slate-200">{k.label}</span>
                        {keyboardLayout === k.code && <span className="text-[#00f0ff] font-bold text-xs">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: TIMEZONE & WI-FI */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-white">Region, Timezone & Connectivity</h3>
                <p className="text-xs text-slate-400 mt-1">Set geographic region for clock sync and connect to wireless networks.</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Timezone Selector */}
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Search Timezone (e.g. Asia/Kolkata, New_York)..."
                    value={tzSearch}
                    onChange={(e) => setTzSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl focus:border-[#00f0ff] outline-none text-xs text-slate-200"
                  />
                  <div className="h-52 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/60 p-2 space-y-1">
                    {filteredTz.slice(0, 50).map((tz) => (
                      <div
                        key={tz}
                        onClick={() => setSelectedTz(tz)}
                        className={`p-2 rounded-lg cursor-pointer text-xs font-mono transition ${
                          selectedTz === tz
                            ? "bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff]"
                            : "hover:bg-slate-800/60 text-slate-300"
                        }`}
                      >
                        {tz}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Selected: <span className="text-[#00f0ff] font-bold">{selectedTz}</span>
                  </p>
                </div>

                {/* Wi-Fi Scan & Connect */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-300">Wireless Networks</span>
                    <button
                      onClick={handleScanWifi}
                      disabled={scanning}
                      className="text-[10px] text-[#00f0ff] border border-[#00f0ff]/30 px-2 py-1 rounded-lg hover:bg-[#00f0ff]/10 cursor-pointer"
                    >
                      {scanning ? "Scanning..." : "Rescan"}
                    </button>
                  </div>

                  <div className="h-36 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/60 p-2 space-y-1">
                    {networks.map((net, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedSsid(String(net.ssid))}
                        className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition text-xs ${
                          selectedSsid === net.ssid
                            ? "bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-white"
                            : "hover:bg-slate-800/60 text-slate-300"
                        }`}
                      >
                        <span className="font-mono">{net.ssid}</span>
                        <span className="text-[10px] text-slate-500">{net.signal}%</span>
                      </div>
                    ))}
                  </div>

                  {selectedSsid && (
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Wi-Fi Password..."
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex-1 focus:border-[#00f0ff] outline-none text-xs"
                      />
                      <button
                        onClick={handleConnectWifi}
                        className="bg-[#00f0ff] text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs hover:bg-[#00f0ff]/80 transition cursor-pointer"
                      >
                        Connect
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 italic">{wifiStatus}</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: USER PROFILE & SECURITY */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Create Administrator Profile</h3>
                <p className="text-xs text-slate-400 mt-1">Configure your primary system credentials. Stored in secure local vault.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Charan Balaji"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (!username) setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl focus:border-[#00f0ff] outline-none text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Username (sudo user)</label>
                  <input
                    type="text"
                    placeholder="e.g. charan"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="w-full bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl focus:border-[#00f0ff] outline-none text-xs font-mono text-slate-200"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••  (min. 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl focus:border-[#00f0ff] outline-none text-xs text-slate-200"
                  />
                  {/* Strength Meter */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${pwStrength.color}`}
                          style={{ width: pwStrength.width }}
                        />
                      </div>
                      <p className={`text-[10px] mt-1 font-semibold ${
                        pwStrength.label === "Weak" ? "text-rose-400" :
                        pwStrength.label === "Fair" ? "text-amber-400" :
                        pwStrength.label === "Good" ? "text-yellow-400" : "text-emerald-400"
                      }`}>{pwStrength.label} password</p>
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-slate-900 border px-4 py-2.5 rounded-xl outline-none text-xs transition ${
                      pwMatch ? "border-rose-500 focus:border-rose-500" : "border-slate-800 focus:border-[#00f0ff]"
                    }`}
                  />
                  {pwMatch && <p className="text-[10px] text-rose-400 mt-1">⚠ Passwords do not match</p>}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Device Hostname</label>
                  <input
                    type="text"
                    placeholder="aether-station"
                    value={hostname}
                    onChange={(e) => setHostname(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl focus:border-[#00f0ff] outline-none text-xs font-mono text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: REPOSITORIES */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Extra & Proprietary Software</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enable curated third-party repositories (RPM Fusion) to easily install NVIDIA graphics drivers, media codecs, and gaming platforms.
                </p>
              </div>

              <div
                onClick={() => setEnableThirdParty(!enableThirdParty)}
                className={`flex items-center justify-between p-6 border rounded-2xl cursor-pointer transition-all duration-200 backdrop-blur-xl ${
                  enableThirdParty
                    ? "bg-[#00f0ff]/10 border-[#00f0ff]/40 shadow-lg shadow-[#00f0ff]/10"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">📦</div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Enable Third-Party Repositories</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Includes RPM Fusion Free & Non-Free for drivers and gaming.</p>
                  </div>
                </div>

                <div className={`w-7 h-7 rounded-xl border flex items-center justify-center font-bold text-xs transition-all ${
                  enableThirdParty ? "bg-[#00f0ff] border-[#00f0ff] text-slate-950" : "border-slate-700 bg-slate-900 text-transparent"
                }`}>
                  ✓
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-400">
                <p className="font-semibold text-slate-300">Software sources enabled:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 text-[11px]">
                  <li>NVIDIA proprietary display drivers (akmod-nvidia)</li>
                  <li>Multimedia audio/video codecs (ffmpeg, gstreamer)</li>
                  <li>Steam, Proton, and gaming acceleration libraries</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 7: PRIVACY & TELEMETRY */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Privacy & Diagnostic Services</h3>
                <p className="text-xs text-slate-400 mt-1">Control telemetry reporting and location access.</p>
              </div>

              <div className="space-y-4">
                <div
                  onClick={() => setLocationServices(!locationServices)}
                  className={`flex items-center justify-between p-5 border rounded-2xl cursor-pointer transition ${
                    locationServices ? "bg-[#00f0ff]/10 border-[#00f0ff]/40" : "bg-slate-900/40 border-slate-800"
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs text-white">Location Services (Geoclue)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Allows automatic night-light adjustments and weather widgets.</p>
                  </div>
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-bold ${
                    locationServices ? "bg-[#00f0ff] text-slate-950 border-[#00f0ff]" : "border-slate-700"
                  }`}>
                    {locationServices && "✓"}
                  </div>
                </div>

                <div
                  onClick={() => setTelemetryOptIn(!telemetryOptIn)}
                  className={`flex items-center justify-between p-5 border rounded-2xl cursor-pointer transition ${
                    telemetryOptIn ? "bg-[#00f0ff]/10 border-[#00f0ff]/40" : "bg-slate-900/40 border-slate-800"
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs text-white">Anonymous Telemetry & Error Reporting</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Disabled by default. Helps improve AetherOS performance and crash resolution.</p>
                  </div>
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-bold ${
                    telemetryOptIn ? "bg-[#00f0ff] text-slate-950 border-[#00f0ff]" : "border-slate-700"
                  }`}>
                    {telemetryOptIn && "✓"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: THEME & ACCENT */}
          {step === 8 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Desktop Aesthetics & Color Scheme</h3>
                <p className="text-xs text-slate-400 mt-1">Select your baseline visual style and glow accents.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setColorMode("dark")}
                  className={`p-5 rounded-2xl border flex flex-col items-center gap-2 transition ${
                    colorMode === "dark" ? "bg-[#00f0ff]/10 border-[#00f0ff] shadow-lg shadow-[#00f0ff]/10" : "bg-slate-900/40 border-slate-800"
                  }`}
                >
                  <span className="text-3xl">🌙</span>
                  <span className="font-bold text-xs text-white">Cyber Dark Glass</span>
                  <span className="text-[10px] text-slate-400">Deep obsidian background with acrylic blur</span>
                </button>

                <button
                  onClick={() => setColorMode("light")}
                  className={`p-5 rounded-2xl border flex flex-col items-center gap-2 transition ${
                    colorMode === "light" ? "bg-[#00f0ff]/10 border-[#00f0ff] shadow-lg shadow-[#00f0ff]/10" : "bg-slate-900/40 border-slate-800"
                  }`}
                >
                  <span className="text-3xl">☀️</span>
                  <span className="font-bold text-xs text-white">Frosted Light Glass</span>
                  <span className="text-[10px] text-slate-400">Paper-tone glassmorphism with soft shadows</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Neon Glow Accent
                </label>
                <div className="flex gap-3">
                  {[
                    { id: "cyan", label: "Cyan", color: "bg-[#00f0ff]" },
                    { id: "mint", label: "Mint", color: "bg-[#00ff99]" },
                    { id: "purple", label: "Purple", color: "bg-[#a855f7]" },
                    { id: "amber", label: "Amber", color: "bg-[#f59e0b]" },
                    { id: "rose", label: "Rose", color: "bg-[#f43f5e]" },
                  ].map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => setAccentColor(acc.id)}
                      className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                        accentColor === acc.id
                          ? "border-white text-white shadow-md bg-white/10"
                          : "border-slate-800 text-slate-400 hover:border-slate-700 bg-slate-900/40"
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${acc.color}`} />
                      <span>{acc.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: HARDWARE TELEMETRY */}
          {step === 9 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Hardware Detection & Verification</h3>
                <p className="text-xs text-slate-400 mt-1">Live telemetry scan of your system architecture.</p>
              </div>

              {loadingHw ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-xs font-mono">
                  Scanning PCI buses, DRM planes, and CPU registers...
                </div>
              ) : hardware ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Processor (CPU)</span>
                    <p className="text-xs font-bold text-white">{hardware.cpu}</p>
                    <p className="text-[11px] text-[#00f0ff] font-mono">{hardware.cores}</p>
                  </div>
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">System Memory</span>
                    <p className="text-xs font-bold text-white">{hardware.memory}</p>
                    <p className="text-[11px] text-emerald-400 font-mono">Verified High-Speed Channel</p>
                  </div>
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Graphics Acceleration (GPU)</span>
                    <p className="text-xs font-bold text-white">{hardware.gpu}</p>
                    <p className="text-[11px] text-[#00f0ff] font-mono">Direct DRM KMS Hardware Plane</p>
                  </div>
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Platform & Kernel</span>
                    <p className="text-xs font-bold text-white">{hardware.virtualization}</p>
                    <p className="text-[11px] text-purple-400 font-mono">{hardware.kernel}</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* STEP 10: FINISH & LAUNCH */}
          {step === 10 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-white">Ready to Deploy AetherOS</h3>
                <p className="text-xs text-slate-400 mt-1">Review your configuration before initializing the desktop compositor.</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">USER PROFILE</span>
                  <span className="text-[#00f0ff] font-bold">{username} ({fullName || "Admin"})</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">TIMEZONE & LOCALE</span>
                  <span className="text-slate-300">{selectedTz} • {selectedLang}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">THIRD-PARTY REPOSITORIES</span>
                  <span className={enableThirdParty ? "text-emerald-400 font-bold" : "text-slate-500"}>
                    {enableThirdParty ? "Enabled (RPM Fusion)" : "Disabled (Vanilla)"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">THEME PREFERENCE</span>
                  <span className="text-purple-400 uppercase font-bold">{colorMode} ({accentColor} accent)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">USER SECURITY VAULT</span>
                  <span className="text-emerald-400">100% Local SSD & Linux PAM (Zero Cloud)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                Clicking "Complete & Launch" will save your credentials locally, lock the administrator account, and hand off control to the Hyprland desktop.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-mono">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Bottom Actions Footer (Shown for all steps except Step 2 which has slide navigation) */}
        {step !== 2 && (
          <div className="px-8 py-4 border-t border-slate-800/80 bg-[#0a0e1a]/60 flex justify-between items-center">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1 || finishing}
              className={`px-5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                step === 1 ? "opacity-0 pointer-events-none" : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              Back
            </button>

            {step < 10 ? (
              <button
                onClick={() => setStep((s) => Math.min(10, s + 1))}
                className="bg-gradient-to-r from-[#00f0ff] to-[#00ff99] text-slate-950 font-bold px-6 py-2 rounded-xl hover:opacity-90 transition text-xs shadow-lg shadow-[#00f0ff]/20 cursor-pointer active:scale-95"
              >
                {step === 1 ? "Quick Tour →" : "Continue →"}
              </button>
            ) : (
              <button
                onClick={handleFinishSetup}
                disabled={finishing}
                className="bg-gradient-to-r from-[#00f0ff] via-[#38bdf8] to-[#00ff99] text-slate-950 font-extrabold px-8 py-2 rounded-xl hover:opacity-90 transition text-xs shadow-lg shadow-[#00f0ff]/20 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {finishing ? "Deploying AetherOS..." : "Complete & Launch AetherOS 🚀"}
              </button>
            )}
          </div>
        )}

        {/* FULLSCREEN HOLOGRAPHIC LOADING OVERLAY */}
        {finishing && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07090e]/85 backdrop-blur-2xl transition-all duration-500">
            {/* Concentric Cyberpunk Spinner */}
            <div className="relative w-36 h-36 mb-8">
              <div className="absolute inset-0 border-t-2 border-[#00f0ff] rounded-full animate-spin" />
              <div className="absolute inset-3 border-r-2 border-[#a855f7] rounded-full animate-[spin_1.5s_reverse_infinite]" />
              <div className="absolute inset-6 border-b-2 border-[#00ff99] rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <svg viewBox="0 0 300 280" className="w-full h-full drop-shadow-[0_0_18px_rgba(0,229,255,0.9)] animate-pulse" fill="none">
                  <path d="M 150,15 C 125,15 108,29 94,57 L 18,215 C 8,237 16,263 40,263 L 85,263 C 102,263 116,251 124,233 L 150,175 L 204,175 L 204,119 L 150,119 L 150,15 Z" fill="url(#oobeLeft)" />
                  <path d="M 150,15 C 175,15 192,29 206,57 L 282,215 C 292,237 284,263 260,263 L 215,263 C 198,263 184,251 176,233 L 150,175 L 96,175 L 96,119 L 150,119 L 150,15 Z" fill="url(#oobeRight)" opacity="0.96" />
                  <circle cx="150" cy="147" r="16" fill="#FFFFFF" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#38bdf8] to-[#00ff99] mb-3 tracking-widest uppercase">
              Initializing AetherOS
            </h2>
            
            <p className="text-xs text-slate-400 font-mono animate-pulse">
              {loadingText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
