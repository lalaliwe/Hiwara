<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ForumAvatar from './ForumAvatar.vue';
import type { AvatarUser } from './ForumAvatar.vue';

export interface PostItemUser extends AvatarUser {
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

export interface PostItemData {
  id: string;
  approved: boolean;
  body: string;
  replyNum: number;
  user: PostItemUser;
  thread: any;
  createdAt: string;
  updatedAt: string;
  threadId: string;
}

const props = defineProps<{
  post: PostItemData
  floorNumber: number
  showTitle?: boolean
  title?: string
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
  <div class="item">
    <div class="author">
      <div class="avatar">
        <ForumAvatar :user="post.user" />
      </div>
      <div class="userinfo">
        <div class="authorname">{{ post.user?.name || post.user?.username || '-' }}</div>
      </div>
    </div>
    <div v-if="showTitle && title" class="title">
      {{ title }}
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
      {{ floorNumber === 0 ? '楼主' : `第${floorNumber}楼` }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.item {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
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

      :deep(.v-img) {
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
        color: var(--color-text-primary);
      }
    }
  }

  .title {
    font-size: 1.1rem;
    font-weight: 500;
    padding: 10px 0;
    border-bottom: 1px dashed var(--color-border-dashed);
    color: var(--color-text-primary);
  }

  .text {
    padding: 10px 0;
    font-size: 0.9rem;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--color-text-body);
  }

  .info {
    display: flex;
    font-size: 0.9rem;

    div {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--color-text-muted);
    }
  }

  .gray {
    color: var(--color-text-muted);
  }

  .num {
    position: absolute;
    right: 12px;
    top: 12px;
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
}
</style>
