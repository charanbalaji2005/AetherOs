#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;
use serde::{Deserialize, Serialize};
use tauri::WindowEvent;

#[derive(Serialize, Deserialize)]
pub struct WifiNetwork {
    pub ssid: String,
    pub signal: String,
    pub security: String,
}

#[derive(Deserialize)]
pub struct SetupPayload {
    pub username: String,
    pub password: String,
    pub full_name: String,
    pub timezone: String,
    pub hostname: String,
    pub language: Option<String>,
    pub country: Option<String>,
}

#[tauri::command]
fn get_timezones() -> Result<Vec<String>, String> {
    let output = Command::new("pkexec")
        .args(["/usr/local/bin/aether-setup-core", "list-timezones"])
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let tzs: Vec<String> = stdout.lines().map(|s| s.trim().to_string()).collect();
    Ok(tzs)
}

#[tauri::command]
fn scan_wifi() -> Result<Vec<WifiNetwork>, String> {
    let output = Command::new("pkexec")
        .args(["/usr/local/bin/aether-setup-core", "scan-wifi"])
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut networks = Vec::new();

    for line in stdout.lines() {
        let parts: Vec<&str> = line.split(':').collect();
        if parts.len() >= 3 && !parts[0].is_empty() {
            networks.push(WifiNetwork {
                ssid: parts[0].to_string(),
                signal: parts[1].to_string(),
                security: parts[2].to_string(),
            });
        }
    }

    Ok(networks)
}

#[tauri::command]
fn connect_wifi(ssid: String, password: Option<String>) -> Result<String, String> {
    let mut args = vec!["/usr/local/bin/aether-setup-core", "connect-wifi", &ssid];
    let pass_val = password.unwrap_or_default();
    if !pass_val.is_empty() {
        args.push(&pass_val);
    }

    let output = Command::new("pkexec")
        .args(&args)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok("Connected to Wi-Fi successfully.".into())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn complete_setup(payload: SetupPayload) -> Result<String, String> {
    let lang = payload.language.unwrap_or_else(|| "en_US.UTF-8".to_string());
    let country = payload.country.unwrap_or_else(|| "us".to_string());

    let output = Command::new("pkexec")
        .args([
            "/usr/local/bin/aether-setup-core",
            "apply-setup",
            &payload.username,
            &payload.password,
            &payload.full_name,
            &payload.timezone,
            &payload.hostname,
            &lang,
            &country,
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok("Setup complete. Initializing desktop...".into())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn reboot_system() -> Result<String, String> {
    let output = Command::new("systemctl")
        .arg("reboot")
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok("System is rebooting...".into())
    } else {
        let fallback = Command::new("pkexec")
            .args(["systemctl", "reboot"])
            .output()
            .map_err(|e| e.to_string())?;

        if fallback.status.success() {
            Ok("System is rebooting...".into())
        } else {
            Err(String::from_utf8_lossy(&fallback.stderr).to_string())
        }
    }
}

fn main() {
    tauri::Builder::default()
        .on_window_event(|event| {
            if let WindowEvent::CloseRequested { api, .. } = event.event() {
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_timezones,
            scan_wifi,
            connect_wifi,
            complete_setup,
            reboot_system
        ])
        .run(tauri::generate_context!())
        .expect("error while running aether setup wizard");
}
