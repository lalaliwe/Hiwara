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
use desktop::Device;
#[cfg(mobile)]
use mobile::Device;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the device APIs.
pub trait DeviceExt<R: Runtime> {
  fn device(&self) -> &Device<R>;
}

impl<R: Runtime, T: Manager<R>> crate::DeviceExt<R> for T {
  fn device(&self) -> &Device<R> {
    self.state::<Device<R>>().inner()
  }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("device")
    .invoke_handler(tauri::generate_handler![
      commands::ping,
      commands::get_device_info,
      commands::get_network_info,
      commands::get_battery_info,
      commands::enter_immersive,
      commands::exit_immersive,
      commands::set_status_bar_text_style,
      commands::set_navigation_bar_button_style,
      commands::set_status_bar_background_color,
      commands::set_navigation_bar_background_color,
      commands::lock_orientation,
      commands::unlock_orientation,
      commands::show_toast,
      commands::move_task_to_back,
      commands::set_screen_brightness,
      commands::get_screen_brightness,
      commands::set_volume,
      commands::get_volume,
      commands::pick_folder,
    ])
    .setup(|app, api| {
      #[cfg(mobile)]
      let device = mobile::init(app, api)?;
      #[cfg(desktop)]
      let device = desktop::init(app, api)?;
      app.manage(device);
      Ok(())
    })
    .build()
}
