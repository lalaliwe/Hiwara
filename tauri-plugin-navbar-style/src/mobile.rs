use serde::de::DeserializeOwned;
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};
use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_navbar_style);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<NavbarStyle<R>> {
    // 注意：这里将 "ExamplePlugin" 改为 "NavbarStylePlugin" 以匹配 Kotlin 代码
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin("com.plugin.navbar_style", "NavbarStylePlugin")?;
    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_navbar_style)?;
    Ok(NavbarStyle(handle))
}

/// Access to the navbar-style APIs.
pub struct NavbarStyle<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> NavbarStyle<R> {
    pub fn set_style(&self, payload: SetStyleRequest) -> crate::Result<SetStyleResponse> {
        self.0
            .run_mobile_plugin("setBarStyle", payload)
            .map_err(Into::into)
    }
}
