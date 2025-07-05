// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_shell::ShellExt;

#[tauri::command]
async fn run_demostool(app: tauri::AppHandle, command: String, args: Vec<String>) -> Result<String, String> {
    // Try to find the CLI tool in multiple locations
    let cli_path = find_cli_tool_path()?;
    
    // Build the command arguments
    let mut cmd_args = vec![cli_path, command];
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

fn find_cli_tool_path() -> Result<String, String> {
    use std::path::Path;
    use std::env;
    
    // Debug info
    let current_dir = env::current_dir().unwrap_or_else(|_| "unknown".into());
    let exe_path = env::current_exe().unwrap_or_else(|_| "unknown".into());
    
    // Path 1: Installed - in user's home directory (desktop/exec launch)
    if let Ok(home_dir) = env::var("HOME") {
        let installed_path = format!("{}/.demos-toolkit/demostools_file.ts", home_dir);
        if Path::new(&installed_path).exists() {
            return Ok(installed_path);
        }
    }
    
    // Path 2: Windows - user profile directory
    if let Ok(user_profile) = env::var("USERPROFILE") {
        let windows_path = format!("{}\\.demos-toolkit\\demostools_file.ts", user_profile);
        if Path::new(&windows_path).exists() {
            return Ok(windows_path);
        }
    }
    
    // Path 3: Development - relative to current working directory (dev mode only)
    let dev_path = "../../demostools_file.ts";
    if Path::new(dev_path).exists() {
        return Ok(dev_path.to_string());
    }
    
    // Create detailed error with debug info
    let home_dir = env::var("HOME").unwrap_or_else(|_| "HOME_NOT_SET".to_string());
    let user_profile = env::var("USERPROFILE").unwrap_or_else(|_| "USERPROFILE_NOT_SET".to_string());
    let installed_path = format!("{}/.demos-toolkit/demostools_file.ts", home_dir);
    let windows_path = format!("{}\\.demos-toolkit\\demostools_file.ts", user_profile);
    
    Err(format!(
        "CLI tools not found. Debug info:\n\
        Current dir: {}\n\
        Exe path: {}\n\
        HOME: {}\n\
        USERPROFILE: {}\n\
        Checked paths:\n\
        - {} (exists: {})\n\
        - {} (exists: {})\n\
        - {} (exists: {})",
        current_dir.display(),
        exe_path.display(),
        home_dir,
        user_profile,
        installed_path,
        Path::new(&installed_path).exists(),
        windows_path,
        Path::new(&windows_path).exists(),
        dev_path,
        Path::new(dev_path).exists()
    ))
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