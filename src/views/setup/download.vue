<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { setupStore } from '../../core/store'
import { storeToRefs } from 'pinia'
import { isTauri, invoke } from '@tauri-apps/api/core'
// 导入Tauri的dialog插件（仅桌面端使用）
import { open } from '@tauri-apps/plugin-dialog'

defineOptions({
  name: 'SetupDownload'
})

const { t } = useI18n()
const router = useRouter()
const setup = setupStore()
const { videoSavePath, imageSavePath, maxConcurrentDownloads } = storeToRefs(setup)

// 是否为 Android 平台
const isAndroid = computed(() => {
  if (!isTauri()) return false
  return /android/i.test(navigator.userAgent)
})

// 返回上一页
const goBack = () => {
  router.back();
}

// 选择视频保存路径
const selectVideoSavePath = async () => {
  let selectedPath: string | null = null

  if (isAndroid.value) {
    // Android 使用原生 SAF 目录选择器（通过 tauri-plugin-device）
    try {
      const result = await invoke<{ path?: string }>('plugin:device|pick_folder', {
        payload: { initialPath: videoSavePath.value || undefined }
      })
      selectedPath = result?.path ?? null
    } catch (error) {
      console.error('选择目录失败:', error)
      return
    }
  } else {
    // 桌面端使用系统对话框
    selectedPath = await open({
      directory: true,
      multiple: false,
      title: t('setup.downloadPage.selectVideoPath')
    }) as string | null
  }

  if (selectedPath) {
    await setup.updateSetting('videoSavePath', selectedPath)
  }
}

// 选择图片保存路径
const selectImageSavePath = async () => {
  let selectedPath: string | null = null

  if (isAndroid.value) {
    try {
      const result = await invoke<{ path?: string }>('plugin:device|pick_folder', {
        payload: { initialPath: imageSavePath.value || undefined }
      })
      selectedPath = result?.path ?? null
    } catch (error) {
      console.error('选择目录失败:', error)
      return
    }
  } else {
    selectedPath = await open({
      directory: true,
      multiple: false,
      title: t('setup.downloadPage.selectImagePath')
    }) as string | null
  }

  if (selectedPath) {
    await setup.updateSetting('imageSavePath', selectedPath)
  }
}
</script>

<template>
  <div id="setupDownloadView">
    <div class="topBar">
      <div class="goback" @click="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </div>
      <div class="label">
        {{ t('setup.downloadPage.title') }}
      </div>
    </div>
    <!-- 内容区域 -->
    <div class="item" @click="selectVideoSavePath">
      <div class="label">{{ t('setup.downloadPage.videoSavePath') }}</div>
      <div class="path-display">{{ videoSavePath || t('setup.downloadPage.notSet') }}</div>
    </div>
    <div class="item" @click="selectImageSavePath">
      <div class="label">{{ t('setup.downloadPage.imageSavePath') }}</div>
      <div class="path-display">{{ imageSavePath || t('setup.downloadPage.notSet') }}</div>
    </div>
    <div class="item">
      <div class="label">{{ t('setup.downloadPage.maxConcurrent') }}</div>
      <div class="slider-row">
        <v-slider v-model="maxConcurrentDownloads" min="1" max="8" step="1" thumb-label color="#00796B" hide-details
          @update:model-value="setup.updateSetting('maxConcurrentDownloads', $event)" class="slider"></v-slider>
        <span class="slider-value">{{ maxConcurrentDownloads }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#setupDownloadView {
  overflow-y: auto;
  padding: calc(60px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  background-color: var(--color-bg-page);

  &::-webkit-scrollbar-track {
    margin: calc(60px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  }

  .container {
    padding-top: 20px;
  }
}

.topBar {
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 400;
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

  .label {
    font-size: 1.2rem;
    font-weight: 500;
  }
}

.item {
  border-bottom: solid 1px var(--color-border-setting);
  color: var(--color-text-primary);
  font-size: 1rem;
  user-select: none;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  padding: 14px;
  cursor: pointer;

  .label {
    margin-bottom: 8px;
  }

  .path-display {
    font-size: 0.8rem;
    color: var(--color-text-muted-light);
    word-break: break-all;
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;

    .slider-value {
      font-size: 1.1rem;
      font-weight: 500;
      color: var(--color-primary);
      min-width: 24px;
      text-align: center;
    }

    .slider {
      flex: 1;
    }
  }
}
</style>
