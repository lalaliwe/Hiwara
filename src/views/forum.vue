<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { ref, computed, onActivated } from 'vue';
import { useI18n } from 'vue-i18n';
import { setStatusBarTextStyle } from '../plugins/navbarStyle';
import { getForumCategoryList } from '../core/api';
import { showShortToast } from '../core/toast';
import loadingHuawu from '../component/loadingHuawu.vue';
import errorHuawu from '../component/errorHuawu.vue';
import type { VInfiniteScroll } from 'vuetify/components'

defineOptions({
  name: 'Forum'
})

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const sectionId = ref(route.query.sectionId as string);

const forumListView = ref<InstanceType<typeof VInfiniteScroll>>();
let forumScrollTop = 0;

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
  avatar: any;
  createdAt: string;
  updatedAt: string;
}

interface LastPost {
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

interface Thread {
  id: string;
  approved: boolean;
  slug: string | null;
  section: string;
  title: string;
  locked: boolean;
  sticky: boolean;
  lastPost: LastPost;
  numViews: number;
  numPosts: number;
  createdAt: string;
  updatedAt: string;
  user: User;
}

interface ForumSection {
  id: string;
  group: string;
  locked: boolean;
  numPosts: number;
  numThreads: number;
}

interface ForumListResponse {
  section: ForumSection;
  threads: Thread[];
  count: number;
  limit: number;
  page: number;
}

// ========== 状态管理 ==========

const threads = ref<Thread[]>([]);
const sectionInfo = ref<ForumSection | null>(null);
const totalCount = ref(0);
const currentPage = ref(0);
const pageLimit = ref(32);
const hasMore = ref(false);
const loadMoreFailed = ref(false);

// 聚合状态：'failed' | 'empty' | 'loading' | 'success'
type ListState = 'failed' | 'empty' | 'loading' | 'success';
const forumState = ref<ListState>('loading');

// ========== i18n 映射 ==========

// 将 API 的 section id 映射为 forum 下的 i18n title key
const sectionKeyMap: Record<string, string> = {
  'announcements': 'forum.sections.announcements',
  'feedback': 'forum.sections.feedback',
  'general': 'forum.sections.general',
  'general-ja': 'forum.sections.general',
  'general-zh': 'forum.sections.general',
  'guides': 'forum.sections.guide',
  'questions': 'forum.sections.helpQuestion',
  'questions-ja': 'forum.sections.helpQuestion',
  'questions-zh': 'forum.sections.helpQuestion',
  'requests': 'forum.sections.request',
  'requests-ja': 'forum.sections.request',
  'requests-zh': 'forum.sections.request',
  'sharing': 'forum.sections.share',
  'support': 'forum.sections.help',
  'support-ja': 'forum.sections.help',
  'support-zh': 'forum.sections.help',
};

// 将 API 的 section id 映射为 forum 下的 i18n description key
const sectionDescKeyMap: Record<string, string> = {
  'announcements': 'forum.sections.announcements_desc',
  'feedback': 'forum.sections.feedback_desc',
  'general': 'forum.sections.general_desc',
  'general-ja': 'forum.sections.general_desc',
  'general-zh': 'forum.sections.general_desc',
  'guides': 'forum.sections.guide_desc',
  'questions': 'forum.sections.helpQuestion_desc',
  'questions-ja': 'forum.sections.helpQuestion_desc',
  'questions-zh': 'forum.sections.helpQuestion_desc',
  'requests': 'forum.sections.request_desc',
  'requests-ja': 'forum.sections.request_desc',
  'requests-zh': 'forum.sections.request_desc',
  'sharing': 'forum.sections.share_desc',
  'support': 'forum.sections.help_desc',
  'support-ja': 'forum.sections.help_desc',
  'support-zh': 'forum.sections.help_desc',
};

const label1Text = computed(() => {
  const key = sectionKeyMap[sectionId.value];
  return key ? t(key) : sectionId.value;
});

const label2Text = computed(() => {
  const key = sectionDescKeyMap[sectionId.value];
  return key ? t(key) : '';
});

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

async function fetchForumData(page: number = 0) {
  if (page === 0) {
    forumState.value = 'loading';
    threads.value = [];
  }

  try {
    const res = await getForumCategoryList(sectionId.value, page, pageLimit.value);
    const data = res?.data;

    if (!data || !data.threads || data.threads.length === 0) {
      if (page === 0) {
        forumState.value = 'empty';
      }
      hasMore.value = true;
      return [];
    }

    sectionInfo.value = data.section;
    totalCount.value = data.count;
    pageLimit.value = data.limit;
    currentPage.value = data.page;

    if (page === 0) {
      threads.value = data.threads;
    } else {
      threads.value = [...threads.value, ...data.threads];
    }

    // 判断是否还有更多数据
    hasMore.value = threads.value.length >= totalCount.value;
    forumState.value = 'success';
    return data.threads;
  } catch (error) {
    console.error('获取论坛帖子列表失败:', error);
    showShortToast('获取论坛帖子列表失败');
    if (page === 0) {
      forumState.value = 'failed';
    }
    throw error;
  }
}

// ========== 事件处理 ==========

function handleErrorClick() {
  fetchForumData(0);
}

// 下滑列表到底追加数据
async function handleScrollToEnd({ done }: any) {
  try {
    const newThreads = await fetchForumData(currentPage.value + 1);
    if (newThreads && newThreads.length > 0) {
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
  forumScrollTop = (e.target as HTMLElement).scrollTop;
}

function goToThread(thread: Thread) {
  router.push({
    path: '/forum/post',
    query: { id: thread.id, sectionId: sectionId.value }
  });
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

// 页面激活时应用设置
onActivated(() => {
  applyPageSettings()
  if (forumListView.value) {
    forumListView.value.$el.scrollTop = forumScrollTop;
  }
  // 如果还没有数据，则加载
  if (threads.value.length === 0 && forumState.value === 'loading') {
    fetchForumData(0);
  }
});

// 初始加载
fetchForumData(0);
</script>

<template>
  <div id="forumView">
    <div class="top">
      <div class="topBar">
        <div class="goback" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-angle-left" />
        </div>
        <div class="label1">
          {{ label1Text }}
        </div>
        <div class="label2">
          {{ label2Text }}
        </div>
      </div>
    </div>
    <div class="content" id="forumContent">
      <!-- 加载失败 -->
      <div v-if="forumState === 'failed'" class="status-container" @click="handleErrorClick">
        <errorHuawu>{{ t('home.video.loadFailed') }}{{ label1Text }}</errorHuawu>
      </div>
      <!-- 数据为空 -->
      <div v-else-if="forumState === 'empty'" class="status-container">
        <errorHuawu>{{ label1Text }}{{ t('home.my.noRecords', { type: '' }) }}</errorHuawu>
      </div>
      <!-- 加载中 -->
      <div v-else-if="forumState === 'loading'" class="status-container">
        <loadingHuawu>{{ t('home.video.loading') }}</loadingHuawu>
      </div>
      <!-- 数据列表 -->
      <v-infinite-scroll v-else color="#00796B" @load="handleScrollToEnd" :disabled="hasMore"
        ref="forumListView" @scroll="handleScroll">
        <div v-for="thread in threads" :key="thread.id" class="item" @click="goToThread(thread)">
          <div class="title">
            <font-awesome-icon v-if="thread.sticky" icon="fa-solid fa-thumbtack" class="sticky-icon" />
            <font-awesome-icon v-if="thread.locked" icon="fa-solid fa-lock" class="lock-icon" />
            {{ thread.title }}
          </div>
          <div class="info1">
            <span>{{ t('forum.replies') }}：</span>
            <span class="gray">{{ thread.numPosts }}</span>
            &nbsp;
            <span>{{ t('forum.views') }}：</span>
            <span class="gray">{{ thread.numViews }}</span>
          </div>
          <div class="info2">
            <div class="info2-item">
              <span>{{ t('forum.author') }}：</span>
              <span class="gray">{{ thread.user?.name || thread.user?.username || '-' }}</span>
            </div>
            <div class="info2-item">
              <span>{{ t('forum.lastReply') }}：</span>
              <span class="gray">{{ thread.lastPost?.user?.name || thread.lastPost?.user?.username || '-' }}</span>
            </div>
            <div class="info2-item">
              <span>{{ t('forum.publishedAt') }}：</span>
              <span class="gray">{{ formatDate(thread.createdAt) }}</span>
            </div>
            <div class="info2-item">
              <span>{{ t('forum.repliedAt') }}：</span>
              <span class="gray">{{ formatDate(thread.lastPost?.createdAt || thread.updatedAt) }}</span>
            </div>
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
#forumView {
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
    }

    .label2 {
      margin-left: 10px;
      font-size: 1rem;
      padding-top: 0.1rem;
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
  cursor: pointer;

  &:active {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .title {
    font-size: 1rem;
    font-weight: 500;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-all;
    line-height: 1.4;
  }

  .info1 {
    font-size: 0.9rem;
    margin: 5px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .info2 {
    font-size: 0.9rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 12px;

    .info2-item {
      overflow: hidden;
      min-width: 0;

      .gray {
        max-width: calc(100% - 5em);
        display: inline-block;
        vertical-align: bottom;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  .gray {
    color: #616161;
  }

  .sticky-icon,
  .lock-icon {
    color: #616161;
    margin-right: 2px;
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
