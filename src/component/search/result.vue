<script setup lang="ts">
import { ref, onActivated, watch } from 'vue';
import cardButton from '../cardButton.vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

interface ListItem {
  id: string;
  title: string;
  img: string;
  author: string;
  time: string;
  viewNum: string;
  likeNum: string;
  longNum: string;
  isR18: boolean;
}

const tab = ref('video');

// 内部维护搜索结果数据
const videoResult = ref<ListItem[]>([]);
const imageResult = ref<ListItem[]>([]);

// 生成搜索结果测试数据 (从父组件移入)
for (let i = 0; i < 100; i++) {
  videoResult.value.push({
    id: `video_${i}`,
    title: `视频结果${i}`,
    img: 'https://picsum.photos/200/300',
    author: '作者',
    time: '2023-01-01',
    viewNum: '1000',
    likeNum: '100',
    longNum: '10:00',
    isR18: false
  });
  imageResult.value.push({
    id: `image_${i}`,
    title: `插画结果${i}`,
    img: 'https://picsum.photos/200/300',
    author: '作者',
    time: '2023-01-01',
    viewNum: '1000',
    likeNum: '100',
    longNum: '10',
    isR18: false
  });
}

const videoListView = ref();
const imageListView = ref();
const swiperInstance = ref<SwiperType | null>(null);
let videoScrollTop = 0;
let imageScrollTop = 0;

watch(tab, (newVal) => {
  if (swiperInstance.value) {
    const targetIndex = newVal === 'video' ? 0 : 1;
    if (swiperInstance.value.activeIndex !== targetIndex) {
      swiperInstance.value.slideTo(targetIndex);
    }
  }
});

const onSwiper = (swiper: SwiperType) => {
  swiperInstance.value = swiper;
};

const onSlideChange = (swiper: SwiperType) => {
  tab.value = swiper.activeIndex === 0 ? 'video' : 'image';
};

onActivated(() => {
  if (videoListView.value && typeof videoListView.value.scrollTo === 'function') {
    videoListView.value.scrollTo({ top: videoScrollTop });
  }
  if (imageListView.value && typeof imageListView.value.scrollTo === 'function') {
    imageListView.value.scrollTo({ top: imageScrollTop });
  }
});

function handleVideoScroll(event: any): void {
  videoScrollTop = event.target.scrollTop;
}

function handleImageScroll(event: any): void {
  imageScrollTop = event.target.scrollTop;
}
</script>

<template>
  <div class="content result">
    <div class="tabs">
      <v-tabs v-model="tab" color="#00796B" align-tabs="center" density="compact" grow>
        <v-tab value="video">视频</v-tab>
        <v-tab value="image">插画</v-tab>
      </v-tabs>
      <v-divider></v-divider>
    </div>
    <swiper class="tabs-window" :slides-per-view="1" :space-between="0" @swiper="onSwiper"
      @slide-change="onSlideChange">
      <swiper-slide>
        <div class="list-view" ref="videoListView" @scroll="handleVideoScroll">
          <v-infinite-scroll color="#00796B">
            <div class="grid">
              <template v-for="item in videoResult" :key="item.id">
                <cardButton type="video" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
                  :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
                  :isR18="item.isR18" />
              </template>
            </div>
          </v-infinite-scroll>
        </div>
      </swiper-slide>

      <swiper-slide>
        <div class="list-view" ref="imageListView" @scroll="handleImageScroll">
          <v-infinite-scroll color="#00796B">
            <div class="grid">
              <template v-for="item in imageResult" :key="item.id">
                <cardButton type="image" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
                  :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
                  :isR18="item.isR18" />
              </template>
            </div>
          </v-infinite-scroll>
        </div>
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
  position: absolute;
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

/* 修改: 调整 tabs-window 样式以适配 Swiper */
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

  .list-view {
    height: 100%;
    overflow: auto;
    // 确保列表视图占据完整高度，无额外margin
    margin: 0;
    padding: 0;

    .v-infinite-scroll {
      padding: calc(60px + 36px + 1px + 10px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0) 0;
    }
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0 10px 0 10px;
}
</style>
