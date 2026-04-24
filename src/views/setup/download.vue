<script setup lang="ts">
import { useRouter } from 'vue-router'
import { setupStore } from '../../core/store'
import { storeToRefs } from 'pinia'
// 导入Tauri的dialog插件
import { open } from '@tauri-apps/plugin-dialog'

defineOptions({
  name: 'SetupDownload'
})

const router = useRouter()
const setup = setupStore()
const { videoSavePath, imageSavePath } = storeToRefs(setup)

// 返回上一页
const goBack = () => {
  router.back();
}

// 选择视频保存路径
const selectVideoSavePath = async () => {
  const selectedPath = await open({
    directory: true,  // 只能选择目录
    multiple: false,  // 只能选择单个目录
    title: '选择视频保存路径'
  });

  if (selectedPath) {
    // 将选择的路径更新到store中
    await setup.updateSetting('videoSavePath', selectedPath as string);
  }
}

// 选择图片保存路径
const selectImageSavePath = async () => {
  const selectedPath = await open({
    directory: true,  // 只能选择目录
    multiple: false,  // 只能选择单个目录
    title: '选择图片保存路径'
  });

  if (selectedPath) {
    // 将选择的路径更新到store中
    await setup.updateSetting('imageSavePath', selectedPath as string);
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
        下载设置
      </div>
    </div>
    <!-- 内容区域 -->
    <div class="item" @click="selectVideoSavePath">
      <div class="label">视频保存路径</div>
      <div class="path-display">{{ videoSavePath || '未设置' }}</div>
    </div>
    <div class="item" @click="selectImageSavePath">
      <div class="label">图片保存路径</div>
      <div class="path-display">{{ imageSavePath || '未设置' }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#setupDownloadView {
  overflow-y: auto;
  padding: calc(60px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
  background-color: #fafafa;

  &::-webkit-scrollbar-track {
    margin: calc(60px + env(safe-area-inset-top, 0) + 4px) 0 calc(env(safe-area-inset-bottom, 0) + 4px) 0;
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
  background-color: rgba(0, 121, 107, 0.9);
  color: #fff;
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
  border-bottom: solid 1px #BDBDBD;
  color: #212121;
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
    color: #757575;
    word-break: break-all;
  }
}
</style>