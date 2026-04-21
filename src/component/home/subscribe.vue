<script setup lang="ts">
import searchBar from '../../component/home/searchBar.vue';
import cardButton from '../../component/cardButton.vue';
import test1Img from '../../static/img/test1.jpg';
import { ref, onActivated, watch } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import {
  getSubscribeVideoList as api_getSubscribeVideoList,
  getSubscribeImageList as api_getSubscribeImageList
} from '../../core/api';
import loadingHuawu from '../loadingHuawu.vue';

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
  viewNum: number;
  likeNum: number;
  longNum: number;
  isR18: boolean;
}
const videoList = ref<ListItem[]>([]);
const imageList = ref<ListItem[]>([]);

let videoScrollTop = 0;
let imageScrollTop = 0;

let videoListPage = 0;
let imageListPage = 0;

const videoListMore = ref(false);
const imageListMore = ref(false);

// 1. 监听 tab 变化，控制 Swiper 切换及按需加载数据
watch(tab, (newVal) => {
  if (swiperInstance.value) {
    const targetIndex = newVal === 'video' ? 0 : 1;
    if (swiperInstance.value.activeIndex !== targetIndex) {
      swiperInstance.value.slideTo(targetIndex);
    }
  }
  // 按需加载数据逻辑
  if (newVal === 'video' && videoList.value.length === 0) {
    getSubscribeVideoList();
  } else if (newVal === 'image' && imageList.value.length === 0) {
    getSubscribeImageList();
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

if (tab.value === 'video' && videoList.value.length === 0) {
  getSubscribeVideoList();
} else if (tab.value === 'image' && imageList.value.length === 0) {
  getSubscribeImageList();
}
// 下滑列表到底获取数据
async function videoListHandleScrollToEnd({ done }: any) {
  await getSubscribeVideoList();
  if (videoListMore.value) {
    done('empty');
  } else {
    done('ok');
  }
}
async function imageListHandleScrollToEnd({ done }: any) {
  await getSubscribeImageList();
  if (imageListMore.value) {
    done('empty');
  } else {
    done('ok');
  }
}
//获取视频列表
async function getSubscribeVideoList() {
  try {
    const res = await api_getSubscribeVideoList(videoListPage);
    console.log(res);
    if (res && res.results && res.results.length > 0) {
      const newVideos = res.results.map((item: any) => {
        return {
          id: item.id,
          title: item.title,
          img: item.file ? `https://i.iwara.tv/image/thumbnail/${item.file.id}/thumbnail-${item.thumbnail}.jpg` : null,
          author: item.user?.name || item.user?.username || 'Unknown',
          time: item.createdAt,
          viewNum: item.numViews || 0,
          likeNum: item.numLikes || 0,
          longNum: item.file?.duration ?? 0,
          isR18: item.rating === 'ecchi' || item.rating === 'r18'
        };
      });
      // 追加数据
      videoList.value = [...videoList.value, ...newVideos];
      videoListPage++;
      // 如果返回的数据少于预期，说明没有更多数据了
      if (res.results.length < 20) { // 假设每页最多返回20个项目
        videoListMore.value = true;
      }
    } else {
      videoListMore.value = true;
    }
  } catch (error) {
    console.error('Error fetching video list:', error);
  }
}
//获取插画列表
async function getSubscribeImageList() {
  try {
    const res = await api_getSubscribeImageList(imageListPage);
    console.log(res);
    if (res && res.results && res.results.length > 0) {
      const newImages = res.results.map((item: any) => {
        return {
          id: item.id,
          title: item.title,
          img: item.thumbnail ? `https://i.iwara.tv/image/thumbnail/${item.thumbnail.id}/${item.thumbnail.id}.jpg` : null,
          author: item.user?.name || item.user?.username || 'Unknown',
          time: item.createdAt,
          viewNum: item.numViews || 0,
          likeNum: item.numLikes || 0,
          longNum: item.numComments || 0,
          isR18: item.rating === 'ecchi' || item.rating === 'r18'
        };
      });
      // 追加数据
      imageList.value = [...imageList.value, ...newImages];
      imageListPage++;
      // 如果返回的数据少于预期，说明没有更多数据了
      if (res.results.length < 20) { // 假设每页最多返回20个项目
        imageListMore.value = true;
      }
    } else {
      imageListMore.value = true;
    }
  } catch (error) {
    console.error('Error fetching image list:', error);
  }
}

</script>

<template>
  <div>
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
    <swiper class="tabs-window" :slides-per-view="1" :space-between="0" @swiper="onSwiper"
      @slide-change="onSlideChange">
      <swiper-slide>
        <div v-if="videoList.length === 0" class="loading">
          <loadingHuawu class="anime" />
          <div class="loading-text">
            数据加载中<span class="dots"></span>
          </div>
        </div>
        <div v-else class="list-view" ref="videoListView" @scroll="handleVideoScroll">
          <v-infinite-scroll color="#00796B" @load="videoListHandleScrollToEnd" :disabled="videoListMore">
            <div class="grid">
              <template v-for="item in videoList" :key="item.id">
                <cardButton type="video" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
                  :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
                  :isR18="item.isR18" />
              </template>
            </div>
            <template v-slot:empty>
              <div class="listEnd">
                已经到底了
              </div>
            </template>
          </v-infinite-scroll>
        </div>
      </swiper-slide>
      <swiper-slide>
        <div v-if="imageList.length === 0" class="loading">
          <loadingHuawu class="anime" />
          <div class="loading-text">
            数据加载中<span class="dots"></span>
          </div>
        </div>
        <div v-else class="list-view" ref="imageListView" @scroll="handleImageScroll">
          <v-infinite-scroll color="#00796B" @load="imageListHandleScrollToEnd" :disabled="imageListMore">
            <div class="grid">
              <template v-for="item in imageList" :key="item.id">
                <cardButton type="image" :id="item.id" :title="item.title" :img="item.img" :author="item.author"
                  :time="item.time" :viewNum="item.viewNum" :likeNum="item.likeNum" :longNum="item.longNum"
                  :isR18="item.isR18" />
              </template>
            </div>
            <template v-slot:empty>
              <div class="listEnd">
                已经到底了
              </div>
            </template>
          </v-infinite-scroll>
        </div>
      </swiper-slide>
    </swiper>
  </div>
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

.loading {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .anime {
    width: 200px;
  }

  .loading-text {
    font-family: 'AaXinRui85-2';
    color: #00796B;

    .dots::after {
      content: '';
      animation: dotsAnimation 1s infinite;
    }
  }

  @keyframes dotsAnimation {
    0% {
      content: '.';
    }

    16.66% {
      content: '..';
    }

    33.32% {
      content: '...';
    }

    49.98% {
      content: '....';
    }

    66.64% {
      content: '.....';
    }

    83.3% {
      content: '......';
    }

    100% {
      content: '.';
    }
  }
}

.listEnd {
  color: #757575;
  padding: 4px 0;
}
</style>
