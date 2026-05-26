use serde::{Deserialize, Serialize};

/// Ping 请求参数
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PingRequest {
    pub value: Option<String>,
}

/// Ping 响应
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PingResponse {
    pub value: Option<String>,
    pub message: Option<String>,
}

/// 创建 WebView 的请求参数
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWebviewRequest {
    pub url: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub transparent: Option<bool>,
}

/// 更新 WebView 边界的请求参数
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWebviewBoundsRequest {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// 注入脚本的请求参数
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InjectScriptRequest {
    pub script: String,
}

/// 注入初始化 CSS 的请求参数
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InjectInitScriptRequest {
    pub css_rules: String,
}

/// 通用响应
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WebviewResponse {
    pub success: bool,
}

/// 导航状态响应
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CanGoBackResponse {
    pub can_go_back: bool,
}
