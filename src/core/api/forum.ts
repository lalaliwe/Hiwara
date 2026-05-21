import { API_URL } from './config';
import { getAccessToken } from './auth';
import { getSendRequestIwara, postSendRequestIwara, deleteSendRequestIwara } from './iwara';

// 获取论坛首页
export async function getForumHome(): Promise<any> {
  const path = `${API_URL}/forum`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  try {
    const response = await getSendRequestIwara(path, headers);
    return response;
  } catch (error) {
    console.error('Get subscribe image list failed:', error);
    throw error;
  }
}