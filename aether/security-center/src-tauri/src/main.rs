#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct FirewallState {
    is_active: bool,
    zone: String,
    open_ports: Vec<String>,
}

#[tauri::command]
fn get_firewall_status() -> Result<FirewallState, String> {
    let output = Command::new("pkexec")
        .args(["/usr/local/bin/aether-firewall-core", "status"])
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let parts: Vec<&str> = stdout.trim().split('|').collect();

    if parts.len() >= 3 {
        let is_active = parts[0] == "ACTIVE";
        let zone = parts[1].to_string();
        let ports_str = parts[2];

        let open_ports = if ports_str == "none" || ports_str.is_empty() {
            Vec::new()
        } else {
            ports_str.split_whitespace().map(|s| s.to_string()).collect()
        };

        Ok(FirewallState {
            is_active,
            zone,
            open_ports,
        })
    } else {
        Err("Failed to parse firewall state".into())
    }
}

#[tauri::command]
fn toggle_firewall(enable: bool) -> Result<String, String> {
    let action = if enable { "enable" } else { "disable" };
    Command::new("pkexec")
        .args(["/usr/local/bin/aether-firewall-core", "toggle", action])
        .output()
        .map_err(|e| e.to_string())?;
    Ok("Firewall state updated.".into())
}

#[tauri::command]
fn apply_preset(preset: String) -> Result<String, String> {
    let output = Command::new("pkexec")
        .args(["/usr/local/bin/aether-firewall-core", "preset", &preset])
        .output()
        .map_err(|e| e.to_string())?;

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
fn configure_port(action: String, port: String) -> Result<String, String> {
    let output = Command::new("pkexec")
        .args(["/usr/local/bin/aether-firewall-core", "port", &action, &port])
        .output()
        .map_err(|e| e.to_string())?;

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_firewall_status,
            toggle_firewall,
            apply_preset,
            configure_port
        ])
        .run(tauri::generate_context!())
        .expect("error while running security center");
}
