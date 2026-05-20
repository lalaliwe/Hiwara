<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/swiper-bundle.css';
import SearchVideo from './video.vue';
import SearchImage from './image.vue';
import SearchUsers from './users.vue';

const props = defineProps<{
  keyword: string;
}>();

const tab = ref<'video' | 'image' | 'user'>('video');
const swiperInstance = ref<SwiperType>();
const videoRef = ref<InstanceType<typeof SearchVideo>>();
const imageRef = ref<InstanceType<typeof SearchImage>>();
const usersRef = ref<InstanceType<typeof SearchUsers>>();

// 监听 tab 变化，控制 Swiper 切换并触发数据加载
watch(tab, (newVal) => {
  if (swiperInstance.value) {
    const targetIndex = newVal === 'video' ? 0 : newVal === 'image' ? 1 : 2;
    if (swiperInstance.value.activeIndex !== targetIndex) {
      swiperInstance.value.slideTo(targetIndex);
    }
  }
  
  // 切换到对应 tab 时，如果该 tab 还未加载数据，则触发加载
  if (newVal === 'video') {
    videoRef.value?.startSearch();
  } else if (newVal === 'image') {
    imageRef.value?.startSearch();
  } else if (newVal === 'user') {
    usersRef.value?.startSearch();
  }
});

// 监听 Swiper 滑动，同步更新 tab
const onSlideChange = (swiper: SwiperType) => {
  const index = swiper.activeIndex;
  if (index === 0) tab.value = 'video';
  else if (index === 1) tab.value = 'image';
  else if (index === 2) tab.value = 'user';
};

const onSwiper = (swiper: SwiperType) => {
  swiperInstance.value = swiper;
};

// 组件挂载时，立即加载当前激活的 Tab 数据
onMounted(() => {
  // 默认是 video tab，立即触发加载
  if (tab.value === 'video') {
    videoRef.value?.startSearch();
  }
});
</script>

<template>
  <div class="content">
    <div class="tabs">
      <v-tabs v-model="tab" color="#00796B" align-tabs="center" density="compact" grow>
        <v-tab value="video">视频</v-tab>
        <v-tab value="image">插画</v-tab>
        <v-tab value="user">用户</v-tab>
      </v-tabs>
      <v-divider></v-divider>
    </div>
    
    <swiper class="tabs-window" :slides-per-view="1" :space-between="0" @swiper="onSwiper" @slide-change="onSlideChange">
      <swiper-slide>
        <SearchVideo ref="videoRef" :keyword="keyword" />
      </swiper-slide>
      <swiper-slide>
        <SearchImage ref="imageRef" :keyword="keyword" />
      </swiper-slide>
      <swiper-slide>
        <SearchUsers ref="usersRef" :keyword="keyword" />
      </swiper-slide>
    </swiper>
  </div>
</template>

<style lang="scss" scoped>
.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tabs {
  position: fixed;
  top: calc(60px + env(safe-area-inset-top, 0));
  z-index: 400;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);

  .v-tabs--density-compact {
    --v-tabs-height: 36px;
  }
}

/* Swiper 容器样式 */
.tabs-window {
  z-index: 1;
  flex: 1;
  width: 100%;
  height: 100%;

  // 深度选择器修改 Swiper 内部结构，使其高度 100% 传递下去
  :deep(.swiper-wrapper) {
    height: 100%;
  }

  :deep(.swiper-slide) {
    height: auto;
    overflow: hidden;
  }
}
</style>
