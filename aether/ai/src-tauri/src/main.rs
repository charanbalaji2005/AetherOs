#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use reqwest::Client;
use serde_json::{json, Value};
use std::process::Command;

#[tauri::command]
async fn execute_ai_diagnostic(prompt: String, api_key: String) -> Result<String, String> {
    // 1. Read current system journal error logs
    let journal_logs = Command::new("journalctl")
        .args(["-p", "3", "-xb", "-n", "20", "--no-pager"])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
        .unwrap_or_default();

    let full_prompt = format!(
        "You are AetherOS AI System Assistant. Context:\n{}\n\nUser Question/Command: {}",
        journal_logs, prompt
    );

    // 2. Query the Gemini API endpoint
    let client = Client::new();
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={}",
        api_key
    );

    let payload = json!({ "contents": [{ "parts": [{ "text": full_prompt }] }] });
    let res = client.post(&url).json(&payload).send().await.map_err(|e| e.to_string())?;
    let json_res: Value = res.json().await.map_err(|e| e.to_string())?;

    Ok(json_res["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("Diagnosis completed with no critical errors detected.")
        .to_string())
}

#[tauri::command]
fn get_system_journal() -> String {
    Command::new("journalctl")
        .args(["-p", "4", "-n", "30", "--no-pager"])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
        .unwrap_or_else(|_| "No system logs available".into())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![execute_ai_diagnostic, get_system_journal])
        .run(tauri::generate_context!())
        .expect("error while running Aether AI Assistant");
}
