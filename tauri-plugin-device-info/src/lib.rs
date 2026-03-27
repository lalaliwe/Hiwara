use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::DeviceInfo;
#[cfg(mobile)]
use mobile::DeviceInfo;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the device-info APIs.
pub trait DeviceInfoExt<R: Runtime> {
  fn device_info(&self) -> &DeviceInfo<R>;
}

impl<R: Runtime, T: Manager<R>> crate::DeviceInfoExt<R> for T {
  fn device_info(&self) -> &DeviceInfo<R> {
    self.state::<DeviceInfo<R>>().inner()
  }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("device-info")
    .invoke_handler(tauri::generate_handler![
      commands::ping,
      commands::get_device_info,
      commands::get_network_info,
      commands::get_battery_info
    ])
    .setup(|app, api| {
      #[cfg(mobile)]
      let device_info = mobile::init(app, api)?;
      #[cfg(desktop)]
      let device_info = desktop::init(app, api)?;
      app.manage(device_info);
      Ok(())
    })
    .build()
}
