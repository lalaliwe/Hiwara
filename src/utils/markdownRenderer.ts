import MarkdownIt from 'markdown-it';

/**
 * Built-in internal link types on iwara.tv
 */
const IWARA_LINK_TYPES: Record<string, { icon: string; label: string }> = {
  user:     { icon: 'fa-solid fa-circle-user',   label: 'User' },
  video:    { icon: 'fa-solid fa-video',          label: 'Video' },
  image:    { icon: 'fa-solid fa-images',         label: 'Image' },
  forum:    { icon: 'fa-solid fa-comments',       label: 'Forum' },
  playlist: { icon: 'fa-solid fa-forward-fast',   label: 'Playlist' },
  rule:     { icon: 'fa-solid fa-gavel',          label: 'Rule' },
  page:     { icon: 'fa-solid fa-file-lines',     label: 'Page' },
  poll:     { icon: 'fa-solid fa-chart-simple',   label: 'Poll' },
};

const IWARA_HOSTS = ['iwara.tv', 'www.iwara.tv', 'ecchi.iwara.tv'];

/**
 * Normalise iwara domain to a canonical host for matching.
 */
function isIwaraHost(host: string): boolean {
  return IWARA_HOSTS.some(h => host === h || host.endsWith(`.${h}`));
}

/**
 * Check if a URL is an iwara internal link and extract type + identifier.
 */
function parseIwaraLink(url: string): { type: string; id: string; slug?: string } | null {
  try {
    const parsed = new URL(url);
    if (!isIwaraHost(parsed.host)) return null;

    const parts = parsed.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    if (parts.length === 0) return null;

    const [type, ...rest] = parts;
    const id = rest.join('/');

    if (type in IWARA_LINK_TYPES && id) {
      return { type, id, slug: parsed.search || undefined };
    }
    return null;
  } catch {
    return null;
  }
}

// ========== Markdown-it 实例 ==========

const md: MarkdownIt = new MarkdownIt({
  html: false,
  breaks: false,       // iwara 使用尾随两个空格换行，而非自动换行
  linkify: true,       // 自动识别 URL
  typographer: false,
})
  // --- 自定义规则：@username 提及 ---
  .use((md) => {
    // 在 inline 解析器中注册 @mention 规则
    md.inline.ruler.before('text', 'mention', (state, silent) => {
      const pos = state.pos;
      const max = state.posMax;
      const ch = state.src.charCodeAt(pos);

      // 匹配 @ 符号
      if (ch !== 0x40) return false; // '@'

      // 不能是已有链接的一部分（前面字符是字母或数字）
      if (pos > 0) {
        const prev = state.src.charCodeAt(pos - 1);
        if (
          (prev >= 0x30 && prev <= 0x39) ||  // 0-9
          (prev >= 0x41 && prev <= 0x5A) ||  // A-Z
          (prev >= 0x61 && prev <= 0x7A) ||  // a-z
          prev === 0x5F                       // _
        ) {
          return false;
        }
      }

      // 匹配 @username（字母、数字、下划线、连字符、点，至少1个字符）
      let end = pos + 1;
      while (end < max) {
        const code = state.src.charCodeAt(end);
        if (
          (code >= 0x30 && code <= 0x39) ||  // 0-9
          (code >= 0x41 && code <= 0x5A) ||  // A-Z
          (code >= 0x61 && code <= 0x7A) ||  // a-z
          code === 0x5F || code === 0x2D || code === 0x2E // _ - .
        ) {
          end++;
        } else {
          break;
        }
      }

      if (end === pos + 1) return false; // 只有 @ 符号，没有用户名

      if (!silent) {
        const username = state.src.slice(pos + 1, end);
        const token = state.push('mention_open', 'a', 1);
        token.attrs = [
          ['class', 'mention-link'],
          ['href', `https://iwara.tv/profile/${username}`],
          ['title', `@${username}`],
          ['rel', 'noreferrer nofollow'],
        ];
        const textToken = state.push('text', '', 0);
        textToken.content = `@${username}`;
        state.push('mention_close', 'a', -1);
      }

      state.pos = end;
      return true;
    });
  });

// ========== 自定义渲染规则 ==========

// 默认渲染器引用
const defaultLinkRender = md.renderer.rules.link_open || ((tokens, idx, options, _env, self) => {
  return self.renderToken(tokens, idx, options);
});

// 覆盖链接渲染：检测 iwara 内部链接并替换为嵌入卡片
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const href = token.attrGet('href');
  if (!href) return defaultLinkRender(tokens, idx, options, env, self);

  const iwara = parseIwaraLink(href);
  if (!iwara) return defaultLinkRender(tokens, idx, options, env, self);

  const info = IWARA_LINK_TYPES[iwara.type];
  if (!info) return defaultLinkRender(tokens, idx, options, env, self);

  // 找到对应的 link_close token
  let closeIdx = -1;
  for (let i = idx + 1; i < tokens.length; i++) {
    if (tokens[i].type === 'link_close') {
      closeIdx = i;
      break;
    }
  }

  // 将 <a> 替换为包裹 span，保留原始 URL 在 data-href 中
  token.type = 'iwara_link_open';
  token.tag = 'span';
  token.attrs = [
    ['class', `iwara-link iwara-link--${iwara.type}`],
    ['data-type', iwara.type],
    ['data-id', iwara.id],
    ['data-href', href],
  ];

  if (closeIdx !== -1) {
    tokens[closeIdx].type = 'iwara_link_close';
    tokens[closeIdx].tag = 'span';
  }

  return self.renderToken(tokens, idx, options);
};

/**
 * 将帖子/评论正文渲染为安全的 HTML 字符串。
 *
 * @param body - 原始 markdown 文本
 * @returns 渲染后的 HTML
 */
export function renderForumBody(body: string): string {
  if (!body) return '';

  // 预处理：确保行末两个空格（硬换行）被保留
  const processed = body
    // 将 \r\n 统一为 \n
    .replace(/\r\n/g, '\n')
    // 将 \r 统一为 \n
    .replace(/\r/g, '\n');

  return md.render(processed);
}

export default renderForumBody;
