<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, watch } from 'vue'
import { lockPortrait, lockLandscape } from '../../plugins/useOrientation'
import { enterImmersive, exitImmersive } from '../../plugins/immersive'
import controlFullscreen from './videoPlayer/controlFullscreen.vue';
import control from './videoPlayer/control.vue';
import { getImageIwara } from '../../core/api';
import { setupStore } from '../../core/store';

// 获取 store 实例
const setup = setupStore();

// 定义 props
const props = defineProps<{
  poster?: string
}>()

const localPosterUrl = ref<string>(''); // 本地存储的poster URL

// 监听 poster prop 变化
watch(() => props.poster, async (newPoster) => {
  if (newPoster) {
    try {
      // 如果之前有URL，先释放
      if (localPosterUrl.value) {
        URL.revokeObjectURL(localPosterUrl.value);
      }
      // 使用 getImageIwara 获取图片
      const blobUrl = await getImageIwara(newPoster);
      localPosterUrl.value = blobUrl;
    } catch (error) {
      console.error('Failed to load poster:', error);
      localPosterUrl.value = '';
    }
  }
}, { immediate: true });

const fullscreenState = ref(false); // 内部维护的全屏状态
const videoPlayerRef = ref<HTMLElement | null>(null); // 播放器元素
const videoRef = ref<HTMLVideoElement | null>(null);  // 视频元素
const isPlaying = ref(false); // 播放状态
const progress = ref<number>(0);  // 进度
const buffered = ref<number>(0);  // 已缓冲
const currentTime = ref<string>('00:00'); // 当前时间
const totalTime = ref<string>('00:00'); // 总时长
const isLoading = ref(false); // 缓冲加载状态
const hasPlayed = ref(false); // 是否已经播放过（用于控制自动隐藏）

// 手势操作消息显示
const gestureMessage = ref<string>('')
let showMessageTimer: number | null = null  // 改为 let，允许重新赋值
const isSliding = ref(false) // 标记是否正在滑动

// 显示手势消息（滑动时使用）
const showGestureMessageTemporary = (message: string) => {
  gestureMessage.value = message
  isSliding.value = true
}

// 隐藏手势消息
const hideGestureMessage = () => {
  gestureMessage.value = ''
  isSliding.value = false
  if (showMessageTimer !== null) {
    clearTimeout(showMessageTimer)
    showMessageTimer = null
  }
}

// 显示手势消息（双击等需要延迟隐藏的操作）
const showGestureMessageDelayed = (message: string) => {
  gestureMessage.value = message
  isSliding.value = false
  // 清除之前的定时器
  if (showMessageTimer !== null) {
    clearTimeout(showMessageTimer)
  }
  // 1.5秒后隐藏消息
  showMessageTimer = window.setTimeout(() => {
    gestureMessage.value = ''
  }, 1500)
}

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

// 进度条变化（拖动过程中）
const onProgressChange = (value: number) => {
  if (!videoRef.value || !videoRef.value.duration) return
  const newTime = (value / 100) * videoRef.value.duration
  videoRef.value.currentTime = newTime
  // 显示当前时间消息（使用临时显示，等待 change 事件来隐藏）
  showGestureMessageTemporary(`${formatTime(newTime)}`)
}

// 进度条拖动结束（松开鼠标/手指）
const onProgressChangeEnd = () => {
  // 立即隐藏消息
  hideGestureMessage()
}

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
      hasPlayed.value = true; // 标记已经播放过
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
  // 清理 poster URL
  if (localPosterUrl.value) {
    URL.revokeObjectURL(localPosterUrl.value);
  }
});

// 处理子组件的手势事件
const handleGestureEvent = (event: { type: string; value?: number; isEnd?: boolean }) => {
  console.log('[videoPlayer.vue] 收到手势事件:', event)

  if (!videoRef.value) return

  switch (event.type) {
    case 'brightness':
      // 调整亮度（具体功能待实现）
      if (event.isEnd) {
        // 滑动结束，立即隐藏消息
        hideGestureMessage()
      } else {
        // 滑动中，更新消息
        showGestureMessageTemporary(`亮度: ${Math.round(event.value || 0)}%`)
      }
      break
    case 'volume':
      // 调整音量（具体功能待实现）
      if (event.isEnd) {
        // 滑动结束，立即隐藏消息
        hideGestureMessage()
      } else {
        // 滑动中，更新消息
        showGestureMessageTemporary(`音量: ${Math.round(event.value || 0)}%`)
      }
      break
    case 'seek':
      // 调整视频进度
      if (event.isEnd) {
        // 滑动结束，立即隐藏消息
        hideGestureMessage()
      } else if (event.value !== undefined) {
        // 滑动中，更新消息和时间
        if (videoRef.value.duration) {
          const newTime = (event.value / 100) * videoRef.value.duration
          videoRef.value.currentTime = newTime
          showGestureMessageTemporary(`${formatTime(newTime)}`)
        }
      }
      break
    case 'rewind':
      // 快退10秒 - 双击操作，延迟隐藏
      videoRef.value.currentTime = Math.max(0, videoRef.value.currentTime - 10)
      showGestureMessageDelayed('快退 10s')
      break
    case 'forward':
      // 快进10秒 - 双击操作，延迟隐藏
      videoRef.value.currentTime = Math.min(videoRef.value.duration, videoRef.value.currentTime + 10)
      showGestureMessageDelayed('快进 10s')
      break
  }
}

</script>

<template>
  <div class="video-player" ref="videoPlayerRef">
    <video ref="videoRef" src="https://ro.qisato.top:2096/public/VID_20220416_033049_395.mp4" :autoplay="setup.autoPlay"
      :poster="setup.autoPlay ? '../../static/img/transparent.png' : (localPosterUrl || '../../static/img/transparent.png')" @click="togglePlay"></video>
    <!-- 视频黑屏遮罩（仅在未播放时显示） -->
    <div v-if="false" class="black-overlay"></div>
    <!-- 仅在缓冲时显示加载指示器，且没有手势消息时显示 -->
    <div v-if="isLoading && !gestureMessage" class="msg-view">
      <v-progress-circular color="#00796B" bg-color="#ffffff66" :size="70" :width="7"
        indeterminate></v-progress-circular>
    </div>
    <!-- 手势操作消息显示 -->
    <div v-if="gestureMessage" class="msg-view">
      <div class="msg">{{ gestureMessage }}</div>
    </div>
    <!-- 使用 fullscreenState 控制显示 -->
    <controlFullscreen v-if="fullscreenState" :is-playing="isPlaying" :progress="progress" :buffered="buffered"
      :current-time="currentTime" :total-time="totalTime" :video-element="videoRef" :has-played="hasPlayed"
      @exit="handleExitFullscreen" @toggle-play="togglePlay" @progress-change="onProgressChange"
      @progress-change-end="onProgressChangeEnd" @gesture="handleGestureEvent" />
    <control v-else :is-playing="isPlaying" :progress="progress" :buffered="buffered" :current-time="currentTime"
      :total-time="totalTime" :has-played="hasPlayed" @toggle-play="togglePlay" @progress-change="onProgressChange"
      @progress-change-end="onProgressChangeEnd" @enter-fullscreen="enterFullscreen" @go-back="goBack" @go-home="goHome"
      @gesture="handleGestureEvent" />
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

  .black-overlay {
    height: 100%;
    width: 100%;
    position: absolute;
    background-color: #000;
    top: 0;
    left: 0;
    z-index: 10;
  }

  .msg-view {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none; // 确保点击事件可以穿透到视频

    .msg {
      color: #fff;
      background-color: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100px;
      height: 40px;
      border-radius: 8px;
    }
  }
}
</style>
