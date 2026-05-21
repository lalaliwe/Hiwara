<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { ref, onActivated } from 'vue';
import { useI18n } from 'vue-i18n';
import { setStatusBarTextStyle } from '../plugins/navbarStyle'
import VideoHistory from '../component/history/video.vue'
import ImageHistory from '../component/history/image.vue'

defineOptions({
  name: 'History'
})

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

// 应用页面设置的函数
const applyPageSettings = () => {
  // 设置状态栏白色文字
  setStatusBarTextStyle('light')
}
applyPageSettings()

const goBack = () => {
  router.back();
}

// 定义选项卡
const tab = ref('video');

// 获取子组件引用
const videoHistoryRef = ref();
const imageHistoryRef = ref();

// 页面激活时恢复滚动位置
onActivated(() => {
  applyPageSettings()
  
  // 根据当前选中的标签页恢复对应子组件的滚动位置
  if (tab.value === 'video' && videoHistoryRef.value) {
    videoHistoryRef.value.restoreScroll();
  } else if (tab.value === 'image' && imageHistoryRef.value) {
    imageHistoryRef.value.restoreScroll();
  }
});
</script>

<template>
  <div id="historyView">
    <div class="top">
      <div class="topBar">
        <div class="goback" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-angle-left" />
        </div>
        <div class="label">
          {{ t('history.title') }}
          <!-- 历史记录 -->
        </div>
      </div>
      <div class="tabs">
        <v-tabs v-model="tab" color="#00796B" align-tabs="center" density="compact" grow>
          <v-tab value="video">
            {{ t('history.video.tab') }}
            <!-- 视频 -->
          </v-tab>
          <v-tab value="image">
            {{ t('history.image.tab') }}
            <!-- 插画 -->
          </v-tab>
        </v-tabs>
        <v-divider></v-divider>
      </div>
    </div>
    <v-tabs-window v-model="tab" class="tabs-window">
      <v-tabs-window-item value="video">
        <VideoHistory ref="videoHistoryRef" />
      </v-tabs-window-item>
      <v-tabs-window-item value="image">
        <ImageHistory ref="imageHistoryRef" />
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<style lang="scss" scoped>
#historyView {
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
}

.top {
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 400;

  .topBar {
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

  .tabs {
    background-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .v-tabs--density-compact {
      --v-tabs-height: 40px;
    }
  }
}

.tabs-window {
  flex: 1;
  overflow: hidden;

  :deep(.v-window__container),
  :deep(.v-window-item) {
    height: 100%;
  }
}
</style>