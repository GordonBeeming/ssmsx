mod sidecar;
mod commands;

use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let sidecar_manager = sidecar::SidecarManager::new();

            // Spawn sidecar on startup
            let manager = sidecar_manager.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = manager.start(&handle).await {
                    eprintln!("Failed to start sidecar: {}", e);
                }
            });

            app.manage(sidecar_manager);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![commands::ping::ping])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
