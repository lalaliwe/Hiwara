<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { getForumHome } from '../../core/api/forum';
import { showShortToast } from '../../core/toast';
import { useRouter } from 'vue-router'
import loadingHuawu from '../loadingHuawu.vue';
import errorHuawu from '../errorHuawu.vue';
import { onActivated } from 'vue';

const { t } = useI18n();
const router = useRouter();

interface LastPostUser {
  id: string;
  name: string;
  username: string;
  avatar: any;
}

interface LastPost {
  id: string;
  approved: boolean;
  body: string;
  replyNum: number;
  user: LastPostUser;
  createdAt: string;
  updatedAt: string;
  threadId: string;
}

interface LastThread {
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
  user: any;
}

interface ForumSection {
  id: string;
  group: string;
  locked: boolean;
  numPosts: number;
  numThreads: number;
  lastThread: LastThread | null;
}

interface ForumGroup {
  groupNameKey: string;
  sections: ForumSection[];
}

const forumGroups = ref<ForumGroup[]>([]);

// 聚合状态：'failed' | 'empty' | 'loading' | 'success'
type ListState = 'failed' | 'empty' | 'loading' | 'success';
const forumState = ref<ListState>('loading');

// 将 API 的 group 名称映射为 i18n key
const groupKeyMap: Record<string, string> = {
  'administration': 'home.forum.groups.admin',
  'global': 'home.forum.groups.moderator',
  'japanese': 'home.forum.groups.japanese',
  'chinese': 'home.forum.groups.chinese',
};

// 将 API 的 section id 映射为 i18n title key
const sectionKeyMap: Record<string, string> = {
  'announcements': 'home.forum.sections.announcement',
  'feedback': 'home.forum.sections.feedback',
  'general': 'home.forum.sections.general',
  'general-ja': 'home.forum.sections.general',
  'general-zh': 'home.forum.sections.general',
  'guides': 'home.forum.sections.guide',
  'questions': 'home.forum.sections.helpQuestion',
  'questions-ja': 'home.forum.sections.helpQuestion',
  'questions-zh': 'home.forum.sections.helpQuestion',
  'requests': 'home.forum.sections.request',
  'requests-ja': 'home.forum.sections.request',
  'requests-zh': 'home.forum.sections.request',
  'sharing': 'home.forum.sections.share',
  'support': 'home.forum.sections.help',
  'support-ja': 'home.forum.sections.help',
  'support-zh': 'home.forum.sections.help',
};

// 将 API 的 section id 映射为 i18n description key
const sectionDescKeyMap: Record<string, string> = {
  'announcements': 'home.forum.sections.announcement_desc',
  'feedback': 'home.forum.sections.feedback_desc',
  'general': 'home.forum.sections.general_desc',
  'general-ja': 'home.forum.sections.general_desc',
  'general-zh': 'home.forum.sections.general_desc',
  'guides': 'home.forum.sections.guide_desc',
  'questions': 'home.forum.sections.helpQuestion_desc',
  'questions-ja': 'home.forum.sections.helpQuestion_desc',
  'questions-zh': 'home.forum.sections.helpQuestion_desc',
  'requests': 'home.forum.sections.request_desc',
  'requests-ja': 'home.forum.sections.request_desc',
  'requests-zh': 'home.forum.sections.request_desc',
  'sharing': 'home.forum.sections.share_desc',
  'support': 'home.forum.sections.help_desc',
  'support-ja': 'home.forum.sections.help_desc',
  'support-zh': 'home.forum.sections.help_desc',
};

// 定义组的显示顺序
const groupOrder = ['administration', 'global', 'japanese', 'chinese'];

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

async function fetchForumData() {
  forumState.value = 'loading';
  try {
    const res = await getForumHome();
    const sections: ForumSection[] = res?.data || res || [];

    if (sections.length === 0) {
      forumState.value = 'empty';
      return;
    }

    // 按 group 分组
    const grouped: Record<string, ForumSection[]> = {};
    for (const section of sections) {
      const group = section.group || 'global';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(section);
    }

    // 按指定顺序排列组
    forumGroups.value = groupOrder
      .filter(g => grouped[g])
      .map(g => ({
        groupNameKey: groupKeyMap[g] || `home.forum.groups.${g}`,
        sections: grouped[g],
      }));

    forumState.value = 'success';
  } catch (error) {
    console.error('获取论坛数据失败:', error);
    showShortToast('获取论坛数据失败');
    forumState.value = 'failed';
  }
}

function handleErrorClick() {
  fetchForumData();
}

onMounted(() => {
  fetchForumData();
});

// 打开论坛页
function openForumPage(sectionId: string) {
  router.push({
    path: '/forum',
    query: { sectionId }
  });
}

// 跳转到发帖页
function goToPublish() {
  router.push({
    path: '/forum/publish'
  });
}

// 滚动处理
const forumView = ref<HTMLElement>();
let scrollTop = 0;

function handleScroll(e: Event): void {
  scrollTop = (e.target as HTMLElement).scrollTop;
  console.log(scrollTop);
}

onActivated(() => {
  if (forumView.value)
    forumView.value.scrollTop = scrollTop;
})
</script>

<template>
  <div class="container">
    <div class="topBar">
      <div class="label">
        {{ t('home.navigation.forum') }}
      </div>
      <div class="publishBtn" @click="goToPublish">
        <font-awesome-icon icon="fa-solid fa-pen-to-square" />
        <span>{{ t('forum.publish') }}</span>
      </div>
    </div>
    <div class="content" ref="forumView" @scroll="handleScroll">
      <div v-if="forumState === 'failed'" class="loading" @click="handleErrorClick">
        <errorHuawu>{{ t('home.forum.homeLoadFailed') }}</errorHuawu>
      </div>
      <div v-else-if="forumState === 'empty'" class="loading">
        <errorHuawu>{{ t('home.forum.homeEmpty') }}</errorHuawu>
      </div>
      <div v-else-if="forumState === 'loading'" class="loading">
        <loadingHuawu>{{ t('home.video.loading') }}</loadingHuawu>
      </div>
      <template v-else>
        <div v-for="(group, groupIndex) in forumGroups" :key="groupIndex">
          <div class="hr">
            {{ t(group.groupNameKey) }}
          </div>
          <div v-for="section in group.sections" :key="section.id" class="btn" @click="openForumPage(section.id)">
            <div class="block">
              <div class="left">
                <div class="bar"></div>
              </div>
              <div class="middle">
                <div class="label1">{{ t(sectionKeyMap[section.id] || `home.forum.sections.${section.id}`) }}</div>
                <div class="label2">{{ t(sectionDescKeyMap[section.id] || `home.forum.sections.${section.id}_desc`) }}
                </div>
              </div>
              <div class="right">
                <div>
                  <div>{{ t('home.forum.posts') }}：<span class="gray">{{ section.numPosts }}</span></div>
                  <div>{{ t('home.forum.topics') }}：<span class="gray">{{ section.numThreads }}</span></div>
                </div>
              </div>
            </div>
            <template v-if="section.lastThread">
              <div class="new-title">
                {{ t('home.forum.latestPost') }}
              </div>
              <div class="new-content">
                {{ section.lastThread.lastPost?.body || section.lastThread.title }}
              </div>
              <div class="user">
                <span class="gray">{{ section.lastThread.lastPost?.user?.name ||
                  section.lastThread.lastPost?.user?.username || '' }}</span>
                &nbsp;
                <span>{{ t('home.forum.repliedAt') }}</span>
                &nbsp;
                <span class="gray">{{ formatDate(section.lastThread.lastPost?.createdAt || section.lastThread.createdAt)
                }}</span>
              </div>
            </template>
            <template v-else>
              <div class="new-title">
                {{ t('home.forum.latestPost') }}
              </div>
              <div class="new-content">
                {{ t('home.my.noRecords', { type: '' }) }}
              </div>
              <div class="user">
                <span class="gray">-</span>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  flex: 1;
}

.topBar {
  backdrop-filter: blur(10px);
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 400;
  padding: env(safe-area-inset-top, 0) 16px 0 16px;
  height: calc(60px + env(safe-area-inset-top, 0));
  background-color: var(--color-primary-90);
  color: var(--color-text-on-primary);
  display: flex;
  align-items: center;
  user-select: none;
  box-shadow: var(--shadow-top-bar);

  .label {
    font-size: 1.2rem;
    font-weight: bold;
  }

  .publishBtn {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background-color: var(--color-white-20);
    border-radius: 20px;
    cursor: pointer;
    user-select: none;
    font-size: 0.9rem;
    white-space: nowrap;

    &:active {
      background-color: var(--color-white-35);
    }

    svg {
      font-size: 1rem;
    }
  }
}

.content {
  height: 100%;
  padding: calc(60px + env(safe-area-inset-top, 0)) 0 calc(60px + env(safe-area-inset-bottom, 0)) 0;
  overflow-y: auto;
  color: var(--color-text-body);

  &::-webkit-scrollbar-track {
    margin: calc(60px + env(safe-area-inset-top, 0)) 0 calc(60px + env(safe-area-inset-bottom, 0) + 4px) 0;
  }
}

.loading {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.hr {
  padding: 6px 10px;
  font-size: 1.2rem;
  font-weight: 500;
  background-color: var(--color-primary-60);
  color: var(--color-text-on-primary);
}

.btn {
  .block {
    display: flex;
    cursor: pointer;
    user-select: none;

    .left {
      padding: 10px;

      .bar {
        width: 4px;
        height: 100%;
        background: var(--color-primary);
        border-radius: 4px;
      }
    }

    .middle {
      flex: 1;
      padding: 12px 0;

      .label1 {
        font-size: 1.2rem;
        font-weight: 500;
        color: var(--color-text-primary);
      }

      .label2 {
        font-size: 0.9rem;
        color: var(--color-text-muted);
      }
    }

    .right {
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: start;
      padding: 0 12px;
      width: 120px;
      color: var(--color-text-muted);
    }
  }

  .new-title {
    font-size: 0.9rem;
    padding: 0 10px;
    color: var(--color-text-secondary);
  }

  .new-content {
    font-size: 0.9rem;
    margin: 10px;
    color: var(--color-text-muted);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-all;
    line-height: 1.4;
  }

  .user {
    font-size: 0.9rem;
    padding: 0 10px 10px 10px;
    border-bottom: 1px solid var(--color-border);
    text-align: right;
    color: var(--color-text-muted);
  }

  .gray {
    color: var(--color-text-muted);
  }
}
</style>
