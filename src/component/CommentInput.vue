<script setup lang="ts">
import { ref } from 'vue'
import { showShortToast } from '../core/toast'

const props = defineProps<{
  contentId: string
  postComment: (contentId: string, body: string, parentId?: string) => Promise<any>
  replyTo?: { id: string; userName: string } | null
}>()

const emit = defineEmits<{
  posted: [comment: any]
  cancelReply: []
  openSyntax: []
}>()

const commentContent = ref('')
const isFocused = ref(false)
const showExpanded = ref(false)
const sending = ref(false)

async function handleSend() {
  if (!commentContent.value.trim() || sending.value) return
  sending.value = true
  try {
    const res = await props.postComment(props.contentId, commentContent.value, props.replyTo?.id || undefined)
    if (res.ok) {
      emit('posted', res.data)
      commentContent.value = ''
      showExpanded.value = false
      showShortToast('评论成功')
    } else {
      showShortToast('评论失败')
    }
  } catch (error) {
    console.error('发送评论失败:', error)
    showShortToast('评论失败')
  } finally {
    sending.value = false
  }
}

function handleFocus() {
  isFocused.value = true
  showExpanded.value = true
}

function handleBlur() {
  isFocused.value = false
}

function handleOverlayClick() {
  showExpanded.value = false
  emit('cancelReply')
}

function handleCancelReply() {
  emit('cancelReply')
}

function handleSyntaxClick() {
  emit('openSyntax')
}
</script>

<template>
  <!-- 半透明遮罩 -->
  <Transition name="overlay">
    <div v-if="showExpanded" class="overlay" @click="handleOverlayClick"></div>
  </Transition>

  <div class="comment-input-area" :class="{ expanded: showExpanded }">
    <div v-if="replyTo" class="reply-hint">
      <span>回复 @{{ replyTo.userName }}</span>
      <font-awesome-icon class="cancel-reply-btn" icon="fa-solid fa-xmark" @click="handleCancelReply" />
    </div>
    <div>
      <v-textarea v-model="commentContent" label="发表评论" :rows="showExpanded ? 6 : 1" density="compact" hide-details
        variant="outlined" no-resize color="#00796B" @focus="handleFocus" @blur="handleBlur"></v-textarea>
    </div>
    <div v-show="showExpanded" class="btns">
      <font-awesome-icon class="btn syntax-btn" icon="fa-solid fa-circle-question" @click="handleSyntaxClick" />
      <v-btn color="#00796B" class="btn send-btn" :loading="sending" :disabled="sending" @click="handleSend">发送</v-btn>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 999;
}

.overlay-enter-active {
  transition: opacity 0.25s ease;
}

.overlay-leave-active {
  transition: opacity 0.2s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.comment-input-area {
  position: relative;
  z-index: 1000;
  background-color: #fff;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.1);
  padding: 12px 12px calc(12px + env(safe-area-inset-bottom, 0)) 12px;

  &.expanded {
    padding-top: 24px;
  }

  .reply-hint {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 0 8px 0;
    font-size: 0.85rem;
    color: #00796B;

    .cancel-reply-btn {
      cursor: pointer;
      font-size: 1.1rem;
      color: #757575;

      &:hover {
        color: #333;
      }
    }
  }

  .btns {
    margin-top: 10px;

    .btn {
      color: #757575;
      cursor: pointer;
      user-select: none;
    }

    .syntax-btn {
      &:hover {
        color: #00796B;
      }
    }

    .send-btn {
      float: right;
    }
  }
}
</style>
