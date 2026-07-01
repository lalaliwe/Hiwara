use std::collections::{HashMap, VecDeque};
use std::path::Path;
use std::sync::Mutex;
use std::time::Instant;
use tauri::Emitter;

// 每个下载任务的独立状态
#[derive(Clone, Debug)]
struct DownloadState {
    cancelled: bool,
    paused: bool,
}

// 下载队列条目
#[derive(Clone, Debug)]
struct QueuedDownload {
    url: String,
    file_path: String,
    download_id: String,
}

// 下载任务管理
static DOWNLOADS: once_cell::sync::Lazy<Mutex<HashMap<String, DownloadState>>> =
    once_cell::sync::Lazy::new(|| Mutex::new(HashMap::new()));
static DOWNLOAD_QUEUE: once_cell::sync::Lazy<Mutex<VecDeque<QueuedDownload>>> =
    once_cell::sync::Lazy::new(|| Mutex::new(VecDeque::new()));


/// 下载视频文件到本地（支持队列）
#[tauri::command]
async fn download_video(
    app: tauri::AppHandle,
    url: String,
    file_path: String,
    download_id: String,
    max_concurrent: usize,
) -> Result<String, String> {
    // 检查当前活跃下载数（排除已暂停的）
    let should_queue = {
        let downloads = DOWNLOADS.lock().unwrap();
        let active_count = downloads.iter().filter(|(_, s)| !s.paused).count();
        active_count >= max_concurrent
    };

    if should_queue {
        // 超过并发限制，加入等待队列
        {
            let mut queue = DOWNLOAD_QUEUE.lock().unwrap();
            queue.push_back(QueuedDownload { url, file_path, download_id: download_id.clone() });
        }
        let _ = app.emit("download-queued", serde_json::json!({
            "download_id": download_id
        }));
        return Ok("queued".to_string());
    }

    // 实际执行下载
    execute_download(app.clone(), url.clone(), file_path.clone(), download_id.clone()).await?;
    Ok("downloading".to_string())
}

/// 检查队列并启动下一个下载
fn process_queue(app: &tauri::AppHandle) {
    let next_download = {
        let mut queue = DOWNLOAD_QUEUE.lock().unwrap();
        queue.pop_front()
    };
    if let Some(next) = next_download {
        let app_clone = app.clone();
        tokio::task::spawn(async move {
            let _ = execute_download(app_clone, next.url, next.file_path, next.download_id).await;
        });
    }
}

/// 执行单个下载任务
async fn execute_download(
    app: tauri::AppHandle,
    url: String,
    file_path: String,
    download_id: String,
) -> Result<(), String> {
    // 注册下载任务
    {
        let mut downloads = DOWNLOADS.lock().unwrap();
        downloads.insert(download_id.clone(), DownloadState { cancelled: false, paused: false });
    }

    let result = download_inner(&app, &url, &file_path, &download_id).await;

    // 清理下载任务
    {
        let mut downloads = DOWNLOADS.lock().unwrap();
        downloads.remove(&download_id);
    }

    match &result {
        Ok(_) => {
            let _ = app.emit("download-progress", serde_json::json!({
                "download_id": download_id,
                "downloaded": 0, "total": 0,
                "speed": 0, "percentage": 100,
                "status": "completed", "file_path": file_path
            }));
        }
        Err(e) => {
            if e == "暂停让出" {
                // 暂停让出：不推入队列，由前端管理暂停状态
                let _ = app.emit("download-paused", serde_json::json!({
                    "download_id": download_id
                }));
                // 暂停让出后立即启动下一个排队下载
                process_queue(&app);
                return result;
            } else {
                let status = if e.contains("已取消") { "cancelled" } else { "failed" };
                let _ = app.emit("download-failed", serde_json::json!({
                    "download_id": download_id, "error": e, "status": status
                }));
            }
        }
    }

    // 尝试启动队列中的下一个下载（完成/失败后）
    process_queue(&app);

    result
}

/// 实际下载逻辑
async fn download_inner(
    app: &tauri::AppHandle,
    url: &str,
    file_path: &str,
    download_id: &str,
) -> Result<(), String> {
    // 文件名冲突处理
    let final_path = resolve_file_path(file_path);
    let path = Path::new(&final_path);

    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .build()
        .map_err(|e| format!("创建HTTP客户端失败: {}", e))?;

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut last_emit_time = Instant::now();
    let start_time = Instant::now();

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
    }
    let mut file = std::fs::File::create(path).map_err(|e| format!("创建文件失败: {}", e))?;

    let mut stream = response.bytes_stream();
    use futures_util::StreamExt;

    while let Some(chunk_result) = stream.next().await {
        // 检查当前下载任务的状态
        {
            let downloads = DOWNLOADS.lock().unwrap();
            if let Some(state) = downloads.get(download_id) {
                if state.cancelled {
                    let _ = std::fs::remove_file(path);
                    return Err("下载已取消".to_string());
                }
                if state.paused {
                    // 暂停让出：不删除文件，返回特殊标记
                    return Err("暂停让出".to_string());
                }
            }
        }

        let chunk = chunk_result.map_err(|e| format!("读取数据失败: {}", e))?;
        use std::io::Write;
        file.write_all(&chunk).map_err(|e| format!("写入文件失败: {}", e))?;

        downloaded += chunk.len() as u64;

        let elapsed = last_emit_time.elapsed();
        if elapsed.as_millis() >= 500 || downloaded == chunk.len() as u64 {
            let total_elapsed = start_time.elapsed().as_secs_f64();
            let speed = if total_elapsed > 0.0 {
                (downloaded as f64 / total_elapsed) as u64
            } else {
                0
            };

            let _ = app.emit("download-progress", serde_json::json!({
                "download_id": download_id,
                "downloaded": downloaded,
                "total": total_size,
                "speed": speed,
                "percentage": if total_size > 0 {
                    (downloaded as f64 / total_size as f64 * 100.0) as u32
                } else { 0 }
            }));
            last_emit_time = Instant::now();
        }
    }

    Ok(())
}

/// 处理文件名冲突：若文件已存在，追加 .1 .2 ...
fn resolve_file_path(original: &str) -> String {
    let path = Path::new(original);
    if !path.exists() {
        return original.to_string();
    }

    let parent = path.parent().unwrap_or(Path::new(""));
    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("file");
    let ext = path.extension().and_then(|s| s.to_str()).map(|e| format!(".{}", e)).unwrap_or_default();

    for i in 1..1000 {
        let new_name = format!("{}.{}{}", stem, i, ext);
        let new_path = parent.join(&new_name);
        if !new_path.exists() {
            return new_path.to_string_lossy().to_string();
        }
    }
    original.to_string() // 兜底
}

/// 取消指定下载
#[tauri::command]
fn cancel_download(download_id: String) {
    let mut downloads = DOWNLOADS.lock().unwrap();
    if let Some(state) = downloads.get_mut(&download_id) {
        state.cancelled = true;
    }
    drop(downloads);
    // 如果在等待队列中，直接移除
    let mut queue = DOWNLOAD_QUEUE.lock().unwrap();
    queue.retain(|d| d.download_id != download_id);
}

/// 暂停下载：让出下载槽位，移到等待队列队首
#[tauri::command]
fn pause_download(download_id: String) {
    let mut downloads = DOWNLOADS.lock().unwrap();
    if let Some(state) = downloads.get_mut(&download_id) {
        state.paused = true;
    }
}

/// 恢复下载：从等待队列中取出并重新加入下载
/// 调用方应确保已从数据库获取 url 和 filePath
#[tauri::command]
async fn resume_download(
    app: tauri::AppHandle,
    url: String,
    file_path: String,
    download_id: String,
    max_concurrent: usize,
) -> Result<String, String> {
    // 如果在等待队列中，先移除
    {
        let mut queue = DOWNLOAD_QUEUE.lock().unwrap();
        queue.retain(|d| d.download_id != download_id);
    }
    // 重新加入下载（会检查并发限制）
    download_video(app, url, file_path, download_id, max_concurrent).await
}

/// 取消暂停信号（用于下载循环尚未让出时的快速取消暂停）
#[tauri::command]
fn unpause_download(download_id: String) {
    let mut downloads = DOWNLOADS.lock().unwrap();
    if let Some(state) = downloads.get_mut(&download_id) {
        state.paused = false;
    }
}

/// 检查指定视频是否正在下载
#[tauri::command]
fn is_downloading(download_id: String) -> bool {
    let downloads = DOWNLOADS.lock().unwrap();
    downloads.contains_key(&download_id)
}

/// 检查指定下载是否已暂停
#[tauri::command]
fn is_paused(download_id: String) -> bool {
    let downloads = DOWNLOADS.lock().unwrap();
    downloads.get(&download_id).map(|s| s.paused).unwrap_or(false)
}

/// 获取所有活跃下载的状态
#[tauri::command]
fn get_active_downloads() -> Vec<serde_json::Value> {
    let downloads = DOWNLOADS.lock().unwrap();
    downloads.iter().map(|(id, state)| {
        serde_json::json!({
            "download_id": id,
            "paused": state.paused,
            "cancelled": state.cancelled,
        })
    }).collect()
}

/// 获取当前下载数量（仅计算非暂停的活跃下载）
#[tauri::command]
fn get_download_count() -> usize {
    let downloads = DOWNLOADS.lock().unwrap();
    downloads.iter().filter(|(_, s)| !s.paused).count()
}

/// 获取队列长度
#[tauri::command]
fn get_queue_length() -> usize {
    let queue = DOWNLOAD_QUEUE.lock().unwrap();
    queue.len()
}

/// 获取指定下载在队列中的位置（0=不在队列）
#[tauri::command]
fn get_queue_position(download_id: String) -> usize {
    let queue = DOWNLOAD_QUEUE.lock().unwrap();
    for (i, item) in queue.iter().enumerate() {
        if item.download_id == download_id {
            return i + 1;
        }
    }
    0
}

/// 删除指定路径的文件（用于清理应用重启后残留的未完成下载文件）
#[tauri::command]
fn remove_file(file_path: String) -> Result<(), String> {
    let path = std::path::Path::new(&file_path);
    if path.exists() {
        std::fs::remove_file(path).map_err(|e| format!("删除文件失败: {}", e))
    } else {
        Ok(())
    }
}

/// 检查队列中是否有指定下载
#[tauri::command]
fn is_in_queue(download_id: String) -> bool {
    let queue = DOWNLOAD_QUEUE.lock().unwrap();
    queue.iter().any(|d| d.download_id == download_id)
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
            unpause_download,
            is_downloading,
            is_paused,
            get_active_downloads,
            get_download_count,
            get_queue_length,
            get_queue_position,
            remove_file,
            is_in_queue,
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
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn test() -> String {
    "RUST\u{4ee3}\u{7801}\u{6d4b}\u{8bd5}".to_string()
}
