<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { getImageIwara } from '../../core/api';
import placeholderImg from '../../static/img/placeholder.png'
import notImg from '../../static/img/not-img.jpg'
import { enterImmersive, exitImmersive } from '../../plugins/immersive';
import { lockLandscape, lockPortrait } from '../../plugins/useOrientation';

// 导入 Swiper 样式
import 'swiper/swiper-bundle.css';

interface ImageFile {
  id: string;
  name: string;
  width: number;
  height: number;
}

const props = defineProps<{
  images: ImageFile[];
}>();

const emit = defineEmits(['close']);

// 处理后的图片URL数组
const processedImages = ref<string[]>([]);
// 加载状态
const loading = ref(false);
// 当前页码
const currentIndex = ref(1);
// Swiper 模块
const modules = [Navigation];
// Swiper 实例
let swiperInstance: SwiperType | null = null;
// 按钮显示状态
const showButtons = ref(false);
// 按钮元素引用
let prevButton: HTMLElement | null = null;
let nextButton: HTMLElement | null = null;
// 全屏状态
const isFullscreen = ref(false);

// 判断是否为服务器URL（需要特殊处理）
const isServerUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

// 处理单个图片文件对象
const processImageFile = async (file: ImageFile): Promise<string> => {
  try {
    const url = `https://i.iwara.tv/image/large/${file.id}/${file.name}`;
    return await getImageIwara(url);
  } catch (error) {
    console.error('Failed to load image:', file, error);
    return notImg;
  }
};

// 处理所有图片
const loadImages = async () => {
  if (!props.images || props.images.length === 0) {
    processedImages.value = [];
    return;
  }

  loading.value = true;
  try {
    const results = await Promise.all(props.images.map(processImageFile));
    processedImages.value = results;
  } catch (error) {
    console.error('Failed to load images:', error);
    processedImages.value = [];
  } finally {
    loading.value = false;
  }
};

// 监听images变化，重新加载
watch(() => props.images, () => {
  loadImages();
}, { immediate: true });

// Swiper 初始化回调
const onSwiper = (swiper: SwiperType) => {
  swiperInstance = swiper;
  currentIndex.value = 1;

  // 获取按钮元素并添加事件监听
  setTimeout(() => {
    prevButton = document.querySelector('.swiper-button-prev');
    nextButton = document.querySelector('.swiper-button-next');

    if (prevButton && nextButton) {
      // 为两个按钮添加鼠标事件监听
      const handleMouseEnter = () => {
        showButtons.value = true;
      };

      const handleMouseLeave = () => {
        showButtons.value = false;
      };

      prevButton.addEventListener('mouseenter', handleMouseEnter);
      prevButton.addEventListener('mouseleave', handleMouseLeave);
      nextButton.addEventListener('mouseenter', handleMouseEnter);
      nextButton.addEventListener('mouseleave', handleMouseLeave);
    }
  }, 100);
};

// Swiper 滑动回调
const onSlideChange = (swiper: SwiperType) => {
  currentIndex.value = swiper.activeIndex + 1;
};

// 判断是否显示左按钮（不在第一张时显示）
const showPrevButton = computed(() => {
  return currentIndex.value > 1;
});

// 判断是否显示右按钮（不在最后一张时显示）
const showNextButton = computed(() => {
  return currentIndex.value < processedImages.value.length;
});

// 组件卸载时清理
onUnmounted(() => {
  if (prevButton && nextButton) {
    // 清理事件监听器（如果需要的话）
  }
});

// 组件挂载时加载图片
onMounted(() => {
  // 初始加载已在watch中处理
});

// 更改当前页码
const changeSwiper = (num: number) => {
  // 边界检查
  if (!swiperInstance || num < 0 || num >= processedImages.value.length) {
    console.warn('Invalid slide index or swiper not ready:', num);
    return;
  }

  // 先执行滑动操作，再更新索引（确保同步）
  swiperInstance.slideTo(num, 0); // 0ms 过渡时间，立即切换

  // 在下一帧更新索引，确保与 Swiper 内部状态同步
  requestAnimationFrame(() => {
    currentIndex.value = num + 1;
  });
};

// 进入全屏
const enterFullscreen = async () => {
  try {
    // 进入沉浸式模式
    enterImmersive();
    // 锁定屏幕为横向
    lockLandscape();
    // 推入历史记录，用于捕获返回键
    history.pushState({ fullscreen: true }, '');
    isFullscreen.value = true;
  } catch (err) {
    console.error('进入全屏失败:', err);
  }
};

// 退出全屏
const exitFullscreen = async () => {
  try {
    // 如果处于全屏状态，则退出
    if (isFullscreen.value) {
      // 退出沉浸式模式
      exitImmersive();
      // 锁定屏幕为竖向
      lockPortrait();
      isFullscreen.value = false;
    }
  } catch (err) {
    console.error('退出全屏失败:', err);
  }
};

// 监听手机返回键 (popstate)
const handlePopState = () => {
  // 如果用户按了返回键，且当前处于全屏，则退出全屏
  if (isFullscreen.value) {
    exitFullscreen();
    emit('close');
  }
};

// 关闭全屏
const handleClose = async () => {
  await exitFullscreen();
  emit('close');
};

defineExpose({
  changeSwiper,
  enterFullscreen
});

// 组件挂载时加载图片
onMounted(() => {
  // 初始加载已在watch中处理
  // 监听 popstate 事件
  window.addEventListener('popstate', handlePopState);
});

onUnmounted(() => {
  if (prevButton && nextButton) {
    // 清理事件监听器（如果需要的话）
  }
  // 移除 popstate 监听
  window.removeEventListener('popstate', handlePopState);
  // 确保退出全屏状态
  if (isFullscreen.value) {
    exitFullscreen();
  }
});
</script>

<template>
  <div class="full-screen">
    <!-- 顶部导航栏 -->
    <div class="top">
      <span class="btn" @click="handleClose">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </span>
    </div>

    <!-- 底部页码指示器 -->
    <div class="bottom-indicator" v-if="processedImages.length > 1">
      <span class="page-number">{{ currentIndex }} / {{ processedImages.length }}</span>
    </div>

    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="white" size="50"></v-progress-circular>
    </div>

    <!-- Swiper 轮播 -->
    <Swiper v-else-if="processedImages.length > 0" :modules="modules" :navigation="true" :slides-per-view="1"
      :space-between="0" class="swiper-container" @swiper="onSwiper" @slide-change="onSlideChange">
      <SwiperSlide v-for="(img, index) in processedImages" :key="index">
        <div class="slide-content">
          <v-img :src="img" contain max-height="100vh" max-width="100vw" class="fullscreen-image">
            <template v-slot:placeholder>
              <v-img cover :src="placeholderImg" class="placeholder"></v-img>
            </template>
          </v-img>
        </div>
      </SwiperSlide>
    </Swiper>

    <!-- 无图片提示 -->
    <div v-else class="no-image">
      <v-icon size="64" color="white">mdi-image-off</v-icon>
      <p>暂无图片</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.full-screen {
  background-color: #000;
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  user-select: none;
}

.top {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 400;
  height: calc(48px + env(safe-area-inset-top, 0));
  padding-top: env(safe-area-inset-top, 0);
  color: #fff;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.5));
  width: 100%;

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

.bottom-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 400;
  height: calc(48px + env(safe-area-inset-bottom, 0));
  padding-bottom: env(safe-area-inset-bottom, 0);
  color: #fff;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.5));
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  .page-number {
    font-size: 1rem;
    font-weight: 500;
    user-select: none;
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.swiper-container {
  width: 100%;
  height: 100%;

  :deep(.swiper-slide) {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  :deep(.swiper-button-prev) {
    color: white;
    filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.8));
    opacity: v-bind('(showButtons && showPrevButton) ? 1 : 0');
    transition: opacity 0.3s ease;
    pointer-events: auto;

    &::after {
      font-size: 24px;
      font-weight: bold;
    }
  }

  :deep(.swiper-button-next) {
    color: white;
    filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.8));
    opacity: v-bind('(showButtons && showNextButton) ? 1 : 0');
    transition: opacity 0.3s ease;
    pointer-events: auto;

    &::after {
      font-size: 24px;
      font-weight: bold;
    }
  }
}

.slide-content {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  .fullscreen-image {
    max-width: 100vw;
    max-height: 100vh;
    object-fit: contain;
  }

  .placeholder {
    opacity: 0.3;
  }
}

.no-image {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  gap: 16px;

  p {
    font-size: 1.2rem;
    margin: 0;
  }
}
</style>