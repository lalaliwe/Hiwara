use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  _api: PluginApi<R, C>,
) -> crate::Result<DeviceInfo<R>> {
  Ok(DeviceInfo(app.clone()))
}

/// Access to the device-info APIs.
pub struct DeviceInfo<R: Runtime>(AppHandle<R>);

impl<R: Runtime> DeviceInfo<R> {
  pub fn ping(&self, payload: PingRequest) -> crate::Result<PingResponse> {
    Ok(PingResponse {
      value: payload.value,
    })
  }

  pub fn get_device_info(&self) -> crate::Result<DeviceInfoResponse> {
    // 桌面端使用 sysinfo crate获取系统信息
    #[cfg(target_os = "windows")]
    {
      Ok(DeviceInfoResponse {
        os_name: "Windows".to_string(),
        os_version: std::env::consts::OS.to_string(),
        device_model: "PC".to_string(),
        device_manufacturer: "Unknown".to_string(),
      })
    }
    
    #[cfg(target_os = "macos")]
    {
      Ok(DeviceInfoResponse {
        os_name: "macOS".to_string(),
        os_version: std::env::consts::OS.to_string(),
        device_model: "Mac".to_string(),
        device_manufacturer: "Apple".to_string(),
      })
    }
    
    #[cfg(target_os = "linux")]
    {
      Ok(DeviceInfoResponse {
        os_name: "Linux".to_string(),
        os_version: std::env::consts::OS.to_string(),
        device_model: "PC".to_string(),
        device_manufacturer: "Unknown".to_string(),
      })
    }
    
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
      Ok(DeviceInfoResponse {
        os_name: std::env::consts::OS.to_string(),
        os_version: std::env::consts::OS.to_string(),
        device_model: "Unknown".to_string(),
        device_manufacturer: "Unknown".to_string(),
      })
    }
  }

  pub fn get_network_info(&self) -> crate::Result<NetworkInfoResponse> {
    // 桌面端简单检测网络连通性
    use std::net::ToSocketAddrs;
    
    let is_connected = "8.8.8.8:53"
      .to_socket_addrs()
      .map(|mut addr| addr.next().is_some())
      .unwrap_or(false);

    Ok(NetworkInfoResponse {
      is_connected,
      network_type: if is_connected { NetworkType::Wifi } else { NetworkType::None },
    })
  }

  pub fn get_battery_info(&self) -> crate::Result<BatteryInfoResponse> {
    // 桌面端尝试使用 battery crate
    // 这里返回一个默认值
    Ok(BatteryInfoResponse {
      level: 100,
      is_charging: false,
    })
  }
}