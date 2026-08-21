import React, { useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface PowerAction {
  id: string;
  label: string;
  subtext: string;
  icon: string;
  key: string;
  command: string;
  color: string;
}

const actions: PowerAction[] = [
  {
    id: "lock",
    label: "Lock",
    subtext: "Lock screen (K)",
    icon: "🔒",
    key: "k",
    command: "system_lock",
    color: "hover:border-indigo-500 hover:shadow-indigo-500/20",
  },
  {
    id: "sleep",
    label: "Sleep",
    subtext: "Suspend session (S)",
    icon: "🌙",
    key: "s",
    command: "system_sleep",
    color: "hover:border-cyan-500 hover:shadow-cyan-500/20",
  },
  {
    id: "hibernate",
    label: "Hibernate",
    subtext: "Save to disk (H)",
    icon: "❄️",
    key: "h",
    command: "system_hibernate",
    color: "hover:border-blue-500 hover:shadow-blue-500/20",
  },
  {
    id: "logout",
    label: "Log Out",
    subtext: "Exit session (L)",
    icon: "🚪",
    key: "l",
    command: "system_logout",
    color: "hover:border-purple-500 hover:shadow-purple-500/20",
  },
  {
    id: "reboot",
    label: "Restart",
    subtext: "Reboot OS (R)",
    icon: "🔄",
    key: "r",
    command: "system_reboot",
    color: "hover:border-amber-500 hover:shadow-amber-500/20",
  },
  {
    id: "poweroff",
    label: "Shut Down",
    subtext: "Power off (P)",
    icon: "⚡",
    key: "p",
    command: "system_poweroff",
    color: "hover:border-rose-500 hover:shadow-rose-500/20",
  },
];

export default function PowerMenu() {
  const executeAction = async (command: string) => {
    try {
      await invoke(command);
      await invoke("close_menu");
    } catch (err) {
      console.error(`Failed to execute ${command}:`, err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        invoke("close_menu");
        return;
      }
      const match = actions.find(
        (a) => a.key.toLowerCase() === e.key.toLowerCase()
      );
      if (match) {
        executeAction(match.command);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-2xl text-white select-none">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">
          Aether Power Control
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
          Press shortcut key or click to execute • ESC to cancel
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-6 gap-5 max-w-6xl px-6">
        {actions.map((act) => (
          <button
            key={act.id}
            onClick={() => executeAction(act.command)}
            className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-xl transition-all duration-200 hover:-translate-y-1.5 hover:bg-gray-800/90 ${act.color}`}
          >
            <span className="text-4xl mb-4 transition-transform duration-200 group-hover:scale-110">
              {act.icon}
            </span>
            <span className="text-base font-semibold text-gray-100">
              {act.label}
            </span>
            <span className="text-xs text-gray-400 mt-1 text-center font-mono">
              {act.subtext}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
