#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;

#[tauri::command]
fn power_action(action: &str) -> Result<(), String> {
    let result = match action {
        "shutdown" => Command::new("systemctl").arg("poweroff").spawn(),
        "reboot"   => Command::new("systemctl").arg("reboot").spawn(),
        "suspend"  => Command::new("systemctl").arg("suspend").spawn(),
        "lock"     => Command::new("hyprlock").spawn(),
        "logout"   => Command::new("hyprctl").args(["dispatch", "exit"]).spawn(),
        _ => return Err("Invalid action".into()),
    };

    result.map(|_| ()).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![power_action])
        .run(tauri::generate_context!())
        .expect("error while running aether powermenu");
}
