use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};
use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<Immersive<R>> {
    Ok(Immersive(app.clone()))
}

/// Access to the immersive APIs.
pub struct Immersive<R: Runtime>(AppHandle<R>);

impl<R: Runtime> Immersive<R> {
    pub fn enter_immersive(&self) -> crate::Result<ImmersiveResponse> {
        // 桌面端暂不支持或可自行实现全屏 API
        Ok(ImmersiveResponse { success: true })
    }

    pub fn exit_immersive(&self) -> crate::Result<ImmersiveResponse> {
        Ok(ImmersiveResponse { success: true })
    }
}
