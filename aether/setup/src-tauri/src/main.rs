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
fn create_system_user(username: String, fullname: String, password: String) -> Result<String, String> {
    let mut child = std::process::Command::new("pkexec")
        .arg("/usr/local/bin/aether-setup-core")
        .arg("create-user")
        .arg(&username)
        .arg(&fullname)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn setup script: {}", e))?;

    if let Some(mut stdin) = child.stdin.take() {
        let _ = std::io::Write::write_all(&mut stdin, format!("{}\n", password).as_bytes());
    }

    let output = child.wait_with_output().map_err(|e| format!("Failed to wait on child: {}", e))?;

    if output.status.success() {
        Ok("User account configured securely.".into())
    } else {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("User creation failed: {}", err_msg))
    }
}

#[tauri::command]
fn complete_setup(payload: SetupPayload) -> Result<String, String> {
    let lang = payload.language.unwrap_or_else(|| "en_US.UTF-8".to_string());
    let country = payload.country.unwrap_or_else(|| "us".to_string());

    let mut child = std::process::Command::new("pkexec")
        .args([
            "/usr/local/bin/aether-setup-core",
            "apply-setup",
            &payload.username,
            &payload.full_name,
            &payload.timezone,
            &payload.hostname,
            &lang,
            &country,
        ])
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn setup engine: {}", e))?;

    if let Some(mut stdin) = child.stdin.take() {
        let _ = std::io::Write::write_all(&mut stdin, format!("{}\n", payload.password).as_bytes());
    }

    let output = child.wait_with_output().map_err(|e| format!("Failed to wait on setup engine: {}", e))?;

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

#[tauri::command]
fn stage_secure_boot_key() -> Result<String, String> {
    let password = "aether\naether\n";

    let mut child = std::process::Command::new("pkexec")
        .arg("mokutil")
        .arg("--import")
        .arg("/etc/pki/akmods/certs/public_key.der")
        .stdin(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn mokutil: {}", e))?;

    if let Some(mut stdin) = child.stdin.take() {
        let _ = std::io::Write::write_all(&mut stdin, password.as_bytes());
    }

    let output = child.wait_with_output().map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok("Key successfully staged. You must approve it upon reboot.".into())
    } else {
        Err("Failed to stage Secure Boot key or key already enrolled.".into())
    }
}

#[tauri::command]
fn finalize_setup_and_reboot() -> Result<String, String> {
    let output = std::process::Command::new("pkexec")
        .arg("/usr/local/bin/aether-finalize-setup")
        .output()
        .map_err(|e| format!("Failed to spawn finalization process: {}", e))?;

    if output.status.success() {
        Ok("Setup finalized. System is rebooting...".into())
    } else {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("Finalization error: {}", err_msg))
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
            create_system_user,
            complete_setup,
            reboot_system,
            stage_secure_boot_key,
            finalize_setup_and_reboot
        ])
        .run(tauri::generate_context!())
        .expect("error while running aether setup wizard");
}
