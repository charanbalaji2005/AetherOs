import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface PowerOption {
  id: string;
  label: string;
  sublabel: string;
  key: string;
  icon: JSX.Element;
  color: string;
}

export default function PowerMenu() {
  const [selected, setSelected] = useState<string>("shutdown");

  const options: PowerOption[] = [
    {
      id: "shutdown",
      label: "Power Off",
      sublabel: "Shut down system",
      key: "S",
      color: "hover:border-red-500 hover:shadow-red-500/20 group-hover:text-red-400",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: "reboot",
      label: "Restart",
      sublabel: "Reboot OS",
      key: "R",
      color: "hover:border-amber-500 hover:shadow-amber-500/20 group-hover:text-amber-400",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      id: "suspend",
      label: "Sleep",
      sublabel: "Suspend to RAM",
      key: "Z",
      color: "hover:border-blue-500 hover:shadow-blue-500/20 group-hover:text-blue-400",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
    },
    {
      id: "lock",
      label: "Lock",
      sublabel: "Secure session",
      key: "L",
      color: "hover:border-purple-500 hover:shadow-purple-500/20 group-hover:text-purple-400",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: "logout",
      label: "Log Out",
      sublabel: "Exit Hyprland",
      key: "E",
      color: "hover:border-emerald-500 hover:shadow-emerald-500/20 group-hover:text-emerald-400",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
    },
  ];

  const handleAction = async (actionId: string) => {
    try {
      await invoke("execute_power_action", { action: actionId });
    } catch (err) {
      console.error("Failed to execute power action:", err);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleAction("cancel");
        return;
      }

      const match = options.find((opt) => opt.key.toLowerCase() === e.key.toLowerCase());
      if (match) {
        handleAction(match.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black/60 backdrop-blur-xl select-none">
      <div className="flex flex-col items-center max-w-4xl w-full px-6">
        
        {/* Header Title */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-wider text-gray-100 uppercase">
            Power Menu
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Select an action or press <kbd className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300">Esc</kbd> to return
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-5 gap-4 w-full">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleAction(opt.id)}
              onMouseEnter={() => setSelected(opt.id)}
              className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl bg-gray-900/80 border border-gray-800 transition-all duration-200 shadow-lg ${opt.color} hover:scale-105 hover:bg-gray-800/90`}
            >
              {/* Shortcut Key Badge */}
              <span className="absolute top-3 right-3 text-[10px] font-mono px-1.5 py-0.5 bg-gray-800 border border-gray-700 text-gray-400 rounded group-hover:border-gray-500 group-hover:text-gray-200">
                {opt.key}
              </span>

              {/* Icon */}
              <div className="text-gray-400 transition-colors mb-3">
                {opt.icon}
              </div>

              {/* Text */}
              <span className="text-sm font-medium text-gray-200">{opt.label}</span>
              <span className="text-[11px] text-gray-500 mt-0.5">{opt.sublabel}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
