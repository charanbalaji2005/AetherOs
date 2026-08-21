use std::fs;
use std::path::Path;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use zbus::{dbus_interface, ConnectionBuilder};

struct BatteryManager {
    current_profile: Arc<Mutex<String>>,
}

#[dbus_interface(name = "com.aetheros.BatteryService")]
impl BatteryManager {
    async fn get_battery_status(&self) -> (bool, u32, String) {
        let (online, capacity) = read_power_supply();
        let profile = self.current_profile.lock().unwrap().clone();
        (online, capacity, profile)
    }

    async fn get_battery_capacity(&self) -> u32 {
        let (_, capacity) = read_power_supply();
        capacity
    }

    async fn set_governor(&self, mode: String) -> Result<String, zbus::fdo::Error> {
        let mode_clean = mode.trim().to_lowercase();
        let canonical = match mode_clean.as_str() {
            "performance" => "performance",
            "balanced" => "balanced",
            "power-saver" | "powersave" | "power_saver" => "power-saver",
            _ => return Err(zbus::fdo::Error::InvalidArgs("Invalid governor mode. Must be 'performance', 'balanced', or 'power-saver'.".into())),
        };

        let _ = Command::new("powerprofilesctl")
            .args(["set", canonical])
            .output();

        let mut lock = self.current_profile.lock().unwrap();
        *lock = canonical.to_string();

        Ok(format!("Governor set to {}", canonical))
    }

    async fn get_governor(&self) -> String {
        self.current_profile.lock().unwrap().clone()
    }

    async fn set_power_profile(&self, profile: String) -> Result<String, zbus::fdo::Error> {
        self.set_governor(profile).await
    }

    async fn get_power_profile(&self) -> String {
        self.get_governor().await
    }
}

fn read_power_supply() -> (bool, u32) {
    let supply_dir = Path::new("/sys/class/power_supply");
    if !supply_dir.exists() {
        return (true, 100);
    }

    let mut online = true;
    let mut capacity = 100;

    if let Ok(entries) = fs::read_dir(supply_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            let type_path = path.join("type");

            if let Ok(content) = fs::read_to_string(&type_path) {
                let dev_type = content.trim();
                if dev_type == "Mains" {
                    if let Ok(on_val) = fs::read_to_string(path.join("online")) {
                        online = on_val.trim() == "1";
                    }
                } else if dev_type == "Battery" {
                    if let Ok(cap_val) = fs::read_to_string(path.join("capacity")) {
                        if let Ok(c) = cap_val.trim().parse::<u32>() {
                            capacity = c;
                        }
                    }
                }
            }
        }
    }

    (online, capacity)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let current_profile = Arc::new(Mutex::new("balanced".to_string()));
    let manager = BatteryManager {
        current_profile: current_profile.clone(),
    };

    // Connect to system D-Bus
    let _conn = ConnectionBuilder::system()?
        .name("com.aetheros.BatteryService")?
        .serve_at("/com/aetheros/Battery", manager)?
        .build()
        .await?;

    println!("AetherOS Battery Management Daemon started on D-Bus (com.aetheros.BatteryService)");

    // Background monitoring task: dynamically adjust power governors
    let monitor_profile = current_profile.clone();
    tokio::spawn(async move {
        let mut last_plugged = true;
        loop {
            let (online, capacity) = read_power_supply();

            if online != last_plugged {
                let target = if online {
                    "performance"
                } else if capacity < 20 {
                    "power-saver"
                } else {
                    "balanced"
                };

                let _ = Command::new("powerprofilesctl")
                    .args(["set", target])
                    .output();

                let mut lock = monitor_profile.lock().unwrap();
                *lock = target.to_string();
                last_plugged = online;
            }

            tokio::time::sleep(Duration::from_secs(5)).await;
        }
    });

    // Keep daemon running
    std::future::pending::<()>().await;
    Ok(())
}
