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
    const response = await getSendRequestIwara(path, false, headers);
    return response;
  } catch (error) {
    console.error('Get subscribe image list failed:', error);
    throw error;
  }
}

// 获取论坛版块列表（支持分页）
export async function getForumCategoryList(sectionId: string, page: number = 0, limit: number = 32): Promise<any> {
  const path = `${API_URL}/forum/${sectionId}`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = {
    page: page,
    limit: limit,
  };
  try {
    const response = await getSendRequestIwara(path, false, headers, query);
    return response;
  } catch (error) {
    console.error('Get forum category list failed:', error);
    throw error;
  }
}

// 获取帖子详情
export async function getForumPostDetail(sectionId: string, id: string): Promise<any> {
  const path = `${API_URL}/forum/${sectionId}/${id}`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  try {
    const response = await getSendRequestIwara(path, false, headers);
    return response;
  } catch (error) {
    console.error('Get forum post detail failed:', error);
    throw error;
  }
}

// 获取帖子回复列表（支持分页）
export async function getForumPostReplies(sectionId: string, id: string, page: number = 0, limit: number = 32): Promise<any> {
  const path = `${API_URL}/forum/${sectionId}/${id}`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const query = {
    page: page,
    limit: limit,
  };
  try {
    const response = await getSendRequestIwara(path, false, headers, query);
    return response;
  } catch (error) {
    console.error('Get forum post replies failed:', error);
    throw error;
  }
}

// 回复评论
export async function replyForumPost(id: string, content: string): Promise<any> {
  const path = `${API_URL}/forum/${id}/reply`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const body = {
    body: content,
    rulesAgreement: true
  };
  try {
    const response = await postSendRequestIwara(path, false, headers, body);
    return response;
  } catch (error) {
    console.error('Reply forum post failed:', error);
    throw error;
  }
}

// 创建论坛帖子（发帖）
export async function createForumThread(section: string, title: string, body: string): Promise<any> {
  const path = `${API_URL}/forum/${section}`;
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
  const bodyData = {
    section: section,
    title: title,
    body: body,
    rulesAgreement: true
  };
  try {
    const response = await postSendRequestIwara(path, false, headers, bodyData);
    return response;
  } catch (error) {
    console.error('Create forum thread failed:', error);
    throw error;
  }
}
