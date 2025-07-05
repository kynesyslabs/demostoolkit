// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_shell::ShellExt;

#[tauri::command]
async fn run_demostool(app: tauri::AppHandle, command: String, args: Vec<String>) -> Result<String, String> {
    // Get the path to the CLI tool (relative to the app)
    let cli_path = "../../demostools_file.ts";
    
    // Build the command arguments
    let mut cmd_args = vec![cli_path.to_string(), command];
    cmd_args.extend(args);
    
    // Execute the command using the shell plugin
    let output = app.shell()
        .command("bun")
        .args(cmd_args)
        .output()
        .await
        .map_err(|e| format!("Failed to execute command: {}", e))?;
    
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn get_available_commands() -> Result<Vec<String>, String> {
    let commands = vec![
        "generate-wallet".to_string(),
        "check-balance".to_string(),
        "send".to_string(),
        "sign".to_string(),
        "verify".to_string(),
        "encrypt".to_string(),
        "hash".to_string(),
        "multichain".to_string(),
        "web2-identity".to_string(),
        "web2-proxy".to_string(),
        "network-info".to_string(),
        "get-block".to_string(),
        "get-mempool".to_string(),
        "get-transaction".to_string(),
        "get-nonce".to_string(),
        "batch-sign".to_string(),
        "config".to_string(),
        "bridge".to_string(),
    ];
    Ok(commands)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![run_demostool, get_available_commands])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}