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
use desktop::MWebview;
#[cfg(mobile)]
use mobile::MWebview;

/// 扩展 trait，方便从 AppHandle 访问 MWebview
pub trait MWebviewExt<R: Runtime> {
    fn mwebview(&self) -> &MWebview<R>;
}

impl<R: Runtime, T: Manager<R>> MWebviewExt<R> for T {
    fn mwebview(&self) -> &MWebview<R> {
        self.state::<MWebview<R>>().inner()
    }
}

/// 初始化插件
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("mwebview")
        .invoke_handler(tauri::generate_handler![
            commands::ping,
            commands::create_webview,
            commands::update_webview_bounds,
            commands::destroy_webview,
            commands::inject_script,
            commands::inject_init_script,
            commands::webview_go_back,
            commands::webview_can_go_back,
        ])
        .setup(|app, api| {
            #[cfg(mobile)]
            let mwebview = mobile::init(app, api)?;
            #[cfg(desktop)]
            let mwebview = desktop::init(app, api)?;
            app.manage(mwebview);
            Ok(())
        })
        .build()
}
