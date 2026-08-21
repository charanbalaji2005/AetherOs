#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;

#[tauri::command]
fn get_snapshots() -> Result<Vec<String>, String> {
    let output = Command::new("pkexec")
        .args(["/usr/local/bin/aether-snapshot-core", "list"])
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let snapshots: Vec<String> = stdout
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(|s| s.to_string())
        .collect();

    Ok(snapshots)
}

#[tauri::command]
fn create_snapshot(name: String) -> Result<String, String> {
    let output = Command::new("pkexec")
        .args(["/usr/local/bin/aether-snapshot-core", "create", &name])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(format!("Snapshot '{}' created successfully.", name))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn rollback_snapshot(snapshot_id: String) -> Result<String, String> {
    // If it's a numeric Snapper ID or standard subvolume name, call the appropriate rollback engine
    let output = if snapshot_id.chars().all(|c| c.is_ascii_digit()) {
        Command::new("pkexec")
            .args(["/usr/local/bin/aether-snapper-rollback", &snapshot_id])
            .output()
            .map_err(|e| format!("Execution failed: {}", e))?
    } else {
        Command::new("pkexec")
            .args(["/usr/local/bin/aether-snapshot-core", "restore", &snapshot_id])
            .output()
            .map_err(|e| format!("Execution failed: {}", e))?
    };

    if output.status.success() {
        // Trigger an immediate reboot to cleanly load the restored subvolume
        let _ = Command::new("systemctl").arg("reboot").spawn();
        Ok(format!("Rollback to '{}' successful. Rebooting system now...", snapshot_id))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn restore_snapshot(name: String) -> Result<String, String> {
    rollback_snapshot(name)
}

#[tauri::command]
fn delete_snapshot(name: String) -> Result<String, String> {
    let output = Command::new("pkexec")
        .args(["/usr/local/bin/aether-snapshot-core", "delete", &name])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(format!("Snapshot '{}' deleted successfully.", name))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_snapshots,
            create_snapshot,
            restore_snapshot,
            rollback_snapshot,
            delete_snapshot
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aether Recovery snapshot manager");
}
