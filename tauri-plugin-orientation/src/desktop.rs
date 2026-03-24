use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<Orientation<R>> {
    Ok(Orientation(app.clone()))
}

/// Access to the orientation APIs.
pub struct Orientation<R: Runtime>(AppHandle<R>);

impl<R: Runtime> Orientation<R> {
    // 修改这里：匹配新的命令签名
    pub fn lock_orientation(&self, payload: LockRequest) -> crate::Result<LockResponse> {
        // 桌面端通常不需要锁定屏幕方向，这里仅打印日志并返回成功
        println!("Desktop lock_orientation called: {:?}", payload.orientation);
        Ok(LockResponse { success: true })
    }

    // 添加解锁方法，匹配 mobile.rs 的接口
    pub fn unlock_orientation(&self) -> crate::Result<LockResponse> {
        println!("Desktop unlock_orientation called");
        Ok(LockResponse { success: true })
    }
}
