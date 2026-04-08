use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  _api: PluginApi<R, C>,
) -> crate::Result<Device<R>> {
  Ok(Device(app.clone()))
}

/// Access to the device APIs.
pub struct Device<R: Runtime>(AppHandle<R>);

impl<R: Runtime> Device<R> {
  pub fn ping(&self, payload: PingRequest) -> crate::Result<PingResponse> {
    Ok(PingResponse {
      value: payload.value,
    })
  }

  pub fn get_device_info(&self) -> crate::Result<DeviceInfoResponse> {
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
    Ok(BatteryInfoResponse {
      level: 100,
      is_charging: false,
    })
  }

  pub fn enter_immersive(&self) -> crate::Result<ImmersiveResponse> {
    Ok(ImmersiveResponse { success: true })
  }

  pub fn exit_immersive(&self) -> crate::Result<ImmersiveResponse> {
    Ok(ImmersiveResponse { success: true })
  }

  pub fn set_bar_style(&self, _payload: SetStyleRequest) -> crate::Result<SetStyleResponse> {
    Ok(SetStyleResponse { success: true })
  }

  pub fn lock_orientation(&self, _payload: LockOrientationRequest) -> crate::Result<OrientationResponse> {
    Ok(OrientationResponse { success: true })
  }

  pub fn unlock_orientation(&self) -> crate::Result<OrientationResponse> {
    Ok(OrientationResponse { success: true })
  }

  pub fn show_toast(&self, _payload: ShowToastRequest) -> crate::Result<ShowToastResponse> {
    // On desktop platforms, we can't show native toasts, so we return success without doing anything
    Ok(ShowToastResponse { success: true })
  }
}