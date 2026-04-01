use tauri::{command, AppHandle, Runtime};
use crate::models::{SetStyleRequest, SetStyleResponse};
use crate::NavbarStyleExt;
use crate::Result;

#[command]
pub(crate) async fn set_bar_style<R: Runtime>(
    app: AppHandle<R>,
    payload: SetStyleRequest,
) -> Result<SetStyleResponse> {
    app.navbar_style().set_style(payload)
}
