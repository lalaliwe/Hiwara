use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri_plugin_http::reqwest;

#[derive(Debug, Deserialize)]
pub struct RequestParams {
    url: String,
    #[serde(default)]
    method: String,
    #[serde(default)]
    headers: Option<HashMap<String, String>>,
    #[serde(default)]
    body: Option<String>,
}

#[derive(Serialize)]
pub struct HttpResponse {
    status: u16,
    headers: HashMap<String, String>,
    data: String,
}

#[derive(Serialize)]
pub struct BinaryHttpResponse {
    status: u16,
    headers: HashMap<String, String>,
    data: Vec<u8>,  // 二进制数据
}

#[tauri::command]
pub async fn send_https_request(params: RequestParams) -> Result<HttpResponse, String> {
    let client = reqwest::Client::new();

    // 默认使用GET方法
    let method = if params.method.is_empty() {
        reqwest::Method::GET
    } else {
        match params.method.to_uppercase().as_str() {
            "GET" => reqwest::Method::GET,
            "POST" => reqwest::Method::POST,
            "PUT" => reqwest::Method::PUT,
            "DELETE" => reqwest::Method::DELETE,
            "PATCH" => reqwest::Method::PATCH,
            _ => reqwest::Method::GET,
        }
    };

    let mut request_builder = client.request(method, &params.url);

    // 设置默认的浏览器样式头部
    let mut final_headers = HashMap::new();
    final_headers.insert("Accept".to_string(), "*/*".to_string());
    final_headers.insert("Accept-Language".to_string(), "en-US,en;q=0.9".to_string());
    final_headers.insert(
        "Accept-Encoding".to_string(),
        "gzip, deflate, br".to_string(),
    );
    final_headers.insert("Connection".to_string(), "keep-alive".to_string());
    final_headers.insert("Upgrade-Insecure-Requests".to_string(), "1".to_string());
    final_headers.insert("User-Agent".to_string(), "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string());

    // 如果用户提供了自定义头部，则覆盖默认值或追加
    if let Some(headers) = params.headers {
        for (key, value) in headers {
            final_headers.insert(key, value);
        }
    }

    // 应用所有头部
    for (key, value) in final_headers {
        request_builder = request_builder.header(&key, value);
    }

    // 添加请求体
    if let Some(body) = params.body {
        request_builder = request_builder.body(body);
    }

    let response = request_builder
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status().as_u16();
    let mut response_headers = HashMap::new();

    for (name, value) in response.headers() {
        if let Ok(value_str) = value.to_str() {
            response_headers.insert(name.to_string(), value_str.to_string());
        }
    }

    let data = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    Ok(HttpResponse {
        status,
        headers: response_headers,
        data,
    })
}

#[tauri::command]
pub async fn send_https_request_binary(params: RequestParams) -> Result<BinaryHttpResponse, String> {
    let client = reqwest::Client::new();

    // 默认使用GET方法
    let method = if params.method.is_empty() {
        reqwest::Method::GET
    } else {
        match params.method.to_uppercase().as_str() {
            "GET" => reqwest::Method::GET,
            "POST" => reqwest::Method::POST,
            "PUT" => reqwest::Method::PUT,
            "DELETE" => reqwest::Method::DELETE,
            "PATCH" => reqwest::Method::PATCH,
            _ => reqwest::Method::GET,
        }
    };

    let mut request_builder = client.request(method, &params.url);

    // 设置默认的浏览器样式头部
    let mut final_headers = HashMap::new();
    final_headers.insert("Accept".to_string(), "*/*".to_string());
    final_headers.insert("Accept-Language".to_string(), "en-US,en;q=0.9".to_string());
    final_headers.insert(
        "Accept-Encoding".to_string(),
        "gzip, deflate, br".to_string(),
    );
    final_headers.insert("Connection".to_string(), "keep-alive".to_string());
    final_headers.insert("Upgrade-Insecure-Requests".to_string(), "1".to_string());
    final_headers.insert("User-Agent".to_string(), "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string());

    // 如果用户提供了自定义头部，则覆盖默认值或追加
    if let Some(headers) = params.headers {
        for (key, value) in headers {
            final_headers.insert(key, value);
        }
    }

    // 应用所有头部
    for (key, value) in final_headers {
        request_builder = request_builder.header(&key, value);
    }

    // 添加请求体
    if let Some(body) = params.body {
        request_builder = request_builder.body(body);
    }

    let response = request_builder
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status().as_u16();
    let mut response_headers = HashMap::new();

    for (name, value) in response.headers() {
        if let Ok(value_str) = value.to_str() {
            response_headers.insert(name.to_string(), value_str.to_string());
        }
    }

    let data = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body as bytes: {}", e))?
        .to_vec(); // 转换为Vec<u8>

    Ok(BinaryHttpResponse {
        status,
        headers: response_headers,
        data,
    })
}

#[tauri::command]
pub async fn get_https_request(url: String) -> Result<HttpResponse, String> {
    send_https_request(RequestParams {
        url,
        method: "GET".to_string(),
        headers: None,
        body: None,
    })
    .await
}

#[tauri::command]
pub async fn post_https_request(
    url: String,
    body: Option<String>,
    headers: Option<HashMap<String, String>>,
) -> Result<HttpResponse, String> {
    send_https_request(RequestParams {
        url,
        method: "POST".to_string(),
        headers,
        body,
    })
    .await
}