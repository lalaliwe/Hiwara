<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ref, onActivated } from 'vue';
import { useAutoStatusBar } from '../../composables/useAutoStatusBar';
import { ai } from '../../core/store';
import { getForumPostReplies, getMyselfInfo } from '../../core/api';
import { showShortToast } from '../../core/toast';
import loadingHuawu from '../../component/loadingHuawu.vue';
import errorHuawu from '../../component/errorHuawu.vue';
import ForumTopBar from '../../component/forum/ForumTopBar.vue';
import ForumPostItem from '../../component/forum/ForumPostItem.vue';
import ForumPostReply from '../../component/forum/ForumPostReply.vue';
import type { PostItemData, PostItemUser } from '../../component/forum/ForumPostItem.vue';
import type { VInfiniteScroll } from 'vuetify/components'

defineOptions({
  name: 'ForumPost'
})

const aiStore = ai();
const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const id = ref(route.query.id as string);
const sectionId = ref(route.query.sectionId as string);

const postListView = ref<InstanceType<typeof VInfiniteScroll>>();
const postContentRef = ref<HTMLElement>();
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

interface ForumPostResponse {
  thread: Thread;
  results: PostItemData[];
  count: number;
  limit: number;
  page: number;
  pendingCount: number;
}

// ========== 状态管理 ==========

const thread = ref<Thread | null>(null);
const posts = ref<PostItemData[]>([]);
const totalCount = ref(0);
const currentPage = ref(0);
const pageLimit = ref(32);
const hasMore = ref(false);
const loadMoreFailed = ref(false);

// 聚合状态：'failed' | 'empty' | 'loading' | 'success'
type ListState = 'failed' | 'empty' | 'loading' | 'success';
const postState = ref<ListState>('loading');

// ========== 数据请求 ==========

async function fetchPostData(page: number = 0) {
  if (page === 0) {
    postState.value = 'loading';
    posts.value = [];
    thread.value = null;
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

// 回复成功后追加到列表末尾
async function handlePosted(reply: any) {
  if (!reply) return;
  try {
    const userInfoRes = await getMyselfInfo();
    if (userInfoRes?.ok && userInfoRes.data?.user) {
      const myself = userInfoRes.data.user;
      reply.user = {
        id: myself.id,
        name: myself.name,
        username: myself.username,
        status: myself.status || '',
        role: myself.role || '',
        followedBy: false,
        following: false,
        friend: false,
        premium: myself.premium || false,
        creatorProgram: myself.creatorProgram || false,
        locale: myself.locale || null,
        seenAt: myself.seenAt || null,
        avatar: myself.avatar || null,
        createdAt: myself.createdAt || '',
        updatedAt: myself.updatedAt || '',
      };
    }
  } catch (e) {
    console.error('获取用户信息失败:', e);
  }
  posts.value = [...posts.value, reply as PostItemData];
  totalCount.value++;
}

// 自动状态栏文字颜色自适应（根据 --color-primary-90 亮度判断）
useAutoStatusBar({ cssVar: '--color-primary-90' })

const goBack = () => {
  router.back();
}

const goToPublish = () => {
  router.push({
    path: '/forum/publish'
  });
}

// 页面激活时恢复滚动位置
onActivated(() => {
  if (postContentRef.value) {
    postContentRef.value.scrollTop = postScrollTop;
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
    <ForumTopBar label1="帖子详情" :show-publish="true" @go-back="goBack" @publish="goToPublish" />
    <div ref="postContentRef" class="content" id="forumPostContent" @scroll="handleScroll">
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
      <v-infinite-scroll v-else color="#00796B" @load="handleScrollToEnd" :disabled="hasMore" ref="postListView">
        <!-- 楼主（第一个帖子，带标题） -->
        <ForumPostItem v-if="thread && posts.length > 0" :post="posts[0] as PostItemData" :floor-number="0"
          :show-title="true" :title="thread.title" />
        <!-- 回复列表（从第2条开始，无标题） -->
        <ForumPostItem v-for="(post, index) in (thread ? posts.slice(1) : posts)" :key="post.id" :post="post"
          :floor-number="post.replyNum" />
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
    <ForumPostReply v-if="thread" :thread-id="thread.id" @posted="handlePosted" />
  </div>
</template>

<style lang="scss" scoped>
#forumPostView {
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-page);
  height: 100%;
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

.list-end {
  color: var(--color-text-muted-light);
  padding: 4px 0;
  text-align: center;
  font-size: 0.9rem;
}

.load-more-failed {
  text-align: center;
  padding: 10px 0;
  color: var(--color-text-muted-light);
  font-size: 0.9rem;

  .retry-btn {
    color: var(--color-retry-btn);
    cursor: pointer;

    &:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
  }
}
</style>
