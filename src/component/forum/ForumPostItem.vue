<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { isTrustedWebviewUrl, openExternalUrl } from '../../utils/external';
import { ai } from '../../core/store';

const aiStore = ai();
import ForumAvatar from './ForumAvatar.vue';
import type { AvatarUser } from './ForumAvatar.vue';
import { renderForumBody } from '../../utils/markdownRenderer';

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
const router = useRouter();

/** 点击链接时处理导航 */
function handleLinkClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  // 查找 <a> 标签或 .iwara-link 元素
  const link = target.closest('a') || target.closest('.iwara-link') as HTMLElement | null;
  if (!link) return;

  // @ 提及 → 跳转到用户空间
  if (link.classList.contains('mention-link')) {
    e.preventDefault();
    e.stopPropagation();
    const href = (link as HTMLAnchorElement).getAttribute('href') || '';
    const username = href.replace(/https?:\/\/[^/]+\/profile\//, '');
    if (username) {
      router.push({ path: `/zone/${username}` });
    }
    return;
  }

  let url: string | null = null;

  if (link.tagName === 'A') {
    const href = (link as HTMLAnchorElement).getAttribute('href');
    if (!href) return;

    // 跳过空链接、锚点、javascript 和 mailto
    if (href === '' || href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:')) return;

    url = href;
  } else if (link.classList.contains('iwara-link')) {
    // iwara 内部链接卡片
    const type = link.getAttribute('data-type');
    const id = link.getAttribute('data-id');
    if (!type || !id) return;

    e.preventDefault();
    e.stopPropagation();

    if (type === 'user') {
      router.push({ path: `/zone/${id}` });
      return;
    }
    if (type === 'video') {
      router.push({ path: `/player/${id}`, query: { isAI: aiStore.value ? 'true' : 'false' } });
      return;
    }
    if (type === 'image') {
      router.push({ path: `/image/${id}`, query: { isAI: aiStore.value ? 'true' : 'false' } });
      return;
    }

    // 其他类型（forum / playlist / rule / page / poll）通过 webview 打开
    url = link.getAttribute('data-href');
    if (!url) return;
  }

  if (!url) return;

  e.preventDefault();
  e.stopPropagation();

  // 安全校验（V-01 修复）：仅受信任的 Hiwara/Iwara HTTPS origin 才在应用内
  // WebView 打开（该 WebView 会注入登录 token）。其它外部链接一律用系统浏览器
  // 打开，避免 token 泄露到不受信任的 WebView origin。
  if (!isTrustedWebviewUrl(url)) {
    openExternalUrl(url);
    return;
  }

  router.push({ path: '/webview', query: { url, title: url } });
}

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
    <div class="text" v-html="renderForumBody(post.body)" @click="handleLinkClick"></div>
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
    word-break: break-word;
    color: var(--color-text-body);
    line-height: 1.6;

    // ========== 段落 ==========
    :deep(p) {
      margin: 0.4em 0;
      &:first-child { margin-top: 0; }
      &:last-child { margin-bottom: 0; }
    }

    // ========== 标题 ==========
    :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
      margin: 0.6em 0 0.3em;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    :deep(h1) { font-size: 1.25rem; }
    :deep(h2) { font-size: 1.1rem; }
    :deep(h3) { font-size: 1.0rem; }
    :deep(h4) { font-size: 0.95rem; }
    :deep(h5) { font-size: 0.9rem; }
    :deep(h6) { font-size: 0.85rem; }

    // ========== 加粗 / 斜体 / 删除线 ==========
    :deep(strong) { font-weight: 600; }
    :deep(em) { font-style: italic; }
    :deep(del) { text-decoration: line-through; }

    // ========== 行内代码 ==========
    :deep(code) {
      background-color: var(--color-bg-code-inline);
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 0.82rem;
      color: var(--color-text-code-inline);
      font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace;
    }

    // ========== 代码块 ==========
    :deep(pre) {
      background-color: var(--color-bg-code-block);
      border: 1px solid var(--color-border-light);
      border-radius: 6px;
      padding: 12px;
      overflow-x: auto;
      margin: 0.5em 0;

      code {
        background: none;
        padding: 0;
        border-radius: 0;
        font-size: 0.82rem;
        color: var(--color-text-code);
      }
    }

    // ========== 引用 ==========
    :deep(blockquote) {
      margin: 0.5em 0;
      padding: 4px 12px;
      border-left: 3px solid var(--color-primary);
      color: var(--color-text-placeholder);
      background-color: var(--color-bg-section);
      border-radius: 0 4px 4px 0;

      blockquote {
        margin-left: 12px;
        margin-top: 0.3em;
        margin-bottom: 0.3em;
      }
    }

    // ========== 列表 ==========
    :deep(ol), :deep(ul) {
      margin: 0.4em 0;
      padding-left: 24px;
      li { margin: 0.2em 0; }
    }
    :deep(ol) { list-style: decimal; }
    :deep(ul) { list-style: disc; }

    // ========== 链接 ==========
    :deep(a:not(.mention-link):not(.iwara-link)) {
      color: var(--color-primary);
      text-decoration: none;
      word-break: break-all;

      &:hover {
        text-decoration: underline;
        opacity: 0.85;
      }
    }

    // ========== 图片 ==========
    :deep(img) {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 0.5em 0;
    }

    // ========== 分割线 ==========
    :deep(hr) {
      margin: 0.6em 0;
      border: none;
      border-top: 1px solid var(--color-border-code-block);
    }

    // ========== @提及 ==========
    :deep(.mention-link) {
      color: var(--color-primary) !important;
      font-weight: 500;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    // ========== Iwara 内部链接 ==========
    :deep(.iwara-link) {
      color: var(--color-primary);
      font-weight: 600;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }
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
