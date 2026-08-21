use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use zbus::{dbus_interface, ConnectionBuilder};

struct UpdateEngine {
    last_checked: Arc<Mutex<u64>>,
    is_busy: Arc<Mutex<bool>>,
}

#[dbus_interface(name = "com.aetheros.UpdateEngine")]
impl UpdateEngine {
    async fn check_updates(&self) -> (bool, u32, String) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        *self.last_checked.lock().unwrap() = now;

        let dnf_check = Command::new("dnf")
            .args(["check-update", "--quiet"])
            .output();

        let mut count: u32 = 0;
        let mut msg = "System is fully up to date.".to_string();

        if let Ok(output) = dnf_check {
            // exit code 100 in dnf indicates updates available
            if output.status.code() == Some(100) {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let lines: Vec<&str> = stdout.lines().filter(|l| !l.trim().is_empty()).collect();
                count = lines.len() as u32;
                msg = format!("{} system updates available.", count);
            }
        }

        (count > 0, count, msg)
    }

    async fn apply_updates(&self) -> Result<String, zbus::fdo::Error> {
        let mut busy = self.is_busy.lock().unwrap();
        if *busy {
            return Err(zbus::fdo::Error::Failed("Update already in progress".into()));
        }
        *busy = true;
        drop(busy);

        let dnf_up = Command::new("dnf")
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

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let engine = UpdateEngine {
        last_checked: Arc::new(Mutex::new(0)),
        is_busy: Arc::new(Mutex::new(false)),
    };

    let _conn = ConnectionBuilder::system()?
        .name("com.aetheros.UpdateEngine")?
        .serve_at("/com/aetheros/UpdateEngine", engine)?
        .build()
        .await?;

    println!("AetherOS Update Engine Daemon started on D-Bus (com.aetheros.UpdateEngine)");

    std::future::pending::<()>().await;
    Ok(())
}
