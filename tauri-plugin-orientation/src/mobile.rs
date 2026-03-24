use serde::de::DeserializeOwned;
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};

use crate::models::*;

// 初始化 Swift 插件绑定
#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_orientation);

// 初始化 Kotlin 或 Swift 插件类
pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<Orientation<R>> {
    // 注意：Android 插件类名通常应与插件名匹配
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin("com.plugin.orientation", "OrientationPlugin")?;

    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_orientation)?;

    Ok(Orientation(handle))
}

/// Access to the orientation APIs.
pub struct Orientation<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> Orientation<R> {
    /// 锁定屏幕方向
    pub fn lock_orientation(&self, payload: LockRequest) -> crate::Result<LockResponse> {
        self
            .0
            .run_mobile_plugin("lockOrientation", payload)
            .map_err(Into::into)
    }

    /// 解锁屏幕方向 (可选，如果你需要)
    pub fn unlock_orientation(&self) -> crate::Result<LockResponse> {
        // 传递空结构体或使用不同的调用方式，视原生实现而定
        // 这里演示传递无参数的调用
        self
            .0
            .run_mobile_plugin("unlockOrientation", ())
            .map_err(Into::into)
    }
}
