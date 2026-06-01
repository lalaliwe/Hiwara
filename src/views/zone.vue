<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/swiper-bundle.css';
import UserInfo from '../component/zone/info.vue'
import VideoList from '../component/zone/video.vue'
import ImageList from '../component/zone/image.vue'
import PublishList from '../component/zone/publish.vue'
import {
  getMyselfInfo,
  getUserInfo,
  getUserFollowers,
  getUserFans,
  getImageIwara
} from '../core/api'
import { showShortToast } from '../core/toast';
import { uid as muid, uname as muname } from '../core/store';
import iwaraSVG from '../assets/svg/iwara.svg'
import kivotosPng from '../static/img/kivotos.png'
import loadingHuawu from '../component/loadingHuawu.vue';
import errorHuawu from '../component/errorHuawu.vue';

const { t } = useI18n();

defineOptions({
  name: 'Zone'
})

const route = useRoute()
const router = useRouter()

const isMyself = ref<boolean>(false)
const username = ref<string>('')
const uid = ref<string>('')
const nickname = ref<string>('')
const userSignature = ref<string>('')
const avatar = ref<string>('')
const header = ref<string>('')
const followNum = ref<number>(0)
const fansNum = ref<number>(0)
const isMyFollow = ref<boolean>(false)
const isMyFans = ref<boolean>(false)

// zone-bg 背景样式
const zoneBgStyle = ref<string>('');

// 页面加载状态
const state = ref<'loading' | 'success' | 'error'>('loading')

// header 背景图是否已加载完成（用于占位图显示控制）
const headerLoaded = ref(false);

// 使用内存变量保存tab状态，初始值为 'video'
const tab = ref<'video' | 'image' | 'publish'>('video')

// 顶部导航栏颜色状态
const isTopGreen = ref(false);
const zoneContainerRef = ref<HTMLElement | null>(null);

// 各标签页保存的滚动位置 - 改为内存变量
let videoScrollTop = 0;
let imageScrollTop = 0;
let publishScrollTop = 0;

// zone-info 元素引用
const zoneInfoRef = ref<HTMLElement | null>(null);

// ResizeObserver 实例
let resizeObserver: ResizeObserver | null = null;

// 滚动节流标志
let ticking = false;

// 标志：是否由手动点击tab触发切换（用于避免重复恢复滚动位置）
let isManualTabChange = false;

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

// 保存当前滚动位置
function saveCurrentScrollPosition() {
  const container = zoneContainerRef.value;
  // 容器不可见时（如 keep-alive 缓存期间）跳过，避免保存错误的滚动位置
  if (!container || container.clientHeight === 0) return;
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
  // 容器不可见时（如 keep-alive 缓存期间）跳过，避免错误重置滚动位置
  if (container.clientHeight === 0) return;
  const maxScrollTop = container.scrollHeight - container.clientHeight;
  if (container.scrollTop > maxScrollTop) {
    container.scrollTop = Math.max(0, maxScrollTop);
  }
  saveCurrentScrollPosition();
}

// --- Swiper 联动逻辑 ---
const swiperInstance = ref<SwiperType | null>(null);

const onSwiper = (swiper: SwiperType) => {
  swiperInstance.value = swiper;
};

// 监听 tab 变化，控制 Swiper 切换
watch(tab, (newVal) => {
  if (swiperInstance.value) {
    const targetIndex = newVal === 'video' ? 0 : newVal === 'image' ? 1 : 2;
    if (swiperInstance.value.activeIndex !== targetIndex) {
      saveCurrentScrollPosition();
      swiperInstance.value.slideTo(targetIndex);
      isManualTabChange = false;
    }
  }
});

// 监听 Swiper 滑动，反控 tab 变化
const onSlideChange = (swiper: SwiperType) => {
  const activeIndex = swiper.activeIndex;
  const newTab = activeIndex === 0 ? 'video' : activeIndex === 1 ? 'image' : 'publish';
  if (tab.value !== newTab) {
    isManualTabChange = true;
    saveCurrentScrollPosition();
    tab.value = newTab;
  }
};

// Swiper 过渡动画完成后恢复滚动位置
const onSlideChangeTransitionEnd = (swiper: SwiperType) => {
  const activeIndex = swiper.activeIndex;
  const targetTab = activeIndex === 0 ? 'video' : activeIndex === 1 ? 'image' : 'publish';
  restoreScrollPosition(targetTab);
  isManualTabChange = false;
};
// --- End Swiper 联动逻辑 ---

// 组件激活时恢复tab状态
onActivated(() => {
  nextTick(() => {
    restoreScrollPosition(tab.value);
    updateTopBarColor();
  });
})

// 处理窗口大小改变
function handleResize() {
  const container = zoneContainerRef.value;
  // 容器不可见时（如 keep-alive 缓存期间）跳过，避免错误重置滚动位置
  if (!container || container.clientHeight === 0) return;
  updateTopBarColor();
  clampScrollPosition();
  restoreScrollPosition(tab.value);
}

onMounted(() => {
  const container = zoneContainerRef.value;
  if (container) {
    container.addEventListener('scroll', handleGlobalScroll, { passive: true });
  }

  window.addEventListener('resize', handleResize);

  if (zoneInfoRef.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      // 内容高度变化时，重新调整滚动位置并刷新顶栏颜色
      updateTopBarColor();
    });
    resizeObserver.observe(zoneInfoRef.value);
  }

  // 异步初始化 username 并获取数据
  initZone()

  nextTick(() => {
    // 初始不设置顶栏颜色，等待滚动事件触发
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

// 异步初始化 username：route params → store → API，然后获取数据
async function initZone() {
  // 1. 优先从路由参数获取
  const routeUsername = route.params.username as string
  if (routeUsername) {
    username.value = routeUsername
    await getData()
    return
  }

  // 2. 从 Pinia store 获取
  const storeUsername = muname().value
  if (storeUsername) {
    username.value = storeUsername
    await getData()
    return
  }

  // 3. 从 API 获取当前用户信息
  try {
    const res = await getMyselfInfo()
    if (res.ok && res.data?.user?.username) {
      username.value = res.data.user.username
      // 同步更新 store
      muname().set(res.data.user.username)
    }
  } catch (error) {
    console.error('无法获取用户名:', error)
  }

  await getData()
}

async function getData() {
  try {
    if (username.value === '')
      throw new Error('username获取失败');
    console.log(username.value);
    const res = await getUserInfo(username.value as string)
    if (!res.ok)
      throw new Error(res.message);
    console.log(res);
    if (res.data.user.id === muid().value)
      isMyself.value = true;
    nickname.value = res.data.user.name;
    uid.value = res.data.user.id;
    userSignature.value = res.data.body ? res.data.body : '这个人很懒，什么都没留下~';
    avatar.value = res.data.user.avatar ? `https://i.iwara.tv/image/avatar/${res.data.user.avatar.id}/${res.data.user.avatar.name}` : '';
    header.value = res.data.header ? `https://i.iwara.tv/image/profileHeader/${res.data.header.id}/${res.data.header.name}` : ''
    // 获取关注状态
    isMyFollow.value = res.data.user.following || false;

    // 无需设置默认背景图，CSS 中 background-color 作为占位色
    zoneBgStyle.value = '';

    // 后台异步加载 header 背景图，不阻塞主流程
    if (res.data.header) {
      loadHeaderBackground(res.data.header);
    } else {
      // 没有 header 时，使用 kivotos 作为默认头图
      zoneBgStyle.value = `background-image: url('${kivotosPng}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;
      headerLoaded.value = true;
    }

    await Promise.allSettled([
      getFollowersNum(uid.value),
      getFansNum(uid.value)
    ]).finally(() => {
      state.value = 'success';
    });
  } catch (error) {
    console.error(error);
    showShortToast(t('common.fetchUserInfoFailed'));
    state.value = 'error';
  }

  // 后台异步加载 header 背景图
  async function loadHeaderBackground(header: any) {
    try {
      const headerUrl = `https://i.iwara.tv/image/profileHeader/${header.id}/${header.name}`;
      const bgImageUrl = await getImageIwara(headerUrl);
      zoneBgStyle.value = `background-image: url('${bgImageUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;
      headerLoaded.value = true;
    } catch (error) {
      console.error('获取header背景失败:', error);
      // 加载失败时使用 kivotos 作为默认头图
      zoneBgStyle.value = `background-image: url('${kivotosPng}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;
      headerLoaded.value = true;
    }
  }
  async function getFollowersNum(uid: string) {
    try {
      const res = await getUserFollowers(uid);
      if (!res.ok)
        throw new Error(res.message);
      followNum.value = res.data.count;
    } catch (err) {
      console.error(err);
    }
  }
  async function getFansNum(uid: string) {
    try {
      const res = await getUserFans(uid);
      if (!res.ok)
        throw new Error(res.message);
      fansNum.value = res.data.count;
    } catch (err) {
      console.error(err);
    }
  }
}
</script>

<template>
  <div id="zoneView">
    <div class="top" :class="{ 'top-green': isTopGreen }" @click="scrollToTop">
      <span class="btn" @click.stop="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </span>
      <span class="btn" @click.stop="goHome">
        <font-awesome-icon icon="fa-regular fa-house" />
      </span>
    </div>

    <div v-if="state === 'loading'" class="state-container">
      <loadingHuawu>{{ t('imageView.loading') }}</loadingHuawu>
    </div>
    <div v-else-if="state === 'error'" class="state-container">
      <errorHuawu>{{ t('imageView.failed') }}</errorHuawu>
    </div>
    <div v-else-if="state === 'success'" class="zone-container" ref="zoneContainerRef" @scroll="handleGlobalScroll">

      <div class="zone-info" ref="zoneInfoRef">
        <div class="zone-bg" :style="zoneBgStyle">
          <div v-if="!headerLoaded" class="zone-bg-placeholder">
            <img :src="iwaraSVG" class="zone-bg-placeholder-icon" />
          </div>
        </div>
        <UserInfo :username="username" :nickname="nickname" :userSignature="userSignature" :avatar="avatar"
          :followNum="followNum" :fansNum="fansNum" :isMyFollow="isMyFollow" :isMyFans="isMyFans" :isMyself="isMyself"
          :uid="uid" @follow="(val) => isMyFollow = val" />
      </div>

      <!-- 独立吸顶的 tabs 区域，修复滚动后 tabs 被移出页面的问题 -->
      <div class="tabs-sticky">
        <div class="tabs">
          <v-tabs v-model="tab" color="#00796B">
            <v-tab value="video">{{ t('zone.videoTab') }}</v-tab>
            <v-tab value="image">{{ t('zone.imageTab') }}</v-tab>
            <v-tab value="publish" v-if="false">{{ t('zone.publishTab') }}</v-tab>
          </v-tabs>
          <v-divider></v-divider>
        </div>
      </div>

      <swiper class="tabs-window" :slides-per-view="1" :space-between="0" :auto-height="true" @swiper="onSwiper"
        @slide-change="onSlideChange" @slide-change-transition-end="onSlideChangeTransitionEnd">
        <swiper-slide>
          <VideoList :uid="uid" />
        </swiper-slide>
        <swiper-slide>
          <ImageList :uid="uid" />
        </swiper-slide>
        <swiper-slide>
          <PublishList />
        </swiper-slide>
      </swiper>
    </div>
    <loadingHuawu v-else-if="state === 'loading'" />
    <errorHuawu v-else />
  </div>
</template>

<style lang="scss" scoped>
#zoneView {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-page);
}

.state-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: calc(48px + env(safe-area-inset-top, 0));
}

.zone-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: var(--color-bg-page);
  position: relative;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.top {
  position: fixed;
  top: 0;
  z-index: 400;
  height: calc(48px + env(safe-area-inset-top, 0));
  padding-top: env(safe-area-inset-top, 0);
  color: #fff;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.5));
  width: 100%;
  transition: background-color 0.3s ease-in-out;

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
  background-color: var(--color-primary-90);
  backdrop-filter: blur(10px);
}

.zone-info {
  position: relative;
  width: 100%;
  background-color: var(--color-bg-card);
  padding-bottom: 8px;

  .zone-bg {
    width: 100%;
    height: 160px;
    background-color: var(--color-bg-placeholder);
    position: relative;
    overflow: hidden;
  }

  .zone-bg-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .zone-bg-placeholder-icon {
    width: 90px;
  }
}

/* 独立吸顶的 tabs 区域 - 修复 tabs 滚动后被移出页面的问题 */
.tabs-sticky {
  position: sticky;
  top: calc(48px + env(safe-area-inset-top, 0));
  z-index: 200;
  background-color: var(--color-bg-card);

  .tabs {
    background-color: var(--color-bg-card);
    width: 100%;
  }

  /* Vuetify tab 文字颜色适配暗色模式 */
  :deep(.v-tab) {
    color: var(--color-text-muted);

    &.v-tab--selected {
      color: var(--color-primary);
    }
  }

  /* Vuetify divider 颜色适配暗色模式 */
  :deep(.v-divider) {
    border-color: var(--color-border-divider) !important;
  }
}

.tabs-window {
  width: 100%;

  :deep(.swiper-wrapper) {
    height: auto;
  }

  :deep(.swiper-slide) {
    height: auto;
    overflow: visible;
  }
}
</style>
