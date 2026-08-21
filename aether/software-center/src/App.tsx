import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface AppRecord {
  app_id: string;
  name: string;
  description: string;
  source: string; // "flathub" | "dnf"
  category: string;
  icon?: string;
  is_installed: boolean;
}

const CATEGORIES = [
  { id: "all", label: "Featured & All", icon: "✨" },
  { id: "development", label: "Development", icon: "💻" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "media", label: "Creative & Media", icon: "🎨" },
  { id: "browsers", label: "Web Browsers", icon: "🌐" },
  { id: "productivity", label: "Productivity", icon: "📝" },
  { id: "utilities", label: "Utilities", icon: "⚡" },
  { id: "installed", label: "Installed", icon: "📦" },
];

export default function SoftwareCenter() {
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Repositories synchronized.");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadCatalog = async () => {
    try {
      if (selectedCategory === "installed") {
        const res = await invoke<AppRecord[]>("get_installed_apps");
        setApps(res);
      } else {
        const res = await invoke<AppRecord[]>("get_featured_catalog");
        setApps(res);
      }
    } catch (err) {
      setStatus(`Failed to load catalog: ${err}`);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [selectedCategory]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      loadCatalog();
      return;
    }
    setStatus(`Searching repositories for "${query}"...`);
    try {
      const res = await invoke<AppRecord[]>("search_apps", { query });
      setApps(res);
      setStatus(`Found ${res.length} matching packages.`);
    } catch (err) {
      setStatus(`Search failed: ${err}`);
    }
  };

  const handleAction = async (app: AppRecord, action: "install" | "uninstall" | "launch") => {
    setProcessingId(app.app_id);
    if (action === "launch") {
      try {
        await invoke("launch_app", { appId: app.app_id, source: app.source });
        setStatus(`Launched ${app.name}.`);
      } catch (err) {
        setStatus(`Launch error: ${err}`);
      } finally {
        setProcessingId(null);
      }
      return;
    }

    setStatus(`${action === "install" ? "Installing" : "Removing"} ${app.name}...`);
    try {
      const res = await invoke<string>(`${action}_app`, {
        appId: app.app_id,
        source: app.source,
      });
      setStatus(res);
      await loadCatalog();
    } catch (err) {
      setStatus(`Operation failed: ${err}`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredApps = apps.filter((app) => {
    if (selectedCategory === "all" || selectedCategory === "installed") return true;
    return app.category.toLowerCase() === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans select-none flex flex-col antialiased">
      {/* Top Glass Header */}
      <header className="px-8 py-6 border-b border-cyan-500/10 bg-[#0c1017]/80 backdrop-blur-xl sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <div className="w-full h-full bg-[#07090e] rounded-[14px] flex items-center justify-center text-2xl">
              📦
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              Aether Software Store
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{status}</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search DNF & Flathub packages..."
              className="w-full bg-[#121824]/90 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400 transition shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  loadCatalog();
                }}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-5 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            Search
          </button>
        </form>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Category Navigation */}
        <aside className="w-64 border-r border-slate-800/60 bg-[#090d14]/70 backdrop-blur-lg p-6 flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-3">
            Categories
          </span>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setQuery("");
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-emerald-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Applications Grid */}
        <main className="flex-1 p-8 overflow-y-auto bg-[#07090e]/95">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-200 capitalize">
                {selectedCategory === "all" ? "Curated Essentials" : selectedCategory}
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {filteredApps.length} Packages Available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredApps.map((app) => {
                const isBusy = processingId === app.app_id;
                return (
                  <div
                    key={app.app_id}
                    className="bg-[#0e131d]/80 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.12)] group relative overflow-hidden"
                  >
                    {/* Top Glow Accent */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div>
                      {/* App Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-xl shadow-inner">
                            {app.icon || "📦"}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                              {app.name}
                            </h3>
                            <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
                              {app.source === "flathub" ? "Flathub Sandbox" : "DNF5 RPM"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                        {app.description}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-auto">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {app.is_installed ? "Installed" : "Available"}
                      </span>

                      <div className="flex items-center gap-2">
                        {app.is_installed ? (
                          <>
                            <button
                              onClick={() => handleAction(app, "launch")}
                              disabled={isBusy}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                            >
                              Launch
                            </button>
                            <button
                              onClick={() => handleAction(app, "uninstall")}
                              disabled={isBusy}
                              className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
                            >
                              {isBusy ? "..." : "Remove"}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleAction(app, "install")}
                            disabled={isBusy}
                            className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 text-xs font-bold transition shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
                          >
                            {isBusy ? "Installing..." : "Install"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
