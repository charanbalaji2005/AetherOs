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
fn restore_snapshot(name: String) -> Result<String, String> {
    let output = Command::new("pkexec")
        .args(["/usr/local/bin/aether-snapshot-core", "restore", &name])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(format!("Rollback staged to '{}'. Please reboot your system immediately.", name))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
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
            delete_snapshot
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aether Recovery snapshot manager");
}
