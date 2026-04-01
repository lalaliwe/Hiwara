use serde::{Deserialize, Serialize};

// 请求参数：对应前端传入的 'portrait' 或 'landscape'
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LockRequest {
    pub orientation: Option<String>,
}

// 响应结果：返回操作是否成功
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LockResponse {
    pub success: bool,
}
