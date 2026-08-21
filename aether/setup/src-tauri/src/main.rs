#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use tauri::AppHandle;

#[tauri::command]
fn create_user_account(username: String, password: Option<String>, app: AppHandle) -> Result<String, String> {
    let u = if username.trim().is_empty() { "aether" } else { username.trim() };
    
    // Add user to essential developer and hardware groups
    let _ = Command::new("useradd")
        .args(["-m", "-G", "wheel,audio,video,input,storage,network,dialout,docker", "-s", "/bin/bash", u])
        .output();

    if let Some(pwd) = password {
        if !pwd.is_empty() {
            let mut child = Command::new("chpasswd")
                .stdin(std::process::Stdio::piped())
                .spawn()
                .map_err(|e| e.to_string())?;

            if let Some(mut stdin) = child.stdin.take() {
                use std::io::Write;
                let _ = write!(stdin, "{}:{}\n", u, pwd);
            }
            let _ = child.wait();
        }
    }

    // Configure SDDM autologin
    let sddm_cfg = format!("[General]\nDisplayServer=wayland\n\n[Theme]\nCurrent=aetheros-glass\nThemeDir=/usr/share/sddm/themes\n\n[Autologin]\nUser={}\nSession=hyprland\nRelogin=false\n", u);
    let _ = std::fs::create_dir_all("/etc/sddm.conf.d");
    let _ = std::fs::write("/etc/sddm.conf.d/aetheros.conf", sddm_cfg);

    app.exit(0);
    Ok("User setup complete".into())
}

#[tauri::command]
fn close_welcome(app: AppHandle) {
    app.exit(0);
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![create_user_account, close_welcome])
        .run(tauri::generate_context!())
        .expect("error while running Aether Welcome Wizard");
}
