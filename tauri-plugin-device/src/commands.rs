use tauri::{command, AppHandle, Runtime};

use crate::models::*;
use crate::DeviceExt;
use crate::Result;

#[command]
pub(crate) async fn ping<R: Runtime>(
    app: AppHandle<R>,
    payload: PingRequest,
) -> Result<PingResponse> {
    app.device().ping(payload)
}

#[command]
pub(crate) async fn get_device_info<R: Runtime>(app: AppHandle<R>) -> Result<DeviceInfoResponse> {
    app.device().get_device_info()
}

#[command]
pub(crate) async fn get_network_info<R: Runtime>(app: AppHandle<R>) -> Result<NetworkInfoResponse> {
    app.device().get_network_info()
}

#[command]
pub(crate) async fn get_battery_info<R: Runtime>(app: AppHandle<R>) -> Result<BatteryInfoResponse> {
    app.device().get_battery_info()
}

#[command]
pub(crate) async fn enter_immersive<R: Runtime>(app: AppHandle<R>) -> Result<ImmersiveResponse> {
    app.device().enter_immersive()
}

#[command]
pub(crate) async fn exit_immersive<R: Runtime>(app: AppHandle<R>) -> Result<ImmersiveResponse> {
    app.device().exit_immersive()
}

#[command]
pub(crate) async fn set_status_bar_text_style<R: Runtime>(
    app: AppHandle<R>,
    payload: SetStatusBarTextStyleRequest,
) -> Result<SetStyleResponse> {
    app.device().set_status_bar_text_style(payload)
}

#[command]
pub(crate) async fn set_navigation_bar_button_style<R: Runtime>(
    app: AppHandle<R>,
    payload: SetNavigationBarButtonStyleRequest,
) -> Result<SetStyleResponse> {
    app.device().set_navigation_bar_button_style(payload)
}

#[command]
pub(crate) async fn set_status_bar_background_color<R: Runtime>(
    app: AppHandle<R>,
    payload: SetStatusBarBackgroundColorRequest,
) -> Result<SetStyleResponse> {
    app.device().set_status_bar_background_color(payload)
}

#[command]
pub(crate) async fn set_navigation_bar_background_color<R: Runtime>(
    app: AppHandle<R>,
    payload: SetNavigationBarBackgroundColorRequest,
) -> Result<SetStyleResponse> {
    app.device().set_navigation_bar_background_color(payload)
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

#[command]
pub(crate) async fn show_toast<R: Runtime>(
    app: AppHandle<R>,
    payload: ShowToastRequest,
) -> Result<ShowToastResponse> {
    app.device().show_toast(payload)
}

#[command]
pub(crate) async fn move_task_to_back<R: Runtime>(
    app: AppHandle<R>,
) -> Result<MoveTaskToBackResponse> {
    app.device().move_task_to_back()
}

#[command]
pub(crate) async fn set_screen_brightness<R: Runtime>(
    app: AppHandle<R>,
    payload: SetScreenBrightnessRequest,
) -> Result<SetScreenBrightnessResponse> {
    app.device().set_screen_brightness(payload)
}

#[command]
pub(crate) async fn get_screen_brightness<R: Runtime>(
    app: AppHandle<R>,
) -> Result<GetScreenBrightnessResponse> {
    app.device().get_screen_brightness()
}

#[command]
pub(crate) async fn set_volume<R: Runtime>(
    app: AppHandle<R>,
    payload: SetVolumeRequest,
) -> Result<SetVolumeResponse> {
    app.device().set_volume(payload)
}

#[command]
pub(crate) async fn get_volume<R: Runtime>(
    app: AppHandle<R>,
) -> Result<GetVolumeResponse> {
    app.device().get_volume()
}

#[command]
pub(crate) async fn pick_folder<R: Runtime>(
    app: AppHandle<R>,
    payload: PickFolderRequest,
) -> Result<PickFolderResponse> {
    app.device().pick_folder(payload)
}

#[command]
pub(crate) async fn share<R: Runtime>(
    app: AppHandle<R>,
    payload: ShareRequest,
) -> Result<ShareResponse> {
    app.device().share(payload)
}

#[command]
pub(crate) async fn open_file<R: Runtime>(
    app: AppHandle<R>,
    payload: OpenFileRequest,
) -> Result<OpenFileResponse> {
    app.device().open_file(payload)
}
