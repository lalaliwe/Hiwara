import { API_URL } from './config';
import { getAccessToken } from './auth';
import { getSendRequestIwara, postSendRequestIwara, deleteSendRequestIwara } from './iwara';

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
    console.error('Get myself info failed:', error);
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
    console.error('Get user followers failed:', error);
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
    console.error('Get user fans failed:', error);
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

// 获取好友列表
export async function getFriendsList(uid: string, page: number): Promise<any> {
  const path = `${API_URL}/user/${uid}/friends`;
  console.log(path);
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = { page: page };
  try {
    const response = await getSendRequestIwara(path, headers, query);
    return response;
  } catch (error) {
    console.error('Get friends list failed:', error);
    throw error;
  }
}
