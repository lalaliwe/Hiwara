use serde::de::DeserializeOwned;
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};

use crate::models::*;
use crate::Result;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_mwebview);

/// 初始化 Kotlin 或 Swift 插件类
pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<MWebview<R>> {
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin("com.plugin.mwebview", "MWebviewPlugin")?;
    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_mwebview)?;
    Ok(MWebview(handle))
}

/// 移动端 WebView API 访问器
pub struct MWebview<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> MWebview<R> {
    /// Ping - 测试插件桥接
    pub fn ping(&self, payload: PingRequest) -> Result<PingResponse> {
        self.0
            .run_mobile_plugin("ping", payload)
            .map_err(Into::into)
    }

    /// 创建嵌入式 WebView
    pub fn create_webview(&self, payload: CreateWebviewRequest) -> Result<WebviewResponse> {
        self.0
            .run_mobile_plugin("createWebview", payload)
            .map_err(Into::into)
    }

    /// 更新 WebView 位置和尺寸
    pub fn update_webview_bounds(&self, payload: UpdateWebviewBoundsRequest) -> Result<WebviewResponse> {
        self.0
            .run_mobile_plugin("updateWebviewBounds", payload)
            .map_err(Into::into)
    }

    /// 销毁 WebView
    pub fn destroy_webview(&self) -> Result<WebviewResponse> {
        self.0
            .run_mobile_plugin("destroyWebview", ())
            .map_err(Into::into)
    }

    /// 注入 JavaScript 脚本（页面加载后执行）
    pub fn inject_script(&self, payload: InjectScriptRequest) -> Result<WebviewResponse> {
        self.0
            .run_mobile_plugin("injectScript", payload)
            .map_err(Into::into)
    }

    /// 注入初始化脚本/CSS（页面加载前执行）
    pub fn inject_init_script(&self, payload: InjectInitScriptRequest) -> Result<WebviewResponse> {
        self.0
            .run_mobile_plugin("injectInitScript", payload)
            .map_err(Into::into)
    }

    /// WebView 后退导航
    pub fn webview_go_back(&self) -> Result<WebviewResponse> {
        self.0
            .run_mobile_plugin("webviewGoBack", ())
            .map_err(Into::into)
    }

    /// 检查是否能后退
    pub fn webview_can_go_back(&self) -> Result<CanGoBackResponse> {
        self.0
            .run_mobile_plugin("webviewCanGoBack", ())
            .map_err(Into::into)
    }
}
