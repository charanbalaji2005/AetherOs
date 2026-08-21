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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            save_ai_config,
            change_system_volume
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aether Settings application");
}
