use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};
use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<NavbarStyle<R>> {
    Ok(NavbarStyle(app.clone()))
}

/// Access to the navbar-style APIs.
pub struct NavbarStyle<R: Runtime>(AppHandle<R>);

impl<R: Runtime> NavbarStyle<R> {
    pub fn set_style(&self, payload: SetStyleRequest) -> crate::Result<SetStyleResponse> {
        // 桌面端暂不支持，返回成功防止报错
        Ok(SetStyleResponse { success: true })
    }
}
