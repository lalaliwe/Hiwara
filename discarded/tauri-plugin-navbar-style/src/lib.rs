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
use desktop::NavbarStyle;
#[cfg(mobile)]
use mobile::NavbarStyle;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the navbar-style APIs.
pub trait NavbarStyleExt<R: Runtime> {
    fn navbar_style(&self) -> &NavbarStyle<R>;
}

impl<R: Runtime, T: Manager<R>> crate::NavbarStyleExt<R> for T {
    fn navbar_style(&self) -> &NavbarStyle<R> {
        self.state::<NavbarStyle<R>>().inner()
    }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("navbar-style")
        .invoke_handler(tauri::generate_handler![
            commands::set_bar_style
        ])
        .setup(|app, api| {
            #[cfg(mobile)]
            let navbar_style = mobile::init(app, api)?;
            #[cfg(desktop)]
            let navbar_style = desktop::init(app, api)?;
            app.manage(navbar_style);
            Ok(())
        })
        .build()
}
