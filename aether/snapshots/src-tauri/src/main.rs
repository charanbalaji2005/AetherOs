#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;

/// Called by the Time-Travel UI: returns raw CSV output from `snapper --csv list`
#[tauri::command]
fn get_snapshots() -> Result<String, String> {
    // Try native snapper first (installed systems)
    let output = Command::new("snapper")
        .args(["--csv", "list"])
        .output();

    match output {
        Ok(out) if out.status.success() => {
            Ok(String::from_utf8_lossy(&out.stdout).to_string())
        }
        _ => {
            // Fall back to the custom aether-snapshot-core backend
            let out = Command::new("pkexec")
                .args(["/usr/local/bin/aether-snapshot-core", "list"])
                .output()
                .map_err(|e| e.to_string())?;

            // Convert line-based output to pseudo-CSV for the frontend
            let lines = String::from_utf8_lossy(&out.stdout);
            let mut rows: Vec<String> = vec![
                "\"config\",\"#\",\"type\",\"date\",\"description\"".to_string(),
            ];
            for (i, line) in lines.lines().enumerate() {
                if line.trim().is_empty() { continue; }
                let parts: Vec<&str> = line.splitn(4, '|').collect();
                let id   = parts.first().unwrap_or(&"").trim();
                let ty   = parts.get(1).unwrap_or(&"single").trim();
                let date = parts.get(2).unwrap_or(&"").trim();
                let desc = parts.get(3).unwrap_or(&"Automatic checkpoint").trim();
                rows.push(format!("\"root\",\"{id}\",\"{ty}\",\"{date}\",\"{desc}\""));
                let _ = i;
            }
            Ok(rows.join("\n"))
        }
    }
}

/// Alias used directly by the React frontend via invoke("rollback_system", { snapshotId })
#[tauri::command]
fn rollback_system(snapshot_id: String) -> Result<String, String> {
    rollback_snapshot(snapshot_id)
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
        // Trigger clean reboot to load the restored Btrfs subvolume
        let _ = Command::new("systemctl").arg("reboot").spawn();
        Ok(format!(
            "Successfully rolled back system to snapshot #{}. Please reboot.",
            snapshot_id
        ))
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
        Ok(format!("Snapshot '{}' deleted.", name))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_snapshots,
            rollback_system,
            create_snapshot,
            restore_snapshot,
            rollback_snapshot,
            delete_snapshot
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aether Time-Travel Vault");
}
