#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
struct AppRecord {
    app_id: String,
    name: String,
    description: String,
}

#[tauri::command]
fn get_installed_apps() -> Result<Vec<AppRecord>, String> {
    let output = Command::new("flatpak")
        .args(["list", "--app", "--columns=application,name,description"])
        .output()
        .map_err(|e| e.to_string())?;

    Ok(parse_flatpak_output(String::from_utf8_lossy(&output.stdout).to_string()))
}

#[tauri::command]
fn search_apps(query: String) -> Result<Vec<AppRecord>, String> {
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }

    let output = Command::new("flatpak")
        .args(["search", &query, "--columns=application,name,description"])
        .output()
        .map_err(|e| e.to_string())?;

    Ok(parse_flatpak_output(String::from_utf8_lossy(&output.stdout).to_string()))
}

#[tauri::command]
fn install_app(app_id: String) -> Result<String, String> {
    let output = Command::new("flatpak")
        .args(["install", "flathub", &app_id, "--noninteractive", "-y"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(format!("Successfully installed {}", app_id))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn uninstall_app(app_id: String) -> Result<String, String> {
    let output = Command::new("flatpak")
        .args(["uninstall", &app_id, "--noninteractive", "-y"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(format!("Successfully removed {}", app_id))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

fn parse_flatpak_output(stdout: String) -> Vec<AppRecord> {
    let mut apps = Vec::new();
    for line in stdout.lines() {
        let parts: Vec<&str> = line.split('\t').collect();
        if parts.len() >= 3 {
            apps.push(AppRecord {
                app_id: parts[0].trim().to_string(),
                name: parts[1].trim().to_string(),
                description: parts[2].trim().to_string(),
            });
        }
    }
    apps
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_installed_apps,
            search_apps,
            install_app,
            uninstall_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aether Software Center");
}
