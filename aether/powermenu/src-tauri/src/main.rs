#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;
use tauri::Manager;

#[tauri::command]
fn system_poweroff() -> Result<(), String> {
    Command::new("systemctl")
        .arg("poweroff")
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn system_reboot() -> Result<(), String> {
    Command::new("systemctl")
        .arg("reboot")
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn system_sleep() -> Result<(), String> {
    Command::new("systemctl")
        .arg("suspend")
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn system_hibernate() -> Result<(), String> {
    Command::new("systemctl")
        .arg("hibernate")
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn system_logout() -> Result<(), String> {
    // Terminate current Hyprland Wayland session
    Command::new("hyprctl")
        .args(["dispatch", "exit"])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn system_lock() -> Result<(), String> {
    Command::new("hyprlock")
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn close_menu(app_handle: tauri::AppHandle) {
    if let Some(window) = app_handle.get_window("main") {
        let _ = window.close();
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            system_poweroff,
            system_reboot,
            system_sleep,
            system_hibernate,
            system_logout,
            system_lock,
            close_menu
        ])
        .run(tauri::generate_context!())
        .expect("error while running aether powermenu");
}
