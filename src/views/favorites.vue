<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAutoStatusBar } from '../composables/useAutoStatusBar'
import VideoFavorites from '../component/favorites/video.vue'
import ImageFavorites from '../component/favorites/image.vue'

const { t } = useI18n();

defineOptions({
  name: 'Favorites'
})

const router = useRouter();
const route = useRoute();

// 自动状态栏文字颜色自适应（根据 --color-primary-90 亮度判断）
useAutoStatusBar({ cssVar: '--color-primary-90' })

const goBack = () => {
  router.back();
}

// 定义选项卡，默认为 'video'
const tab = ref<'video' | 'image'>(route.query.type === 'image' ? 'image' : 'video');

</script>

<template>
  <div id="favoritesView">
    <div class="top">
      <div class="topBar">
        <div class="goback" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-angle-left" />
        </div>
        <div class="label">
          {{ t('favorites.title') }}
        </div>
      </div>
      <div class="tabs">
        <v-tabs v-model="tab" color="#00796B" align-tabs="center" density="compact" grow>
          <v-tab value="video">
            {{ t('favorites.videoTab') }}
          </v-tab>
          <v-tab value="image">
            {{ t('favorites.imageTab') }}
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
  background-color: var(--color-bg-page);
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

  .tabs {
    background-color: var(--color-white-80);
    box-shadow: var(--shadow-tab-bar);

    .v-tabs--density-compact {
      --v-tabs-height: 40px;
    }

    :deep(.v-tab) {
      color: var(--color-text-muted);

      &.v-tab--selected {
        color: var(--color-primary);
      }
    }

    :deep(.v-divider) {
      border-color: var(--color-border-divider) !important;
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
