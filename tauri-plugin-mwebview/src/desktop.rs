use serde::de::DeserializeOwned;
use tauri::{AppHandle, Runtime};

use crate::models::*;
use crate::Result;

/// 桌面端 WebView 管理器
/// 桌面端不需要此插件，直接使用 Tauri 内置的 Webview API
/// 这里提供空实现以避免编译错误
pub struct MWebview<R: Runtime>(std::marker::PhantomData<R>);

// 确保 MWebview 满足 Send + Sync，因为 Tauri 的 Manager::manage 和 state 要求
unsafe impl<R: Runtime> Send for MWebview<R> {}
unsafe impl<R: Runtime> Sync for MWebview<R> {}

impl<R: Runtime> MWebview<R> {
    pub fn new() -> Self {
        MWebview(std::marker::PhantomData)
    }

    pub fn ping(&self, _payload: PingRequest) -> Result<PingResponse> {
        Ok(PingResponse {
            value: Some("pong".into()),
            message: Some("Desktop MWebview plugin (no-op)".into()),
        })
    }

    pub fn create_webview(&self, _payload: CreateWebviewRequest) -> Result<WebviewResponse> {
        // 桌面端由前端的 @tauri-apps/api/webview 处理
        Ok(WebviewResponse { success: true })
    }

    pub fn update_webview_bounds(&self, _payload: UpdateWebviewBoundsRequest) -> Result<WebviewResponse> {
        Ok(WebviewResponse { success: true })
    }

    pub fn destroy_webview(&self) -> Result<WebviewResponse> {
        Ok(WebviewResponse { success: true })
    }

    pub fn inject_script(&self, _payload: InjectScriptRequest) -> Result<WebviewResponse> {
        Ok(WebviewResponse { success: true })
    }

    pub fn inject_init_script(&self, _payload: InjectInitScriptRequest) -> Result<WebviewResponse> {
        Ok(WebviewResponse { success: true })
    }

    pub fn webview_go_back(&self) -> Result<WebviewResponse> {
        Ok(WebviewResponse { success: true })
    }

    pub fn webview_can_go_back(&self) -> Result<CanGoBackResponse> {
        Ok(CanGoBackResponse { can_go_back: false })
    }
}

pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    _api: tauri::plugin::PluginApi<R, C>,
) -> crate::Result<MWebview<R>> {
    Ok(MWebview::new())
}
