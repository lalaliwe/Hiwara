use tauri::{AppHandle, command, Runtime};
use crate::models::*;
use crate::Result;
use crate::OrientationExt;

#[command]
pub(crate) async fn lock_orientation<R: Runtime>(
    app: AppHandle<R>,
    payload: LockRequest,
) -> Result<LockResponse> {
    app.orientation().lock_orientation(payload)
}

// 如果需要解锁功能，添加以下命令
#[command]
pub(crate) async fn unlock_orientation<R: Runtime>(
    app: AppHandle<R>,
) -> Result<LockResponse> {
    app.orientation().unlock_orientation()
}
