use serde::{Deserialize, Serialize};

// 你可以保留原来的 Ping 结构体，也可以删除
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PingRequest {
    pub value: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PingResponse {
    pub value: Option<String>,
}

// --- 新增以下内容 ---

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImmersiveResponse {
    pub success: bool,
}
