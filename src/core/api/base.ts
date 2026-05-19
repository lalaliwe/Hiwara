import { fetch } from '@tauri-apps/plugin-http';

// 发送GET请求（通用）
export async function getSendRequest(url: string, headers?: any, query?: any) {
  try {
    // 构建查询字符串
    let finalUrl = url;
    if (query) {
      const queryParams = new URLSearchParams();
      Object.keys(query).forEach(key => {
        if (query[key] !== undefined && query[key] !== null) {
          queryParams.append(key, String(query[key]));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        finalUrl += `?${queryString}`;
      }
    }
    // 合并默认头信息和用户传入的头信息
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers || {}),
    };
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: requestHeaders,
    });
    console.log('response', response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // 尝试解析 JSON，如果失败则返回文本或空对象
    let data: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        console.warn('Failed to parse JSON response:', e);
        data = await response.text();
      }
    } else {
      data = await response.text();
    }
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: data,
    };
  } catch (error) {
    console.error('GET request failed:', error);
    throw error;
  }
}

// 发送POST请求（通用）
export async function postSendRequest(url: string, headers?: any, body?: any) {
  try {
    // 合并默认头信息和用户传入的头信息
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers || {}),
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
    // 尝试解析 JSON，如果失败则返回文本或空对象
    let data: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        console.warn('Failed to parse JSON response:', e);
        data = await response.text();
      }
    } else {
      data = await response.text();
    }
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: data,
    };
  } catch (error) {
    console.error('POST request failed:', error);
    throw error;
  }
}

// 发送DELETE请求（通用）
export async function deleteRequest(url: string, headers?: any): Promise<any> {
  try {
    // 合并默认头信息和用户传入的头信息
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers || {}),
    };
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: requestHeaders,
    });
    
    // 尝试解析 JSON，如果失败则返回文本或空对象
    let data: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        console.warn('Failed to parse JSON response:', e);
        data = await response.text();
      }
    } else {
      data = await response.text();
    }
    
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: data,
    };
  } catch (error) {
    console.error('DELETE request failed:', error);
    throw error;
  }
}
