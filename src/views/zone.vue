<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/swiper-bundle.css';
import UserInfo from '../component/zone/info.vue'
import VideoList from '../component/zone/video.vue'
import ImageList from '../component/zone/image.vue'
import PublishList from '../component/zone/publish.vue'
import {
  getUserInfo,
  getUserFollowers,
  getUserFans,
  getImageIwara
} from '../core/api'
import { showShortToast } from '../core/toast';
import { uid as muid } from '../core/store';
import kivotos from '../static/img/kivotos.png'
import loadingHuawu from '../component/loadingHuawu.vue';
import errorHuawu from '../component/errorHuawu.vue';

defineOptions({
  name: 'Zone'
})

const route = useRoute()
const router = useRouter()

const isMyself = ref<boolean>(false)
const username = ref<string>(route.params.username as string)
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

// 监听 tab 变化，控制 Swiper 切换（滚动恢复由过渡完成事件处理）
watch(tab, (newVal) => {
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
      isManualTabChange = true;
      swiperInstance.value.slideTo(targetIndex);
    }
  }
});

// Swiper 实例初始化
const onSwiper = (swiper: SwiperType) => {
  swiperInstance.value = swiper;
};

// 监听 Swiper 滑动中，反控 tab 变化并保存滚动位置
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

// 监听 Swiper 切换过渡结束（高度已稳定），恢复滚动位置
const onSlideChangeTransitionEnd = (swiper: SwiperType) => {
  // 确保 tab 状态一致
  let newTab: 'video' | 'image' | 'publish';
  switch (swiper.activeIndex) {
    case 0: newTab = 'video'; break;
    case 1: newTab = 'image'; break;
    case 2: newTab = 'publish'; break;
    default: newTab = 'video';
  }
  if (newTab !== tab.value) {
    tab.value = newTab;
  }

  // 等待一帧确保高度彻底稳定
  requestAnimationFrame(() => {
    restoreScrollPosition(tab.value);
    updateTopBarColor();
    isManualTabChange = false;
  });
};

// 组件激活时恢复tab状态
onActivated(() => {
  // 在下一个tick恢复滚动位置
  nextTick(() => {
    restoreScrollPosition(tab.value);
    updateTopBarColor();
  });
});

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

// 获取数据
getData()
async function getData() {
  try {
    const res = await getUserInfo(username.value as string)
    if (!res.ok)
      throw new Error(res.message);
    console.log(res);
    console.log(muid().value);
    if (res.data.user.id === muid().value)
      isMyself.value = true;
    nickname.value = res.data.user.name;
    uid.value = res.data.user.id;
    userSignature.value = res.data.body ? res.data.body : '这个人很懒，什么都没留下~';
    avatar.value = res.data.user.avatar ? `https://i.iwara.tv/image/avatar/${res.data.user.avatar.id}/${res.data.user.avatar.name}` : '';
    header.value = res.data.header ? `https://i.iwara.tv/image/profileHeader/${res.data.header.id}/${res.data.header.name}` : ''
    // 获取关注状态
    isMyFollow.value = res.data.user.following || false;

    // 设置 zone-bg 背景
    const defaultBgStyle = `background-image: url('${kivotos}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;

    if (res.data.header) {
      try {
        const headerUrl = `https://i.iwara.tv/image/profileHeader/${res.data.header.id}/${res.data.header.name}`;
        const bgImageUrl = await getImageIwara(headerUrl);
        zoneBgStyle.value = `background-image: url('${bgImageUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;
      } catch (error) {
        console.error('获取header背景失败:', error);
        // 失败时使用默认背景
        zoneBgStyle.value = defaultBgStyle;
      }
    } else {
      // 没有 header 时使用默认背景
      zoneBgStyle.value = defaultBgStyle;
    }
    await Promise.allSettled([
      getFollowersNum(uid.value),
      getFansNum(uid.value)
    ]).finally(() => {
      state.value = 'success';
    });
  } catch (error) {
    console.error(error);
    showShortToast('获取用户信息失败');
    state.value = 'error';
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
      <loadingHuawu>正在加载数据</loadingHuawu>
    </div>
    <div v-else-if="state === 'error'" class="state-container">
      <errorHuawu>数据加载失败了喵~</errorHuawu>
    </div>
    <div v-else-if="state === 'success'" class="zone-container" ref="zoneContainerRef" @scroll="handleGlobalScroll">

      <div class="zone-info" ref="zoneInfoRef">
        <div class="zone-bg" :style="zoneBgStyle"></div>
        <UserInfo :username="username" :nickname="nickname" :userSignature="userSignature" :avatar="avatar"
          :followNum="followNum" :fansNum="fansNum" :isMyFollow="isMyFollow" :isMyFans="isMyFans" :isMyself="isMyself"
          :uid="uid" @navigate-to="routerGoTo" @follow="(val) => isMyFollow = val" />
      </div>

      <!-- 独立吸顶的 tabs 区域，修复滚动后 tabs 被移出页面的问题 -->
      <div class="tabs-sticky">
        <div class="tabs">
          <v-tabs v-model="tab" color="#00796B">
            <v-tab value="video">视频</v-tab>
            <v-tab value="image">插画</v-tab>
            <v-tab value="publish" v-if="false">发布</v-tab>
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
  background-color: #fafafa;
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
  background-color: #fafafa;
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
  background-color: rgba(0, 121, 107, 0.9);
  backdrop-filter: blur(10px);
}

.zone-info {
  position: relative;
  width: 100%;
  background-color: #fff;
  padding-bottom: 8px;

  .zone-bg {
    width: 100%;
    height: 160px;
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

  :deep(.swiper-wrapper) {
    height: auto;
  }

  :deep(.swiper-slide) {
    height: auto;
    overflow: visible;
  }
}
</style>