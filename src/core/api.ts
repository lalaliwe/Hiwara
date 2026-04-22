import { fetch } from '@tauri-apps/plugin-http';
import { getUserToken } from './database';
import { token as store_token } from './store';
import { invoke } from '@tauri-apps/api/core';

const API_URL = 'https://api.iwara.tv';

// 发送GET请求
async function getSendRequest(path: string, headers?: any, query?: any) {
  try {
    // 构建查询字符串
    let url = `${API_URL}${path}`;
    if (query) {
      const queryParams = new URLSearchParams();
      Object.keys(query).forEach(key => {
        if (query[key] !== undefined && query[key] !== null) {
          queryParams.append(key, String(query[key]));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    // 合并默认头信息和用户传入的头信息
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers || {}),
    };
    const response = await fetch(url, {
      method: 'GET',
      headers: requestHeaders,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('GET request failed:', error);
    throw error;
  }
}
// 发送POST请求 
async function postSendRequest(path: string, headers?: any, body?: any) {
  try {
    // 合并默认头信息和用户传入的头信息
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers || {}),
    };
    const response = await fetch(`${API_URL}${path}`, {
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
// 获取图片
export async function getImage(url: string): Promise<string> {
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

// 登录
export async function login(email: string, password: string): Promise<any> {
  const path = '/user/login';
  const body = {
    email,
    password
  };
  try {
    const response = await postSendRequest(path, undefined, body);
    return response;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// 获取accessToken
async function getAccessToken(): Promise<any> {
  const accessToken = store_token().value
  if (accessToken)
    return accessToken
  const path = '/user/token';
  const token = await getUserToken()
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  try {
    const response = await postSendRequest(path, headers);
    if (response.ok) {
      store_token().set(response.data.accessToken);
      return response.data.accessToken;
    } else {
      throw new Error('Failed to get access token');
    }
  } catch (error) {
    console.error('Get access token failed:', error);
    throw error;
  }
}

// 获取用户订阅视频列表
export async function getSubscribeVideoList(page: number): Promise<any> {
  const path = '/videos';
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = {
    rating: 'all',
    page: page,
    limit: 32,
    subscribed: true
  };
  try {
    const response = await getSendRequest(path, headers, query);
    return response;
  } catch (error) {
    console.error('Get subscribe video list failed:', error);
    throw error;
  }
}
// 获取用户订阅插画列表
export async function getSubscribeImageList(page: number): Promise<any> {
  const path = '/images';
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = {
    rating: 'all',
    page: page,
    limit: 32,
    subscribed: true
  };
  try {
    const response = await getSendRequest(path, headers, query);
    return response;
  } catch (error) {
    console.error('Get subscribe image list failed:', error);
    throw error;
  }
}
// 获取视频列表
export async function getVideoList(page: number, sort: string, date?: string): Promise<any> {
  const path = '/videos';
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = {
    rating: 'all',
    page: page,
    limit: 32,
    sort: sort,
    date: date
  };
  try {
    const response = await getSendRequest(path, headers, query);
    return response;
  } catch (error) {
    console.error('Get subscribe video list failed:', error);
    throw error;
  }
}

// 获取插画列表
export async function getImageList(page: number, sort: string, date?: string): Promise<any> {
  const path = '/images';
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = {
    rating: 'all',
    page: page,
    limit: 32,
    sort: sort,
    date: date
  };
  try {
    const response = await getSendRequest(path, headers, query);
    return response;
  } catch (error) {
    console.error('Get subscribe video list failed:', error);
    throw error;
  }
}