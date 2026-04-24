<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref } from 'vue'

defineOptions({
  name: 'SetupDownload'
})

const router = useRouter()
// 返回上一页
const goBack = () => {
  router.back();
}

const videoDownload = ref('~/Videos')
const imageDownload = ref('~/Pictures');
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
      <div class="label">视频下载目录</div>
      <div class="value">{{ videoDownload }}</div>
    </div>
    <div class="item">
      <div class="label">插画下载目录</div>
      <div class="value">{{ imageDownload }}</div>
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
  width: 100%;
  padding: 12px 14px;

  .value {
    font-size: 0.8rem;
    color: #757575;
  }
}
</style>