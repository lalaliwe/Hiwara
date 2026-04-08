use serde::de::DeserializeOwned;
use tauri::{
  plugin::{PluginApi, PluginHandle},
  AppHandle, Runtime,
};

use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_device);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
  _app: &AppHandle<R>,
  api: PluginApi<R, C>,
) -> crate::Result<Device<R>> {
  #[cfg(target_os = "android")]
  let handle = api.register_android_plugin("com.plugin.device", "DevicePlugin")?;
  #[cfg(target_os = "ios")]
  let handle = api.register_ios_plugin(init_plugin_device)?;
  Ok(Device(handle))
}

/// Access to the device APIs.
pub struct Device<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> Device<R> {
  pub fn ping(&self, payload: PingRequest) -> crate::Result<PingResponse> {
    self
      .0
      .run_mobile_plugin("ping", payload)
      .map_err(Into::into)
  }

  pub fn get_device_info(&self) -> crate::Result<DeviceInfoResponse> {
    self
      .0
      .run_mobile_plugin("getDeviceInfo", ())
      .map_err(Into::into)
  }

  pub fn get_network_info(&self) -> crate::Result<NetworkInfoResponse> {
    self
      .0
      .run_mobile_plugin("getNetworkInfo", ())
      .map_err(Into::into)
  }

  pub fn get_battery_info(&self) -> crate::Result<BatteryInfoResponse> {
    self
      .0
      .run_mobile_plugin("getBatteryInfo", ())
      .map_err(Into::into)
  }

  pub fn enter_immersive(&self) -> crate::Result<ImmersiveResponse> {
    self
      .0
      .run_mobile_plugin("enterImmersive", ())
      .map_err(Into::into)
  }

  pub fn exit_immersive(&self) -> crate::Result<ImmersiveResponse> {
    self
      .0
      .run_mobile_plugin("exitImmersive", ())
      .map_err(Into::into)
  }

  pub fn set_bar_style(&self, payload: SetStyleRequest) -> crate::Result<SetStyleResponse> {
    self
      .0
      .run_mobile_plugin("setBarStyle", payload)
      .map_err(Into::into)
  }

  pub fn lock_orientation(&self, payload: LockOrientationRequest) -> crate::Result<OrientationResponse> {
    self
      .0
      .run_mobile_plugin("lockOrientation", payload)
      .map_err(Into::into)
  }

  pub fn unlock_orientation(&self) -> crate::Result<OrientationResponse> {
    self
      .0
      .run_mobile_plugin("unlockOrientation", ())
      .map_err(Into::into)
  }

  pub fn show_toast(&self, payload: ShowToastRequest) -> crate::Result<ShowToastResponse> {
    self
      .0
      .run_mobile_plugin("showToast", payload)
      .map_err(Into::into)
  }
}