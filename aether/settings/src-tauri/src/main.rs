#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs;
use std::process::Command;

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
    let output = Command::new("aether-appearance")
        .args(["wallpaper", &path])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok("Wallpaper and theme colors synchronized across desktop, lockscreen, and SDDM.".into())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn set_wallpaper(path: String) -> Result<String, String> {
    // 1. Set background using swww
    let _ = Command::new("swww")
        .args(["img", &path, "--transition-type", "grow"])
        .output();

    // 2. Generate new color palette with Pywal
    let _ = Command::new("wal")
        .args(["-q", "-t", "-i", &path])
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
        let _ = fs::copy(&path, &lock_path);
    }

    // 5. Sync SDDM login screen
    let _ = Command::new("pkexec")
        .args(["/usr/local/bin/aether-sync-sddm", &path])
        .output();

    Ok("Wallpaper applied, Pywal colors generated, and Waybar reloaded.".into())
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
            set_wallpaper
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aether Settings application");
}
