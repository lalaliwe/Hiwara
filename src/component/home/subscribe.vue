<script setup lang="ts">
import searchBar from '../../component/home/searchBar.vue';
import cardButton from '../../component/cardButton.vue';
import test1Img from '../../static/img/test1.jpg';
import { ref, onActivated, watch } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

const videoListView = ref<HTMLElement>();
const imageListView = ref<HTMLElement>();

const tab = ref('video');
const swiperInstance = ref<SwiperType | null>(null);

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
let videoList: ListItem[] = [];
const imageList: ListItem[] = []; // 修正了类型
for (let i = 0; i < 20; i++) {
  videoList.push({
    id: Math.random().toString(36).slice(2),
    title: `测试标题${i + 1}`,
    img: test1Img,
    author: '测试作者',
    time: '2021-09-09',
    viewNum: '100',
    likeNum: '100',
    longNum: '10:00',
    isR18: false,
  });
  imageList.push({
    id: Math.random().toString(36).slice(2),
    title: `测试标题${i + 1}`,
    img: test1Img,
    author: '测试作者',
    time: '2021-09-09',
    viewNum: '100',
    likeNum: '100',
    longNum: '10',
    isR18: false,
  });
}
let videoScrollTop = 0;
let imageScrollTop = 0;

// 1. 监听 tab 变化，控制 Swiper 切换
watch(tab, (newVal) => {
  if (swiperInstance.value) {
    const targetIndex = newVal === 'video' ? 0 : 1;
    if (swiperInstance.value.activeIndex !== targetIndex) {
      swiperInstance.value.slideTo(targetIndex);
    }
  }
});

// 2. Swiper 实例初始化
const onSwiper = (swiper: SwiperType) => {
  swiperInstance.value = swiper;
};

// 3. 监听 Swiper 滑动，反控 tab 变化 (实现双向联动)
const onSlideChange = (swiper: SwiperType) => {
  tab.value = swiper.activeIndex === 0 ? 'video' : 'image';
};

onActivated(() => {
  if (videoListView.value && typeof videoListView.value.scrollTo === 'function')
    videoListView.value.scrollTo({ top: videoScrollTop });
  if (imageListView.value && typeof imageListView.value.scrollTo === 'function')
    imageListView.value.scrollTo({ top: imageScrollTop });
});

function handleVideoScroll(e: Event): void {
  videoScrollTop = (e.target as HTMLElement).scrollTop;
}
function handleImageScroll(e: Event): void {
  imageScrollTop = (e.target as HTMLElement).scrollTop;
}
</script>

<template>
  <div class="top">
    <searchBar />
    <div class="tabs">
      <!-- 保留 Vuetify 的 Tab 头部作为 UI 展示 -->
      <v-tabs v-model="tab" color="#00796B" align-tabs="center" density="compact" grow>
        <v-tab value="video">视频</v-tab>
        <v-tab value="image">插画</v-tab>
      </v-tabs>
      <v-divider></v-divider>
    </div>
  </div>

  <!-- 替换为 Swiper 组件 -->
  <swiper class="tabs-window" :slides-per-view="1" :space-between="0" @swiper="onSwiper" @slide-change="onSlideChange">
    <swiper-slide>
      <div class="list-view" ref="videoListView" @scroll="handleVideoScroll">
        <v-infinite-scroll color="#00796B">
          <div class="grid">
            <template v-for="item in videoList" :key="item.id">
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
            <template v-for="item in imageList" :key="item.id">
              <cardButton type="image" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
                :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
                :isR18="item.isR18" />
            </template>
          </div>
        </v-infinite-scroll>
      </div>
    </swiper-slide>
  </swiper>
</template>

<style lang="scss" scoped>
.top {
  position: absolute;
  width: 100%;
  top: 0;
  z-index: 500;
  backdrop-filter: blur(10px);

  .tabs {
    background-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .v-tabs--density-compact {
      --v-tabs-height: 40px;
    }
  }
}

/* Swiper 容器样式，替换原来的 .tabs-window */
.tabs-window {
  z-index: 1;
  width: 100%;
  height: 100%; // 确保撑满父级高度

  // 深度选择器修改 Swiper 内部结构，使其高度 100% 传递下去
  :deep(.swiper-wrapper) {
    height: 100%;
  }

  :deep(.swiper-slide) {
    height: auto; // Swiper 默认 auto 可以让内部根据内容或子元素 100% 撑开
    overflow: hidden; // 防止滑动时内容溢出
  }

  .list-view {
    height: 100vh; // 使用视口高度，因为 swiper-slide 的 auto 高度需要子级有明确高度
    overflow-y: auto;

    &::-webkit-scrollbar-track {
      margin: calc(60px + 40px + 1px + env(safe-area-inset-top, 0) + 4px) 0 calc(60px + env(safe-area-inset-bottom, 0) + 4px);
    }

    .v-infinite-scroll {
      padding: calc(60px + 40px + 1px + 10px + env(safe-area-inset-top, 0)) 0 calc(60px + env(safe-area-inset-bottom, 0)) 0;
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
