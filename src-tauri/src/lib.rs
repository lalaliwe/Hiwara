use std::sync::OnceLock;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::time::Instant;
use tauri::Emitter;

// 下载状态标志
static CANCEL_DOWNLOAD: OnceLock<AtomicBool> = OnceLock::new();
static PAUSE_DOWNLOAD: OnceLock<AtomicBool> = OnceLock::new();
static DOWNLOAD_SPEED: OnceLock<AtomicU64> = OnceLock::new(); // bytes/sec

fn get_cancel_flag() -> &'static AtomicBool {
    CANCEL_DOWNLOAD.get_or_init(|| AtomicBool::new(false))
}

fn get_pause_flag() -> &'static AtomicBool {
    PAUSE_DOWNLOAD.get_or_init(|| AtomicBool::new(false))
}

fn get_speed() -> &'static AtomicU64 {
    DOWNLOAD_SPEED.get_or_init(|| AtomicU64::new(0))
}

/// 下载视频文件到本地
#[tauri::command]
async fn download_video(
    app: tauri::AppHandle,
    url: String,
    file_path: String,
) -> Result<(), String> {
    // 重置标志
    get_cancel_flag().store(false, Ordering::SeqCst);
    get_pause_flag().store(false, Ordering::SeqCst);
    get_speed().store(0, Ordering::SeqCst);

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
    let mut last_emit_time = Instant::now();
    let start_time = Instant::now();

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
            let _ = std::fs::remove_file(path);
            return Err("下载已取消".to_string());
        }

        // 检查是否暂停
        while get_pause_flag().load(Ordering::SeqCst) {
            if get_cancel_flag().load(Ordering::SeqCst) {
                let _ = std::fs::remove_file(path);
                return Err("下载已取消".to_string());
            }
            tokio::time::sleep(std::time::Duration::from_millis(200)).await;
        }

        let chunk = chunk_result.map_err(|e| format!("读取数据失败: {}", e))?;
        use std::io::Write;
        file.write_all(&chunk).map_err(|e| format!("写入文件失败: {}", e))?;

        downloaded += chunk.len() as u64;

        // 每 500ms 或每次下载量变化时发射进度（包含速度）
        let elapsed = last_emit_time.elapsed();
        if elapsed.as_millis() >= 500 || downloaded == chunk.len() as u64 {
            let total_elapsed = start_time.elapsed().as_secs_f64();
            let speed = if total_elapsed > 0.0 {
                (downloaded as f64 / total_elapsed) as u64
            } else {
                0
            };
            get_speed().store(speed, Ordering::SeqCst);

            let _ = app.emit("download-progress", serde_json::json!({
                "downloaded": downloaded,
                "total": total_size,
                "speed": speed,
                "percentage": if total_size > 0 {
                    (downloaded as f64 / total_size as f64 * 100.0) as u32
                } else {
                    0
                }
            }));
            last_emit_time = Instant::now();
        }
    }

    Ok(())
}

/// 取消下载
#[tauri::command]
fn cancel_download() {
    get_cancel_flag().store(true, Ordering::SeqCst);
}

/// 暂停下载
#[tauri::command]
fn pause_download() {
    get_pause_flag().store(true, Ordering::SeqCst);
}

/// 恢复下载
#[tauri::command]
fn resume_download() {
    get_pause_flag().store(false, Ordering::SeqCst);
}

/// 获取当前下载速度（bytes/sec）
#[tauri::command]
fn get_download_speed() -> u64 {
    get_speed().load(Ordering::SeqCst)
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
            pause_download,
            resume_download,
            get_download_speed,
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
