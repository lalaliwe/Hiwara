<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { ref, computed, onActivated } from 'vue';
import { useI18n } from 'vue-i18n';
import { setStatusBarTextStyle } from '../plugins/navbarStyle';
import { getForumCategoryList } from '../core/api';
import { showShortToast } from '../core/toast';
import loadingHuawu from '../component/loadingHuawu.vue';
import errorHuawu from '../component/errorHuawu.vue';
import ForumTopBar from '../component/forum/ForumTopBar.vue';
import ForumThreadItem from '../component/forum/ForumThreadItem.vue';
import type { Thread } from '../component/forum/ForumThreadItem.vue';
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

function goToPublish() {
  router.push({
    path: '/forum/publish'
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
    <ForumTopBar :label1="label1Text" :label2="label2Text" :show-publish="true" @go-back="goBack" @publish="goToPublish" />
    <div class="content" id="forumContent">
      <!-- 加载失败 -->
      <div v-if="forumState === 'failed'" class="status-container" @click="handleErrorClick">
        <errorHuawu>{{ t('home.forum.listLoadFailed') }}</errorHuawu>
      </div>
      <!-- 数据为空 -->
      <div v-else-if="forumState === 'empty'" class="status-container">
        <errorHuawu>{{ t('home.forum.listEmpty') }}</errorHuawu>
      </div>
      <!-- 加载中 -->
      <div v-else-if="forumState === 'loading'" class="status-container">
        <loadingHuawu>{{ t('home.video.loading') }}</loadingHuawu>
      </div>
      <!-- 数据列表 -->
      <v-infinite-scroll v-else color="#00796B" @load="handleScrollToEnd" :disabled="hasMore" ref="forumListView"
        @scroll="handleScroll">
        <ForumThreadItem v-for="thread in threads" :key="thread.id" :thread="thread" @click="goToThread(thread)" />
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
