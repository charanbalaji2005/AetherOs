use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};
use sysinfo::{CpuRefreshKind, Disks, MemoryRefreshKind, RefreshKind, System};
use zbus::{dbus_interface, ConnectionBuilder};

struct TelemetryService {
    sys: Arc<Mutex<System>>,
}

#[dbus_interface(name = "com.aetheros.TelemetryService")]
impl TelemetryService {
    async fn get_system_metrics(&self) -> String {
        let mut sys = self.sys.lock().unwrap();
        sys.refresh_all();

        let cpu_usage: f32 = sys.global_cpu_info().cpu_usage();
        let total_mem = sys.total_memory() / (1024 * 1024);
        let used_mem = sys.used_memory() / (1024 * 1024);
        let temp = read_thermal_temp();

        let disks = Disks::new_with_refreshed_list();
        let mut total_disk: u64 = 0;
        let mut available_disk: u64 = 0;
        for disk in &disks {
            total_disk += disk.total_space();
            available_disk += disk.available_space();
        }
        let total_disk_gb = total_disk / (1024 * 1024 * 1024);
        let used_disk_gb = (total_disk - available_disk) / (1024 * 1024 * 1024);

        let data = serde_json::json!({
            "cpu_usage_percent": cpu_usage,
            "memory_used_mb": used_mem,
            "memory_total_mb": total_mem,
            "disk_used_gb": used_disk_gb,
            "disk_total_gb": total_disk_gb,
            "cpu_temp_celsius": temp,
            "os_kernel": System::kernel_version().unwrap_or_else(|| "Linux 6.x".into()),
            "uptime_seconds": System::uptime()
        });

        serde_json::to_string(&data).unwrap_or_else(|_| "{}".into())
    }

    async fn get_cpu_temperature(&self) -> f32 {
        read_thermal_temp()
    }

    async fn get_memory_usage(&self) -> (u64, u64) {
        let mut sys = self.sys.lock().unwrap();
        sys.refresh_memory_specifics(MemoryRefreshKind::new().with_ram());
        (
            sys.used_memory() / (1024 * 1024),
            sys.total_memory() / (1024 * 1024),
        )
    }

    async fn get_disk_usage(&self) -> (u64, u64) {
        let disks = Disks::new_with_refreshed_list();
        let mut total: u64 = 0;
        let mut avail: u64 = 0;
        for disk in &disks {
            total += disk.total_space();
            avail += disk.available_space();
        }
        (
            (total - avail) / (1024 * 1024 * 1024),
            total / (1024 * 1024 * 1024),
        )
    }
}

fn read_thermal_temp() -> f32 {
    let zone_path = Path::new("/sys/class/thermal/thermal_zone0/temp");
    if let Ok(content) = fs::read_to_string(zone_path) {
        if let Ok(milli) = content.trim().parse::<f32>() {
            return milli / 1000.0;
        }
    }
    42.0 // Optimal nominal default if virtualized
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let sys = System::new_with_specifics(
        RefreshKind::new()
            .with_cpu(CpuRefreshKind::everything())
            .with_memory(MemoryRefreshKind::everything()),
    );
    let service = TelemetryService {
        sys: Arc::new(Mutex::new(sys)),
    };

    let _conn = ConnectionBuilder::system()?
        .name("com.aetheros.TelemetryService")?
        .serve_at("/com/aetheros/Telemetry", service)?
        .build()
        .await?;

    println!("AetherOS Telemetry Daemon started on D-Bus (com.aetheros.TelemetryService)");

    std::future::pending::<()>().await;
    Ok(())
}
