use flate2::read::GzDecoder;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::Read;
use tauri_plugin_http::reqwest;

// 引入处理 deflate 和 brotli 所需的库
use brotli::Decompressor as BrotliDecoder;
use flate2::read::ZlibDecoder;

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
    data: Vec<u8>, // 二进制数据
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

    let raw_bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body as bytes: {}", e))?;

    // 检查内容编码并根据不同的压缩方式进行解码
    let data = decode_response_body(raw_bytes.to_vec(), &response_headers)?; // 这里添加 .to_vec()

    Ok(HttpResponse {
        status,
        headers: response_headers,
        data,
    })
}

// 解码响应体的辅助函数
fn decode_response_body(
    raw_bytes: Vec<u8>,
    response_headers: &HashMap<String, String>,
) -> Result<String, String> {
    let content_encoding = response_headers
        .get("content-encoding")
        .map(|s| s.as_str())
        .unwrap_or("");

    if content_encoding.contains("gzip") || content_encoding.contains("x-gzip") {
        // 解压缩gzip数据
        let mut decoder = GzDecoder::new(&raw_bytes[..]);
        let mut decoded_data = String::new();
        decoder
            .read_to_string(&mut decoded_data)
            .map_err(|e| format!("Failed to decompress gzip data: {}", e))?;
        Ok(decoded_data)
    } else if content_encoding.contains("deflate") {
        // 解压缩deflate数据
        let mut decoder = ZlibDecoder::new(&raw_bytes[..]);
        let mut decoded_data = String::new();
        decoder
            .read_to_string(&mut decoded_data)
            .map_err(|e| format!("Failed to decompress deflate data: {}", e))?;
        Ok(decoded_data)
    } else if content_encoding.contains("br") {
        // 解压缩brotli数据
        let mut decoder = BrotliDecoder::new(&raw_bytes[..], 4096);
        let mut decoded_data = Vec::new();
        decoder
            .read_to_end(&mut decoded_data)
            .map_err(|e| format!("Failed to decompress brotli data: {}", e))?;
        String::from_utf8(decoded_data)
            .map_err(|e| format!("Failed to convert decompressed brotli data to UTF-8: {}", e))
    } else {
        // 如果没有压缩，则直接转换为字符串
        String::from_utf8(raw_bytes.to_vec())
            .map_err(|e| format!("Failed to convert response to UTF-8: {}", e))
    }
}

#[tauri::command]
pub async fn send_https_request_binary(
    params: RequestParams,
) -> Result<BinaryHttpResponse, String> {
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
pub async fn get_https_request(
    url: String,
    headers: Option<HashMap<String, String>>,
) -> Result<HttpResponse, String> {
    send_https_request(RequestParams {
        url,
        method: "GET".to_string(),
        headers,
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

#[tauri::command]
pub async fn delete_https_request(
    url: String,
    headers: Option<HashMap<String, String>>,
) -> Result<HttpResponse, String> {
    send_https_request(RequestParams {
        url,
        method: "DELETE".to_string(),
        headers,
        body: None,
    })
    .await
}
