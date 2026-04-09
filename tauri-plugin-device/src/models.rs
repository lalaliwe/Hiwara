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
