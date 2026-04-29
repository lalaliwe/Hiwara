<script setup lang="ts">
import { onActivated, ref, watch } from 'vue'
import { getVideoComments, getImageIwara } from '../../core/api'
import errorHuawu from '../errorHuawu.vue'
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
const commentViewRef = ref<HTMLElement>()

// 接收视频ID prop
const props = defineProps<{
  vid: string
}>()

let commentPage = 0
const commentMore = ref(false)
let scrollTop = 0

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

// 获取评论列表
async function getCommentList() {
  if (!props.vid) return
  
  try {
    const res = await getVideoComments(props.vid, commentPage)
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
          }
        })
        // 追加数据
        commentList.value = [...commentList.value, ...newComments]
        // 批量加载新评论的头像
        await loadAvatarsForComments(newComments)
        commentPage++
      } else {
        commentMore.value = true
      }
    } else {
      console.error(`状态码：${res.status}`, `错误信息：${res.statusText}`)
      showShortToast('获取评论失败')
    }
  } catch (error) {
    console.error(`获取评论失败:`, error)
    showShortToast('获取评论失败')
  }
}

// 滚动到底部加载数据
async function handleScrollToEnd({ done }: any) {
  await getCommentList()
  if (commentMore.value) {
    done('empty')
  } else {
    done('ok')
  }
}

// 初始化加载评论
function initGetComments() {
  if (props.vid && commentList.value.length === 0) {
    getCommentList()
  }
}

// 监听视频ID变化
watch(() => props.vid, (newVal) => {
  if (newVal && commentList.value.length === 0) {
    // 重置分页状态
    commentPage = 0
    commentMore.value = false
    commentList.value = []
    avatarUrlMap.value = {}
    getCommentList()
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
  if (commentViewRef.value && typeof commentViewRef.value.scrollTo === 'function') {
    commentViewRef.value.scrollTo({ top: scrollTop })
  }
})
</script>

<template>
  <div class="commentView" @scroll="handleScroll" ref="commentViewRef">
    <div v-if="commentList.length === 0 && commentMore" class="empty-state">
      <errorHuawu>当前还没有评论</errorHuawu>
    </div>
    <v-infinite-scroll v-else color="#00796B" @load="handleScrollToEnd" :disabled="commentMore">
      <div class="commentItem" v-for="item in commentList" :key="item.id">
        <div class="avatar">
          <v-img :src="avatarUrlMap[item.user.id] || avatarPlaceholderImg" cover height="40px" width="40px" style="border-radius: 50%;">
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
              <div class="created-time">{{ formatDate(item.createdAt) }}</div>
              <!-- 回复按钮 -->
              <div class="reply-btn">
                <font-awesome-icon icon="fa-regular fa-comment" /> 回复
              </div>
              <!-- 展开/收起按钮 (仅长文本显示) -->
              <div class="toggle-btn" v-if="needToggle(item.body)" @click="toggleExpand(item.id)">
                {{ expandedMap[item.id] ? '收起' : '展开' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <template v-slot:empty>
        <div class="listEnd">
          已经到底了
        </div>
      </template>
    </v-infinite-scroll>
  </div>
</template>

<style lang="scss" scoped>
.commentView {
  height: 100%;
  overflow-y: auto;

  >div {
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
}

.listEnd {
  color: #757575;
  padding: 4px 0;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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

      .reply-btn {
        color: #616161;
        cursor: pointer;
        padding: 0 4px;
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
