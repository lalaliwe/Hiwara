<script setup lang="ts">
import searchBar from '../../component/home/searchBar.vue';
import cardButton from '../../component/cardButton.vue';
// import test1Img from '../../static/img/test1.jpg';
import { ref, onActivated, watch, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/swiper-bundle.css';
import {
  getSubscribeVideoList as api_getSubscribeVideoList,
  getSubscribeImageList as api_getSubscribeImageList
} from '../../core/api';
import loadingHuawu from '../loadingHuawu.vue';
import errorHuawu from '../errorHuawu.vue';
import { showShortToast } from '../../core/toast';
import type { VInfiniteScroll } from 'vuetify/components'

const { t } = useI18n();

const videoListView = ref<InstanceType<typeof VInfiniteScroll>>();
const imageListView = ref<InstanceType<typeof VInfiniteScroll>>();

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

const videoListMore = ref(false); // 视频加载到底
const imageListMore = ref(false); // 插画加载到底

// 加载更多失败标记
const videoLoadMoreFailed = ref(false); // 视频加载失败
const imageLoadMoreFailed = ref(false); // 插画加载失败

// 聚合状态：'failed' | 'empty' | 'loading' | 'success'
type ListState = 'failed' | 'empty' | 'loading' | 'success';
const videoState = ref<ListState>('loading');
const imageState = ref<ListState>('loading');

let showBeen = false;
const homeTab = inject('isTab') as { value: 'video' | 'image' | 'subscribe' | 'forum' | 'my' };
watch(() => homeTab.value, (val) => {
  if (val === 'subscribe' && !showBeen) {
    initGetSubscribeData();
    showBeen = true;
  }
}, { immediate: true });

// 注入刷新令牌
const refreshToken = inject('refreshToken') as { value: number };
// 监听刷新令牌变化，执行刷新
watch(refreshToken, () => {
  console.log('刷新');
  refreshData();
});

// 1. 监听 tab 变化，控制 Swiper 切换及按需加载数据
watch(tab, (newVal) => {
  if (swiperInstance.value) {
    const targetIndex = newVal === 'video' ? 0 : 1;
    if (swiperInstance.value.activeIndex !== targetIndex) {
      swiperInstance.value.slideTo(targetIndex);
    }
  }
  initGetSubscribeData();
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
  if (videoListView.value)
    videoListView.value.$el.scrollTop = videoScrollTop;
  if (imageListView.value)
    imageListView.value.$el.scrollTop = imageScrollTop;
});

function handleVideoScroll(e: Event): void {
  videoScrollTop = (e.target as HTMLElement).scrollTop;
  // console.log(videoScrollTop);
}
function handleImageScroll(e: Event): void {
  imageScrollTop = (e.target as HTMLElement).scrollTop;
  // console.log(imageScrollTop);
}
// 初始获取订阅列表数据
function initGetSubscribeData() {
  if (tab.value === 'video' && videoState.value === 'loading') {
    getSubscribeVideoList().then((res) => {
      if (res.length > 0)
        videoState.value = 'success';
      else
        videoState.value = 'empty';
    }).catch(() => {
      videoState.value = 'failed';
    });
  }
  if (tab.value === 'image' && imageState.value === 'loading') {
    getSubscribeImageList().then((res) => {
      if (res.length > 0)
        imageState.value = 'success';
      else
        imageState.value = 'empty';
    }).catch(() => {
      imageState.value = 'failed';
    });
  }
}
// 刷新数据
function refreshData() {
  if (tab.value === 'video') {
    // 清空视频列表数据
    videoList.value = [];
    videoListPage = 0;
    videoListMore.value = false;
    videoLoadMoreFailed.value = false;
    videoState.value = 'loading';
    // 获取视频列表数据
    getSubscribeVideoList().then((res) => {
      if (res.length > 0)
        videoState.value = 'success';
      else
        videoState.value = 'empty';
    }).catch(() => {
      videoState.value = 'failed';
    });
  }
  if (tab.value === 'image') {
    // 清空图片列表数据
    imageList.value = [];
    imageListPage = 0;
    imageListMore.value = false;
    imageLoadMoreFailed.value = false;
    imageState.value = 'loading';
    // 获取图片列表数据
    getSubscribeImageList().then((res) => {
      if (res.length > 0)
        imageState.value = 'success';
      else
        imageState.value = 'empty';
    }).catch(() => {
      imageState.value = 'failed';
    });
  }
}
// 点击错误图片刷新数据
function handleVideoErrorClick() {
  refreshData();
}
function handleImageErrorClick() {
  refreshData();
}
// 下滑列表到底追加数据
async function videoListHandleScrollToEnd({ done }: any) {
  getSubscribeVideoList().then((res) => {
    if (res.length > 0) done('ok');
    else {
      videoListMore.value = true;
      done('empty');
    }
  }).catch(() => {
    videoLoadMoreFailed.value = true;
    done('error');
  });
}
async function imageListHandleScrollToEnd({ done }: any) {
  getSubscribeImageList().then((res) => {
    if (res.length > 0) done('ok');
    else {
      imageListMore.value = true;
      done('empty');
    }
  }).catch(() => {
    imageLoadMoreFailed.value = true;
    done('error');
  });
}

// 获取视频列表
async function getSubscribeVideoList(): Promise<any> {
  try {
    const res = await api_getSubscribeVideoList(videoListPage);
    // console.log(res);
    if (!res.ok)
      throw new Error(`状态码：${res.status}, 错误信息：${res.statusText}`);
    if (res.data.results && res.data.results.length > 0) {
      const newVideos = res.data.results.map((item: any) => {
        return {
          id: item.id,
          title: item.title,
          img: item.file ? `https://i.iwara.tv/image/thumbnail/${item.file.id}/thumbnail-${String(item.thumbnail).padStart(2, '0')}.jpg` : 'file-loss',
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
      // 返回数据
      return newVideos;
    } else {
      // 返回空数组
      return [];
    }
  } catch (error) {
    console.error(`获取视频列表失败:`, error);
    showShortToast('获取视频列表失败');
    throw error;
  }
}
// 获取插画列表
async function getSubscribeImageList(): Promise<any> {
  try {
    const res = await api_getSubscribeImageList(imageListPage);
    // console.log(res);
    if (!res.ok)
      throw new Error(`状态码：${res.status}, 错误信息：${res.statusText}`);
    if (res.data.results && res.data.results.length > 0) {
      const newImages = res.data.results.map((item: any) => {
        return {
          id: item.id,
          title: item.title,
          img: item.thumbnail ? `https://i.iwara.tv/image/thumbnail/${item.thumbnail.id}/${item.thumbnail.id}.jpg` : 'file-loss',
          author: item.user?.name || item.user?.username || 'Unknown',
          time: item.createdAt,
          viewNum: item.numViews || 0,
          likeNum: item.numLikes || 0,
          longNum: item.numImages || 0,
          isR18: item.rating === 'ecchi' || item.rating === 'r18'
        };
      });
      // 追加数据
      imageList.value = [...imageList.value, ...newImages];
      imageListPage++;
      // 返回数据
      return newImages;
    } else {
      // 返回空数组
      return [];
    }
  } catch (error) {
    console.error(`获取插画列表失败:`, error);
    showShortToast('获取插画列表失败');
    throw error;
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
          <v-tab value="video">{{ t('home.navigation.video') }}</v-tab>
          <v-tab value="image">{{ t('home.navigation.image') }}</v-tab>
        </v-tabs>
        <v-divider></v-divider>
      </div>
    </div>
    <!-- 替换为 Swiper 组件 -->
    <swiper class="tabs-window" :slides-per-view="1" :space-between="0" @swiper="onSwiper"
      @slide-change="onSlideChange">
      <swiper-slide>
        <div v-if="videoState === 'failed'" class="loading" @click="handleVideoErrorClick">
          <errorHuawu>{{ t('home.video.loadFailed') }}{{ t('home.navigation.video') }}</errorHuawu>
        </div>
        <div v-else-if="videoState === 'empty'" class="loading" @click="handleVideoErrorClick">
          <errorHuawu>{{ t('home.navigation.video') }}{{ t('home.video.noRecords') }}</errorHuawu>
        </div>
        <div v-else-if="videoState === 'loading'" class="loading">
          <loadingHuawu>{{ t('home.video.loading') }}</loadingHuawu>
        </div>
        <v-infinite-scroll v-else color="#00796B" @load="videoListHandleScrollToEnd" :disabled="videoListMore"
          class="list-view" ref="videoListView" @scroll="handleVideoScroll">
          <div class="grid">
            <template v-for="item in videoList" :key="item.id">
              <cardButton type="video" :data="{
                id: item.id,
                title: item.title,
                img: item.img,
                author: item.author,
                time: item.time,
                viewNum: item.viewNum,
                likeNum: item.likeNum,
                longNum: item.longNum,
                isR18: item.isR18
              }" />
            </template>
          </div>
          <template v-slot:error="{ props }">
            <div class="load-more-failed">
              <span>{{ t('home.video.loadFailed') }}</span>
              <span class="retry-btn" v-bind=props>{{ t('home.video.retry') }}</span>
            </div>
          </template>
          <template v-slot:empty>
            <div class="listEnd">
              {{ t('home.video.reachedBottom') }}
            </div>
          </template>
        </v-infinite-scroll>
      </swiper-slide>
      <swiper-slide>
        <div v-if="imageState === 'failed'" class="loading" @click="handleImageErrorClick">
          <errorHuawu>{{ t('home.image.loadFailed') }}{{ t('home.navigation.image') }}</errorHuawu>
        </div>
        <div v-else-if="imageState === 'empty'" class="loading" @click="handleImageErrorClick">
          <errorHuawu>{{ t('home.navigation.image') }}{{ t('home.image.noRecords') }}</errorHuawu>
        </div>
        <div v-else-if="imageState === 'loading'" class="loading">
          <loadingHuawu>{{ t('home.image.loading') }}</loadingHuawu>
        </div>
        <v-infinite-scroll v-else color="#00796B" @load="imageListHandleScrollToEnd" :disabled="imageListMore"
          class="list-view" ref="imageListView" @scroll="handleImageScroll">
          <div class="grid">
            <template v-for="item in imageList" :key="item.id">
              <cardButton type="image" :data="{
                id: item.id,
                title: item.title,
                img: item.img,
                author: item.author,
                time: item.time,
                viewNum: item.viewNum,
                likeNum: item.likeNum,
                longNum: item.longNum,
                isR18: item.isR18
              }" />
            </template>
          </div>
          <template v-slot:error="{ props }">
            <div class="load-more-failed">
              <span>{{ t('home.image.loadFailed') }}</span>
              <span class="retry-btn" v-bind=props>{{ t('home.image.retry') }}</span>
            </div>
          </template>
          <template v-slot:empty>
            <div class="listEnd">
              {{ t('home.image.reachedBottom') }}
            </div>
          </template>
        </v-infinite-scroll>
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
    $top: calc(env(safe-area-inset-top, 0) + 60px + 40px);
    $bottom: calc(env(safe-area-inset-bottom, 0) + 60px);
    height: calc(100vh - $top - 10px - $bottom);
    padding-top: calc($top + 10px);
    padding-bottom: $bottom;

    &::-webkit-scrollbar-track {
      margin: calc($top + 4px) 0 calc($bottom + 4px) 0;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      padding: 0 10px 0 10px;

      >* {
        content-visibility: auto;
        contain-intrinsic-size: 0 180px;
      }
    }
  }
}

.loading {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.listEnd {
  color: #757575;
  padding: 4px 0;
}

.load-more-failed {
  text-align: center;
  padding: 10px 0;
  color: #757575;
  font-size: 0.9rem;

  .retry-btn {
    color: #00796B;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
  }
}
</style>
