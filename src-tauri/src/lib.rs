use base64::Engine;
use std::path::Path;

/// Download a file from URL to local path
#[tauri::command]
async fn download_file(url: String, save_path: String) -> Result<String, String> {
    let response = reqwest::get(&url).await.map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }
    let bytes = response.bytes().await.map_err(|e| e.to_string())?;

    // Ensure parent directory exists
    if let Some(parent) = Path::new(&save_path).parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| e.to_string())?;
    }

    tokio::fs::write(&save_path, &bytes)
        .await
        .map_err(|e| e.to_string())?;

    log::info!("File downloaded to: {}", save_path);
    Ok(save_path)
}

/// Save a base64-encoded image to a file
#[tauri::command]
async fn save_base64_image(data: String, filename: String, dir: String) -> Result<String, String> {
    // Strip data URI prefix if present
    let b64_data = if data.starts_with("data:") {
        data.split(',')
            .nth(1)
            .ok_or("Invalid data URI format")?
    } else {
        &data
    };

    let decoded = base64::engine::general_purpose::STANDARD
        .decode(b64_data.trim())
        .map_err(|e| format!("Base64 decode error: {}", e))?;

    // Ensure directory exists
    tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|e| e.to_string())?;

    let save_path = Path::new(&dir).join(&filename);
    tokio::fs::write(&save_path, &decoded)
        .await
        .map_err(|e| e.to_string())?;

    log::info!("Base64 image saved to: {:?}", save_path);
    Ok(save_path.to_string_lossy().to_string())
}

/// Get the default downloads directory for the current user
#[tauri::command]
async fn get_default_download_dir() -> Result<String, String> {
    let home = std::env::var("USERPROFILE").map_err(|_| "Cannot get USERPROFILE")?;
    let download_dir = Path::new(&home).join("Downloads").join("AgnesAI");

    // Create if not exists
    tokio::fs::create_dir_all(&download_dir)
        .await
        .map_err(|e| e.to_string())?;

    Ok(download_dir.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            download_file,
            save_base64_image,
            get_default_download_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
