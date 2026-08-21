#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppRecord {
    pub app_id: String,
    pub name: String,
    pub description: String,
    pub source: String,       // "flathub" | "dnf"
    pub category: String,     // "development" | "gaming" | "media" | "browsers" | "productivity" | "utilities"
    pub icon: String,
    pub is_installed: bool,
}

// Curated high-performance applications available out-of-the-box
fn get_curated_catalog() -> Vec<AppRecord> {
    vec![
        // Development
        AppRecord {
            app_id: "com.visualstudio.code".into(),
            name: "Visual Studio Code".into(),
            description: "Code editing redefined. Powerful lightweight source code editor.".into(),
            source: "flathub".into(),
            category: "development".into(),
            icon: "💻".into(),
            is_installed: false,
        },
        AppRecord {
            app_id: "com.jetbrains.IntelliJ-IDEA-Community".into(),
            name: "IntelliJ IDEA".into(),
            description: "Capable and Ergonomic IDE for JVM, Kotlin, and Web Development.".into(),
            source: "flathub".into(),
            category: "development".into(),
            icon: "☕".into(),
            is_installed: false,
        },
        AppRecord {
            app_id: "git".into(),
            name: "Git Version Control".into(),
            description: "Fast, scalable, distributed revision control system.".into(),
            source: "dnf".into(),
            category: "development".into(),
            icon: "🌿".into(),
            is_installed: false,
        },
        AppRecord {
            app_id: "docker-ce".into(),
            name: "Docker Engine".into(),
            description: "Enterprise container platform for modern distributed applications.".into(),
            source: "dnf".into(),
            category: "development".into(),
            icon: "🐳".into(),
            is_installed: false,
        },
        // Browsers
        AppRecord {
            app_id: "com.brave.Browser".into(),
            name: "Brave Browser".into(),
            description: "Fast, privacy-first web browser with built-in ad and tracker blocking.".into(),
            source: "flathub".into(),
            category: "browsers".into(),
            icon: "🦁".into(),
            is_installed: false,
        },
        AppRecord {
            app_id: "com.google.Chrome".into(),
            name: "Google Chrome".into(),
            description: "The fast, secure, and smart web browser built for modern web experiences.".into(),
            source: "flathub".into(),
            category: "browsers".into(),
            icon: "🌐".into(),
            is_installed: false,
        },
        AppRecord {
            app_id: "app.zen_browser.zen".into(),
            name: "Zen Browser".into(),
            description: "Beautifully designed, high-performance Firefox-based browser.".into(),
            source: "flathub".into(),
            category: "browsers".into(),
            icon: "⚡".into(),
            is_installed: false,
        },
        // Gaming
        AppRecord {
            app_id: "com.valvesoftware.Steam".into(),
            name: "Steam".into(),
            description: "The premier platform for PC games, Proton compatibility, and community.".into(),
            source: "flathub".into(),
            category: "gaming".into(),
            icon: "🎮".into(),
            is_installed: false,
        },
        AppRecord {
            app_id: "com.heroicgameslauncher.hgl".into(),
            name: "Heroic Games Launcher".into(),
            description: "Native Open Source Epic Games, GOG, and Prime Gaming launcher.".into(),
            source: "flathub".into(),
            category: "gaming".into(),
            icon: "⚔️".into(),
            is_installed: false,
        },
        AppRecord {
            app_id: "net.lutris.Lutris".into(),
            name: "Lutris Gaming".into(),
            description: "Open Gaming Platform for Linux with automated game runners.".into(),
            source: "flathub".into(),
            category: "gaming".into(),
            icon: "🕹️".into(),
            is_installed: false,
        },
        AppRecord {
            app_id: "com.discordapp.Discord".into(),
            name: "Discord".into(),
            description: "Voice, video, and text communication service for gaming communities.".into(),
            source: "flathub".into(),
            category: "gaming".into(),
            icon: "🎧".into(),
            is_installed: false,
        },
        // Creative & Media
        AppRecord {
            app_id: "org.blender.Blender".into(),
            name: "Blender 3D".into(),
            description: "Full-featured 3D modeling, sculpting, animation, and rendering suite.".into(),
            source: "flathub".into(),
            category: "media".into(),
            icon: "🎨".into(),
            is_installed: false,
        },
        AppRecord {
            app_id: "com.obsproject.Studio".into(),
            name: "OBS Studio".into(),
            description: "Free and open source software for video recording and live streaming.".into(),
            source: "flathub".into(),
            category: "media".into(),
            icon: "📹".into(),
            is_installed: false,
        },
        AppRecord {
            app_id: "org.gimp.GIMP".into(),
            name: "GIMP Image Editor".into(),
            description: "High-end photo retouching and graphic composition tool.".into(),
            source: "flathub".into(),
            category: "media".into(),
            icon: "🖌️".into(),
            is_installed: false,
        },
        AppRecord {
            app_id: "com.spotify.Client".into(),
            name: "Spotify Music".into(),
            description: "Digital music, podcast, and streaming service with millions of songs.".into(),
            source: "flathub".into(),
            category: "media".into(),
            icon: "🎵".into(),
            is_installed: false,
        },
        // Productivity
        AppRecord {
            app_id: "md.obsidian.Obsidian".into(),
            name: "Obsidian Notes".into(),
            description: "Sharpen your thinking. Extensible markdown knowledge base and vault.".into(),
            source: "flathub".into(),
            category: "productivity".into(),
            icon: "📝".into(),
            is_installed: false,
        },
        AppRecord {
            app_id: "org.libreoffice.LibreOffice".into(),
            name: "LibreOffice Suite".into(),
            description: "Full-featured office suite (Docs, Spreadsheets, Presentations).".into(),
            source: "flathub".into(),
            category: "productivity".into(),
            icon: "📊".into(),
            is_installed: false,
        },
        AppRecord {
            app_id: "org.telegram.desktop".into(),
            name: "Telegram Desktop".into(),
            description: "Fast and secure cloud-based messaging app.".into(),
            source: "flathub".into(),
            category: "productivity".into(),
            icon: "✈️".into(),
            is_installed: false,
        },
        // Utilities
        AppRecord {
            app_id: "fastfetch".into(),
            name: "Fastfetch".into(),
            description: "Neofetch-like tool for fetching system information and styling.".into(),
            source: "dnf".into(),
            category: "utilities".into(),
            icon: "⚡".into(),
            is_installed: true,
        },
        AppRecord {
            app_id: "htop".into(),
            name: "Htop Process Viewer".into(),
            description: "Interactive process viewer and system resource monitor.".into(),
            source: "dnf".into(),
            category: "utilities".into(),
            icon: "📈".into(),
            is_installed: false,
        },
    ]
}

#[tauri::command]
fn get_featured_catalog() -> Result<Vec<AppRecord>, String> {
    let installed_flatpaks = get_installed_flatpak_ids();
    let mut catalog = get_curated_catalog();
    
    for app in &mut catalog {
        if app.source == "flathub" {
            app.is_installed = installed_flatpaks.contains(&app.app_id);
        } else {
            // Check RPM presence
            app.is_installed = check_rpm_installed(&app.app_id);
        }
    }
    
    Ok(catalog)
}

#[tauri::command]
fn get_installed_apps() -> Result<Vec<AppRecord>, String> {
    let output = Command::new("flatpak")
        .args(["list", "--app", "--columns=application,name,description"])
        .output()
        .map_err(|e| e.to_string())?;

    let mut apps = parse_flatpak_output(String::from_utf8_lossy(&output.stdout).to_string());
    
    // Check curated system RPMs that are installed
    for curated in get_curated_catalog() {
        if curated.source == "dnf" && check_rpm_installed(&curated.app_id) {
            let mut app = curated.clone();
            app.is_installed = true;
            apps.push(app);
        }
    }
    
    Ok(apps)
}

#[tauri::command]
fn search_apps(query: String) -> Result<Vec<AppRecord>, String> {
    let q = query.trim().to_lowercase();
    if q.is_empty() {
        return get_featured_catalog();
    }

    let mut results = Vec::new();
    let installed_flatpaks = get_installed_flatpak_ids();

    // 1. Search Curated Catalog First
    for mut app in get_curated_catalog() {
        if app.name.to_lowercase().contains(&q) || app.description.to_lowercase().contains(&q) || app.category.contains(&q) {
            if app.source == "flathub" {
                app.is_installed = installed_flatpaks.contains(&app.app_id);
            } else {
                app.is_installed = check_rpm_installed(&app.app_id);
            }
            results.push(app);
        }
    }

    // 2. Query Flathub CLI for broad search
    if let Ok(output) = Command::new("flatpak")
        .args(["search", &query, "--columns=application,name,description"])
        .output()
    {
        let flathub_apps = parse_flatpak_output(String::from_utf8_lossy(&output.stdout).to_string());
        for mut f_app in flathub_apps {
            if !results.iter().any(|r| r.app_id == f_app.app_id) {
                f_app.is_installed = installed_flatpaks.contains(&f_app.app_id);
                results.push(f_app);
            }
        }
    }

    Ok(results)
}

#[tauri::command]
fn install_app(app_id: String, source: Option<String>) -> Result<String, String> {
    let pkg_source = source.unwrap_or_else(|| "flathub".into());

    if pkg_source == "dnf" {
        // DNF Package installation via Polkit
        let output = Command::new("pkexec")
            .args(["dnf", "install", "-y", &app_id])
            .output()
            .map_err(|e| format!("Failed to invoke DNF: {}", e))?;

        if output.status.success() {
            Ok(format!("Successfully installed {}", app_id))
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    } else {
        // Flatpak Package installation
        let output = Command::new("flatpak")
            .args(["install", "flathub", &app_id, "--noninteractive", "-y"])
            .output()
            .map_err(|e| format!("Failed to invoke Flatpak: {}", e))?;

        if output.status.success() {
            Ok(format!("Successfully installed {}", app_id))
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }
}

#[tauri::command]
fn uninstall_app(app_id: String, source: Option<String>) -> Result<String, String> {
    let pkg_source = source.unwrap_or_else(|| "flathub".into());

    if pkg_source == "dnf" {
        let output = Command::new("pkexec")
            .args(["dnf", "remove", "-y", &app_id])
            .output()
            .map_err(|e| format!("Failed to remove DNF package: {}", e))?;

        if output.status.success() {
            Ok(format!("Successfully removed {}", app_id))
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    } else {
        let output = Command::new("flatpak")
            .args(["uninstall", &app_id, "--noninteractive", "-y"])
            .output()
            .map_err(|e| format!("Failed to remove Flatpak: {}", e))?;

        if output.status.success() {
            Ok(format!("Successfully removed {}", app_id))
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }
}

#[tauri::command]
fn launch_app(app_id: String, source: Option<String>) -> Result<String, String> {
    let pkg_source = source.unwrap_or_else(|| "flathub".into());

    if pkg_source == "dnf" {
        let _ = Command::new(&app_id).spawn().map_err(|e| e.to_string())?;
    } else {
        let _ = Command::new("flatpak")
            .args(["run", &app_id])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(format!("Launched {}", app_id))
}

fn get_installed_flatpak_ids() -> Vec<String> {
    if let Ok(output) = Command::new("flatpak").args(["list", "--app", "--columns=application"]).output() {
        String::from_utf8_lossy(&output.stdout)
            .lines()
            .map(|l| l.trim().to_string())
            .filter(|l| !l.is_empty())
            .collect()
    } else {
        Vec::new()
    }
}

fn check_rpm_installed(pkg_name: &str) -> bool {
    if let Ok(output) = Command::new("rpm").args(["-q", pkg_name]).output() {
        output.status.success()
    } else {
        false
    }
}

fn parse_flatpak_output(stdout: String) -> Vec<AppRecord> {
    let mut apps = Vec::new();
    for line in stdout.lines() {
        let parts: Vec<&str> = line.split('\t').collect();
        if parts.len() >= 3 {
            apps.push(AppRecord {
                app_id: parts[0].trim().to_string(),
                name: parts[1].trim().to_string(),
                description: parts[2].trim().to_string(),
                source: "flathub".into(),
                category: "general".into(),
                icon: "📦".into(),
                is_installed: true,
            });
        }
    }
    apps
}

/// Alias matching frontend invoke("search_packages", { query })
#[tauri::command]
fn search_packages(query: String) -> Result<Vec<AppRecord>, String> {
    search_apps(query)
}

/// Alias matching frontend invoke("install_flatpak", { appId, source })
#[tauri::command]
fn install_flatpak(app_id: String, source: Option<String>) -> Result<String, String> {
    install_app(app_id, source)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // Primary handlers
            get_featured_catalog,
            get_installed_apps,
            search_apps,
            install_app,
            uninstall_app,
            launch_app,
            // Frontend invoke aliases
            search_packages,
            install_flatpak
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aether Software Center");
}
