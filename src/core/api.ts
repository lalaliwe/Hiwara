import { fetch } from '@tauri-apps/plugin-http';
import { getUserToken } from './database';
import { token as store_token } from './store';

const API_URL = 'https://api.iwara.tv';

// 发送GET请求
async function getSendRequest(path: string, headers?: any, query?: any) {
  try {
    // 构建查询字符串
    let url = `${API_URL}/${path}`;
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
    console.log(`${API_URL}/${path}`)
    const response = await fetch(`${API_URL}/${path}`, {
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

// 登录
export async function login(email: string, password: string): Promise<any> {
  const path = 'user/login';
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
  const path = 'user/token';
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
export async function getSubscribeVideoList(): Promise<any> {
  const path = 'videos';
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = {
    rating: 'all',
    page: 0,
    limit: 24,
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