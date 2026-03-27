use serde::{Deserialize, Serialize};

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

/// 网络类型枚举 - 支持未来扩展
#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum NetworkType {
  Wifi,
  Cellular,  // 通用蜂窝网络，不区分具体代数
  Ethernet,
  Other,
  None,
  Unknown,
}

impl Default for NetworkType {
  fn default() -> Self {
    Self::Unknown
  }
}

/// 设备信息响应结构
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfoResponse {
  /// 操作系统名称
  pub os_name: String,
  /// 操作系统版本
  pub os_version: String,
  /// 设备型号
  pub device_model: String,
  /// 设备制造商
  pub device_manufacturer: String,
}

/// 网络信息响应结构 - 简化版
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkInfoResponse {
  /// 是否已连接网络
  pub is_connected: bool,
  /// 网络类型
  pub network_type: NetworkType,
}

/// 电池信息响应结构 - 只保留电量和充电状态
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatteryInfoResponse {
  /// 电池电量百分比 (0-100)
  pub level: u8,
  /// 是否在充电
  pub is_charging: bool,
}
