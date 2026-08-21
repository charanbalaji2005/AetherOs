import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

export default function Appearance() {
  const [activeTab, setActiveTab] = useState<"desktop" | "sddm">("desktop");
  const [status, setStatus] = useState<string>("");

  const changeTheme = async (target: string, theme: string) => {
    try {
      setStatus(`Applying ${theme}...`);
      await invoke("apply_theme", { target, themeName: theme });
      setStatus(`${theme} applied successfully!`);
    } catch (e) {
      setStatus(`Note: ${e}`);
    }
  };

  return (
    <div className="p-8 text-white bg-gray-950 h-full select-none">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400">Interface Customizer</h1>
          <p className="text-xs text-gray-400 mt-1">Switch styles dynamically between Desktop Compositor and Login Screen</p>
        </div>
        {status && (
          <span className="text-xs px-3 py-1 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full">
            {status}
          </span>
        )}
      </div>

      <div className="flex gap-4 mb-8 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab("desktop")}
          className={`pb-2 text-sm font-semibold transition ${
            activeTab === "desktop"
              ? "text-cyan-400 border-b-2 border-cyan-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          OS Desktop Environment
        </button>
        <button
          onClick={() => setActiveTab("sddm")}
          className={`pb-2 text-sm font-semibold transition ${
            activeTab === "sddm"
              ? "text-cyan-400 border-b-2 border-cyan-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          SDDM Login Screen
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {activeTab === "desktop" ? (
          <>
            <div
              className="bg-gray-900/90 p-6 rounded-xl border border-gray-800 hover:border-cyan-400 cursor-pointer transition shadow-lg group"
              onClick={() => changeTheme("desktop", "cyberpunk")}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-100 group-hover:text-cyan-400">Neon Cyberpunk</h3>
                <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                High-contrast radiant borders with cyan/purple accents, glowing blur, and mountain sunset art.
              </p>
            </div>

            <div
              className="bg-gray-900/90 p-6 rounded-xl border border-gray-800 hover:border-cyan-400 cursor-pointer transition shadow-lg group"
              onClick={() => changeTheme("desktop", "minimal-glass")}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-100 group-hover:text-cyan-400">Minimal Glass</h3>
                <span className="w-3 h-3 rounded-full bg-purple-400"></span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Ultra-deep acrylic blur, minimal dock pills, and subdued monochrome icons.
              </p>
            </div>
          </>
        ) : (
          <>
            <div
              className="bg-gray-900/90 p-6 rounded-xl border border-gray-800 hover:border-orange-500 cursor-pointer transition shadow-lg group"
              onClick={() => changeTheme("sddm", "aetheros-glass")}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-100 group-hover:text-orange-400">AetherOS Glass</h3>
                <span className="w-3 h-3 rounded-full bg-orange-400"></span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Split acrylic frosted panel with 42px clock, glowing orange capsule inputs, and enchanted forest backdrop.
              </p>
            </div>

            <div
              className="bg-gray-900/90 p-6 rounded-xl border border-gray-800 hover:border-orange-500 cursor-pointer transition shadow-lg group"
              onClick={() => changeTheme("sddm", "aether-minimal")}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-100 group-hover:text-orange-400">Aether Minimal</h3>
                <span className="w-3 h-3 rounded-full bg-gray-400"></span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Clean, centered single-card login prompt with subtle drop shadows.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
