use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetStyleRequest {
    /// "light" (白字) 或 "dark" (黑字)
    pub style: String,
    /// "status" (顶部), "navigation" (底部) 或 "all" (默认)
    #[serde(default = "default_target")]
    pub target: String,
    /// 状态栏背景颜色（可选），格式为十六进制颜色码，如 "#FF0000"
    pub status_bar_color: Option<String>,
    /// 导航栏背景颜色（可选），格式为十六进制颜色码，如 "#FFFFFF"
    pub navigation_bar_color: Option<String>,
}

fn default_target() -> String {
    "all".to_string()
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetStyleResponse {
    pub success: bool,
}
