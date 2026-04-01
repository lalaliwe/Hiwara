use tauri::{AppHandle, command, Runtime};

use crate::models::*;
use crate::Result;
use crate::DeviceInfoExt;

#[command]
pub(crate) async fn ping<R: Runtime>(
    app: AppHandle<R>,
    payload: PingRequest,
) -> Result<PingResponse> {
    app.device_info().ping(payload)
}

/// 获取设备信息
#[command]
pub(crate) async fn get_device_info<R: Runtime>(
    app: AppHandle<R>,
) -> Result<DeviceInfoResponse> {
    app.device_info().get_device_info()
}

/// 获取网络信息
#[command]
pub(crate) async fn get_network_info<R: Runtime>(
    app: AppHandle<R>,
) -> Result<NetworkInfoResponse> {
    app.device_info().get_network_info()
}

/// 获取电池信息
#[command]
pub(crate) async fn get_battery_info<R: Runtime>(
    app: AppHandle<R>,
) -> Result<BatteryInfoResponse> {
    app.device_info().get_battery_info()
}
