import { fetch } from '@tauri-apps/plugin-http';
import { getUserToken } from './database';
import { token as store_token } from './store';
import { invoke } from '@tauri-apps/api/core';
import { sha1 } from './crypto';

const API_URL = 'https://api.iwara.tv';
const FILESQ_URL = 'https://filesq.iwara.tv';

// 发送GET请求
async function getSendRequest(url: string, headers?: any, query?: any) {
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
// 发送POST请求 
async function postSendRequest(url: string, headers?: any, body?: any) {
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
// 发送DELETE请求
async function deleteRequest(url: string, customHeaders?: any): Promise<any> {
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
    ...(customHeaders || {}),
  };
  try {
    const response = await deleteSendRequestIwara(url, headers);
    return response;
  } catch (error) {
    console.error('DELETE request failed:', error);
    throw error;
  }
}
// 发送GET请求(iwara)
async function getSendRequestIwara(url: string, headers?: any, query?: any) {
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
async function postSendRequestIwara(url: string, headers?: any, body?: any) {
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
async function deleteSendRequestIwara(url: string, headers?: any) {
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

// 登录
export async function login(email: string, password: string): Promise<any> {
  const path = `${API_URL}/user/login`;
  const body = {
    email,
    password
  };
  try {
    const response = await postSendRequestIwara(path, undefined, body);
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
  const path = `${API_URL}/user/token`;
  const token = await getUserToken()
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  try {
    const response = await postSendRequestIwara(path, headers);
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
  const path = `${API_URL}/videos`;
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
    const response = await getSendRequestIwara(path, headers, query);
    return response;
  } catch (error) {
    console.error('Get subscribe video list failed:', error);
    throw error;
  }
}
// 获取用户订阅插画列表
export async function getSubscribeImageList(page: number): Promise<any> {
  const path = `${API_URL}/images`;
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
    const response = await getSendRequestIwara(path, headers, query);
    return response;
  } catch (error) {
    console.error('Get subscribe image list failed:', error);
    throw error;
  }
}
// 获取视频列表
export async function getVideoList(page: number, sort: string, date?: string, user?: string): Promise<any> {
  const path = `${API_URL}/videos`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = {
    rating: 'all',
    page: page,
    limit: 32,
    sort: sort,
    ...(date && { date }),
    ...(user && { user })
  };
  try {
    const response = await getSendRequestIwara(path, headers, query);
    return response;
  } catch (error) {
    console.error('Get subscribe video list failed:', error);
    throw error;
  }
}

// 获取插画列表
export async function getImageList(page: number, sort: string, date?: string, user?: string): Promise<any> {
  const path = `${API_URL}/images`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = {
    rating: 'all',
    page: page,
    limit: 32,
    sort: sort,
    ...(date && { date }),
    ...(user && { user })
  };
  try {
    const response = await getSendRequestIwara(path, headers, query);
    return response;
  } catch (error) {
    console.error('Get subscribe video list failed:', error);
    throw error;
  }
}
// 获取视频信息
export async function getVideoInfo(videoId: string): Promise<any> {
  const path = `${API_URL}/video/${videoId}`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  try {
    const response = await getSendRequestIwara(path, headers);
    return response;
  } catch (error) {
    console.error('Get video info failed:', error);
    throw error;
  }
}
// 获取视频文件信息
export async function getVideoFileSQ(url: string, download: string): Promise<any> {
  // 示例url：https://filesq.iwara.tv/file/703f6909-71cd-4562-90d8-d03641ad4706?expires=1776910833478&hash=bfaa8a6c942a9553af1c976dc56b1585fc119ad522e7fc8970a1f18a50823b09
  const urlObj = new URL(url);
  const id = urlObj.pathname.split('/').pop();
  const expires = urlObj.searchParams.get('expires');
  const hash = urlObj.searchParams.get('hash');
  const salt = 'mSvL05GfEmeEmsEYfGCnVpEjYgTJraJN'
  const headers = {
    'x-version': await sha1(`${id}_${expires}_${salt}`)
  };
  const path = download ? `${url}${url.includes('?') ? '&' : '?'}download=${encodeURIComponent(download)}` : url;
  try {
    const response = await getSendRequestIwara(path, headers);
    return response;
  } catch (error) {
    console.error('Get video file info failed:', error);
    throw error;
  }
}
// 点赞视频
export async function likeVideo(videoId: string): Promise<any> {
  const path = `${API_URL}/video/${videoId}/like`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  try {
    const response = await postSendRequestIwara(path, headers);
    return response;
  } catch (error) {
    console.error('Like video failed:', error);
    throw error;
  }
}
// 取消点赞视频
export async function unlikeVideo(videoId: string): Promise<any> {
  const path = `${API_URL}/video/${videoId}/like`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  try {
    const response = await deleteSendRequestIwara(path, headers);
    return response;
  } catch (error) {
    console.error('Unlike video failed:', error);
    throw error;
  }
}
// 获取视频推荐：该用户的其他视频
export async function getVideoRecommendByUser(vid: string, uid: string): Promise<any> {
  const path = `${API_URL}/videos`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = {
    rating: 'all',
    user: uid,
    exclude: vid,
    limit: 6
  };
  try {
    const response = await getSendRequestIwara(path, headers, query);
    return response;
  } catch (error) {
    console.error('Get video info failed:', error);
    throw error;
  }
}
// 获取视频推荐：更多视频
export async function getVideoRecommendByOther(vid: string): Promise<any> {
  const path = `${API_URL}/video/${vid}/related`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  try {
    const response = await getSendRequestIwara(path, headers);
    return response;
  } catch (error) {
    console.error('Get video info failed:', error);
    throw error;
  }
}
// 获取视频评论
export async function getVideoComments(vid: string, page: number): Promise<any> {
  const path = `${API_URL}/video/${vid}/comments`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = {
    page: page,
    limit: 32
  };
  try {
    const response = await getSendRequestIwara(path, headers, query);
    return response;
  } catch (error) {
    console.error('Get video info failed:', error);
    throw error;
  }
}
// 获取插画信息
export async function getImageInfo(imageId: string): Promise<any> {
  const path = `${API_URL}/image/${imageId}`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  try {
    console.log(path)
    const response = await getSendRequestIwara(path, headers);
    return response;
  } catch (error) {
    console.error('Get image info failed:', error);
    throw error;
  }
}
// 点赞插画
export async function likeImage(imageId: string): Promise<any> {
  const path = `${API_URL}/image/${imageId}/like`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  try {
    const response = await postSendRequestIwara(path, headers);
    return response;
  } catch (error) {
    console.error('Like image failed:', error);
    throw error;
  }
}
// 取消点赞插画
export async function unlikeImage(imageId: string): Promise<any> {
  const path = `${API_URL}/image/${imageId}/like`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  try {
    const response = await deleteSendRequestIwara(path, headers);
    return response;
  } catch (error) {
    console.error('Unlike image failed:', error);
    throw error;
  }
}
// 获取插画推荐：该用户的其他插画
export async function getImageRecommendByUser(pid: string, uid: string): Promise<any> {
  const path = `${API_URL}/images`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = {
    rating: 'all',
    user: uid,
    exclude: pid,
    limit: 6
  };
  try {
    const response = await getSendRequestIwara(path, headers, query);
    return response;
  } catch (error) {
    console.error('Get image info failed:', error);
    throw error;
  }
}
// 获取插画推荐：更多插画
export async function getImageRecommendByOther(pid: string): Promise<any> {
  const path = `${API_URL}/image/${pid}/related`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  try {
    const response = await getSendRequestIwara(path, headers);
    return response;
  } catch (error) {
    console.error('Get image info failed:', error);
    throw error;
  }
}
// 获取插画评论
export async function getImageComments(pid: string, page: number): Promise<any> {
  const path = `${API_URL}/image/${pid}/comments`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = {
    page: page,
    limit: 32
  };
  try {
    const response = await getSendRequestIwara(path, headers, query);
    return response;
  } catch (error) {
    console.error('Get image comments failed:', error);
    throw error;
  }
}
// 获取用户个人信息
export async function getMyselfInfo(): Promise<any> {
  const path = `${API_URL}/user`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  try {
    const response = await getSendRequestIwara(path, headers);
    return response;
  } catch (error) {
    console.error('Get user info failed:', error);
    throw error;
  }
}
// 获取用户信息
export async function getUserInfo(username: string): Promise<any> {
  const path = `${API_URL}/profile/${username}`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  try {
    const response = await getSendRequestIwara(path, headers);
    return response;
  } catch (error) {
    console.error('Get user info failed:', error);
    throw error;
  }
}
// 获取用户关注列表
export async function getUserFollowers(uid: string, page: number = 0): Promise<any> {
  const path = `${API_URL}/user/${uid}/following`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = { page: page };
  try {
    const response = await getSendRequestIwara(path, headers, query);
    return response;
  } catch (error) {
    console.error('Get user info failed:', error);
    throw error;
  }
}
// 获取用户粉丝列表
export async function getUserFans(uid: string, page: number = 0): Promise<any> {
  const path = `${API_URL}/user/${uid}/followers`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = { page: page };
  try {
    const response = await getSendRequestIwara(path, headers, query);
    return response;
  } catch (error) {
    console.error('Get user info failed:', error);
    throw error;
  }
}
// 关注用户
export async function followUser(uid: string): Promise<any> {
  const path = `${API_URL}/user/${uid}/followers`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  try {
    const response = await postSendRequestIwara(path, headers);
    return response;
  } catch (error) {
    console.error('Follow user failed:', error);
    throw error;
  }
}
// 取消关注用户
export async function unfollowUser(uid: string): Promise<any> {
  const path = `${API_URL}/user/${uid}/followers`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  try {
    const response = await deleteSendRequestIwara(path, headers);
    return response;
  } catch (error) {
    console.error('Unfollow user failed:', error);
    throw error;
  }
}
