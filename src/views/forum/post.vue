<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ref, onActivated } from 'vue';
import { setStatusBarTextStyle } from '../../plugins/navbarStyle';
import defaultAvatarImg from '../../static/img/avatar-default.jpg';
import avatarPlaceholderImg from '../../static/img/avatar-placeholder.png';
import avatarErrorImg from '../../static/img/avatar-error.png';
import { getForumPostReplies, getImageIwara } from '../../core/api';
import { showShortToast } from '../../core/toast';
import loadingHuawu from '../../component/loadingHuawu.vue';
import errorHuawu from '../../component/errorHuawu.vue';
import type { VInfiniteScroll } from 'vuetify/components'

defineOptions({
  name: 'ForumPost'
})

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const id = ref(route.query.id as string);
const sectionId = ref(route.query.sectionId as string);

const postListView = ref<InstanceType<typeof VInfiniteScroll>>();
let postScrollTop = 0;

// ========== 数据接口定义 ==========

interface User {
  id: string;
  name: string;
  username: string;
  status: string;
  role: string;
  followedBy: boolean;
  following: boolean;
  friend: boolean;
  premium: boolean;
  creatorProgram: boolean;
  locale: string | null;
  seenAt: string | null;
  avatar: {
    id: string;
    path: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Thread {
  id: string;
  approved: boolean;
  slug: string | null;
  section: string;
  title: string;
  locked: boolean;
  sticky: boolean;
  lastPost: any;
  numViews: number;
  numPosts: number;
  createdAt: string;
  updatedAt: string;
  user: User;
}

interface PostItem {
  id: string;
  approved: boolean;
  body: string;
  replyNum: number;
  user: User;
  thread: any;
  createdAt: string;
  updatedAt: string;
  threadId: string;
}

interface ForumPostResponse {
  thread: Thread;
  results: PostItem[];
  count: number;
  limit: number;
  page: number;
  pendingCount: number;
}

// ========== 状态管理 ==========

const thread = ref<Thread | null>(null);
const posts = ref<PostItem[]>([]);
const totalCount = ref(0);
const currentPage = ref(0);
const pageLimit = ref(32);
const hasMore = ref(false);
const loadMoreFailed = ref(false);

// 聚合状态：'failed' | 'empty' | 'loading' | 'success'
type ListState = 'failed' | 'empty' | 'loading' | 'success';
const postState = ref<ListState>('loading');

// 头像 URL 缓存 (userId -> avatarUrl)
const avatarUrlMap = ref<Record<string, string>>({});

// ========== 头像加载 ==========

// 加载单个用户头像
async function loadUserAvatar(user: User): Promise<string> {
  const userId = user.id;

  // 如果已经缓存，直接返回
  if (avatarUrlMap.value[userId]) {
    return avatarUrlMap.value[userId];
  }

  let avatarUrl: string;

  try {
    // 没有头像信息，使用默认头像
    if (!user.avatar) {
      avatarUrl = defaultAvatarImg;
    } else {
      // 先拼接头像URL
      const avatarImageUrl = `https://i.iwara.tv/image/avatar/${user.avatar.id}/${user.avatar.name}`;
      // 通过 API 获取图片数据
      avatarUrl = await getImageIwara(avatarImageUrl);
    }
  } catch (error) {
    console.error('Failed to load avatar:', error);
    avatarUrl = avatarErrorImg;
  }

  avatarUrlMap.value[userId] = avatarUrl;
  return avatarUrl;
}

// 批量加载头像
async function loadAvatarsForUsers(users: User[]) {
  for (const user of users) {
    await loadUserAvatar(user);
  }
}

// 获取头像 URL（同步，从缓存取，没有则返回占位图）
function getAvatarUrl(user: User): string {
  return avatarUrlMap.value[user.id] || avatarPlaceholderImg;
}

// ========== 工具函数 ==========

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// ========== 数据请求 ==========

async function fetchPostData(page: number = 0) {
  if (page === 0) {
    postState.value = 'loading';
    posts.value = [];
    thread.value = null;
    avatarUrlMap.value = {};
  }

  try {
    const res = await getForumPostReplies(sectionId.value, id.value, page, pageLimit.value);
    const data: ForumPostResponse = res?.data;

    if (!data) {
      if (page === 0) {
        postState.value = 'empty';
      }
      hasMore.value = true;
      return [];
    }

    // 第一页时保存 thread（楼主信息）
    if (page === 0) {
      thread.value = data.thread;
    }

    totalCount.value = data.count;
    pageLimit.value = data.limit;
    currentPage.value = data.page;

    if (page === 0) {
      posts.value = data.results || [];
    } else {
      posts.value = [...posts.value, ...(data.results || [])];
    }

    // 批量加载头像
    const usersToLoad: User[] = [];
    if (page === 0 && data.thread?.user) {
      usersToLoad.push(data.thread.user);
    }
    if (data.results) {
      for (const post of data.results) {
        if (post.user) {
          usersToLoad.push(post.user);
        }
      }
    }
    if (usersToLoad.length > 0) {
      await loadAvatarsForUsers(usersToLoad);
    }

    // 判断是否还有更多数据
    hasMore.value = posts.value.length >= totalCount.value;
    postState.value = 'success';
    return data.results || [];
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    showShortToast('获取帖子详情失败');
    if (page === 0) {
      postState.value = 'failed';
    }
    throw error;
  }
}

// ========== 事件处理 ==========

function handleErrorClick() {
  fetchPostData(0);
}

// 下滑列表到底追加数据
async function handleScrollToEnd({ done }: any) {
  try {
    const newPosts = await fetchPostData(currentPage.value + 1);
    if (newPosts && newPosts.length > 0) {
      done('ok');
    } else {
      hasMore.value = true;
      done('empty');
    }
  } catch {
    loadMoreFailed.value = true;
    done('error');
  }
}

function handleScroll(e: Event): void {
  postScrollTop = (e.target as HTMLElement).scrollTop;
}

// 应用页面设置的函数
const applyPageSettings = () => {
  // 设置状态栏白色文字
  setStatusBarTextStyle('light')
}
applyPageSettings()

const goBack = () => {
  router.back();
}

// 页面激活时恢复滚动位置
onActivated(() => {
  applyPageSettings()
  if (postListView.value) {
    postListView.value.$el.scrollTop = postScrollTop;
  }
  // 如果还没有数据，则加载
  if (posts.value.length === 0 && postState.value === 'loading') {
    fetchPostData(0);
  }
});

// 初始加载
fetchPostData(0);
</script>

<template>
  <div id="forumPostView">
    <div class="top">
      <div class="topBar">
        <div class="goback" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-angle-left" />
        </div>
        <div class="label1">
          帖子详情
        </div>
      </div>
    </div>
    <div class="content" id="forumPostContent">
      <!-- 加载失败 -->
      <div v-if="postState === 'failed'" class="status-container" @click="handleErrorClick">
        <errorHuawu>{{ t('home.video.loadFailed') }}</errorHuawu>
      </div>
      <!-- 数据为空 -->
      <div v-else-if="postState === 'empty'" class="status-container">
        <errorHuawu>{{ t('home.my.noRecords', { type: '' }) }}</errorHuawu>
      </div>
      <!-- 加载中 -->
      <div v-else-if="postState === 'loading'" class="status-container">
        <loadingHuawu>{{ t('home.video.loading') }}</loadingHuawu>
      </div>
      <!-- 数据列表 -->
      <v-infinite-scroll v-else color="#00796B" @load="handleScrollToEnd" :disabled="hasMore"
        ref="postListView" @scroll="handleScroll">
        <!-- 楼主（第一个帖子，带标题） -->
        <div v-if="thread" class="item">
          <div class="author">
            <div class="avatar">
              <v-img :src="getAvatarUrl(thread.user)" cover>
                <template v-slot:placeholder>
                  <v-img height="100%" :src="avatarPlaceholderImg" cover></v-img>
                </template>
              </v-img>
            </div>
            <div class="userinfo">
              <div class="authorname">{{ thread.user?.name || thread.user?.username || '-' }}</div>
            </div>
          </div>
          <div class="title">
            {{ thread.title }}
          </div>
          <div class="text">
            {{ posts.length > 0 ? posts[0].body : '' }}
          </div>
          <div class="info">
            <div>
              <span>{{ t('forum.publishedAt') }}：</span>
              <span class="gray">{{ formatDate(thread.createdAt) }}</span>
            </div>
            <div>
              <span>{{ t('forum.repliedAt') }}：</span>
              <span class="gray">{{ formatDate(thread.updatedAt) }}</span>
            </div>
          </div>
          <div class="num">
            楼主
          </div>
        </div>
        <!-- 回复列表（从第2条开始，无标题） -->
        <div v-for="(post, index) in (thread ? posts.slice(1) : posts)" :key="post.id" class="item">
          <div class="author">
            <div class="avatar">
              <v-img :src="getAvatarUrl(post.user)" cover>
                <template v-slot:placeholder>
                  <v-img height="100%" :src="avatarPlaceholderImg" cover></v-img>
                </template>
              </v-img>
            </div>
            <div class="userinfo">
              <div class="authorname">{{ post.user?.name || post.user?.username || '-' }}</div>
            </div>
          </div>
          <div class="text">
            {{ post.body }}
          </div>
          <div class="info">
            <div>
              <span>{{ t('forum.publishedAt') }}：</span>
              <span class="gray">{{ formatDate(post.createdAt) }}</span>
            </div>
            <div>
              <span>{{ t('forum.repliedAt') }}：</span>
              <span class="gray">{{ formatDate(post.updatedAt) }}</span>
            </div>
          </div>
          <div class="num">
            第{{ thread ? (index + 2) : (index + 1) }}楼
          </div>
        </div>
        <template v-slot:error="{ props }">
          <div class="load-more-failed">
            <span>{{ t('home.video.loadFailed') }}</span>
            <span class="retry-btn" v-bind=props>{{ t('home.video.retry') }}</span>
          </div>
        </template>
        <template v-slot:empty>
          <div class="list-end">
            {{ t('forum.noMore') }}
          </div>
        </template>
      </v-infinite-scroll>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#forumPostView {
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
  height: 100%;
}

.top {
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 400;

  .topBar {
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

    .label1 {
      font-size: 1.2rem;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      padding-right: 16px;
    }
  }
}

.content {
  flex: 1;
  margin-top: calc(env(safe-area-inset-top, 0) + 60px);
  overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.status-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.item {
  padding: 10px 12px;
  border-bottom: 1px solid #e0e0e0;
  position: relative;

  .author {
    display: flex;

    .avatar {
      margin-right: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      user-select: none;

      .v-img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
      }
    }

    .userinfo {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .authorname {
        font-size: 0.9rem;
        cursor: pointer;
        user-select: none;
      }
    }
  }

  .title {
    font-size: 1.1rem;
    font-weight: 500;
    padding: 10px 0;
    border-bottom: 1px dashed #a0a0a0;
  }

  .text {
    padding: 10px 0;
    font-size: 0.9rem;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .info {
    display: flex;
    font-size: 0.9rem;

    div {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .gray {
    color: #616161;
  }

  .num {
    position: absolute;
    right: 12px;
    top: 12px;
    font-size: 0.8rem;
    color: #616161;
  }
}

.list-end {
  color: #757575;
  padding: 4px 0;
  text-align: center;
  font-size: 0.9rem;
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
</style>
