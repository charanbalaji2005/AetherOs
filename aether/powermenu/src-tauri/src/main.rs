#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use tauri::AppHandle;

#[tauri::command]
fn execute_power_action(action: String, app: AppHandle) -> Result<(), String> {
    match action.as_str() {
        "shutdown" => {
            Command::new("systemctl")
                .arg("poweroff")
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        "reboot" => {
            Command::new("systemctl")
                .arg("reboot")
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        "suspend" => {
            Command::new("systemctl")
                .arg("suspend")
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        "lock" => {
            Command::new("hyprlock")
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        "logout" => {
            Command::new("hyprctl")
                .args(["dispatch", "exit"])
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        "cancel" => {
            app.exit(0);
        }
        _ => return Err("Unknown power action requested.".into()),
    }

    app.exit(0);
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![execute_power_action])
        .run(tauri::generate_context!())
        .expect("error while running Aether Power Menu");
}
