use serde::de::DeserializeOwned;
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};
use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_immersive);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<Immersive<R>> {
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin("com.plugin.immersive", "ImmersivePlugin")?;
    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_immersive)?;
    Ok(Immersive(handle))
}

/// Access to the immersive APIs.
pub struct Immersive<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> Immersive<R> {
    pub fn enter_immersive(&self) -> crate::Result<ImmersiveResponse> {
        self.0.run_mobile_plugin("enterImmersive", ())
            .map_err(Into::into)
    }

    pub fn exit_immersive(&self) -> crate::Result<ImmersiveResponse> {
        self.0.run_mobile_plugin("exitImmersive", ())
            .map_err(Into::into)
    }
}
