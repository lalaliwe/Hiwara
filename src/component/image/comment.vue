<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { getImageComments, getImageIwara } from '../../core/api';
import errorHuawu from '../errorHuawu.vue';
import loadingHuawu from '../loadingHuawu.vue';
import { showShortToast } from '../../core/toast';
import defaultAvatarImg from '../../static/img/avatar-default.jpg';
import avatarPlaceholderImg from '../../static/img/avatar-placeholder.png';
import avatarErrorImg from '../../static/img/avatar-error.png';

interface CommentUser {
  id: string
  name: string
  username: string
  avatar: {
    id: string
    path: string
    name: string
  } | null
}

interface Comment {
  id: string
  approved: boolean
  body: string
  numReplies: number
  parent: string | null
  createdAt: string
  updatedAt: string
  user: CommentUser
  imageId: string
}

const emit = defineEmits(['close']);

// 全屏状态
const isFullscreen = ref(false);

// 接收图片ID prop
const props = defineProps<{
  pid: string
}>();

const commentList = ref<Comment[]>([])
const commentListRef = ref<HTMLElement>()

let commentPage = 0
const commentMore = ref(false) // 评论加载到底
let scrollTop = 0

// 加载更多失败标记
const loadMoreFailed = ref(false) // 评论加载失败

// 聚合状态：'failed' | 'empty' | 'loading' | 'success'
type CommentState = 'failed' | 'empty' | 'loading' | 'success'
const commentState = ref<CommentState>('loading')

// 头像 URL 缓存 (userId -> avatarUrl)
const avatarUrlMap = ref<Record<string, string>>({})

// 加载单个用户头像
async function loadUserAvatar(user: CommentUser): Promise<string> {
  const userId = user.id

  // 如果已经缓存，直接返回
  if (avatarUrlMap.value[userId]) {
    return avatarUrlMap.value[userId]
  }

  let avatarUrl: string

  try {
    // 没有头像信息，使用默认头像
    if (!user.avatar) {
      avatarUrl = defaultAvatarImg
    } else {
      // 先拼接头像URL
      const avatarImageUrl = `https://i.iwara.tv/image/avatar/${user.avatar.id}/${user.avatar.name}`
      // 通过 API 获取图片数据
      avatarUrl = await getImageIwara(avatarImageUrl)
    }
  } catch (error) {
    console.error('Failed to load avatar:', error)
    avatarUrl = avatarErrorImg
  }

  avatarUrlMap.value[userId] = avatarUrl
  return avatarUrl
}

// 批量加载新评论的头像
async function loadAvatarsForComments(comments: Comment[]) {
  for (const comment of comments) {
    await loadUserAvatar(comment.user)
  }
}

// 初始获取评论列表数据
function initGetComments() {
  if (commentState.value === 'loading') {
    getCommentList().then((res) => {
      if (res.length > 0)
        commentState.value = 'success';
      else
        commentState.value = 'empty';
    }).catch(() => {
      commentState.value = 'failed';
    });
  }
}

// 刷新数据
function refreshData() {
  // 清空评论列表数据
  commentList.value = [];
  commentPage = 0;
  commentMore.value = false;
  loadMoreFailed.value = false;
  commentState.value = 'loading';

  // 获取评论列表数据
  getCommentList().then((res) => {
    if (res.length > 0)
      commentState.value = 'success';
    else
      commentState.value = 'empty';
  }).catch(() => {
    commentState.value = 'failed';
  });
}

// 点击错误图片刷新数据
function handleErrorClick() {
  refreshData();
}

// 下滑列表到底追加数据
async function handleScrollToEnd({ done }: any) {
  getCommentList().then((res) => {
    if (res.length > 0) done('ok');
    else {
      commentMore.value = true;
      done('empty');
    }
  }).catch(() => {
    loadMoreFailed.value = true;
    done('error');
  });
}

// 获取评论列表
async function getCommentList(): Promise<any> {
  if (!props.pid) {
    throw new Error('图片ID不存在');
  }

  try {
    const res = await getImageComments(props.pid, commentPage);
    if (res.ok) {
      if (res.data.results && res.data.results.length > 0) {
        const newComments = res.data.results.map((item: any) => {
          return {
            id: item.id,
            approved: item.approved,
            body: item.body,
            numReplies: item.numReplies,
            parent: item.parent,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            user: item.user,
            imageId: item.imageId
          };
        });
        // 追加数据
        commentList.value = [...commentList.value, ...newComments];
        // 批量加载新评论的头像
        await loadAvatarsForComments(newComments);
        commentPage++;
        // 返回数据
        return newComments;
      } else {
        // 返回空数组
        return [];
      }
    }
    throw new Error(`状态码：${res.status}, 错误信息：${res.statusText}`);
  } catch (error) {
    console.error(`获取评论列表失败:`, error);
    showShortToast('获取评论列表失败');
    throw error;
  }
}

// 监听图片ID变化
watch(() => props.pid, (newVal) => {
  if (newVal) {
    // 重置分页状态
    commentPage = 0;
    commentMore.value = false;
    commentList.value = [];
    avatarUrlMap.value = {};
    loadMoreFailed.value = false;
    commentState.value = 'loading';
    // 重新初始化加载
    initGetComments();
  }
}, { immediate: true })

const expandedMap = ref<Record<string, boolean>>({})

const needToggle = (content: string) => {
  return content.length > 180
}

const toggleExpand = (id: string) => {
  expandedMap.value[id] = !expandedMap.value[id]
}

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const month = 30 * day
  const year = 365 * day

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < month) {
    return `${Math.floor(diff / day)}天前`
  } else if (diff < year) {
    return `${Math.floor(diff / month)}个月前`
  } else {
    return `${Math.floor(diff / year)}年前`
  }
}

// 保存滚动条位置
function handleScroll(e: Event): void {
  scrollTop = (e.target as HTMLElement).scrollTop
}

// 进入全屏
const enterFullscreen = async () => {
  try {
    // 推入历史记录，用于捕获返回键
    history.pushState({ fullscreen: true }, '');
    isFullscreen.value = true;
  } catch (err) {
    console.error('进入全屏失败:', err);
  }
};

// 退出全屏
const exitFullscreen = async () => {
  try {
    // 如果处于全屏状态，则退出
    if (isFullscreen.value) {
      isFullscreen.value = false;
    }
  } catch (err) {
    console.error('退出全屏失败:', err);
  }
};

// 监听手机返回键 (popstate)
const handlePopState = () => {
  // 如果用户按了返回键，且当前处于全屏，则退出全屏
  if (isFullscreen.value) {
    exitFullscreen();
    emit('close');
  }
};

// 关闭评论
const handleClose = async () => {
  await exitFullscreen();
  emit('close');
};

defineExpose({
  enterFullscreen
});

// 组件挂载时监听 popstate 事件
onMounted(() => {
  window.addEventListener('popstate', handlePopState);
});

onUnmounted(() => {
  // 移除 popstate 监听
  window.removeEventListener('popstate', handlePopState);
  // 确保退出全屏状态
  if (isFullscreen.value) {
    exitFullscreen();
  }
});
</script>
<template>
  <div class="comment-container">
    <div class="topBar">
      <div class="goback" @click="handleClose">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </div>
      <div class="label">
        评论
      </div>
    </div>

    <div class="commentView">
      <div v-if="commentState === 'failed'" class="empty-state" @click="handleErrorClick">
        <errorHuawu>评论加载失败了喵~</errorHuawu>
      </div>
      <div v-else-if="commentState === 'empty'" class="empty-state" @click="handleErrorClick">
        <errorHuawu>当前还没有评论</errorHuawu>
      </div>
      <div v-else-if="commentState === 'loading'" class="empty-state">
        <loadingHuawu>评论加载中</loadingHuawu>
      </div>
      <v-infinite-scroll class="commentList" v-else color="#00796B" @load="handleScrollToEnd" :disabled="commentMore"
        @scroll="handleScroll" ref="commentListRef">
        <div class="commentItem" v-for="item in commentList" :key="item.id">
          <div class="avatar">
            <v-img :src="avatarUrlMap[item.user.id] || avatarPlaceholderImg" cover height="40px" width="40px"
              style="border-radius: 50%;">
              <template v-slot:placeholder>
                <v-img height="100%" width="100%" :src="avatarPlaceholderImg" cover style="border-radius: 50%;"></v-img>
              </template>
            </v-img>
          </div>
          <div class="elements">
            <div class="username">{{ item.user.name || item.user.username }}</div>
            <div class="content-wrapper">
              <div class="content" :class="{ fold: needToggle(item.body) && !expandedMap[item.id] }">
                {{ item.body }}
              </div>
              <!-- 底部操作栏：始终显示 -->
              <div class="action-bar">
                <!-- 发布时间 -->
                <div class="created-time">{{ formatDate(item.createdAt) }}&nbsp;&nbsp;</div>
                <!-- 回复数 + 回复按钮 -->
                <div class="reply-section">
                  <div v-if="item.numReplies > 0">{{ item.numReplies }}条回复&nbsp;&nbsp;</div>
                  <div class="reply-btn">
                    回复
                  </div>
                </div>
                <!-- 展开/收起按钮 (仅长文本显示) -->
                <div class="toggle-btn" v-if="needToggle(item.body)" @click="toggleExpand(item.id)">
                  {{ expandedMap[item.id] ? '收起' : '展开' }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <template v-slot:error="{ props }">
          <div class="load-more-failed">
            <span>加载失败，</span>
            <span class="retry-btn" v-bind=props>点击重试</span>
          </div>
        </template>
        <template v-slot:empty>
          <div class="listEnd">
            已经到底了喵~
          </div>
        </template>
      </v-infinite-scroll>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.comment-container {
  background-color: #fafafa;
  height: 100vh;
  width: 100vw;
  overflow-y: auto;
}

.topBar {
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 400;
  padding-top: env(safe-area-inset-top, 0);
  height: calc(env(safe-area-inset-top, 0) + 60px);
  background-color: rgba(0, 121, 107, 0.9);
  color: #fff;
  display: flex;
  align-items: center;
  user-select: none;

  .goback {
    padding: 0 16px;
    height: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;

    svg {
      font-size: 1.5rem;
      color: white;
    }

    &:active {
      opacity: 0.7;
    }
  }

  .label {
    font-size: 1.2rem;
    font-weight: 500;
  }
}

.commentView {
  height: 100%;

  >div {
    padding-bottom: env(safe-area-inset-bottom, 0);
  }

}

.listEnd {
  color: #757575;
  padding: 4px 0;
}

.load-more-failed {
  text-align: center;
  padding: 10px 0;
  color: #757575;
  font-size: 0.9rem;

  .retry-btn {
    color: #00796B;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
  }
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.commentList {
  height: 100%;
  overflow-x: hidden;
  padding: calc(env(safe-area-inset-top, 0) + 60px) 0 env(safe-area-inset-bottom, 0) 0;

  &::-webkit-scrollbar-track {
    margin: calc(60px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  }
}

.commentItem {
  display: flex;
  padding: 10px;
  border-bottom: 1px solid #eee;

  .avatar {
    flex-shrink: 0;

    :deep(.v-img) {
      border-radius: 50%;
      background-color: #eee;
    }
  }

  .elements {
    margin-left: 10px;
    flex: 1;

    .username {
      font-size: 0.8rem;
      color: #616161;
    }

    .content-wrapper {
      margin-top: 5px;
    }

    .content {
      font-size: 0.9rem;
      line-height: 1.5em;
      text-align: justify;
      overflow-wrap: anywhere;

      &.fold {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 6;
        overflow: hidden;
        position: relative;

        &::after {
          content: '...';
          position: absolute;
          right: 0;
          bottom: 0;
          padding-left: 5px;
          background: #fff;
        }
      }
    }

    /* 底部操作栏 */
    .action-bar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      margin-top: 2px;
      font-size: 0.8rem;

      .created-time {
        color: #616161;
      }

      .reply-section {
        display: flex;
        align-items: center;
        color: #616161;

        .reply-btn {
          cursor: pointer;
          color: #00796B;
        }
      }

      .toggle-btn {
        color: #00796B;
        cursor: pointer;
        flex-shrink: 0;

        &:hover {
          opacity: 0.8;
        }
      }
    }
  }
}
</style>