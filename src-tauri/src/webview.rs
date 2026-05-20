use tauri::Manager;

#[tauri::command]
pub async fn inject_webview_script(
    app_handle: tauri::AppHandle,
    webview_label: String,
    script: String,
) -> Result<(), String> {
    // 获取指定的 webview（嵌入式）
    if let Some(webview) = app_handle.get_webview(&webview_label) {
        webview
            .eval(&script)
            .map_err(|e| format!("Failed to eval script: {}", e))?;
        Ok(())
    } else {
        Err(format!("Webview '{}' not found", webview_label))
    }
}

// 注入初始化 CSS（在页面加载前执行，避免闪烁）
#[tauri::command]
pub async fn inject_webview_initialization_script(
    app_handle: tauri::AppHandle,
    webview_label: String,
    css_rules: String,
) -> Result<(), String> {
    if let Some(webview) = app_handle.get_webview(&webview_label) {
        // 构建注入 CSS 的 JavaScript 脚本
        let script = format!(
            r#"
            (function() {{
                var style = document.createElement('style');
                style.type = 'text/css';
                style.innerHTML = `{}`;
                document.head.appendChild(style);
                console.log('[WebView] Initialization CSS injected');
            }})();
            "#,
            css_rules.replace('`', "\\`")
        );
        
        // 使用 eval 立即执行
        webview
            .eval(&script)
            .map_err(|e| format!("Failed to inject initialization script: {}", e))?;
        Ok(())
    } else {
        Err(format!("Webview '{}' not found", webview_label))
    }
}
