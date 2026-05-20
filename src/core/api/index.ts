// 导出配置常量
export { API_URL, FILESQ_URL } from './config';

// 导出基础请求工具
export { getSendRequest, postSendRequest, deleteRequest } from './base';

// 导出 Iwara 专用请求函数
export { getSendRequestIwara, postSendRequestIwara, deleteSendRequestIwara, getImageIwara } from './iwara';

// 导出认证相关 API
export { login, getAccessToken } from './auth';

// 导出视频相关 API
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

// 导出插画相关 API
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

// 导出用户相关 API
export {
  getMyselfInfo,
  getUserInfo,
  getUserFollowers,
  getUserFans,
  followUser,
  unfollowUser,
  getFriendsList
} from './user';
