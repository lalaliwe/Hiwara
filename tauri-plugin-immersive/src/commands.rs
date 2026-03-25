use tauri::{command, AppHandle, Runtime};
use crate::Result;
use crate::ImmersiveExt;
use crate::models::ImmersiveResponse;

#[command]
pub(crate) async fn enter_immersive<R: Runtime>(
    app: AppHandle<R>,
) -> Result<ImmersiveResponse> {
    app.immersive().enter_immersive()
}

#[command]
pub(crate) async fn exit_immersive<R: Runtime>(
    app: AppHandle<R>,
) -> Result<ImmersiveResponse> {
    app.immersive().exit_immersive()
}
