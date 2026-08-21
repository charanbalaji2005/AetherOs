import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";

export default function SnapshotManager() {
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [newSnapName, setNewSnapName] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchSnapshots = async () => {
    try {
      const data = await invoke<string[]>("get_snapshots");
      setSnapshots(data);
    } catch (err) {
      setStatus(`Error fetching snapshots: ${err}`);
    }
  };

  const handleCreate = async () => {
    if (!newSnapName.trim()) return;
    setLoading(true);
    try {
      const res = await invoke<string>("create_snapshot", { name: newSnapName.trim() });
      setStatus(res);
      setNewSnapName("");
      await fetchSnapshots();
    } catch (err) {
      setStatus(`Failed to create snapshot: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (snapshotId: string) => {
    if (
      !window.confirm(
        `Are you sure you want to revert your system to Snapshot '${snapshotId}'?\n\n` +
          `• The root OS subvolume (/@) will be replaced with this snapshot.\n` +
          `• Your personal files (/home) and logs (/var/log) will NOT be affected.\n` +
          `• The system will automatically reboot immediately upon completion.`
      )
    ) {
      return;
    }

    setRestoringId(snapshotId);
    setLoading(true);
    setStatus(`Staging rollback to snapshot '${snapshotId}' and preparing system reboot...`);

    try {
      const res = await invoke<string>("rollback_snapshot", { snapshotId });
      setStatus(res);
    } catch (err) {
      setStatus(`Rollback failed: ${err}`);
      setRestoringId(null);
      setLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete snapshot '${name}'?`)) {
      setLoading(true);
      try {
        const res = await invoke<string>("delete_snapshot", { name });
        setStatus(res);
        await fetchSnapshots();
      } catch (err) {
        setStatus(`Delete failed: ${err}`);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  return (
    <div className="p-8 text-gray-100 bg-[#0a0a0f] min-h-screen font-sans select-none flex flex-col relative overflow-hidden">
      {/* Restoring Fullscreen Holographic Overlay */}
      {restoringId && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-2xl flex flex-col items-center justify-center animate-fade-in">
          <div className="relative w-36 h-36 flex items-center justify-center mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent animate-spin duration-700"></div>
            <div
              className="absolute inset-3 rounded-full border-4 border-t-transparent border-r-rose-500 border-b-transparent border-l-transparent animate-spin"
              style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
            ></div>
            <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500 flex items-center justify-center animate-pulse">
              <span className="text-orange-400 font-mono text-base font-bold">↻</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-100 tracking-wider mb-2">
            Restoring System Snapshot #{restoringId}
          </h2>
          <p className="text-sm text-gray-400 font-mono">
            Replacing root subvolume and rebooting workstation...
          </p>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <h1 className="text-2xl font-bold text-orange-400 tracking-wide">
            Aether Recovery & Disaster Snapshots
          </h1>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Atomic Btrfs subvolume snapshot creation and point-in-time system rollback engine.
        </p>
      </div>

      {/* Status Bar */}
      {status && (
        <div className="mb-4 p-3 rounded-xl bg-gray-900/80 border border-gray-800 text-xs font-mono text-orange-400">
          {status}
        </div>
      )}

      {/* Create New Snapshot Box */}
      <div className="bg-gray-900/60 border border-gray-800 p-5 rounded-2xl mb-6 shadow-lg backdrop-blur-md">
        <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
          Create Instant Read-Only Snapshot
        </label>
        <div className="flex gap-3">
          <input
            className="bg-gray-950/80 border border-gray-700 px-4 py-2.5 rounded-xl flex-1 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm text-gray-200 placeholder-gray-500"
            placeholder="e.g., pre-system-upgrade or stable-release-v1"
            value={newSnapName}
            onChange={(e) => setNewSnapName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={loading}
            className="bg-orange-500/20 text-orange-400 border border-orange-500/50 px-6 py-2.5 rounded-xl hover:bg-orange-500 hover:text-gray-950 font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {loading ? "Working..." : "Create Snapshot"}
          </button>
        </div>
      </div>

      {/* Snapshot List Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
          Available Restore Points ({snapshots.length})
        </h2>
        <button
          onClick={fetchSnapshots}
          className="text-xs text-gray-400 hover:text-orange-400 transition"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Snapshot List */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {snapshots.map((snap) => (
          <div
            key={snap}
            className="flex justify-between items-center bg-gray-900/40 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-orange-400 font-mono text-sm">📸</span>
              <span className="font-mono text-sm text-gray-200 font-medium">{snap}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRollback(snap)}
                disabled={loading}
                className="bg-orange-500/20 text-orange-400 border border-orange-500/40 px-4 py-1.5 rounded-lg hover:bg-orange-500 hover:text-gray-950 font-semibold text-xs transition disabled:opacity-50"
              >
                Restore System
              </button>
              <button
                onClick={() => handleDelete(snap)}
                disabled={loading}
                className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg hover:bg-rose-500 hover:text-white text-xs transition disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {snapshots.length === 0 && (
          <div className="p-8 text-center bg-gray-900/20 rounded-xl border border-gray-800/60">
            <p className="text-gray-500 text-sm italic">No Btrfs snapshots found in /@snapshots or Snapper.</p>
            <p className="text-xs text-gray-600 mt-1">Create your first snapshot or perform a DNF package transaction.</p>
          </div>
        )}
      </div>
    </div>
  );
}
