<script setup lang="ts">
import { onActivated, ref, watch } from 'vue'
import { getVideoComments, getImageIwara } from '../../core/api'
import errorHuawu from '../errorHuawu.vue'
import loadingHuawu from '../loadingHuawu.vue'
import { showShortToast } from '../../core/toast'
import defaultAvatarImg from '../../static/img/avatar-default.jpg'
import avatarPlaceholderImg from '../../static/img/avatar-placeholder.png'
import avatarErrorImg from '../../static/img/avatar-error.png'

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
  videoId: string
}

const commentList = ref<Comment[]>([])
const commentListRef = ref<HTMLElement>()

// 接收视频ID prop
const props = defineProps<{
  vid: string
}>()

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
  if (!props.vid) {
    throw new Error('视频ID不存在');
  }

  try {
    const res = await getVideoComments(props.vid, commentPage);
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
            videoId: item.videoId
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

// 监听视频ID变化
watch(() => props.vid, (newVal) => {
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

onActivated(() => {
  // 恢复滚动条位置
  if (commentListRef.value && typeof commentListRef.value.scrollTo === 'function') {
    commentListRef.value.scrollTo({ top: scrollTop })
  }
})
</script>

<template>
  <div class="commentView">
    <div v-if="commentState === 'failed'" class="status-overlay" @click="handleErrorClick">
      <errorHuawu>评论加载失败了喵~</errorHuawu>
    </div>
    <div v-else-if="commentState === 'empty'" class="status-overlay" @click="handleErrorClick">
      <errorHuawu>当前还没有评论</errorHuawu>
    </div>
    <div v-else-if="commentState === 'loading'" class="status-overlay">
      <loadingHuawu>评论加载中</loadingHuawu>
    </div>
    <v-infinite-scroll class="commentList" v-else color="#00796B" @load="handleScrollToEnd" :disabled="commentMore" @scroll="handleScroll"
      ref="commentListRef">
      <div class="commentItem" v-for="item in commentList" :key="item.id">
        <div class="avatar">
          <v-img :src="avatarUrlMap[item.user.id] || avatarPlaceholderImg" cover height="40px" width="40px"
            style="border-radius: 50%;">
            <template v-slot:placeholder>
              <v-img height="100%" width="100%" :src="avatarPlaceholderImg" cover style="border-radius: 50%;"></v-img>
            </template>
          </v-img>
        </div>
        <div class="comment-body">
          <div class="username">{{ item.user.name || item.user.username }}</div>
          <div class="content-wrapper">
            <div class="content" :class="{ fold: needToggle(item.body) && !expandedMap[item.id] }">
              {{ item.body }}
            </div>
            <div class="action-bar">
              <div class="created-time">{{ formatDate(item.createdAt) }}&nbsp;&nbsp;</div>
              <div class="reply-section">
                <div v-if="item.numReplies > 0">{{ item.numReplies }}条回复&nbsp;&nbsp;</div>
                <div class="reply-btn">回复</div>
              </div>
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
</template>

<style lang="scss" scoped>
.commentView {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 0);
  box-sizing: border-box;
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

.status-overlay {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.commentList {
  flex: 1;
  overflow-y: auto;
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

  .comment-body {
    margin-left: 10px;
    flex: 1;
    min-width: 0;

    .username {
      font-size: 0.8rem;
      color: #616161;
    }

    .content-wrapper {
      margin-top: 5px;
      min-width: 0;
    }

    .content {
      font-size: 0.9rem;
      line-height: 1.5em;
      text-align: justify;
      overflow-wrap: break-word;
      word-break: break-word;

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
