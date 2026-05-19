import { invoke } from '@tauri-apps/api/core';

// 发送GET请求(iwara)
export async function getSendRequestIwara(url: string, headers?: any, query?: any) {
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
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.iwara.tv/',
      'Accept-Encoding': 'gzip, deflate, br', // 支持压缩编码
      ...(headers || {}),
    };

    // 使用我们创建的自定义网络请求命令，模拟浏览器请求
    const response: any = await invoke('get_https_request', {
      url: finalUrl,
      headers: requestHeaders
    });

    // 检查响应状态
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    // 尝试解析 JSON，如果失败则返回文本
    let data: any = null;
    const contentType = response.headers['Content-Type'] || response.headers['content-type'];

    // 检查内容是否为JSON
    if (contentType && contentType.includes('application/json')) {
      try {
        // 如果是JSON，解析它
        data = JSON.parse(response.data);
      } catch (e) {
        console.warn('Failed to parse JSON response:', e);
        console.warn('Raw response data:', response.data);
        data = response.data;
      }
    } else {
      // 不是JSON则直接使用响应数据
      data = response.data;
    }

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: data,
    };
  } catch (error) {
    console.error('GET request failed:', error);
    throw error;
  }
}

// 发送POST请求(iwara) 
export async function postSendRequestIwara(url: string, headers?: any, body?: any) {
  try {
    // 合并默认头信息和用户传入的头信息
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.iwara.tv/',
      'Accept-Encoding': 'gzip, deflate, br', // 支持压缩编码
      ...(headers || {}),
    };

    // 使用我们创建的自定义网络请求命令，模拟浏览器请求
    const response: any = await invoke('post_https_request', {
      url,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined
    });

    // 检查响应状态
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    // 尝试解析 JSON，如果失败则返回文本
    let data: any = null;
    const contentType = response.headers['Content-Type'] || response.headers['content-type'];

    // 检查内容是否为JSON
    if (contentType && contentType.includes('application/json')) {
      try {
        // 如果是JSON，解析它
        data = JSON.parse(response.data);
      } catch (e) {
        console.warn('Failed to parse JSON response:', e);
        console.warn('Raw response data:', response.data);
        data = response.data;
      }
    } else {
      // 不是JSON则直接使用响应数据
      data = response.data;
    }

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: data,
    };
  } catch (error) {
    console.error('POST request failed:', error);
    throw error;
  }
}

// 发送DELETE请求(iwara) 
export async function deleteSendRequestIwara(url: string, headers?: any) {
  try {
    // 合并默认头信息和用户传入的头信息
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.iwara.tv/',
      'Accept-Encoding': 'gzip, deflate, br', // 支持压缩编码
      ...(headers || {}),
    };

    // 使用我们创建的自定义网络请求命令，模拟浏览器请求
    const response: any = await invoke('delete_https_request', {
      url,
      headers: requestHeaders
    });

    // 检查响应状态
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    // 尝试解析 JSON，如果失败则返回文本
    let data: any = null;
    const contentType = response.headers['Content-Type'] || response.headers['content-type'];

    // 检查内容是否为JSON
    if (contentType && contentType.includes('application/json')) {
      try {
        // 如果是JSON，解析它
        data = JSON.parse(response.data);
      } catch (e) {
        console.warn('Failed to parse JSON response:', e);
        console.warn('Raw response data:', response.data);
        data = response.data;
      }
    } else {
      // 不是JSON则直接使用响应数据
      data = response.data;
    }

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: data,
    };
  } catch (error) {
    console.error('DELETE request failed:', error);
    throw error;
  }
}

// 获取图片(iwara) 
export async function getImageIwara(url: string): Promise<string> {
  // console.log('getImageIwara', url);
  try {
    // 构建请求头
    const headers: Record<string, string> = {
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Referer': 'https://www.iwara.tv/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    // 使用我们创建的自定义网络请求命令获取二进制数据，模拟浏览器请求
    const response: any = await invoke('send_https_request_binary', {
      params: {
        url,
        method: 'GET',
        headers
      }
    });
    // 检查响应状态
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    // 将响应的二进制数据转换为 Blob
    // response.data 现在是一个数字数组，代表字节
    const uint8Array = new Uint8Array(response.data);
    const blob = new Blob([uint8Array], { type: response.headers['Content-Type'] || 'image/jpeg' });
    // 创建对象 URL 并返回
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('GET image failed:', error);
    throw error;
  }
}
