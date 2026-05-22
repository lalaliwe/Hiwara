<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  label1: string
  label2?: string
  showPublish?: boolean
}>()

const emit = defineEmits<{
  goBack: []
  publish: []
}>()
</script>

<template>
  <div class="top">
    <div class="topBar">
      <div class="goback" @click="emit('goBack')">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </div>
      <div class="label1">
        {{ label1 }}
      </div>
      <div v-if="label2" class="label2">
        {{ label2 }}
      </div>
      <div v-if="showPublish" class="publishBtn" @click="emit('publish')">
        <font-awesome-icon icon="fa-solid fa-pen-to-square" />
        <span>{{ t('forum.publish') }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.top {
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 400;

  .topBar {
    padding-top: env(safe-area-inset-top, 0);
    height: calc(env(safe-area-inset-top, 0) + 60px);
    background-color: var(--color-primary-90);
    color: var(--color-text-on-primary);
    display: flex;
    align-items: center;
    user-select: none;

    .goback {
      padding: 0 16px;
      height: 100%;
      display: flex;
      align-items: center;
      cursor: pointer;

      svg {
        font-size: 1.5rem;
        color: white;
      }

      &:active {
        opacity: 0.7;
      }
    }

    .label1 {
      font-size: 1.2rem;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .label2 {
      margin-left: 10px;
      font-size: 1rem;
      padding-top: 0.1rem;
      padding-right: 16px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .publishBtn {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      margin-right: 12px;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      cursor: pointer;
      user-select: none;
      font-size: 0.9rem;
      white-space: nowrap;

      &:active {
        background-color: rgba(255, 255, 255, 0.35);
      }

      svg {
        font-size: 1rem;
      }
    }
  }
}
</style>
