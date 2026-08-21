#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;
use serde::Serialize;

#[derive(Serialize)]
struct HardwareState {
    nvidia: bool,
    broadcom: bool,
}

#[tauri::command]
fn detect_hardware() -> Result<HardwareState, String> {
    let output = Command::new("pkexec")
        .args(["/usr/local/bin/aether-driver-core", "detect"])
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let nvidia = stdout.contains("NVIDIA_DETECTED=true");
    let broadcom = stdout.contains("BROADCOM_DETECTED=true");

    Ok(HardwareState { nvidia, broadcom })
}

#[tauri::command]
fn check_secure_boot() -> Result<bool, String> {
    let output = Command::new("pkexec")
        .args(["/usr/local/bin/aether-driver-core", "check-secureboot"])
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.contains("SECUREBOOT_ENABLED=true"))
}

#[tauri::command]
fn enroll_mok(password: String) -> Result<String, String> {
    let output = Command::new("pkexec")
        .args(["/usr/local/bin/aether-driver-core", "enroll-mok", &password])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn install_driver(target: String) -> Result<String, String> {
    let output = Command::new("pkexec")
        .args(["/usr/local/bin/aether-driver-core", "install", &target])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            detect_hardware,
            check_secure_boot,
            enroll_mok,
            install_driver
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aether Driver Manager");
}
