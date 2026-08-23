#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs;
use std::path::Path;
use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WallpaperItem {
    pub id: String,
    pub name: String,
    pub path: String,
    pub profile: String,
}

#[tauri::command]
fn get_system_info() -> String {
    let output = Command::new("uname")
        .arg("-a")
        .output();

    match output {
        Ok(o) => String::from_utf8_lossy(&o.stdout).to_string(),
        Err(e) => format!("Error fetching system info: {}", e),
    }
}

#[tauri::command]
fn save_ai_config(api_key: &str) -> Result<String, String> {
    let config_dir = dirs::config_dir()
        .ok_or("Could not find config directory")?
        .join("aether");

    fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;

    let config_path = config_dir.join("ai.json");
    let json_data = format!(r#"{{"gemini_api_key": "{}"}}"#, api_key);

    fs::write(config_path, json_data).map_err(|e| e.to_string())?;

    Ok("API Key saved to system configuration (~/.config/aether/ai.json)".into())
}

#[tauri::command]
fn change_system_volume(level: &str) -> String {
    let output = Command::new("wpctl")
        .args(["set-volume", "@DEFAULT_AUDIO_SINK@", level])
        .output();

    match output {
        Ok(o) => String::from_utf8_lossy(&o.stdout).to_string(),
        Err(e) => format!("Error: {}", e),
    }
}

#[tauri::command]
async fn apply_theme(target: String, theme_name: String) -> Result<String, String> {
    let status = Command::new("pkexec")
        .args(["/usr/local/bin/aether-theme-manager", &target, &theme_name])
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok(format!("Theme '{}' applied successfully!", theme_name))
    } else {
        Err("Failed to apply theme.".into())
    }
}

#[tauri::command]
fn set_color_mode(mode: String) -> Result<String, String> {
    let output = Command::new("aether-appearance")
        .args(["mode", &mode])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(format!("Mode changed to {}", mode))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn set_system_font(font: String, size: u32) -> Result<String, String> {
    let output = Command::new("aether-appearance")
        .args(["font", &font, &size.to_string()])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(format!("Font changed to {} {}", font, size))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn set_system_wallpaper(path: String) -> Result<String, String> {
    apply_wallpaper_and_theme(path, "cyan".into())
}

#[tauri::command]
fn set_wallpaper(path: String) -> Result<String, String> {
    apply_wallpaper_and_theme(path, "cyan".into())
}

/// Dynamic Wallpaper & Universal Dotfiles Engine
#[tauri::command]
fn apply_wallpaper_and_theme(image_path: String, theme_profile: String) -> Result<String, String> {
    // 1. Fluid Wayland background transition using swww
    let _ = Command::new("swww")
        .args(["img", &image_path, "--transition-type", "grow", "--transition-duration", "1.5"])
        .output();

    // 2. Generate and apply color palette with Pywal
    let _ = Command::new("wal")
        .args(["-q", "-t", "-i", &image_path])
        .output();

    // 3. Send live-reload signal to Waybar
    let _ = Command::new("killall")
        .args(["-SIGUSR2", "waybar"])
        .output();

    // 4. Sync Lock Screen image cache
    if let Some(home) = dirs::home_dir() {
        let cache_dir = home.join(".cache");
        let _ = fs::create_dir_all(&cache_dir);
        let lock_path = cache_dir.join("aether-lockscreen.jpg");
        let _ = fs::copy(&image_path, &lock_path);

        // Save active wallpaper marker
        let aether_cfg = home.join(".config").join("aether");
        let _ = fs::create_dir_all(&aether_cfg);
        let _ = fs::write(aether_cfg.join("current_wallpaper"), &image_path);
    }

    // 4.5. Trigger dual-desktop wallpaper switcher (GNOME gsettings & Hyprland)
    let _ = Command::new("aether-wallpaper")
        .arg(&image_path)
        .output();

    // 5. Sync Login Screen (GDM / SDDM)
    let _ = Command::new("pkexec")
        .args(["/usr/local/bin/aether-sync-sddm", &image_path])
        .output();

    // 6. Check if it's native Aether theme profile or custom community dotfiles
    if theme_profile == "custom_dotfile" {
        apply_community_dotfiles(&image_path)?;
    } else {
        apply_aether_native_theme(&theme_profile)?;
    }

    Ok("Wallpaper and theme configuration successfully synchronized.".into())
}

fn apply_aether_native_theme(profile: &str) -> Result<(), String> {
    let border_color = match profile {
        "mint" => "00ff99",
        "purple" => "a855f7",
        "amber" => "f59e0b",
        "rose" => "f43f5e",
        _ => "33ccff", // Default cyan
    };

    // Modify Hyprland active border colors on the fly via hyprctl
    let _ = Command::new("hyprctl")
        .args([
            "keyword",
            "general:col.active_border",
            &format!("rgba({}ee) rgba(0a0a0fee) 45deg", border_color),
        ])
        .output();

    Ok(())
}

fn apply_community_dotfiles(_image_path: &str) -> Result<(), String> {
    if let Some(home) = dirs::home_dir() {
        let dotfile_script = home.join(".config").join("aether").join("apply-theme.sh");
        if dotfile_script.exists() {
            let _ = Command::new("bash").arg(dotfile_script).output();
        }
    }
    Ok(())
}

/// Discovers all wallpapers (.webp, .jpg, .png, .jpeg, .avif) installed on the system
#[tauri::command]
fn get_available_wallpapers() -> Result<Vec<WallpaperItem>, String> {
    let mut wallpapers = Vec::new();
    let bg_dir = Path::new("/usr/share/backgrounds/aetheros");

    if bg_dir.exists() && bg_dir.is_dir() {
        if let Ok(entries) = fs::read_dir(bg_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                    let ext_lower = ext.to_lowercase();
                    if matches!(ext_lower.as_str(), "webp" | "jpg" | "jpeg" | "png" | "avif") {
                        let file_stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("wallpaper");
                        if file_stem == "default" || file_stem == "avatar" || file_stem == "after_dark" {
                            continue;
                        }

                        let clean_name = file_stem
                            .replace('_', " ")
                            .replace('-', " ")
                            .split_whitespace()
                            .map(|word| {
                                let mut c = word.chars();
                                match c.next() {
                                    None => String::new(),
                                    Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
                                }
                            })
                            .collect::<Vec<_>>()
                            .join(" ");

                        let profile = if file_stem.contains("forest") || file_stem.contains("mint") {
                            "mint"
                        } else if file_stem.contains("sunset") || file_stem.contains("amber") {
                            "amber"
                        } else if file_stem.contains("cyber") || file_stem.contains("gojo") {
                            "purple"
                        } else {
                            "cyan"
                        };

                        wallpapers.push(WallpaperItem {
                            id: file_stem.to_string(),
                            name: clean_name,
                            path: path.to_string_lossy().to_string(),
                            profile: profile.to_string(),
                        });
                    }
                }
            }
        }
    }

    // Sort by name
    wallpapers.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(wallpapers)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            save_ai_config,
            change_system_volume,
            apply_theme,
            set_color_mode,
            set_system_font,
            set_system_wallpaper,
            set_wallpaper,
            apply_wallpaper_and_theme,
            get_available_wallpapers
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aether Settings application");
}
