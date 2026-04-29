<script setup lang="ts">
import searchBar from '../../component/home/searchBar.vue';
import cardButton from '../../component/cardButton.vue';
// import test1Img from '../../static/img/test1.jpg';
import { ref, onActivated, watch, inject } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import {
  getSubscribeVideoList as api_getSubscribeVideoList,
  getSubscribeImageList as api_getSubscribeImageList
} from '../../core/api';
import loadingHuawu from '../loadingHuawu.vue';
import errorHuawu from '../errorHuawu.vue';
import { showShortToast } from '../../core/toast';

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

// 加载更多失败标记
const videoLoadMoreFailed = ref(false);
const imageLoadMoreFailed = ref(false);

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
  // 按需加载数据逻辑 - 只有在没有数据且状态不是失败或空时才跳过
  if (newVal === 'video' && videoList.value.length === 0 && videoState.value !== 'failed' && videoState.value !== 'empty') {
    getSubscribeVideoList();
  }
  if (newVal === 'image' && imageList.value.length === 0 && imageState.value !== 'failed' && imageState.value !== 'empty') {
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

// 点击错误图片刷新数据
function handleVideoErrorClick() {
  refreshData();
}

function handleImageErrorClick() {
  refreshData();
}

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
    getSubscribeVideoList();
  }
  if (tab.value === 'image') {
    // 清空图片列表数据
    imageList.value = [];
    imageListPage = 0;
    imageListMore.value = false;
    imageLoadMoreFailed.value = false;
    imageState.value = 'loading';
    // 获取图片列表数据
    getSubscribeImageList();
  }
}

// 重试加载更多
function retryVideoLoadMore() {
  videoLoadMoreFailed.value = false;
  videoListMore.value = false;
  getSubscribeVideoList();
}

function retryImageLoadMore() {
  imageLoadMoreFailed.value = false;
  imageListMore.value = false;
  getSubscribeImageList();
}

// 初始获取订阅列表数据
function initGetSubscribeData() {
  if (tab.value === 'video' && videoList.value.length === 0 && videoState.value !== 'failed' && videoState.value !== 'empty') {
    videoState.value = 'loading';
    getSubscribeVideoList();
  }
  if (tab.value === 'image' && imageList.value.length === 0 && imageState.value !== 'failed' && imageState.value !== 'empty') {
    imageState.value = 'loading';
    getSubscribeImageList();
  }
}
// 下滑列表到底获取数据
async function videoListHandleScrollToEnd({ done }: any) {
  try {
    await getSubscribeVideoList();
    if (videoListMore.value) {
      done('empty');
    } else {
      done('ok');
    }
  } catch (error) {
    // 加载更多失败时，显示错误提示但保留已有数据
    done('ok');
  }
}
async function imageListHandleScrollToEnd({ done }: any) {
  try {
    await getSubscribeImageList();
    if (imageListMore.value) {
      done('empty');
    } else {
      done('ok');
    }
  } catch (error) {
    // 加载更多失败时，显示错误提示但保留已有数据
    done('ok');
  }
}
// 获取视频列表
async function getSubscribeVideoList() {
  try {
    const res = await api_getSubscribeVideoList(videoListPage);
    // console.log(res);
    if (res.ok) {
      if (res.data.results && res.data.results.length > 0) {
        videoState.value = 'success';
        videoListMore.value = false;
        videoLoadMoreFailed.value = false;
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
      } else {
        videoListMore.value = true;
        if (videoList.value.length === 0) {
          videoState.value = 'empty';
        }
      }
    } else {
      console.error(`状态码：${res.status}`, `错误信息：${res.statusText}`);
      showShortToast('获取视频列表失败');
      // 如果是加载更多时失败，阻止继续加载
      if (videoList.value.length === 0) {
        videoState.value = 'failed';
      } else {
        videoListMore.value = true;
        videoLoadMoreFailed.value = true;
      }
    }
  } catch (error) {
    console.error(`获取视频列表失败:`, error);
    showShortToast('获取视频列表失败');
    // 如果是加载更多时失败，阻止继续加载
    if (videoList.value.length === 0) {
      videoState.value = 'failed';
    } else {
      videoListMore.value = true;
      videoLoadMoreFailed.value = true;
    }
  }
}
// 获取插画列表
async function getSubscribeImageList() {
  try {
    const res = await api_getSubscribeImageList(imageListPage);
    // console.log(res);
    if (res.ok) {
      if (res.data.results && res.data.results.length > 0) {
        imageState.value = 'success';
        imageListMore.value = false;
        imageLoadMoreFailed.value = false;
        const newImages = res.data.results.map((item: any) => {
          return {
            id: item.id,
            title: item.title,
            img: item.thumbnail ? `https://i.iwara.tv/image/thumbnail/${item.thumbnail.id}/${item.thumbnail.id}.jpg` : 'file-loss',
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
      } else {
        imageListMore.value = true;
        if (imageList.value.length === 0) {
          imageState.value = 'empty';
        }
      }
    } else {
      console.error(`状态码：${res.status}`, `错误信息：${res.statusText}`);
      showShortToast('获取插画列表失败');
      // 如果是加载更多时失败，阻止继续加载
      if (imageList.value.length === 0) {
        imageState.value = 'failed';
      } else {
        imageListMore.value = true;
        imageLoadMoreFailed.value = true;
      }
    }
  } catch (error) {
    console.error(`获取插画列表失败:`, error);
    showShortToast('获取插画列表失败');
    // 如果是加载更多时失败，阻止继续加载
    if (imageList.value.length === 0) {
      imageState.value = 'failed';
    } else {
      imageListMore.value = true;
      imageLoadMoreFailed.value = true;
    }
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
        <div v-if="videoState === 'failed'" class="loading" @click="handleVideoErrorClick">
          <errorHuawu>视频列表加载失败了喵~</errorHuawu>
        </div>
        <div v-else-if="videoState === 'empty'" class="loading" @click="handleVideoErrorClick">
          <errorHuawu>暂无视频内容</errorHuawu>
        </div>
        <div v-else-if="videoState === 'loading'" class="loading">
          <loadingHuawu>数据加载中</loadingHuawu>
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
              <div v-if="videoLoadMoreFailed" class="load-more-failed">
                <span>加载失败，</span>
                <span class="retry-btn" @click="retryVideoLoadMore">点击重试</span>
              </div>
              <div v-else class="listEnd">
                已经到底了
              </div>
            </template>
          </v-infinite-scroll>
        </div>
      </swiper-slide>
      <swiper-slide>
        <div v-if="imageState === 'failed'" class="loading" @click="handleImageErrorClick">
          <errorHuawu>插画列表加载失败了喵~</errorHuawu>
        </div>
        <div v-else-if="imageState === 'empty'" class="loading" @click="handleImageErrorClick">
          <errorHuawu>暂无插画内容</errorHuawu>
        </div>
        <div v-else-if="imageState === 'loading'" class="loading">
          <loadingHuawu>数据加载中</loadingHuawu>
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
              <div v-if="imageLoadMoreFailed" class="load-more-failed">
                <span>加载失败，</span>
                <span class="retry-btn" @click="retryImageLoadMore">点击重试</span>
              </div>
              <div v-else class="listEnd">
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
      margin: calc(60px + 40px + 1px + env(safe-area-inset-top, 0) + 4px) 0 calc(60px + env(safe-area-inset-bottom, 0) + 4px) 0;
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
