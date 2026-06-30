use std::sync::OnceLock;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::Emitter;

// 存储下载取消标志
static CANCEL_DOWNLOAD: OnceLock<AtomicBool> = OnceLock::new();

fn get_cancel_flag() -> &'static AtomicBool {
    CANCEL_DOWNLOAD.get_or_init(|| AtomicBool::new(false))
}

/// 下载视频文件到本地
#[tauri::command]
async fn download_video(
    app: tauri::AppHandle,
    url: String,
    file_path: String,
) -> Result<(), String> {
    // 重置取消标志
    get_cancel_flag().store(false, Ordering::SeqCst);

    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .build()
        .map_err(|e| format!("创建HTTP客户端失败: {}", e))?;

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;

    // 创建输出文件
    let path = std::path::Path::new(&file_path);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
    }
    let mut file = std::fs::File::create(path).map_err(|e| format!("创建文件失败: {}", e))?;

    let mut stream = response.bytes_stream();

    use futures_util::StreamExt;
    while let Some(chunk_result) = stream.next().await {
        // 检查是否取消
        if get_cancel_flag().load(Ordering::SeqCst) {
            // 删除已下载的部分文件
            let _ = std::fs::remove_file(path);
            return Err("下载已取消".to_string());
        }

        let chunk = chunk_result.map_err(|e| format!("读取数据失败: {}", e))?;
        use std::io::Write;
        file.write_all(&chunk).map_err(|e| format!("写入文件失败: {}", e))?;

        downloaded += chunk.len() as u64;

        // 发送进度事件
        let _ = app.emit("download-progress", serde_json::json!({
            "downloaded": downloaded,
            "total": total_size,
            "percentage": if total_size > 0 {
                (downloaded as f64 / total_size as f64 * 100.0) as u32
            } else {
                0
            }
        }));
    }

    Ok(())
}

/// 取消下载
#[tauri::command]
fn cancel_download() {
    get_cancel_flag().store(true, Ordering::SeqCst);
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

mod network;
use network::{
    delete_https_request, get_https_request, post_https_request, send_https_request,
    send_https_request_binary,
};

mod webview;
use webview::{inject_webview_script, inject_webview_initialization_script};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_device::init())
        .plugin(tauri_plugin_mwebview::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            test,
            download_video,
            cancel_download,
            send_https_request,
            get_https_request,
            post_https_request,
            delete_https_request,
            send_https_request_binary,
            inject_webview_script,
            inject_webview_initialization_script
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn test() -> String {
    "RUST\u{4ee3}\u{7801}\u{6d4b}\u{8bd5}".to_string()
}
