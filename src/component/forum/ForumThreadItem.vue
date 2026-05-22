<script setup lang="ts">
import { useI18n } from 'vue-i18n';

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

export interface Thread {
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

defineProps<{
  thread: Thread
}>()

const emit = defineEmits<{
  click: []
}>()

const { t } = useI18n();

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
</script>

<template>
  <div class="item" @click="emit('click')">
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
</template>

<style lang="scss" scoped>
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
</style>
