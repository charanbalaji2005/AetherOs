#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs;
use std::io::Write;
use std::process::{Command, Stdio};
use serde::{Deserialize, Serialize};
use tauri::WindowEvent;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WifiNetwork {
    pub ssid: String,
    pub signal: String,
    pub security: String,
}

#[derive(Deserialize, Clone, Debug)]
pub struct SetupPayload {
    pub username: String,
    pub password: String,
    pub full_name: String,
    pub timezone: String,
    pub hostname: String,
    pub language: Option<String>,
    pub country: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct HardwareInfo {
    pub cpu: String,
    pub cores: String,
    pub memory: String,
    pub gpu: String,
    pub virtualization: String,
    pub kernel: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct UserCloudMetadata {
    pub username: String,
    pub fullname: String,
    pub hostname: String,
    pub timezone: String,
    pub language: String,
    pub theme: String,
    pub accent: String,
    pub third_party_repos: bool,
    pub telemetry_opt_in: bool,
    pub timestamp: String,
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

/// Validates and applies system timezone via timedatectl.
#[tauri::command]
fn set_system_timezone(timezone: String) -> Result<String, String> {
    if timezone.chars().any(|c| matches!(c, ';' | '&' | '|' | '$' | '`' | '\n' | '\r')) {
        return Err("Invalid timezone format: contains disallowed characters.".into());
    }

    let output = Command::new("pkexec")
        .args(["timedatectl", "set-timezone", &timezone])
        .output()
        .map_err(|e| format!("Failed to execute timedatectl: {}", e))?;

    if output.status.success() {
        Ok("Timezone successfully updated.".into())
    } else {
        Err(format!("Failed to set timezone: {}", String::from_utf8_lossy(&output.stderr)))
    }
}

/// Configures Fedora third-party and RPM Fusion repositories
#[tauri::command]
fn configure_third_party_repos(enable: bool) -> Result<String, String> {
    if enable {
        let output = Command::new("pkexec")
            .args(["fedora-third-party", "enable"])
            .output()
            .map_err(|e| format!("Failed to execute fedora-third-party: {}", e))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to enable third-party repos: {}", err));
        }
    } else {
        let _ = Command::new("pkexec")
            .args(["fedora-third-party", "disable"])
            .output();
    }
    Ok("Repository configuration applied successfully.".into())
}

/// Detects system hardware specs, GPU accelerator, RAM, and virtualization
#[tauri::command]
fn detect_hardware() -> Result<HardwareInfo, String> {
    // 1. CPU
    let cpu_info = fs::read_to_string("/proc/cpuinfo").unwrap_or_default();
    let cpu_model = cpu_info
        .lines()
        .find(|l| l.starts_with("model name"))
        .and_then(|l| l.split(':').nth(1))
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| "Generic 64-bit x86_64 Processor".into());

    let cpu_cores = cpu_info
        .lines()
        .filter(|l| l.starts_with("processor"))
        .count();

    // 2. Memory
    let mem_info = fs::read_to_string("/proc/meminfo").unwrap_or_default();
    let mem_total_kb = mem_info
        .lines()
        .find(|l| l.starts_with("MemTotal:"))
        .and_then(|l| l.split_whitespace().nth(1))
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(0);
    let mem_gb = format!("{:.1} GiB RAM", (mem_total_kb as f64) / (1024.0 * 1024.0));

    // 3. GPU
    let gpu = Command::new("sh")
        .arg("-c")
        .arg("lspci | grep -E -i 'vga|3d|display' | cut -d ':' -f3 | head -n1")
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|_| "Accelerated DRM KMS Graphics".into());

    let gpu_clean = if gpu.is_empty() { "Accelerated DRM KMS / Mesa 3D".into() } else { gpu };

    // 4. Virtualization
    let virt = Command::new("systemd-detect-virt")
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|_| "none".into());
    let virt_desc = if virt.is_empty() || virt == "none" { "Bare Metal (Physical Hardware)".into() } else { format!("Virtual Machine ({})", virt) };

    // 5. Kernel
    let kernel = Command::new("uname")
        .arg("-r")
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|_| "Linux Kernel 6.x".into());

    Ok(HardwareInfo {
        cpu: cpu_model,
        cores: format!("{} Cores / Threads", if cpu_cores > 0 { cpu_cores } else { 4 }),
        memory: if mem_total_kb > 0 { mem_gb } else { "16.0 GiB RAM (Estimated)".into() },
        gpu: gpu_clean,
        virtualization: virt_desc,
        kernel,
    })
}

/// Stores User Profile metadata strictly into local persistent SSD storage (~/.config/aether/user_profile.json)
/// 100% Offline & Private: No personal credentials or passwords ever leave the local machine.
#[tauri::command]
fn save_local_user_profile(metadata: UserCloudMetadata) -> Result<String, String> {
    // 1. Save local user preference config in user's home directory
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("/etc/aether"))
        .join("aether");
    let _ = fs::create_dir_all(&config_dir);
    let local_file = config_dir.join("user_profile.json");
    if let Ok(json_str) = serde_json::to_string_pretty(&metadata) {
        let _ = fs::write(local_file, json_str);
    }

    // 2. Persist to /var/lib/aetheros/ssd_storage if local SSD storage is mounted
    let ssd_path = std::path::Path::new("/var/lib/aetheros/ssd_storage/AetherOS/credentials");
    if ssd_path.exists() {
        let _ = fs::create_dir_all(ssd_path);
        let _ = fs::write(
            ssd_path.join("aether-profile.json"),
            serde_json::to_string_pretty(&metadata).unwrap_or_default(),
        );
    }

    Ok("Local user profile metadata securely saved.".into())
}

/// Creates primary system user securely via aether-setup-core. Password piped via stdin.
#[tauri::command]
fn create_system_user(username: String, fullname: String, password: String) -> Result<String, String> {
    if username.is_empty() {
        return Err("Username cannot be empty.".into());
    }
    if password.len() < 8 {
        return Err("Password must be at least 8 characters long.".into());
    }
    if !username.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_') {
        return Err("Username must be lowercase alphanumeric and may include underscores.".into());
    }

    let mut child = Command::new("pkexec")
        .arg("/usr/local/bin/aether-setup-core")
        .arg("create-user")
        .arg(&username)
        .arg(&fullname)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn setup script: {}", e))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(format!("{}\n", password).as_bytes())
            .map_err(|e| format!("Failed to write password to stdin: {}", e))?;
    }

    let output = child
        .wait_with_output()
        .map_err(|e| format!("Failed to wait on child process: {}", e))?;

    if output.status.success() {
        Ok("User account securely created.".into())
    } else {
        Err(format!("User creation failed: {}", String::from_utf8_lossy(&output.stderr)))
    }
}

/// Alias for finalize_setup_and_reboot
#[tauri::command]
fn finalize_oobe_setup() -> Result<String, String> {
    finalize_setup_and_reboot()
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
            set_system_timezone,
            scan_wifi,
            connect_wifi,
            configure_third_party_repos,
            detect_hardware,
            save_local_user_profile,
            create_system_user,
            complete_setup,
            reboot_system,
            stage_secure_boot_key,
            finalize_setup_and_reboot,
            finalize_oobe_setup
        ])
        .run(tauri::generate_context!())
        .expect("error while running aether setup wizard");
}
