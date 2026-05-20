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
        .invoke_handler(tauri::generate_handler![
            greet,
            test,
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
    format!("RUST代码测试")
}
