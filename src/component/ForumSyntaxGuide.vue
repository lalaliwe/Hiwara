<script setup lang="ts">
defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="syntax-drawer">
    <div class="drawer-header">
      <span class="drawer-title">语法说明</span>
      <font-awesome-icon class="drawer-close" icon="fa-solid fa-xmark" @click="$emit('close')" />
    </div>
    <div class="drawer-body">
      <!-- Iwara 专用语法 -->
      <div class="section">
        <div class="section-title">Iwara 专用语法</div>
        <div class="syntax-table">
          <div class="syntax-row">
            <div class="syntax-label">站内链接</div>
            <div class="syntax-desc">
              <code>https://iwara.tv/...</code>
              <div class="syntax-preview">
                <span class="preview-item"><font-awesome-icon icon="fa-solid fa-circle-user" /> User</span>
                <span class="preview-item"><font-awesome-icon icon="fa-solid fa-video" /> Video</span>
                <span class="preview-item"><font-awesome-icon icon="fa-solid fa-images" /> Image</span>
                <span class="preview-item"><font-awesome-icon icon="fa-solid fa-comments" /> Forum</span>
                <span class="preview-item"><font-awesome-icon icon="fa-solid fa-forward-fast" /> Playlist</span>
                <span class="preview-item"><font-awesome-icon icon="fa-solid fa-gavel" /> Rule</span>
                <span class="preview-item"><font-awesome-icon icon="fa-solid fa-file-lines" /> Page</span>
              </div>
            </div>
          </div>
          <div class="syntax-row">
            <div class="syntax-label">嵌入式投票</div>
            <div class="syntax-desc">
              <code>https://iwara.tv/poll/...</code>
            </div>
          </div>
          <div class="syntax-row">
            <div class="syntax-label">提及用户</div>
            <div class="syntax-desc">
              <kbd>@</kbd><code>username</code>
              <div class="syntax-preview">@username</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Markdown 基本语法 -->
      <div class="section">
        <a href="https://www.markdownguide.org/basic-syntax" target="_blank" rel="noreferrer nofollow" class="section-title link">
          Markdown 基本语法 <font-awesome-icon icon="fa-solid fa-up-right-from-square" class="external-icon" />
        </a>
        <div class="syntax-table">
          <div class="syntax-row">
            <div class="syntax-label">
              段落
              <div class="syntax-hint">中间留一个空行</div>
            </div>
            <div class="syntax-desc">
              <kbd>Blank Line</kbd><br>
              <code>Paragraph one</code><br>
              <kbd>Blank Line</kbd><br>
              <code>Paragraph two</code><br>
              <kbd>Blank Line</kbd>
              <div class="syntax-preview"><p>Paragraph one</p><p>Paragraph two</p></div>
            </div>
          </div>
          <div class="syntax-row">
            <div class="syntax-label">换行符</div>
            <div class="syntax-desc">
              <code>Line</code><kbd>Space</kbd><kbd>Space</kbd><br>
              <code>Break</code>
              <div class="syntax-preview"><p>Line <br>Break</p></div>
            </div>
          </div>
          <div class="syntax-row">
            <div class="syntax-label">粗体</div>
            <div class="syntax-desc">
              <kbd>*</kbd><kbd>*</kbd><code>bold text</code><kbd>*</kbd><kbd>*</kbd>
              <div class="syntax-preview"><strong>bold text</strong></div>
            </div>
          </div>
          <div class="syntax-row">
            <div class="syntax-label">斜体</div>
            <div class="syntax-desc">
              <kbd>*</kbd><code>italic text</code><kbd>*</kbd>
              <div class="syntax-preview"><em>italic text</em></div>
            </div>
          </div>
          <div class="syntax-row">
            <div class="syntax-label">删除线</div>
            <div class="syntax-desc">
              <kbd>~</kbd><code>striked text</code><kbd>~</kbd>
              <div class="syntax-preview"><del>striked text</del></div>
            </div>
          </div>
          <div class="syntax-row">
            <div class="syntax-label">代码</div>
            <div class="syntax-desc">
              <kbd>`</kbd><code>code text</code><kbd>`</kbd>
              <div class="syntax-preview"><code>code text</code></div>
            </div>
          </div>
          <div class="syntax-row">
            <div class="syntax-label">分隔线</div>
            <div class="syntax-desc">
              <kbd>Blank Line</kbd><br>
              <kbd>-</kbd><kbd>-</kbd><kbd>-</kbd><br>
              <kbd>Blank Line</kbd>
              <div class="syntax-preview"><hr></div>
            </div>
          </div>
          <div class="syntax-row">
            <div class="syntax-label">引用区块</div>
            <div class="syntax-desc">
              <kbd>></kbd><kbd>Space</kbd><code>blockquote</code><br>
              <kbd>></kbd><kbd>Space</kbd><code>text</code><br>
              <kbd>></kbd><kbd>></kbd><kbd>Space</kbd><code>nested blockquote text</code>
              <div class="syntax-preview">
                <blockquote>blockquote text<blockquote>nested blockquote text</blockquote></blockquote>
              </div>
            </div>
          </div>
          <div class="syntax-row">
            <div class="syntax-label">列表</div>
            <div class="syntax-desc">
              <kbd>1</kbd><kbd>.</kbd><kbd>Space</kbd><code>Ordered List</code><br>
              <kbd>2</kbd><kbd>.</kbd><kbd>Space</kbd><code>Nested List</code><br>
              <kbd>Space</kbd><kbd>Space</kbd><kbd>-</kbd><kbd>Space</kbd><code>Unordered</code><br>
              <kbd>Space</kbd><kbd>Space</kbd><kbd>-</kbd><kbd>Space</kbd><code>List</code>
              <div class="syntax-preview">
                <ol>
                  <li>Ordered List</li>
                  <li>Nested List</li>
                  <ul>
                    <li>Unordered</li>
                    <li>List</li>
                  </ul>
                </ol>
              </div>
            </div>
          </div>
          <div class="syntax-row">
            <div class="syntax-label">链接</div>
            <div class="syntax-desc">
              <kbd>[</kbd><code>Link text</code><kbd>]</kbd><kbd>(</kbd><code>https://iwara.tv</code><kbd>)</kbd>
              <div class="syntax-preview"><a href="#">Link text</a></div>
            </div>
          </div>
          <div class="syntax-row">
            <div class="syntax-label">图片</div>
            <div class="syntax-desc">
              <kbd>!</kbd><kbd>[</kbd><kbd>]</kbd><kbd>(</kbd><code>/images/logo.png</code><kbd>)</kbd>
            </div>
          </div>
          <div class="syntax-row">
            <div class="syntax-label">标题</div>
            <div class="syntax-desc">
              <kbd>Blank Line</kbd><br>
              <kbd>#</kbd><kbd>Space</kbd><code>Heading 1</code><br>
              <kbd>Blank Line</kbd><br>
              <kbd>#</kbd><kbd>#</kbd><kbd>Space</kbd><code>Heading 2</code><br>
              <kbd>Blank Line</kbd>
              <div class="syntax-preview"><h1>Heading 1</h1><h2>Heading 2</h2></div>
            </div>
          </div>
          <div class="syntax-row">
            <div class="syntax-label">替代语法</div>
            <div class="syntax-desc">
              <kbd>Blank Line</kbd><br>
              <code>Heading 1</code><br>
              <kbd>=</kbd><br>
              <kbd>Blank Line</kbd><br>
              <code>Heading 2</code><br>
              <kbd>-</kbd><br>
              <kbd>Blank Line</kbd>
              <div class="syntax-preview"><h1>Heading 1</h1><h2>Heading 2</h2></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.syntax-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 75%;
  background-color: var(--color-bg-card);
  border-radius: 16px 16px 0 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;

  .drawer-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .drawer-close {
    font-size: 1.4rem;
    color: var(--color-text-placeholder-light);
    cursor: pointer;
    padding: 4px;

    &:hover {
      color: var(--color-text-secondary);
    }
  }
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px calc(16px + env(safe-area-inset-bottom, 0)) 20px;
}

// 语法说明样式
.section {
  margin-bottom: 24px;

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: 12px;
    display: block;

    &.link {
      color: var(--color-primary);
      text-decoration: none;

      .external-icon {
        font-size: 0.75rem;
        margin-left: 4px;
      }
    }
  }

  .syntax-hint {
    font-size: 0.75rem;
    color: var(--color-text-placeholder-light);
    font-weight: 400;
    margin-top: 2px;
  }
}

.syntax-table {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background-color: var(--color-bg-section);
  border-radius: 8px;
  overflow: hidden;
}

.syntax-row {
  display: flex;
  background-color: var(--color-bg-card);

  &:not(:last-child) {
    border-bottom: 1px solid var(--color-border-lighter);
  }
}

.syntax-label {
  width: 80px;
  flex-shrink: 0;
  padding: 10px 12px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-code);
  background-color: var(--color-bg-page);
}

.syntax-desc {
  flex: 1;
  padding: 10px 12px;
  font-size: 0.82rem;
  line-height: 1.6;
  color: var(--color-text-body);

  code {
    background-color: var(--color-bg-code-inline);
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 0.8rem;
    color: var(--color-text-code-inline);
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace;
  }

  kbd {
    display: inline-block;
    background-color: var(--color-bg-tag);
    border: 1px solid var(--color-bg-tag-border);
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 0.75rem;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace;
    color: var(--color-text-code);
    margin: 0 1px;
  }

  .syntax-preview {
    margin-top: 6px;
    padding: 8px 10px;
    background-color: var(--color-bg-code-block);
    border-radius: 6px;
    border: 1px solid var(--color-border-light);

    p { margin: 4px 0; }
    strong { font-weight: 600; }
    em { font-style: italic; }
    del { text-decoration: line-through; }

    hr {
      margin: 4px 0;
      border: none;
      border-top: 1px solid var(--color-border-code-block);
    }

    blockquote {
      margin: 4px 0;
      padding-left: 10px;
      border-left: 3px solid var(--color-primary);
      color: var(--color-text-placeholder);
      blockquote { margin-left: 10px; }
    }

    ol, ul {
      margin: 4px 0;
      padding-left: 20px;
      li { margin: 2px 0; }
    }

    h1 { font-size: 1.2rem; font-weight: 600; margin: 4px 0; }
    h2 { font-size: 1rem; font-weight: 600; margin: 4px 0; }
    a { color: var(--color-primary); text-decoration: none; }
  }

  .preview-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-right: 12px;
    font-size: 0.8rem;
    color: var(--color-primary);

    svg { font-size: 0.85rem; }
  }
}
</style>
