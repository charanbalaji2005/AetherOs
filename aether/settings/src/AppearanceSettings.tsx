import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

const availableFonts = [
  { name: "JetBrainsMono Nerd Font", label: "JetBrains Mono (Developer Default)" },
  { name: "Inter", label: "Inter (Clean & Modern)" },
  { name: "FiraCode Nerd Font", label: "Fira Code (Ligatures)" },
  { name: "Roboto", label: "Roboto (Minimalist)" },
];

export default function AppearanceSettings() {
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const [selectedFont, setSelectedFont] = useState("JetBrainsMono Nerd Font");
  const [fontSize, setFontSize] = useState(11);
  const [status, setStatus] = useState("");

  const handleModeSwitch = async (newMode: "dark" | "light") => {
    setMode(newMode);
    try {
      await invoke("set_color_mode", { mode: newMode });
      // Apply dark/light class locally to the Tauri app window
      if (newMode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      setStatus(`Applied ${newMode.toUpperCase()} mode.`);
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
  };

  const handleFontChange = async (fontName: string, size: number) => {
    setSelectedFont(fontName);
    setFontSize(size);
    try {
      await invoke("set_system_font", { font: fontName, size });
      document.body.style.fontFamily = `"${fontName}", sans-serif`;
      setStatus(`Applied font: ${fontName} (${size}pt)`);
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl text-gray-100 select-none">
      <h2 className="text-2xl font-bold text-cyan-400 mb-2">Appearance & Typography</h2>
      <p className="text-sm text-gray-400 mb-8">
        Customize global color schemes, XDG portals, and system-wide application fonts.
      </p>

      {/* Dark / Light Mode Selector */}
      <div className="mb-10">
        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-4 font-semibold">
          System Color Scheme
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleModeSwitch("dark")}
            className={`p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
              mode === "dark"
                ? "border-cyan-500 bg-gray-900 shadow-lg shadow-cyan-500/10"
                : "border-gray-800 bg-gray-950/60 hover:border-gray-700"
            }`}
          >
            <span className="text-3xl">🌙</span>
            <span className="font-semibold text-gray-100">Dark Mode</span>
            <span className="text-xs text-gray-400">Deep obsidian tones & high contrast</span>
          </button>

          <button
            onClick={() => handleModeSwitch("light")}
            className={`p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
              mode === "light"
                ? "border-cyan-500 bg-gray-900 shadow-lg shadow-cyan-500/10"
                : "border-gray-800 bg-gray-950/60 hover:border-gray-700"
            }`}
          >
            <span className="text-3xl">☀️</span>
            <span className="font-semibold text-gray-100">Light Mode</span>
            <span className="text-xs text-gray-400">Clean paper tones & soft shadows</span>
          </button>
        </div>
      </div>

      {/* Global Font Selection */}
      <div className="mb-10">
        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-4 font-semibold">
          Global System Font
        </label>
        <div className="space-y-3">
          {availableFonts.map((f) => (
            <div
              key={f.name}
              onClick={() => handleFontChange(f.name, fontSize)}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                selectedFont === f.name
                  ? "border-cyan-400 bg-gray-900"
                  : "border-gray-800 bg-gray-950/40 hover:border-gray-700"
              }`}
            >
              <div>
                <p className="text-base font-medium text-gray-100" style={{ fontFamily: f.name }}>
                  {f.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">The quick brown fox jumps over the lazy dog.</p>
              </div>
              {selectedFont === f.name && <span className="text-cyan-400 font-bold">✓ Active</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Font Size Adjuster */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
            Base Font Size
          </label>
          <span className="text-sm font-mono text-cyan-400">{fontSize} pt</span>
        </div>
        <input
          type="range"
          min="9"
          max="16"
          value={fontSize}
          onChange={(e) => handleFontChange(selectedFont, parseInt(e.target.value))}
          className="w-full accent-cyan-400 bg-gray-800 rounded-lg cursor-pointer"
        />
      </div>

      {status && (
        <div className="mt-4 p-3 rounded-lg bg-gray-900 border border-gray-800 text-xs text-cyan-300">
          {status}
        </div>
      )}
    </div>
  );
}
