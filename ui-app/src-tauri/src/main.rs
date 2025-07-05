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
    
    // Path 1: Development - relative to the app (for development mode)
    let dev_path = "../../demostools_file.ts";
    if Path::new(dev_path).exists() {
        return Ok(dev_path.to_string());
    }
    
    // Path 2: Installed - in user's home directory
    if let Ok(home_dir) = env::var("HOME") {
        let installed_path = format!("{}/.demos-toolkit/demostools_file.ts", home_dir);
        if Path::new(&installed_path).exists() {
            return Ok(installed_path);
        }
    }
    
    // Path 3: Windows - user profile directory
    if let Ok(user_profile) = env::var("USERPROFILE") {
        let windows_path = format!("{}\\.demos-toolkit\\demostools_file.ts", user_profile);
        if Path::new(&windows_path).exists() {
            return Ok(windows_path);
        }
    }
    
    // Path 4: System-wide installation (fallback)
    let system_paths = if cfg!(windows) {
        vec![
            "C:\\Program Files\\Demos SDK Toolkit\\demostools_file.ts",
            "C:\\ProgramData\\Demos SDK Toolkit\\demostools_file.ts",
        ]
    } else {
        vec![
            "/usr/local/bin/demostools_file.ts",
            "/opt/demos-toolkit/demostools_file.ts",
        ]
    };
    
    for path in system_paths {
        if Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }
    
    // Path 5: Check PATH for demostools command
    let which_cmd = if cfg!(windows) { "where" } else { "which" };
    let demostools_name = if cfg!(windows) { "demostools.bat" } else { "demostools" };
    
    if let Ok(which_output) = std::process::Command::new(which_cmd)
        .arg(demostools_name)
        .output() 
    {
        if which_output.status.success() {
            let demostools_path = String::from_utf8_lossy(&which_output.stdout).trim().to_string();
            if !demostools_path.is_empty() && Path::new(&demostools_path).exists() {
                // If it's a symlink/batch file, try to resolve the actual CLI file
                let path_obj = Path::new(&demostools_path);
                let parent_dir = path_obj.parent()
                    .and_then(|p| p.parent())
                    .and_then(|p| p.to_str())
                    .unwrap_or("");
                
                let separator = if cfg!(windows) { "\\" } else { "/" };
                let resolved_path = format!("{}{}demostools_file.ts", parent_dir, separator);
                
                if Path::new(&resolved_path).exists() {
                    return Ok(resolved_path);
                }
                
                return Ok(demostools_path);
            }
        }
    }
    
    Err("CLI tools not found. Please ensure demostools is installed or run from development directory.".to_string())
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