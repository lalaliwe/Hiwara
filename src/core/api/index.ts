// 配置常量
export { API_URL, FILESQ_URL } from './config';

// 基础请求工具
export { getSendRequest, postSendRequest, deleteRequest } from './base';

// Iwara 专用请求函数
export { getSendRequestIwara, postSendRequestIwara, deleteSendRequestIwara, getImageIwara } from './iwara';

// 认证 API
export { login, getAccessToken } from './auth';

// 视频 API
export {
  getSubscribeVideoList,
  getFavoritesVideoList,
  getVideoList,
  getVideoInfo,
  getVideoFileSQ,
  likeVideo,
  unlikeVideo,
  getVideoRecommendByUser,
  getVideoRecommendByOther,
  getVideoComments,
  search
} from './video';

// 插画 API
export {
  getSubscribeImageList,
  getFavoritesImageList,
  getImageList,
  getImageInfo,
  likeImage,
  unlikeImage,
  getImageRecommendByUser,
  getImageRecommendByOther,
  getImageComments
} from './image';

// 用户 API
export {
  getMyselfInfo,
  getUserInfo,
  getUserFollowers,
  getUserFans,
  followUser,
  unfollowUser,
  getFriendsList
} from './user';

// 论坛 API
export {
  getForumHome
} from './forum';