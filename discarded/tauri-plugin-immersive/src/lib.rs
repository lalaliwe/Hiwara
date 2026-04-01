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
use desktop::Immersive;
#[cfg(mobile)]
use mobile::Immersive;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the immersive APIs.
pub trait ImmersiveExt<R: Runtime> {
    fn immersive(&self) -> &Immersive<R>;
}

impl<R: Runtime, T: Manager<R>> crate::ImmersiveExt<R> for T {
    fn immersive(&self) -> &Immersive<R> {
        self.state::<Immersive<R>>().inner()
    }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("immersive")
        .invoke_handler(tauri::generate_handler![
            commands::enter_immersive,
            commands::exit_immersive,
        ])
        .setup(|app, api| {
            #[cfg(mobile)]
            let immersive = mobile::init(app, api)?;
            #[cfg(desktop)]
            let immersive = desktop::init(app, api)?;
            app.manage(immersive);
            Ok(())
        })
        .build()
}
