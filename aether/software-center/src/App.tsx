import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface AppRecord {
  app_id: string;
  name: string;
  description: string;
}

export default function SoftwareCenter() {
  const [installed, setInstalled] = useState<AppRecord[]>([]);
  const [searchResults, setSearchResults] = useState<AppRecord[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Loading installed applications...");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchInstalled = async () => {
    try {
      const apps = await invoke<AppRecord[]>("get_installed_apps");
      setInstalled(apps);
      setStatus("System packages and Flatpaks up to date.");
    } catch (e) {
      setStatus(`Error: ${e}`);
    }
  };

  useEffect(() => {
    fetchInstalled();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setStatus(`Searching Flathub repository for "${query}"...`);
    try {
      const results = await invoke<AppRecord[]>("search_apps", { query });
      setSearchResults(results);
      setStatus(results.length > 0 ? `Found ${results.length} applications.` : "No applications found.");
    } catch (err) {
      setStatus(`Search failed: ${err}`);
    }
  };

  const handleAction = async (app_id: string, action: "install" | "uninstall") => {
    setIsProcessing(true);
    setStatus(`${action === "install" ? "Installing" : "Removing"} ${app_id}...`);

    try {
      const res = await invoke<string>(`${action}_app`, { appId: app_id });
      setStatus(res);
      await fetchInstalled();
    } catch (err) {
      setStatus(`Action failed: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const isInstalled = (id: string) => installed.some((app) => app.app_id === id);
  const displayList = query ? searchResults : installed;

  return (
    <div className="p-8 text-gray-100 bg-[#0a0a0f] min-h-screen font-sans select-none flex flex-col">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <h1 className="text-2xl font-bold text-blue-400">Aether Software Center</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">{status}</p>
        </div>
        <button
          onClick={fetchInstalled}
          disabled={isProcessing}
          className="text-xs text-gray-400 hover:text-blue-400 border border-gray-800 px-3 py-1.5 rounded-lg bg-gray-900/60 transition disabled:opacity-50"
        >
          ↻ Refresh Installed
        </button>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          className="bg-gray-900/80 border border-gray-800 px-4 py-2.5 rounded-xl flex-1 outline-none focus:border-blue-500 transition-colors text-sm text-gray-200 placeholder-gray-500"
          placeholder="Search Flathub for applications (e.g. Spotify, VS Code, Discord, Blender)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          disabled={isProcessing}
          className="bg-blue-500/20 text-blue-400 border border-blue-500/50 px-6 py-2.5 rounded-xl hover:bg-blue-500 hover:text-gray-950 font-semibold text-sm transition shadow-md active:scale-95 disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {/* List Header */}
      <h2 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
        {query ? `Search Results (${searchResults.length})` : `Installed Applications (${installed.length})`}
      </h2>

      {/* Application Cards List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {displayList.map((app) => (
          <div
            key={app.app_id}
            className="flex justify-between items-center bg-gray-900/40 p-5 rounded-2xl border border-gray-800 hover:border-gray-700 transition backdrop-blur-md"
          >
            <div className="flex-1 pr-4">
              <h3 className="text-base font-bold text-gray-100">{app.name}</h3>
              <p className="text-xs text-gray-500 font-mono mb-1">{app.app_id}</p>
              <p className="text-xs text-gray-400 truncate max-w-xl">{app.description}</p>
            </div>

            <button
              disabled={isProcessing}
              onClick={() => handleAction(app.app_id, isInstalled(app.app_id) ? "uninstall" : "install")}
              className={`px-5 py-2 rounded-xl font-semibold text-xs min-w-[100px] transition shadow-md active:scale-95 disabled:opacity-50 ${
                isInstalled(app.app_id)
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-gray-950"
              }`}
            >
              {isInstalled(app.app_id) ? "Uninstall" : "Install"}
            </button>
          </div>
        ))}

        {!query && installed.length === 0 && (
          <div className="p-10 text-center border border-dashed border-gray-800 rounded-2xl bg-gray-900/20">
            <p className="text-gray-500 text-sm italic">No Flatpak applications installed yet.</p>
            <p className="text-xs text-gray-600 mt-1">Use the search bar above to install your first application from Flathub.</p>
          </div>
        )}
      </div>
    </div>
  );
}
