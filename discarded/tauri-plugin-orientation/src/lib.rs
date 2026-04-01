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
use desktop::Orientation;
#[cfg(mobile)]
use mobile::Orientation;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the orientation APIs.
pub trait OrientationExt<R: Runtime> {
    fn orientation(&self) -> &Orientation<R>;
}

impl<R: Runtime, T: Manager<R>> crate::OrientationExt<R> for T {
    fn orientation(&self) -> &Orientation<R> {
        self.state::<Orientation<R>>().inner()
    }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("orientation")
        // 修改这里：注册新的命令
        .invoke_handler(tauri::generate_handler![commands::lock_orientation, commands::unlock_orientation])
        .setup(|app, api| {
            #[cfg(mobile)]
            let orientation = mobile::init(app, api)?;
            #[cfg(desktop)]
            let orientation = desktop::init(app, api)?;
            app.manage(orientation);
            Ok(())
        })
        .build()
}
