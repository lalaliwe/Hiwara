<script setup lang="ts">
import { onActivated, ref } from 'vue'

interface Comment {
  id: string
  username: string
  avatar: string
  createdAt: string
  content: string
}

const commentList = ref<Comment[]>([])

// 模拟生成数据
for (let i = 0; i < 10; i++) {
  const isLong = i % 2 === 0
  commentList.value.push({
    id: `comment-${i}`,
    username: '测试用户',
    avatar: 'https://picsum.photos/200/300',
    createdAt: '2021-01-01',
    content: isLong
      ? '长文本内容：'.padEnd(500, '测试内容')
      : '短文本：这条内容很短，不需要折叠。'
  })
}

const expandedMap = ref<Record<string, boolean>>({})

const needToggle = (content: string) => {
  return content.length > 180
}

const toggleExpand = (id: string) => {
  expandedMap.value[id] = !expandedMap.value[id]
}

// 当前滚动条位置
let scrollTop = 0;
const commentViewRef = ref<HTMLElement>();
// 保存滚动条位置
function handleSroll(e: Event): void {
  scrollTop = (e.target as HTMLElement).scrollTop;
}
onActivated(() => {
  // 恢复滚动条位置
  if (commentViewRef.value && typeof commentViewRef.value.scrollTo === 'function') {
    commentViewRef.value.scrollTo({ top: scrollTop });
  }
})
</script>

<template>
  <div class="commentView" @scroll="handleSroll" ref="commentViewRef">
    <div>
      <div class="commentItem" v-for="item in commentList" :key="item.id">
        <div class="avatar">
          <img :src="item.avatar" alt="">
        </div>

        <div class="elements">
          <div class="username">{{ item.username }}</div>

          <div class="content-wrapper">
            <div class="content" :class="{ fold: needToggle(item.content) && !expandedMap[item.id] }">
              {{ item.content }}
            </div>

            <!-- 底部操作栏：始终显示 -->
            <div class="action-bar">
              <!-- 发布时间 -->
              <div class="created-time">{{ item.createdAt }}</div>
              <!-- 回复按钮 -->
              <div class="reply-btn">
                <font-awesome-icon icon="fa-regular fa-comment" /> 回复
              </div>
              <!-- 展开/收起按钮 (仅长文本显示) -->
              <div class="toggle-btn" v-if="needToggle(item.content)" @click="toggleExpand(item.id)">
                {{ expandedMap[item.id] ? '收起' : '展开' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.commentView {
  height: 100%;
  overflow-y: auto;

  >div {
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
}

.commentItem {
  display: flex;
  padding: 10px;
  border-bottom: 1px solid #eee;

  .avatar {
    flex-shrink: 0;

    img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #eee;
    }
  }

  .elements {
    margin-left: 10px;
    flex: 1;

    .username {
      font-size: 0.8rem;
      color: #616161;
    }

    .content-wrapper {
      margin-top: 5px;
    }

    .content {
      font-size: 0.9rem;
      line-height: 1.5em;
      text-align: justify;

      &.fold {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 6;
        overflow: hidden;
        position: relative;

        &::after {
          content: '...';
          position: absolute;
          right: 0;
          bottom: 0;
          padding-left: 5px;
          background: #fff;
        }
      }
    }

    /* 底部操作栏 */
    .action-bar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      margin-top: 2px;
      font-size: 0.8rem;

      .created-time {
        color: #616161;
      }

      .reply-btn {
        color: #616161;
        cursor: pointer;
        padding: 0 4px;
      }

      .toggle-btn {
        color: #00796B;
        cursor: pointer;
        flex-shrink: 0;
        /* 防止按钮被压缩 */

        &:hover {
          opacity: 0.8;
        }
      }
    }
  }
}
</style>
