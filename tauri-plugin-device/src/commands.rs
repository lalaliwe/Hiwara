use tauri::{AppHandle, command, Runtime};

use crate::models::*;
use crate::Result;
use crate::DeviceExt;

#[command]
pub(crate) async fn ping<R: Runtime>(
    app: AppHandle<R>,
    payload: PingRequest,
) -> Result<PingResponse> {
    app.device().ping(payload)
}

#[command]
pub(crate) async fn get_device_info<R: Runtime>(
    app: AppHandle<R>,
) -> Result<DeviceInfoResponse> {
    app.device().get_device_info()
}

#[command]
pub(crate) async fn get_network_info<R: Runtime>(
    app: AppHandle<R>,
) -> Result<NetworkInfoResponse> {
    app.device().get_network_info()
}

#[command]
pub(crate) async fn get_battery_info<R: Runtime>(
    app: AppHandle<R>,
) -> Result<BatteryInfoResponse> {
    app.device().get_battery_info()
}

#[command]
pub(crate) async fn enter_immersive<R: Runtime>(
    app: AppHandle<R>,
) -> Result<ImmersiveResponse> {
    app.device().enter_immersive()
}

#[command]
pub(crate) async fn exit_immersive<R: Runtime>(
    app: AppHandle<R>,
) -> Result<ImmersiveResponse> {
    app.device().exit_immersive()
}

#[command]
pub(crate) async fn set_bar_style<R: Runtime>(
    app: AppHandle<R>,
    payload: SetStyleRequest,
) -> Result<SetStyleResponse> {
    app.device().set_bar_style(payload)
}

#[command]
pub(crate) async fn lock_orientation<R: Runtime>(
    app: AppHandle<R>,
    payload: LockOrientationRequest,
) -> Result<OrientationResponse> {
    app.device().lock_orientation(payload)
}

#[command]
pub(crate) async fn unlock_orientation<R: Runtime>(
    app: AppHandle<R>,
) -> Result<OrientationResponse> {
    app.device().unlock_orientation()
}
