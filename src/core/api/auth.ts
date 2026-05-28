import { getUserToken } from '../database';
import { token as store_token } from '../store';
import { logout } from '../auth';
import { API_URL } from './config';
import { postSendRequestIwara } from './iwara';

/**
 * 解码 JWT payload（base64url -> JSON）
 */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const decoded = atob(base64 + padding);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * 检查 JWT token 是否已过期
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return Date.now() >= payload.exp * 1000;
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

// 获取accessToken（自动检测过期并刷新，refreshToken过期则退出登录）
export async function getAccessToken(): Promise<any> {
  // 1. 检查缓存的 accessToken 是否仍然有效
  const cachedToken = store_token().value
  if (cachedToken && !isTokenExpired(cachedToken)) {
    return cachedToken
  }

  // 2. 缓存中无有效 token，用 refreshToken 向 API 重新获取
  const path = `${API_URL}/user/token`;
  const refreshToken = await getUserToken()
  const headers = {
    Authorization: `Bearer ${refreshToken}`,
  };

  try {
    const response = await postSendRequestIwara(path, headers);
    store_token().set(response.data.accessToken);
    return response.data.accessToken;
  } catch (error) {
    console.error('Get access token failed:', error);
    // postSendRequestIwara 在非 2xx 响应时会抛出包含状态码的错误
    // 例如 401 表示 refreshToken 已过期，此时执行退出登录
    const errorMsg = String(error);
    if (/status\s+4\d\d/.test(errorMsg)) {
      console.log('refreshToken 已过期，执行退出登录');
      await logout();
    }
    throw error;
  }
}
