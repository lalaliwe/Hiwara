<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ForumSyntaxGuide from './ForumSyntaxGuide.vue';
import { replyForumPost } from '../../core/api';
import { showShortToast } from '../../core/toast';

const { t } = useI18n();

const props = defineProps<{
  threadId: string
}>()

const replyContent = ref('');
const isFocused = ref(false);
const showExpanded = ref(false);
const showSyntaxDrawer = ref(false);
const sending = ref(false);

const emit = defineEmits<{
  posted: [reply: any]
}>()

async function handleSend() {
  if (!replyContent.value.trim() || sending.value) return;
  sending.value = true;
  try {
    const res = await replyForumPost(props.threadId, replyContent.value);
    replyContent.value = '';
    showExpanded.value = false;
    showShortToast('回复成功');
    emit('posted', res?.data);
  } catch (error) {
    showShortToast('回复失败');
  } finally {
    sending.value = false;
  }
}

function handleFocus() {
  isFocused.value = true;
  showExpanded.value = true;
}

function handleBlur() {
  isFocused.value = false;
}

function handleOverlayClick() {
  showExpanded.value = false;
}

function handleSyntaxClick() {
  showSyntaxDrawer.value = true;
}

function handleDrawerClose() {
  showSyntaxDrawer.value = false;
}
</script>

<template>
  <!-- 半透明遮罩 -->
  <Transition name="overlay">
    <div v-if="showExpanded" class="overlay" @click="handleOverlayClick"></div>
  </Transition>

  <!-- 语法说明抽屉遮罩 -->
  <Transition name="overlay">
    <div v-if="showSyntaxDrawer" class="drawer-overlay" @click="handleDrawerClose"></div>
  </Transition>

  <!-- 语法说明抽屉 -->
  <Transition name="drawer">
    <ForumSyntaxGuide v-if="showSyntaxDrawer" @close="handleDrawerClose" />
  </Transition>

  <div class="reply" :class="{ expanded: showExpanded }">
    <div>
      <v-textarea v-model="replyContent" label="评论" :rows="showExpanded ? 6 : 1" density="compact" hide-details
        variant="outlined" no-resize color="#00796B" @focus="handleFocus" @blur="handleBlur"></v-textarea>
    </div>
    <div v-show="showExpanded" class="btns">
      <font-awesome-icon class="btn syntax-btn" icon="fa-solid fa-circle-question" @click="handleSyntaxClick" />
      <v-btn color="#00796B" class="btn reply-btn" :loading="sending" :disabled="sending" @click="handleSend">发送</v-btn>
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

// 抽屉遮罩
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1999;
}

// 抽屉过渡
.drawer-enter-active {
  transition: transform 0.3s ease;
}

.drawer-leave-active {
  transition: transform 0.25s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateY(100%);
}

.reply {
  position: relative;
  z-index: 1000;
  background-color: #fff;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.1);
  padding: 12px 12px calc(12px + env(safe-area-inset-bottom, 0)) 12px;

  &.expanded {
    padding-top: 24px;
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

    .reply-btn {
      float: right;
    }
  }
}
</style>
