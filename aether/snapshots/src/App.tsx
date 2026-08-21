import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface Snapshot {
  id: string;
  type: string;
  date: string;
  description: string;
}

const TYPE_COLORS: Record<string, string> = {
  pre:    "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30",
  post:   "from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-500/30",
  single: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30",
};

const TYPE_ICON: Record<string, string> = {
  pre:    "🔄",
  post:   "✅",
  single: "📸",
};

export default function SnapshotManager() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"info" | "error" | "success">("info");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rolling, setRolling] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadSnapshots();
  }, []);

  const loadSnapshots = async () => {
    setLoading(true);
    setStatus("");
    try {
      const rawData = await invoke<string>("get_snapshots");
      const lines = rawData.trim().split("\n");
      const parsed: Snapshot[] = lines.slice(1)
        .filter((l) => l.trim().length > 0)
        .map((line) => {
          const cols = line.split(",");
          return {
            id:          (cols[1] ?? "").replace(/"/g, "").trim(),
            type:        (cols[2] ?? "single").replace(/"/g, "").trim().toLowerCase(),
            date:        (cols[3] ?? "").replace(/"/g, "").trim(),
            description: (cols[4] ?? "").replace(/"/g, "").trim(),
          };
        })
        .filter((s) => s.id !== "");
      setSnapshots(parsed.reverse()); // Most recent first
    } catch (err) {
      setStatus(`Scan failed: ${err}`);
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (id: string) => {
    if (!window.confirm(`Roll back system to snapshot #${id}?\n\nThis will revert all changes made after this checkpoint and reboot the machine.`)) return;
    setRolling(id);
    setStatus(`Initiating rollback to checkpoint #${id}...`);
    setStatusType("info");
    try {
      const res = await invoke<string>("rollback_system", { snapshotId: id });
      setStatus(res);
      setStatusType("success");
    } catch (err) {
      setStatus(`Rollback failed: ${err}`);
      setStatusType("error");
    } finally {
      setRolling(null);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setStatus("Creating manual checkpoint...");
    setStatusType("info");
    try {
      const res = await invoke<string>("create_snapshot", { name: "manual" });
      setStatus(res);
      setStatusType("success");
      await loadSnapshots();
    } catch (err) {
      setStatus(`Failed to create snapshot: ${err}`);
      setStatusType("error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Delete checkpoint #${id}? This cannot be undone.`)) return;
    try {
      const res = await invoke<string>("delete_snapshot", { name: id });
      setStatus(res);
      setStatusType("success");
      await loadSnapshots();
    } catch (err) {
      setStatus(`Delete failed: ${err}`);
      setStatusType("error");
    }
  };

  const statusBg = {
    info:    "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
    error:   "bg-rose-500/10 border-rose-500/30 text-rose-300",
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  }[statusType];

  return (
    <div className="flex flex-col h-screen bg-[#07090e] text-slate-100 font-sans select-none antialiased overflow-hidden">

      {/* ── Header ──────────────────────────────────────── */}
      <header className="px-8 py-6 border-b border-slate-800/60 bg-[#0c1017]/80 backdrop-blur-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Official Aether Logo */}
          <div className="w-12 h-12 drop-shadow-[0_0_12px_rgba(0,229,255,0.5)]">
            <svg viewBox="0 0 300 280" className="w-full h-full" fill="none">
              <defs>
                <linearGradient id="snapLeft" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0066FF" />
                  <stop offset="100%" stopColor="#00D2FF" />
                </linearGradient>
                <linearGradient id="snapRight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00E5FF" />
                  <stop offset="100%" stopColor="#00F59B" />
                </linearGradient>
              </defs>
              <path d="M 150,15 C 125,15 108,29 94,57 L 18,215 C 8,237 16,263 40,263 L 85,263 C 102,263 116,251 124,233 L 150,175 L 204,175 L 204,119 L 150,119 L 150,15 Z" fill="url(#snapLeft)" />
              <path d="M 150,15 C 175,15 192,29 206,57 L 282,215 C 292,237 284,263 260,263 L 215,263 C 198,263 184,251 176,233 L 150,175 L 96,175 L 96,119 L 150,119 L 150,15 Z" fill="url(#snapRight)" opacity="0.96" />
              <circle cx="150" cy="147" r="16" fill="#FFFFFF" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              Time-Travel Vault
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Btrfs snapshot checkpoints — restore any previous system state instantly</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 hover:from-cyan-500/20 hover:to-emerald-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold rounded-xl transition active:scale-95 disabled:opacity-50"
          >
            <span>{creating ? "⏳" : "📸"}</span>
            {creating ? "Creating..." : "New Checkpoint"}
          </button>
          <button
            onClick={loadSnapshots}
            className="px-4 py-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            ↺ Refresh
          </button>
        </div>
      </header>

      {/* ── Status Banner ───────────────────────────────── */}
      {status && (
        <div className={`mx-8 mt-5 px-5 py-3 rounded-xl border text-xs font-mono ${statusBg} transition-all`}>
          {status}
        </div>
      )}

      {/* ── Stats Bar ───────────────────────────────────── */}
      <div className="px-8 pt-5 grid grid-cols-3 gap-4">
        {[
          { label: "Total Checkpoints", value: snapshots.length.toString(), icon: "🗂️" },
          { label: "Automatic (Pre/Post)", value: snapshots.filter(s => s.type === "pre" || s.type === "post").length.toString(), icon: "🔄" },
          { label: "Manual Saves", value: snapshots.filter(s => s.type === "single").length.toString(), icon: "📸" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#0e131d]/80 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">{stat.icon}</span>
            <div>
              <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Snapshot Timeline ───────────────────────────── */}
      <main className="flex-1 px-8 py-5 overflow-y-auto space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            {/* Spinning Aether emblem */}
            <div className="w-16 h-16 animate-spin drop-shadow-[0_0_12px_rgba(0,229,255,0.4)]">
              <svg viewBox="0 0 300 280" className="w-full h-full" fill="none">
                <defs>
                  <linearGradient id="spinL" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0066FF" /><stop offset="100%" stopColor="#00D2FF" /></linearGradient>
                  <linearGradient id="spinR" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00E5FF" /><stop offset="100%" stopColor="#00F59B" /></linearGradient>
                </defs>
                <path d="M 150,15 C 125,15 108,29 94,57 L 18,215 C 8,237 16,263 40,263 L 85,263 C 102,263 116,251 124,233 L 150,175 L 204,175 L 204,119 L 150,119 L 150,15 Z" fill="url(#spinL)" />
                <path d="M 150,15 C 175,15 192,29 206,57 L 282,215 C 292,237 284,263 260,263 L 215,263 C 198,263 184,251 176,233 L 150,175 L 96,175 L 96,119 L 150,119 L 150,15 Z" fill="url(#spinR)" opacity="0.96" />
                <circle cx="150" cy="147" r="16" fill="#FFFFFF" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-mono">Scanning Btrfs subvolume checkpoints...</p>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <span className="text-5xl opacity-30">🗄️</span>
            <p className="text-slate-400 text-sm">No snapshots found.</p>
            <p className="text-xs text-slate-500">Snapshots are created automatically before DNF transactions.<br />Click "New Checkpoint" to save a manual restore point.</p>
          </div>
        ) : (
          snapshots.map((snap, idx) => {
            const typeStyle = TYPE_COLORS[snap.type] ?? TYPE_COLORS.single;
            const icon = TYPE_ICON[snap.type] ?? "📸";
            const isSelected = selectedId === snap.id;
            const isRolling = rolling === snap.id;

            return (
              <div
                key={snap.id}
                onClick={() => setSelectedId(isSelected ? null : snap.id)}
                className={`group relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 cursor-pointer
                  ${isSelected
                    ? "bg-cyan-500/8 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                    : "bg-[#0e131d]/70 border-slate-800/60 hover:border-slate-700"
                  }`}
              >
                {/* Timeline connector */}
                {idx < snapshots.length - 1 && (
                  <div className="absolute left-9 -bottom-3 w-px h-3 bg-slate-700/60" />
                )}

                {/* Left: ID badge + info */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-slate-800 border border-slate-700/60 rounded-xl font-mono font-bold text-sm text-cyan-400 shadow-inner flex-shrink-0">
                    #{snap.id}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-100">
                        {snap.description || "Automatic Checkpoint"}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-gradient-to-r ${typeStyle}`}>
                        {icon} {snap.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{snap.date || "Date unavailable"}</p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(snap.id); }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 text-xs font-semibold transition"
                  >
                    Delete
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRollback(snap.id); }}
                    disabled={isRolling}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-emerald-500/15 hover:from-cyan-500/25 hover:to-emerald-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition active:scale-95 disabled:opacity-50"
                  >
                    {isRolling ? "⏳ Restoring..." : "⏮ Restore State"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
