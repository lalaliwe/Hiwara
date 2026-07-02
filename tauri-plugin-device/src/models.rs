use serde::{Deserialize, Serialize};

// ========== Ping 相关 =========
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PingRequest {
  pub value: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PingResponse {
  pub value: Option<String>,
}

// ========== Device Info 相关 =========
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfoResponse {
  pub os_name: String,
  pub os_version: String,
  pub device_model: String,
  pub device_manufacturer: String,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkInfoResponse {
  pub is_connected: bool,
  pub network_type: NetworkType,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum NetworkType {
  Wifi,
  Cellular,
  Ethernet,
  Other,
  None,
  #[default]
  Unknown,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatteryInfoResponse {
  pub level: i32,
  pub is_charging: bool,
}

// ========== Immersive 相关 =========
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImmersiveResponse {
  pub success: bool,
}

// ========== Navbar Style 相关 =========
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetStatusBarTextStyleRequest {
  pub style: String, // "light" or "dark"
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetNavigationBarButtonStyleRequest {
  pub style: String, // "light" or "dark"
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetStatusBarBackgroundColorRequest {
  pub color: String, // hex color code
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetNavigationBarBackgroundColorRequest {
  pub color: String, // hex color code
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetStyleResponse {
  pub success: bool,
}

// ========== Orientation 相关 =========
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LockOrientationRequest {
  pub orientation: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrientationResponse {
  pub success: bool,
}

// ========== Toast 相关 =========
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShowToastRequest {
  pub message: String,
  pub duration: Option<String>, // "short" or "long"
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShowToastResponse {
  pub success: bool,
}

// ========== Move Task To Back 相关 =========
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveTaskToBackResponse {
  pub success: bool,
}

// ========== Screen Brightness 相关 =========
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetScreenBrightnessRequest {
  pub brightness: f32, // 0.0 ~ 1.0; pass -1.0 to restore system default
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetScreenBrightnessResponse {
  pub success: bool,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetScreenBrightnessResponse {
  pub brightness: f32, // -1.0 = system default, 0.0~1.0 = specific value
}

// ========== Volume 相关 =========
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetVolumeRequest {
  pub volume: f32, // 0.0 ~ 1.0
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetVolumeResponse {
  pub success: bool,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetVolumeResponse {
  pub volume: f32,      // 0.0 ~ 1.0, normalized
  pub max_volume: f32,  // system max volume value
}

// ========== Share 相关 =========
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShareRequest {
    pub title: String,
    pub text: String,
    pub url: String,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShareResponse {
    pub success: bool,
}

// ========== Folder Picker 相关 =========
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PickFolderRequest {
  pub initial_path: Option<String>, // 初始路径，用于 SAF 定位到上次选择的目录
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PickFolderResponse {
  pub path: Option<String>, // 选择的目录路径，取消则为 None
}

// ========== Open File 相关 =========
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenFileRequest {
  pub path: String,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenFileResponse {
  pub success: bool,
}
