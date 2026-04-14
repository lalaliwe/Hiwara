<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import UserInfo from '../component/zone/userInfo.vue'

defineOptions({
  name: 'Zone'
})

const route = useRoute()
const router = useRouter()

const myself = ref<boolean>(route.query.myself == 'true')
const nickname = ref('测试用户')
const userSignature = '测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名测试个性签名'
const followNum = ref(100)
const fansNum = ref(100)
const tab = ref<'video' | 'image' | 'publish'>('video')

// 顶部导航栏颜色状态
const isTopGreen = ref(false);
const zoneContainerRef = ref<HTMLElement | null>(null);

// 各标签页保存的滚动位置
let videoScrollTop = 0;
let imageScrollTop = 0;
let publishScrollTop = 0;

// zone-info 元素引用
const zoneInfoRef = ref<HTMLElement | null>(null);

// ResizeObserver 实例
let resizeObserver: ResizeObserver | null = null;

// 滚动节流标志
let ticking = false;

// 返回顶部
function scrollToTop() {
  const container = zoneContainerRef.value;
  if (container) {
    container.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// 返回
function goBack() {
  router.back();
}
// 回到主界面
function goHome() {
  router.replace('/');
}

function routerGoTo(path: string, query?: any) {
  if (query) {
    router.push({
      path: path,
      query: query
    });
  } else {
    router.push(path);
  }
}

// 保存当前标签页的滚动位置
function saveCurrentScrollPosition() {
  const container = zoneContainerRef.value;
  if (!container) return;
  const scrollTop = container.scrollTop;
  switch (tab.value) {
    case 'video':
      videoScrollTop = scrollTop;
      break;
    case 'image':
      imageScrollTop = scrollTop;
      break;
    case 'publish':
      publishScrollTop = scrollTop;
      break;
  }
}

// 恢复指定标签页的滚动位置
function restoreScrollPosition(targetTab: 'video' | 'image' | 'publish') {
  const container = zoneContainerRef.value;
  if (!container) return;

  let targetScrollTop = 0;
  switch (targetTab) {
    case 'video':
      targetScrollTop = videoScrollTop;
      break;
    case 'image':
      targetScrollTop = imageScrollTop;
      break;
    case 'publish':
      targetScrollTop = publishScrollTop;
      break;
  }

  // 限制滚动位置在有效范围内
  const maxScrollTop = container.scrollHeight - container.clientHeight;
  if (targetScrollTop > maxScrollTop) {
    targetScrollTop = Math.max(0, maxScrollTop);
  }
  container.scrollTop = targetScrollTop;
}

// 处理全局滚动事件
function handleGlobalScroll() {
  const container = zoneContainerRef.value;
  if (!container) return;

  // 保存当前滚动位置
  saveCurrentScrollPosition();

  // 使用 RAF 优化性能
  if (!ticking) {
    requestAnimationFrame(() => {
      updateTopBarColor();
      ticking = false;
    });
    ticking = true;
  }
}

// 更新顶部导航栏颜色（基于 zone-bg 是否滚出视口）
function updateTopBarColor() {
  const container = zoneContainerRef.value;
  if (!container) return;

  const zoneBg = container.querySelector('.zone-bg') as HTMLElement;
  const topElement = document.querySelector('.top') as HTMLElement;

  if (!zoneBg || !topElement) return;

  // 获取 zone-bg 底部相对于视口的位置
  const zoneBgRect = zoneBg.getBoundingClientRect();
  const zoneBgBottom = zoneBgRect.bottom;

  // top 元素的高度（包括 padding 和 safe-area-inset-top）
  const topHeight = topElement.offsetHeight;

  // 当 zone-bg 的底部滚到 top 元素下方时，改变背景色
  isTopGreen.value = zoneBgBottom < topHeight;
}

// 调整滚动位置以适应内容高度变化（如 UserInfo 展开/折叠）
function clampScrollPosition() {
  const container = zoneContainerRef.value;
  if (!container) return;
  const maxScrollTop = container.scrollHeight - container.clientHeight;
  if (container.scrollTop > maxScrollTop) {
    container.scrollTop = Math.max(0, maxScrollTop);
  }
  saveCurrentScrollPosition();
}

// 处理窗口大小改变
function handleResize() {
  updateTopBarColor();
  clampScrollPosition();
  restoreScrollPosition(tab.value);
}

// Swiper 实例
const swiperInstance = ref<SwiperType | null>(null);

// 监听 tab 变化，控制 Swiper 切换并恢复滚动位置
watch(tab, (newVal, oldVal) => {
  if (swiperInstance.value) {
    let targetIndex: number;
    switch (newVal) {
      case 'video':
        targetIndex = 0;
        break;
      case 'image':
        targetIndex = 1;
        break;
      case 'publish':
        targetIndex = 2;
        break;
      default:
        targetIndex = 0;
    }
    if (swiperInstance.value.activeIndex !== targetIndex) {
      swiperInstance.value.slideTo(targetIndex);
    }
  }

  // 切换标签页后恢复对应的滚动位置
  nextTick(() => {
    restoreScrollPosition(newVal);
    updateTopBarColor();
  });
});

// Swiper 实例初始化
const onSwiper = (swiper: SwiperType) => {
  swiperInstance.value = swiper;
};

// 监听 Swiper 滑动，反控 tab 变化并保存/恢复滚动位置
const onSlideChange = (swiper: SwiperType) => {
  let newTab: 'video' | 'image' | 'publish';
  switch (swiper.activeIndex) {
    case 0:
      newTab = 'video';
      break;
    case 1:
      newTab = 'image';
      break;
    case 2:
      newTab = 'publish';
      break;
    default:
      newTab = 'video';
  }

  if (newTab !== tab.value) {
    // 保存当前滚动位置
    saveCurrentScrollPosition();
    tab.value = newTab;
  }
};

onMounted(() => {
  const container = zoneContainerRef.value;
  if (container) {
    container.addEventListener('scroll', handleGlobalScroll, { passive: true });
  }

  window.addEventListener('resize', handleResize);

  if (zoneInfoRef.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      // 内容高度变化时，重新调整滚动位置并刷新顶栏颜色
      clampScrollPosition();
      updateTopBarColor();
    });
    resizeObserver.observe(zoneInfoRef.value);
  }

  nextTick(() => {
    updateTopBarColor();
    restoreScrollPosition(tab.value);
  });
});

onUnmounted(() => {
  const container = zoneContainerRef.value;
  if (container) {
    container.removeEventListener('scroll', handleGlobalScroll);
  }
  window.removeEventListener('resize', handleResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>
<template>
  <div id="zoneView" ref="zoneContainerRef" @scroll="handleGlobalScroll">
    <div class="top" :class="{ 'top-green': isTopGreen }" @click="scrollToTop">
      <span class="btn" @click.stop="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </span>
      <span class="btn" @click.stop="goHome">
        <font-awesome-icon icon="fa-regular fa-house" />
      </span>
    </div>

    <div class="zone-info" ref="zoneInfoRef">
      <div class="zone-bg"></div>
      <UserInfo :nickname="nickname" :userSignature="userSignature" :followNum="followNum" :fansNum="fansNum"
        @navigate-to="routerGoTo" />
    </div>

    <!-- 独立吸顶的 tabs 区域，修复滚动后 tabs 被移出页面的问题 -->
    <div class="tabs-sticky">
      <div class="tabs">
        <v-tabs v-model="tab" color="#00796B">
          <v-tab value="video">视频</v-tab>
          <v-tab value="image">插画</v-tab>
          <v-tab value="publish">发布</v-tab>
        </v-tabs>
        <v-divider></v-divider>
      </div>
    </div>

    <swiper class="tabs-window" :slides-per-view="1" :space-between="0" @swiper="onSwiper"
      @slide-change="onSlideChange">
      <swiper-slide>
        <div class="list-content">
          <v-infinite-scroll color="#00796B">
            <div v-for="i in 1000" :key="i">这是视频{{ i }}</div>
          </v-infinite-scroll>
        </div>
      </swiper-slide>
      <swiper-slide>
        <div class="list-content">
          <v-infinite-scroll color="#00796B">
            <div v-for="i in 1000" :key="i">这是插画{{ i }}</div>
          </v-infinite-scroll>
        </div>
      </swiper-slide>
      <swiper-slide>
        <div class="list-content">
          <v-infinite-scroll color="#00796B">
            <div v-for="i in 1000" :key="i">这是发布{{ i }}</div>
          </v-infinite-scroll>
        </div>
      </swiper-slide>
    </swiper>
  </div>
</template>
<style lang="scss" scoped>
#zoneView {
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #fff;
  height: 100vh;
  scroll-behavior: smooth;
  position: relative;
}

.top {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 400;
  height: calc(48px + env(safe-area-inset-top, 0));
  padding-top: env(safe-area-inset-top, 0);
  color: #fff;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.5));
  width: 100%;
  transition: background-color 0.3s ease-in-out;
  cursor: pointer;

  .btn {
    display: inline-flex;
    margin: 4px;
    width: 40px;
    height: 40px;
    justify-content: center;
    align-items: center;
    font-size: 1.2rem;
    cursor: pointer;
    user-select: none;
  }
}

.top-green {
  background-color: rgba(0, 121, 107, 0.9);
  backdrop-filter: blur(10px);
}

.zone-info {
  position: relative;
  width: 100%;
  background-color: #fff;

  .zone-bg {
    width: 100%;
    height: 160px;
    background-image: url('https://picsum.photos/200/300');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-color: #BDBDBD;
  }
}

/* 独立吸顶的 tabs 区域 - 修复 tabs 滚动后被移出页面的问题 */
.tabs-sticky {
  position: sticky;
  top: calc(48px + env(safe-area-inset-top, 0));
  z-index: 200;
  background-color: #fff;

  .tabs {
    background-color: #fff;
    width: 100%;
  }
}

.tabs-window {
  width: 100%;
  background-color: #fff;

  :deep(.swiper-wrapper) {
    height: auto;
  }

  :deep(.swiper-slide) {
    height: auto;
    overflow: visible;
  }

  .list-content {
    padding-bottom: 20px;
  }
}
</style>