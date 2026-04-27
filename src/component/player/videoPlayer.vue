<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject } from 'vue'
import { lockPortrait, lockLandscape } from '../../plugins/useOrientation'
import { enterImmersive, exitImmersive } from '../../plugins/immersive'
import controlFullscreen from './videoPlayer/controlFullscreen.vue';
import control from './videoPlayer/control.vue';

const fullscreenState = ref(false); // 内部维护的全屏状态
const videoPlayerRef = ref<HTMLElement | null>(null); // 播放器元素
const videoRef = ref<HTMLVideoElement | null>(null);  // 视频元素
const isPlaying = ref(false); // 播放状态
const progress = ref<number>(0);  // 进度
const buffered = ref<number>(0);  // 已缓冲
const currentTime = ref<string>('00:00'); // 当前时间
const totalTime = ref<string>('00:00'); // 总时长
const isLoading = ref(false); // 缓冲加载状态

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 更新视频时间
const updateTime = () => {
  if (!videoRef.value) return;
  const current = videoRef.value.currentTime;
  const duration = videoRef.value.duration;

  progress.value = duration ? (current / duration) * 100 : 0;
  currentTime.value = formatTime(current);
  totalTime.value = formatTime(duration || 0);

  // 更新缓冲进度
  if (videoRef.value.buffered.length > 0) {
    const bufferedEnd = videoRef.value.buffered.end(videoRef.value.buffered.length - 1);
    buffered.value = duration ? (bufferedEnd / duration) * 100 : 0;
  }
};

// 切换播放/暂停
const togglePlay = () => {
  if (!videoRef.value) return;

  if (isPlaying.value) {
    videoRef.value.pause();
  } else {
    videoRef.value.play();
  }
  isPlaying.value = !isPlaying.value;
};

// 进度条变化
const onProgressChange = (value: number) => {
  if (!videoRef.value || !videoRef.value.duration) return;
  const newTime = (value / 100) * videoRef.value.duration;
  videoRef.value.currentTime = newTime;
};

// 进入全屏
const enterFullscreen = async () => {
  if (!videoPlayerRef.value) return;
  try {
    // 进入沉浸式
    enterImmersive();
    // 锁定屏幕为横向
    lockLandscape();
    // 请求全屏
    await videoPlayerRef.value.requestFullscreen();
    // 针对手机端，进入全屏时推入一个历史记录，用于捕获返回键
    history.pushState({ fullscreen: true }, '');
  } catch (err) {
    console.error('进入全屏失败:', err);
  }
};

// 退出全屏（由子组件调用或内部逻辑触发）
const exitFullscreen = async () => {
  try {
    // 如果当前处于全屏状态，则退出
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      exitImmersive();
      lockPortrait();
    }
  } catch (err) {
    console.error('退出全屏失败:', err);
  }
};

// 处理子组件触发的退出全屏逻辑
const handleExitFullscreen = async () => {
  await exitFullscreen();
  fullscreenState.value = false;
};

// 监听全屏状态变化 (处理 ESC 键、手势退出等情况)
const handleFullscreenChange = () => {
  const isNowFullscreen = !!document.fullscreenElement;
  // 状态同步
  fullscreenState.value = isNowFullscreen;
  // 逻辑处理：
  // 如果退出了全屏，且历史栈里有我们推入的状态，则将其弹出
  // 这样可以防止用户按 ESC 退出后，还需要点两次返回键才能退出页面
  if (!isNowFullscreen && history.state?.fullscreen) {
    history.back();
  }
};

// 监听手机返回键 (popstate)
const handlePopState = () => {
  // 如果用户按了返回键，且当前处于全屏，则退出全屏
  if (fullscreenState.value) {
    exitFullscreen();
  }
};

const goBack = inject<() => void>('goBack');
const goHome = inject<() => void>('goHome');

onMounted(async () => {
  // 挂载/卸载监听
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  window.addEventListener('popstate', handlePopState);
  
  // 绑定视频事件
  if (videoRef.value) {
    videoRef.value.addEventListener('play', () => {
      isPlaying.value = true;
      isLoading.value = false; // 开始播放时隐藏加载指示器
    });
    videoRef.value.addEventListener('pause', () => {
      isPlaying.value = false;
    });
    videoRef.value.addEventListener('timeupdate', updateTime);
    videoRef.value.addEventListener('loadedmetadata', updateTime);
    // 监听缓冲事件
    videoRef.value.addEventListener('waiting', () => {
      isLoading.value = true; // 数据不足，显示加载指示器
    });
    videoRef.value.addEventListener('playing', () => {
      isLoading.value = false; // 从缓冲恢复，隐藏加载指示器
    });
    videoRef.value.addEventListener('canplaythrough', () => {
      isLoading.value = false; // 已缓冲足够，隐藏加载指示器
    });
    // 初始化总时长
    if (videoRef.value.duration) {
      totalTime.value = formatTime(videoRef.value.duration);
    }
  }
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  window.removeEventListener('popstate', handlePopState);
  // 清理事件监听
  if (videoRef.value) {
    videoRef.value.removeEventListener('play', () => { });
    videoRef.value.removeEventListener('pause', () => { });
    videoRef.value.removeEventListener('timeupdate', updateTime);
    videoRef.value.removeEventListener('loadedmetadata', updateTime);
    videoRef.value.removeEventListener('waiting', () => { });
    videoRef.value.removeEventListener('playing', () => { });
    videoRef.value.removeEventListener('canplaythrough', () => { });
  }
});
</script>

<template>
  <div class="video-player" ref="videoPlayerRef">
    <video ref="videoRef" src="https://ro.qisato.top:2096/public/VID_20220416_033049_395.mp4"
      @click="togglePlay"></video>
    <!-- 仅在缓冲时显示加载指示器 -->
    <div v-if="isLoading" class="msg-view">
      <v-progress-circular color="#00796B" bg-color="#ffffff66" :size="70" :width="7"
        indeterminate></v-progress-circular>
    </div>
    <!-- 使用 fullscreenState 控制显示 -->
    <controlFullscreen 
      v-if="fullscreenState"
      :is-playing="isPlaying"
      :progress="progress"
      :buffered="buffered"
      :current-time="currentTime"
      :total-time="totalTime"
      :video-element="videoRef"
      @exit="handleExitFullscreen"
      @toggle-play="togglePlay"
      @progress-change="onProgressChange"
    />
    <control
      v-else
      :is-playing="isPlaying"
      :progress="progress"
      :buffered="buffered"
      :current-time="currentTime"
      :total-time="totalTime"
      @toggle-play="togglePlay"
      @progress-change="onProgressChange"
      @enter-fullscreen="enterFullscreen"
      @go-back="goBack"
      @go-home="goHome"
    />
  </div>
</template>

<style lang="scss" scoped>
.video-player {
  background-color: #000;
  overflow: hidden;
  position: relative;
  width: 100%;

  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .msg-view {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none; // 确保点击事件可以穿透到视频
  }
}
</style>
