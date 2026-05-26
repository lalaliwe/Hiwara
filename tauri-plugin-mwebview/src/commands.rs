use tauri::{command, AppHandle, Runtime};

use crate::models::*;
use crate::MWebviewExt;
use crate::Result;

#[command]
pub(crate) async fn ping<R: Runtime>(
    app: AppHandle<R>,
    payload: PingRequest,
) -> Result<PingResponse> {
    app.mwebview().ping(payload)
}

#[command]
pub(crate) async fn create_webview<R: Runtime>(
    app: AppHandle<R>,
    payload: CreateWebviewRequest,
) -> Result<WebviewResponse> {
    app.mwebview().create_webview(payload)
}

#[command]
pub(crate) async fn update_webview_bounds<R: Runtime>(
    app: AppHandle<R>,
    payload: UpdateWebviewBoundsRequest,
) -> Result<WebviewResponse> {
    app.mwebview().update_webview_bounds(payload)
}

#[command]
pub(crate) async fn destroy_webview<R: Runtime>(
    app: AppHandle<R>,
) -> Result<WebviewResponse> {
    app.mwebview().destroy_webview()
}

#[command]
pub(crate) async fn inject_script<R: Runtime>(
    app: AppHandle<R>,
    payload: InjectScriptRequest,
) -> Result<WebviewResponse> {
    app.mwebview().inject_script(payload)
}

#[command]
pub(crate) async fn inject_init_script<R: Runtime>(
    app: AppHandle<R>,
    payload: InjectInitScriptRequest,
) -> Result<WebviewResponse> {
    app.mwebview().inject_init_script(payload)
}

#[command]
pub(crate) async fn webview_go_back<R: Runtime>(
    app: AppHandle<R>,
) -> Result<WebviewResponse> {
    app.mwebview().webview_go_back()
}

#[command]
pub(crate) async fn webview_can_go_back<R: Runtime>(
    app: AppHandle<R>,
) -> Result<CanGoBackResponse> {
    app.mwebview().webview_can_go_back()
}
