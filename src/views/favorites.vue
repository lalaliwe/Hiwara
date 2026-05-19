<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { ref, onActivated } from 'vue';
import { setStatusBarTextStyle } from '../plugins/navbarStyle'
import VideoFavorites from '../component/favorites/video.vue'
import ImageFavorites from '../component/favorites/image.vue'

defineOptions({
  name: 'Favorites'
})

const router = useRouter();
const route = useRoute();

// 应用页面设置的函数
const applyPageSettings = () => {
  // 设置状态栏白色文字
  setStatusBarTextStyle('light')
}
applyPageSettings()

const goBack = () => {
  router.back();
}

// 定义选项卡，默认为 'video'
const tab = ref<'video' | 'image'>(route.query.type === 'image' ? 'image' : 'video');

// 获取子组件引用
const videoFavoritesRef = ref();
const imageFavoritesRef = ref();

// 页面激活时恢复滚动位置
onActivated(() => {
  applyPageSettings()
  
  // 根据当前选中的标签页恢复对应子组件的滚动位置
  if (tab.value === 'video' && videoFavoritesRef.value) {
    videoFavoritesRef.value.restoreScroll();
  } else if (tab.value === 'image' && imageFavoritesRef.value) {
    imageFavoritesRef.value.restoreScroll();
  }
});
</script>

<template>
  <div id="favoritesView">
    <div class="top">
      <div class="topBar">
        <div class="goback" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-angle-left" />
        </div>
        <div class="label">
          我的收藏
        </div>
      </div>
      <div class="tabs">
        <v-tabs v-model="tab" color="#00796B" align-tabs="center" density="compact" grow>
          <v-tab value="video">
            视频
          </v-tab>
          <v-tab value="image">
            插画
          </v-tab>
        </v-tabs>
        <v-divider></v-divider>
      </div>
    </div>
    <v-tabs-window v-model="tab" class="tabs-window">
      <v-tabs-window-item value="video">
        <VideoFavorites ref="videoFavoritesRef" />
      </v-tabs-window-item>
      <v-tabs-window-item value="image">
        <ImageFavorites ref="imageFavoritesRef" />
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<style lang="scss" scoped>
#favoritesView {
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