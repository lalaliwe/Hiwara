import { getUserToken } from '../database';
import { token as store_token } from '../store';
import { API_URL } from './config';
import { postSendRequestIwara } from './iwara';

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
export async function getAccessToken(): Promise<any> {
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
