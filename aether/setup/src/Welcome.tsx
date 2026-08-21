import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

export default function Welcome() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const handleFinish = async () => {
    try {
      await invoke("create_user_account", { username: username || "aether", password });
      await invoke("close_welcome");
    } catch (e) {
      setStatus(`Configuration note: ${e}`);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-950 text-gray-100 select-none">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center font-bold text-black text-sm">
            󰢻
          </div>
          <h1 className="text-2xl font-bold tracking-wide text-cyan-400">Welcome to AetherOS</h1>
        </div>
        <p className="text-sm text-gray-400">Step {step} of 2: System Setup</p>

        {step === 1 ? (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1.5">Primary Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="aether"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white outline-none focus:border-cyan-400 placeholder-gray-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white outline-none focus:border-cyan-400 placeholder-gray-500 text-sm"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 font-semibold text-black transition hover:opacity-90 mt-2 shadow-lg shadow-cyan-500/20"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              Your user account, GPU acceleration, and desktop shell are ready to initialize.
            </p>
            {status && <p className="text-xs text-amber-400">{status}</p>}
            <button
              onClick={handleFinish}
              className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white transition hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
            >
              Launch Desktop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
