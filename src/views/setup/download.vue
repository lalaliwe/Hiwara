<script setup lang="ts">
import { useRouter } from 'vue-router'
import { setupStore } from '../../core/store'
import { storeToRefs } from 'pinia'

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

// 更新视频保存路径
const updateVideoSavePath = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  await setup.updateSetting('videoSavePath', target.value);
}

// 更新图片保存路径
const updateImageSavePath = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  await setup.updateSetting('imageSavePath', target.value);
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
    <div class="item">
      <div class="label">视频保存路径</div>
      <v-text-field 
        class="input" 
        label="请输入视频保存路径" 
        color="#00796B" 
        hide-details
        density="comfortable" 
        variant="underlined"
        :model-value="videoSavePath"
        @change="updateVideoSavePath"
      ></v-text-field>
    </div>
    <div class="item">
      <div class="label">图片保存路径</div>
      <v-text-field 
        class="input" 
        label="请输入图片保存路径" 
        color="#00796B" 
        hide-details 
        density="comfortable"
        variant="underlined"
        :model-value="imageSavePath"
        @change="updateImageSavePath"
      ></v-text-field>
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
  padding: 16px 14px;

  .label {
    margin-bottom: 8px;
  }

  .input {
    width: 100%;
  }
}
</style>