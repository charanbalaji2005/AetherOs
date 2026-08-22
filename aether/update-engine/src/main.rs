use std::process::Command;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use zbus::{dbus_interface, ConnectionBuilder};

struct UpdateEngine {
    last_checked: Arc<Mutex<u64>>,
    is_busy: Arc<Mutex<bool>>,
}

#[dbus_interface(name = "com.aetheros.UpdateEngine")]
impl UpdateEngine {
    async fn check_updates(&self) -> (bool, u32, String) {
        let (dnf_count, flatpak_count) = check_all_updates();
        let total = dnf_count + flatpak_count;
        let msg = if total > 0 {
            format!("{} system updates and {} app updates available.", dnf_count, flatpak_count)
        } else {
            "System is fully up to date.".to_string()
        };

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        *self.last_checked.lock().unwrap() = now;

        (total > 0, total, msg)
    }

    async fn apply_updates(&self) -> Result<String, zbus::fdo::Error> {
        let mut busy = self.is_busy.lock().unwrap();
        if *busy {
            return Err(zbus::fdo::Error::Failed("Update already in progress".into()));
        }
        *busy = true;
        drop(busy);

        let dnf_cmd = if Command::new("which").arg("dnf5").output().map(|o| o.status.success()).unwrap_or(false) {
            "dnf5"
        } else {
            "dnf"
        };

        let dnf_up = Command::new(dnf_cmd)
            .args(["upgrade", "--refresh", "-y"])
            .output();

        let flatpak_up = Command::new("flatpak")
            .args(["update", "-y"])
            .output();

        let mut busy = self.is_busy.lock().unwrap();
        *busy = false;

        match (dnf_up, flatpak_up) {
            (Ok(_), Ok(_)) => Ok("All system and Flatpak updates applied successfully.".into()),
            _ => Err(zbus::fdo::Error::Failed("Failed to execute upgrade package manager".into())),
        }
    }

    async fn get_last_check_time(&self) -> u64 {
        *self.last_checked.lock().unwrap()
    }
}

/// Helper function to scan DNF5 / DNF and Flatpak for pending updates
fn check_all_updates() -> (u32, u32) {
    let dnf_cmd = if Command::new("which").arg("dnf5").output().map(|o| o.status.success()).unwrap_or(false) {
        "dnf5"
    } else {
        "dnf"
    };

    // 1. Check for DNF/DNF5 system updates
    let dnf_count = match Command::new(dnf_cmd).arg("check-update").output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            stdout
                .lines()
                .filter(|l| {
                    let trim = l.trim();
                    !trim.is_empty() && (trim.contains(".x86_64") || trim.contains(".noarch") || trim.contains("updates"))
                })
                .count() as u32
        }
        Err(_) => 0,
    };

    // 2. Check for Flatpak app updates
    let flatpak_count = match Command::new("flatpak").args(["remote-updates", "--columns=application"]).output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            stdout
                .lines()
                .filter(|l| !l.trim().is_empty())
                .count() as u32
        }
        Err(_) => 0,
    };

    (dnf_count, flatpak_count)
}

/// Periodic background notification loop (checks every 6 hours)
fn start_background_notifier() {
    thread::spawn(|| {
        // Initial delay on startup (give desktop 45 seconds to settle)
        thread::sleep(Duration::from_secs(45));

        loop {
            let (dnf_count, flatpak_count) = check_all_updates();
            let total = dnf_count + flatpak_count;

            if total > 0 {
                let msg = format!(
                    "{} System updates and {} App updates are available in the Aether Software Center.",
                    dnf_count, flatpak_count
                );

                let _ = Command::new("notify-send")
                    .args([
                        "--app-name=Aether Software",
                        "--icon=software-update-available",
                        "--urgency=normal",
                        "Software Updates Ready",
                        &msg,
                    ])
                    .output();
            }

            // Sleep 6 hours (21600 seconds) before next scan
            thread::sleep(Duration::from_secs(21600));
        }
    });
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("AetherOS Background Update Engine Daemon initializing...");

    // Start background check & notification thread
    start_background_notifier();

    // Setup D-Bus Interface for Software Center integration
    let engine = UpdateEngine {
        last_checked: Arc::new(Mutex::new(0)),
        is_busy: Arc::new(Mutex::new(false)),
    };

    // Try system D-Bus first, fallback to session D-Bus if unprivileged
    let _conn = match ConnectionBuilder::system() {
        Ok(builder) => {
            builder
                .name("com.aetheros.UpdateEngine")?
                .serve_at("/com/aetheros/UpdateEngine", engine)?
                .build()
                .await
                .ok()
        }
        Err(_) => None,
    };

    println!("AetherOS Update Engine active. Monitoring system & Flatpak repositories.");

    // Keep daemon running indefinitely
    std::future::pending::<()>().await;
    Ok(())
}
