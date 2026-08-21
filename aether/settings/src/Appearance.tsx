import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface WallpaperItem {
  id: string;
  name: string;
  path: string;
  profile: string;
}

const DEFAULT_WALLPAPERS: WallpaperItem[] = [
  { id: "pain_akatsuki", name: "Pain (Akatsuki)", path: "/usr/share/backgrounds/aetheros/pain_akatsuki.jpg", profile: "cyan" },
  { id: "autumn_forest", name: "Autumn Forest", path: "/usr/share/backgrounds/aetheros/autumn_forest.jpg", profile: "mint" },
  { id: "sunset_mountains", name: "Sunset Peaks", path: "/usr/share/backgrounds/aetheros/sunset_mountains.jpg", profile: "amber" },
  { id: "cyberpunk_city", name: "Cyberpunk City", path: "/usr/share/backgrounds/aetheros/cyberpunk_city.png", profile: "purple" },
  { id: "satoru_gojo", name: "Satoru Gojo", path: "/usr/share/backgrounds/aetheros/satoru-gojo-jujutsu-5120x2880-16987.png", profile: "cyan" },
  { id: "samurai_warrior", name: "Samurai Night", path: "/usr/share/backgrounds/aetheros/samurai-warrior-night-city-5120x2880-17865.png", profile: "rose" },
];

const PROFILE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/40", text: "text-cyan-400", glow: "shadow-cyan-500/20" },
  mint: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400", glow: "shadow-emerald-500/20" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/40", text: "text-purple-400", glow: "shadow-purple-500/20" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-400", glow: "shadow-amber-500/20" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/40", text: "text-rose-400", glow: "shadow-rose-500/20" },
};

export default function AppearanceSettings() {
  const [wallpapers, setWallpapers] = useState<WallpaperItem[]>(DEFAULT_WALLPAPERS);
  const [activeWallpaper, setActiveWallpaper] = useState<string>("pain_akatsuki");
  const [selectedProfile, setSelectedProfile] = useState<string>("cyan");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [customPath, setCustomPath] = useState<string>("");

  useEffect(() => {
    loadWallpapers();
  }, []);

  const loadWallpapers = async () => {
    try {
      const list = await invoke<WallpaperItem[]>("get_available_wallpapers");
      if (list && list.length > 0) {
        setWallpapers(list);
      }
    } catch {
      // Use defaults if backend list command fails or in dev mode
    }
  };

  const handleApplyWallpaper = async (wp: WallpaperItem) => {
    setActiveWallpaper(wp.id);
    setSelectedProfile(wp.profile);
    setStatus(`Applying ${wp.name} & generating palette...`);
    setLoading(true);

    try {
      const res = await invoke<string>("apply_wallpaper_and_theme", {
        imagePath: wp.path,
        themeProfile: wp.profile,
      });
      setStatus(res);
    } catch (err) {
      setStatus(`Failed to apply theme: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCustom = async () => {
    if (!customPath.trim()) return;
    setStatus(`Applying custom wallpaper: ${customPath}...`);
    setLoading(true);

    try {
      const res = await invoke<string>("apply_wallpaper_and_theme", {
        imagePath: customPath.trim(),
        themeProfile: selectedProfile,
      });
      setStatus(res);
    } catch (err) {
      setStatus(`Error applying custom wallpaper: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportDotfiles = () => {
    alert("Community Dotfiles: To import, extract your custom Hyprland/Waybar dotfiles archive to ~/.config/hypr/ and ~/.config/waybar/.\nAetherOS will execute ~/.config/aether/apply-theme.sh dynamically on theme change!");
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e1a] text-slate-100 p-6 select-none overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-[#00f0ff] via-[#38bdf8] to-[#00ff99] bg-clip-text text-transparent">
            Wallpaper & Theme Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic Wayland wallpaper transitions (swww), Pywal color generation, and universal dotfile support
          </p>
        </div>

        <button
          onClick={loadWallpapers}
          className="px-3 py-1.5 bg-[#13192b] border border-[#1b2238] hover:border-[#00f0ff]/40 rounded-xl text-xs font-semibold text-slate-300 transition cursor-pointer"
        >
          ↻ Refresh Vault
        </button>
      </div>

      {/* Live Status Notification */}
      {status && (
        <div className="p-3 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-xl text-[#00f0ff] text-xs font-mono backdrop-blur-md">
          {status}
        </div>
      )}

      {/* Theme Accent Profiles */}
      <div className="bg-[#13192b] border border-[#1b2238] p-5 rounded-2xl">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          🎨 Active Accent Profile
        </h3>
        <div className="flex gap-3">
          {Object.entries(PROFILE_COLORS).map(([name, style]) => (
            <button
              key={name}
              onClick={() => setSelectedProfile(name)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                selectedProfile === name
                  ? `${style.bg} ${style.border} ${style.text} shadow-lg ${style.glow}`
                  : "bg-[#0a0e1a] border-[#1b2238] text-slate-400 hover:border-slate-600"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Wallpaper Gallery Grid */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-white">
            Installed System Backgrounds ({wallpapers.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">Supports .webp, .jpg, .png, .avif</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {wallpapers.map((wp) => {
            const isSelected = activeWallpaper === wp.id;
            const pStyle = PROFILE_COLORS[wp.profile] || PROFILE_COLORS.cyan;

            return (
              <div
                key={wp.id}
                onClick={() => handleApplyWallpaper(wp)}
                className={`group relative p-3 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                  isSelected
                    ? "bg-[#00f0ff]/10 border-[#00f0ff] shadow-lg shadow-[#00f0ff]/20"
                    : "bg-[#13192b] border-[#1b2238] hover:border-slate-600 hover:bg-[#182035]"
                }`}
              >
                <div className="h-28 bg-[#0a0e1a] rounded-xl mb-3 border border-[#1b2238] flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                  <span className="text-3xl mb-1">🖼️</span>
                  <span className="text-[10px] text-slate-500 font-mono truncate max-w-[90%]">
                    {wp.id}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-200 truncate">{wp.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Glassmorphic Dynamic</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${pStyle.bg} ${pStyle.border} ${pStyle.text}`}>
                    {wp.profile}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Wallpaper Path */}
      <div className="bg-[#13192b] border border-[#1b2238] p-5 rounded-2xl space-y-3">
        <h3 className="text-sm font-semibold text-white">📁 Apply Custom File Path</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="/home/user/Pictures/custom-wallpaper.webp"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            className="flex-1 bg-[#0a0e1a] border border-[#1b2238] px-4 py-2.5 rounded-xl text-xs text-slate-200 font-mono focus:border-[#00f0ff] outline-none"
          />
          <button
            onClick={handleApplyCustom}
            disabled={loading || !customPath.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-[#00f0ff] to-[#00ff99] text-[#0a0e1a] text-xs font-bold rounded-xl hover:opacity-90 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            Apply Wallpaper
          </button>
        </div>
      </div>

      {/* Community Dotfiles Engine */}
      <div className="bg-gradient-to-r from-[#13192b] to-[#182035] border border-[#1b2238] p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-white">Universal Community Dotfiles Engine</h3>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-semibold">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            AetherOS natively supports external GitHub Hyprland & Waybar dotfiles without breaking system services.
          </p>
        </div>

        <button
          onClick={handleImportDotfiles}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold text-white transition active:scale-95 cursor-pointer"
        >
          Import Dotfiles Schema
        </button>
      </div>
    </div>
  );
}
