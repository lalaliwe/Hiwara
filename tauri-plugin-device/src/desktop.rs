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
      use std::process::Command;
      
      // 使用wmic获取Windows详细版本信息(更可靠)
      let os_version = if let Ok(output) = Command::new("wmic")
        .args(&["os", "get", "Version"])
        .output() 
      {
        let version_str = String::from_utf8_lossy(&output.stdout);
        // 解析输出,提取版本号
        let lines: Vec<&str> = version_str.lines().collect();
        if lines.len() >= 2 {
          // 第二行是版本号,如 "10.0.19045"
          let version = lines[1].trim();
          if !version.is_empty() {
            // 尝试获取Build Number
            if let Ok(build_output) = Command::new("wmic")
              .args(&["os", "get", "BuildNumber"])
              .output() 
            {
              let build_str = String::from_utf8_lossy(&build_output.stdout);
              let build_lines: Vec<&str> = build_str.lines().collect();
              if build_lines.len() >= 2 {
                let build_number = build_lines[1].trim();
                if !build_number.is_empty() {
                  return Ok(DeviceInfoResponse {
                    os_name: "Windows".to_string(),
                    os_version: format!("{}.{}", version, build_number),
                    device_model: "PC".to_string(),
                    device_manufacturer: "Unknown".to_string(),
                  });
                }
              }
            }
            version.to_string()
          } else {
            "Windows 10/11".to_string()
          }
        } else {
          "Windows 10/11".to_string()
        }
      } else {
        "Windows 10/11".to_string()
      };

      Ok(DeviceInfoResponse {
        os_name: "Windows".to_string(),
        os_version,
        device_model: "PC".to_string(),
        device_manufacturer: "Unknown".to_string(),
      })
    }
    
    #[cfg(target_os = "macos")]
    {
      use std::process::Command;
      
      // 使用sw_vers获取macOS详细版本信息
      let os_version = if let Ok(output) = Command::new("sw_vers")
        .args(&["-productVersion"])
        .output() 
      {
        let version_str = String::from_utf8_lossy(&output.stdout);
        let version = version_str.trim();
        if !version.is_empty() {
          version.to_string()
        } else {
          "macOS".to_string()
        }
      } else {
        "macOS".to_string()
      };

      Ok(DeviceInfoResponse {
        os_name: "macOS".to_string(),
        os_version,
        device_model: "Mac".to_string(),
        device_manufacturer: "Apple".to_string(),
      })
    }
    
    #[cfg(target_os = "linux")]
    {
      use std::fs;
      
      // 尝试从 /etc/os-release 获取发行版信息
      let (os_name, os_version) = if let Ok(content) = fs::read_to_string("/etc/os-release") {
        let mut name = "Linux".to_string();
        let mut version = "Unknown".to_string();
        
        for line in content.lines() {
          if line.starts_with("PRETTY_NAME=") {
            // PRETTY_NAME="Ubuntu 22.04.3 LTS"
            let value = line.trim_start_matches("PRETTY_NAME=").trim_matches('"');
            name = value.to_string();
          } else if line.starts_with("VERSION_ID=") {
            // VERSION_ID="22.04"
            let value = line.trim_start_matches("VERSION_ID=").trim_matches('"');
            version = value.to_string();
          }
        }
        
        // 如果没有PRETTY_NAME,尝试NAME和VERSION组合
        if name == "Linux" {
          let mut temp_name = "Linux".to_string();
          let mut temp_version = "Unknown".to_string();
          
          for line in content.lines() {
            if line.starts_with("NAME=") {
              temp_name = line.trim_start_matches("NAME=").trim_matches('"').to_string();
            } else if line.starts_with("VERSION=") {
              temp_version = line.trim_start_matches("VERSION=").trim_matches('"').to_string();
            }
          }
          
          name = if temp_version != "Unknown" && !temp_version.is_empty() {
            format!("{} {}", temp_name, temp_version)
          } else {
            temp_name
          };
          version = temp_version;
        }
        
        (name, version)
      } else {
        ("Linux".to_string(), "Unknown".to_string())
      };

      Ok(DeviceInfoResponse {
        os_name,
        os_version,
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

  pub fn set_status_bar_text_style(&self, _payload: SetStatusBarTextStyleRequest) -> crate::Result<SetStyleResponse> {
    Ok(SetStyleResponse { success: true })
  }

  pub fn set_navigation_bar_button_style(&self, _payload: SetNavigationBarButtonStyleRequest) -> crate::Result<SetStyleResponse> {
    Ok(SetStyleResponse { success: true })
  }

  pub fn set_status_bar_background_color(&self, _payload: SetStatusBarBackgroundColorRequest) -> crate::Result<SetStyleResponse> {
    Ok(SetStyleResponse { success: true })
  }

  pub fn set_navigation_bar_background_color(&self, _payload: SetNavigationBarBackgroundColorRequest) -> crate::Result<SetStyleResponse> {
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

  pub fn move_task_to_back(&self) -> crate::Result<MoveTaskToBackResponse> {
    // On desktop platforms, this is a no-op
    Ok(MoveTaskToBackResponse { success: true })
  }

  pub fn set_screen_brightness(&self, _payload: SetScreenBrightnessRequest) -> crate::Result<SetScreenBrightnessResponse> {
    // Desktop: no-op, brightness control is mobile-only
    Ok(SetScreenBrightnessResponse { success: true })
  }

  pub fn get_screen_brightness(&self) -> crate::Result<GetScreenBrightnessResponse> {
    // Desktop: return -1 (system default)
    Ok(GetScreenBrightnessResponse { brightness: -1.0 })
  }

  pub fn set_volume(&self, _payload: SetVolumeRequest) -> crate::Result<SetVolumeResponse> {
    // Desktop: no-op, volume control is mobile-only
    Ok(SetVolumeResponse { success: true })
  }

  pub fn get_volume(&self) -> crate::Result<GetVolumeResponse> {
    // Desktop: return default
    Ok(GetVolumeResponse { volume: 1.0, max_volume: 1.0 })
  }
}