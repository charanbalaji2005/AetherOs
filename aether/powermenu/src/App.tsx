import React, { useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";

export default function PowerMenu() {
  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        appWindow.close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAction = async (action: string) => {
    try {
      await invoke("power_action", { action });
      appWindow.close();
    } catch (e) {
      console.error("Failed to execute power action:", e);
    }
  };

  return (
    // Fullscreen transparent container with heavy blur
    <div
      className="fixed inset-0 bg-gray-950/60 backdrop-blur-2xl flex flex-col items-center justify-center font-sans select-none"
      onClick={() => appWindow.close()}
    >
      {/* Title & Hint */}
      <div className="text-center mb-10 pointer-events-none">
        <h1 className="text-2xl font-bold tracking-widest text-orange-400 uppercase mb-1">
          Aether Session Control
        </h1>
        <p className="text-xs text-gray-400 font-mono">
          Press <span className="text-white bg-gray-900 border border-gray-700 px-1.5 py-0.5 rounded">ESC</span> or click outside to dismiss
        </p>
      </div>

      {/* Button Row */}
      <div onClick={(e) => e.stopPropagation()} className="flex gap-6">
        <PowerButton
          icon="🔒"
          label="Lock"
          color="border-blue-500/40 hover:bg-blue-500/20 hover:text-blue-400 text-gray-300 shadow-blue-500/10"
          onClick={() => handleAction("lock")}
        />

        <PowerButton
          icon="🌙"
          label="Suspend"
          color="border-emerald-500/40 hover:bg-emerald-500/20 hover:text-emerald-400 text-gray-300 shadow-emerald-500/10"
          onClick={() => handleAction("suspend")}
        />

        <PowerButton
          icon="🚪"
          label="Logout"
          color="border-amber-500/40 hover:bg-amber-500/20 hover:text-amber-400 text-gray-300 shadow-amber-500/10"
          onClick={() => handleAction("logout")}
        />

        <PowerButton
          icon="🔄"
          label="Reboot"
          color="border-orange-500/40 hover:bg-orange-500/20 hover:text-orange-400 text-gray-300 shadow-orange-500/10"
          onClick={() => handleAction("reboot")}
        />

        <PowerButton
          icon="⏻"
          label="Shutdown"
          color="border-rose-500/40 hover:bg-rose-500/20 hover:text-rose-400 text-rose-500 shadow-rose-500/10"
          onClick={() => handleAction("shutdown")}
        />
      </div>
    </div>
  );
}

// Reusable Glassmorphic Button Component
function PowerButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: string;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-32 h-32 rounded-2xl bg-gray-900/60 border backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl ${color}`}
    >
      <span className="text-3xl mb-2">{icon}</span>
      <span className="text-xs font-bold tracking-widest uppercase">{label}</span>
    </button>
  );
}
