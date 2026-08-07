<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { lockPortraitOnMobile, lockLandscape } from '../../plugins/useOrientation'
import { enterImmersive, exitImmersive } from '../../plugins/immersive'
import {
  setScreenBrightness,
  getScreenBrightness,
  setVolume,
  getVolume
} from '../../plugins/screenControl'
import controlFullscreen from './controlFullscreen.vue';
import control from './control.vue';
import { getImageIwara } from '../../core/api';
import { ai, setupStore } from '../../core/store';

// 获取 store 实例
const aiStore = ai();
const setup = setupStore();
const { t } = useI18n();

// 定义 props
const props = defineProps<{
  poster?: string
  src?: string
  title?: string
  server?: string // 服务器名称
  videoFiles?: Array<{ id: string; name: string; server: string; type: string; view: string; download: string }> // 视频文件列表
  currentDefinitionIndex?: number // 当前选中的清晰度索引
  isRefreshingServer?: boolean // 是否正在切换服务器
  isLike?: boolean // 是否已点赞
  vid?: string // 视频ID
  likeNum?: number // 点赞数
  username?: string // 作者用户名（用于下载文件名）
  authorName?: string // 作者昵称（用于下载记录）
  playNum?: number // 播放数
}>()

// 定义 emits
const emit = defineEmits<{
  (e: 'refreshServer'): void // 刷新服务器列表
  (e: 'definition-change', index: number): void // 切换清晰度
  (e: 'ended'): void // 视频播放结束
  (e: 'like', isLiked: boolean): void // 点赞状态变化
}>()

const localPosterUrl = ref<string>(''); // 本地存储的poster URL
const videoSrc = ref<string>(''); // 视频源地址

// 监听 poster prop 变化
watch(() => props.poster, async (newPoster) => {
  if (newPoster) {
    try {
      // 如果之前有URL，先释放
      if (localPosterUrl.value) {
        URL.revokeObjectURL(localPosterUrl.value);
      }
      // 使用 getImageIwara 获取图片
      const blobUrl = await getImageIwara(newPoster, aiStore.value);
      localPosterUrl.value = blobUrl;
    } catch (error) {
      console.error('Failed to load poster:', error);
      localPosterUrl.value = '';
    }
  }
}, { immediate: true });

// 监听 src prop 变化
watch(() => props.src, (newSrc) => {
  if (newSrc) {
    videoSrc.value = newSrc;
    videoEnded.value = false; // 切换源时重置结束状态
    isState.value = 'loading' // 新源开始加载
    // src 动态变更后尝试自动播放（不能用 HTML autoplay 属性，因为初始化时已被空 src 消耗）
    if (setup.autoPlay) {
      nextTick(() => {
        autoPlayVideo();
      });
    }
  }
}, { immediate: true });

const fullscreenState = ref(false); // 内部维护的全屏状态
const videoPlayerRef = ref<HTMLElement | null>(null); // 播放器元素
const videoRef = ref<HTMLVideoElement | null>(null);  // 视频元素
const isPlaying = ref(false); // 播放状态
const progress = ref<number>(0);  // 实际播放进度（由 timeupdate 驱动）
const displayProgress = ref<number>(0) // 显示进度（与播放进度解耦，用于进度条显示和用户交互）
const isSeeking = ref(false) // 是否正在拖拽/滑动进度中
const buffered = ref<number>(0);  // 已缓冲
const currentTime = ref<string>('00:00'); // 当前时间
const totalTime = ref<string>('00:00'); // 总时长
const isLoading = ref(false); // 缓冲加载状态
const isState = ref<'failed' | 'empty' | 'loading' | 'success'>('empty'); // 视频加载状态
const metadataLoaded = ref(false); // 是否已经播放过（用于控制自动隐藏）
const videoEnded = ref(false); // 视频是否播放完成

// 亮度/音量 - 页面生命周期内保存的原始亮度值
const originalBrightness = ref<number>(-1)

// 手势基准值（非 ref，不需要响应式）
// 手势开始时读取系统当前亮度/音量作为基准，后续用 deltaPercent 做偏移
let gestureBrightnessBase: number | null = null
let gestureVolumeBase: number | null = null

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
  // 非拖拽状态才同步显示进度，拖拽/滑动中由用户控制
  if (!isSeeking.value) {
    displayProgress.value = progress.value
  }
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
    isPlaying.value = false // pause 是同步操作，直接翻转
  } else {
    isPlaying.value = true // 乐观更新，先显示播放状态
    videoRef.value.play().catch(() => {
      // play() 被浏览器阻止（如自动播放策略），回滚状态
      isPlaying.value = false
    })
  }
};

// 自动播放视频（先静音启动，成功后再取消静音）
const autoPlayVideo = async () => {
  if (!videoRef.value || !setup.autoPlay) return;

  // 先静音，满足 WebView 自动播放策略
  videoRef.value.muted = true;

  try {
    await videoRef.value.play();
    // 自动播放成功 → 取消静音，用户听到声音
    videoRef.value.muted = false;
    console.log('✅ 自动播放成功（有声）');
  } catch (err) {
    // 自动播放被 WebView 阻止，保持静音或等待用户交互
    console.log('❌ 自动播放被阻止:', err instanceof Error ? err.message : err);
  }
};

// 进度条变化（拖动过程中）
const onProgressChange = (value: number) => {
  if (!videoRef.value || !videoRef.value.duration) return
  // 标记正在拖拽，阻止 timeupdate 覆盖显示进度
  isSeeking.value = true
  // 仅更新显示进度，不跳转视频（松手后才跳转）
  displayProgress.value = value
  const newTime = (value / 100) * videoRef.value.duration
  // 显示当前时间消息（使用临时显示，等待 change 事件来隐藏）
  showGestureMessageTemporary(`${formatTime(newTime)}`)
}

// 进度条拖动结束（松开鼠标/手指）
const onProgressChangeEnd = () => {
  // 将显示进度同步到实际播放进度
  if (videoRef.value?.duration) {
    const newTime = (displayProgress.value / 100) * videoRef.value.duration
    videoRef.value.currentTime = newTime
  }
  isSeeking.value = false
  // 立即隐藏消息
  hideGestureMessage()
}

// 进入全屏
const enterFullscreen = async () => {
  if (!videoPlayerRef.value) return;
  try {
    // 进入沉浸式（等待完成，避免与 requestFullscreen 竞态导致系统栏重新弹出）
    try {
      await enterImmersive();
    } catch (e) {
      console.error('进入沉浸模式失败:', e);
    }
    // 锁定屏幕为横向
    lockLandscape();
    // 请求全屏
    await videoPlayerRef.value.requestFullscreen();
    // Android 返回键由 App.vue 的 onBackButtonPress 统一拦截，不再插入假历史状态
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
      lockPortraitOnMobile();
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

// 处理服务器刷新
const handleRefreshServer = () => {
  // console.log('[videoPlayer.vue] 触发服务器刷新')
  emit('refreshServer')
}

// 处理清晰度切换
const handleDefinitionChange = (index: number) => {
  // console.log('[videoPlayer.vue] 触发清晰度切换:', index)
  emit('definition-change', index)
}
// 监听全屏状态变化 (处理 ESC 键、手势退出、App.vue 返回键拦截触发的退出等情况)
const handleFullscreenChange = () => {
  // 仅同步状态，不操作路由（Android 返回键由 App.vue 的 onBackButtonPress 统一拦截）
  fullscreenState.value = !!document.fullscreenElement;
};

// 响应 App.vue 返回键拦截：完整退出全屏（含沉浸模式恢复、横屏恢复）
const handlePlayerExitFullscreen = () => {
  exitFullscreen();
};

const goBack = inject<() => void>('goBack');
const goHome = inject<() => void>('goHome');

onMounted(async () => {
  // 挂载/卸载监听
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  window.addEventListener('player-exit-fullscreen', handlePlayerExitFullscreen);

  // 绑定视频事件
  if (videoRef.value) {
    // 视频资源开始加载
    videoRef.value.addEventListener('loadstart', () => {
      isLoading.value = true; // 开始加载视频
      isState.value = 'loading' // 标记加载中
    });
    // 加载失败（网络错误、资源不存在、格式不支持等）
    videoRef.value.addEventListener('error', () => {
      // 没有实际视频源时忽略 error（空 src 加载会被浏览器报 error）
      if (!videoSrc.value) return
      isLoading.value = false
      isState.value = 'failed'
      console.error('[videoPlayer] 视频加载失败')
    });
    // 缓存数据足够播放，暂停加载数据
    videoRef.value.addEventListener('suspend', () => { });
    // 网络波动，意外断开
    videoRef.value.addEventListener('stalled', () => { });
    // 视频播放
    videoRef.value.addEventListener('play', () => {
      isPlaying.value = true;
      videoEnded.value = false;
    });
    // 视频暂停
    videoRef.value.addEventListener('pause', () => {
      isPlaying.value = false;
    });
    // 视频播放结束
    videoRef.value.addEventListener('ended', () => {
      isPlaying.value = false;
      videoEnded.value = true;
      emit('ended');
    });
    // 播放进度更新
    videoRef.value.addEventListener('timeupdate', updateTime);
    // 元数据加载完成
    videoRef.value.addEventListener('loadedmetadata', () => {
      updateTime();
      metadataLoaded.value = true;
      console.log('视频元数据加载完成');
    });
    // 首帧加载完成
    videoRef.value.addEventListener('loadeddata', () => {
      console.log('视频数据加载完成');
      // 兜底：如果 src watcher 中因视频未加载而 play() 失败，这里重试
      autoPlayVideo();
    });
    // 监听缓冲事件
    // 数据不足，进入缓冲状态
    videoRef.value.addEventListener('waiting', () => {
      isLoading.value = true; // 数据不足，显示加载指示器
    });
    // 从缓冲恢复，继续播放
    videoRef.value.addEventListener('playing', () => {
      isLoading.value = false; // 从缓冲恢复，隐藏加载指示器
    });
    // 缓冲完成
    videoRef.value.addEventListener('canplaythrough', () => {
      isLoading.value = false; // 已缓冲足够，隐藏加载指示器
      if (isState.value === 'loading') {
        isState.value = 'success' // 加载成功
      }
    });
    // 初始化总时长
    if (videoRef.value.duration) {
      totalTime.value = formatTime(videoRef.value.duration);
    }
  }

  // 保存进入页面时的原始屏幕亮度，用于离开时恢复
  try {
    originalBrightness.value = await getScreenBrightness()
  } catch (e) {
    console.warn('[videoPlayer] 获取原始亮度失败:', e)
  }
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  window.removeEventListener('player-exit-fullscreen', handlePlayerExitFullscreen);
  // 清理事件监听
  if (videoRef.value) {
    videoRef.value.removeEventListener('loadstart', () => { });
    videoRef.value.removeEventListener('suspend', () => { });
    videoRef.value.removeEventListener('stalled', () => { });
    videoRef.value.removeEventListener('play', () => { });
    videoRef.value.removeEventListener('pause', () => { });
    videoRef.value.removeEventListener('timeupdate', updateTime);
    videoRef.value.removeEventListener('loadedmetadata', () => { });
    videoRef.value.removeEventListener('loadeddata', () => { });
    videoRef.value.removeEventListener('waiting', () => { });
    videoRef.value.removeEventListener('playing', () => { });
    videoRef.value.removeEventListener('canplaythrough', () => { });
    videoRef.value.removeEventListener('ended', () => { });
  }
  // 清理 poster URL
  if (localPosterUrl.value) {
    URL.revokeObjectURL(localPosterUrl.value);
  }
  // 恢复原始屏幕亮度（-1.0 表示系统默认，让系统接管）
  try {
    setScreenBrightness(originalBrightness.value)
  } catch (e) {
    console.warn('[videoPlayer] 恢复亮度失败:', e)
  }
});

// 处理子组件的手势事件
const handleGestureEvent = async (event: { type: string; value?: number; isEnd?: boolean }) => {
  // console.log('[videoPlayer.vue] 收到手势事件:', event)

  if (!videoRef.value) return

  switch (event.type) {
    case 'brightness': {
      if (event.isEnd) {
        // 滑动结束，重置基准值，隐藏消息
        gestureBrightnessBase = null
        hideGestureMessage()
      } else if (event.value !== undefined) {
        // 第一帧：读取系统当前亮度作为基准
        if (gestureBrightnessBase === null) {
          const sysBrightness = await getScreenBrightness()
          // sysBrightness: -1(系统默认) → 当作 100; 0.0~1.0 → 映射为 0~100
          gestureBrightnessBase = sysBrightness < 0 ? 100 : Math.round(sysBrightness * 100)
        }
        // deltaPercent(event.value) 是相对位移，叠加到基准值上得到绝对值
        const absolute = gestureBrightnessBase + event.value
        const clamped = Math.max(0, Math.min(100, Math.round(absolute)))
        const normalized = clamped / 100 // 转为 0.0~1.0
        setScreenBrightness(normalized)
        showGestureMessageTemporary(t('player.brightness', { n: clamped }))
      }
      break
    }
    case 'volume': {
      if (event.isEnd) {
        // 滑动结束，重置基准值，隐藏消息
        gestureVolumeBase = null
        hideGestureMessage()
      } else if (event.value !== undefined) {
        // 第一帧：读取系统当前音量作为基准
        if (gestureVolumeBase === null) {
          const sysVolume = await getVolume()
          // sysVolume: 0.0~1.0 → 映射为 0~100
          gestureVolumeBase = Math.round(sysVolume * 100)
        }
        // deltaPercent(event.value) 是相对位移，叠加到基准值上得到绝对值
        const absolute = gestureVolumeBase + event.value
        const clamped = Math.max(0, Math.min(100, Math.round(absolute)))
        const normalized = clamped / 100 // 转为 0.0~1.0
        setVolume(normalized)
        showGestureMessageTemporary(t('player.volume', { n: clamped }))
      }
      break
    }
    case 'seek':
      // 调整视频进度（滑动中仅更新显示，松手后才跳转）
      if (event.isEnd) {
        // 滑动结束：将显示进度同步到实际播放
        if (videoRef.value?.duration) {
          const newTime = (displayProgress.value / 100) * videoRef.value.duration
          videoRef.value.currentTime = newTime
        }
        isSeeking.value = false
        // 立即隐藏消息
        hideGestureMessage()
      } else if (event.value !== undefined) {
        // 滑动中，标记正在滑动，仅更新显示进度
        isSeeking.value = true
        displayProgress.value = event.value
        if (videoRef.value.duration) {
          const newTime = (event.value / 100) * videoRef.value.duration
          showGestureMessageTemporary(`${formatTime(newTime)} / ${totalTime.value}`)
        }
      }
      break
    case 'rewind':
      // 快退10秒 - 双击操作，延迟隐藏
      videoRef.value.currentTime = Math.max(0, videoRef.value.currentTime - 10)
      // 立即刷新进度显示：加载/暂停/缓冲中 timeupdate 不会触发，进度条会滞后于实际播放进度
      updateTime()
      showGestureMessageDelayed(t('player.rewind10s'))
      break
    case 'forward':
      // 快进10秒 - 双击操作，延迟隐藏
      videoRef.value.currentTime = Math.min(videoRef.value.duration, videoRef.value.currentTime + 10)
      // 立即刷新进度显示
      updateTime()
      showGestureMessageDelayed(t('player.forward10s'))
      break
  }
}

// 重新播放视频
const replay = () => {
  if (!videoRef.value) return;
  videoEnded.value = false;
  videoRef.value.currentTime = 0;
  isPlaying.value = true // 乐观更新
  videoRef.value.play().catch(() => {
    // play() 被浏览器阻止，回滚状态
    isPlaying.value = false
  })
};

// 视频加载失败后重试
const handleRetry = () => {
  if (!videoRef.value) return
  isState.value = 'loading'
  isLoading.value = true
  videoRef.value.load()
}

defineExpose({ replay });
</script>

<template>
  <div class="video-player" ref="videoPlayerRef">
    <!-- 不在此处绑定点击暂停：控制层(control/controlFullscreen)已全屏覆盖并统一处理单击/双击，
         若视频本身再绑定 @click="togglePlay"，首次点击（尤其控制栏隐藏时）会被误判为暂停 -->
    <video ref="videoRef" :src="videoSrc" :autoplay="setup.autoPlay" playsinline
      :poster="setup.autoPlay ? '../../static/img/transparent.png' : (localPosterUrl || '../../static/img/transparent.png')"></video>
    <!-- 视频暗色遮罩（播放完成时显示） -->
    <div v-if="videoEnded" class="black-overlay"></div>
    <!-- 缓冲加载指示器（底层，与手势提示解耦，可同时显示） -->
    <div v-if="isLoading" class="msg-view msg-loading">
      <v-progress-circular color="#00796B" bg-color="#ffffff66" :size="70" :width="7"
        indeterminate></v-progress-circular>
    </div>
    <!-- 视频加载失败提示（样式与重新播放按钮保持一致） -->
    <div v-if="isState === 'failed'" class="fail-view">
      <div class="fail-text">加载失败</div>
      <div class="fail-retry" @click="handleRetry">
        <font-awesome-icon icon="fa-solid fa-rotate-right" />
        <span>重新加载</span>
      </div>
    </div>
    <!-- 手势操作消息显示（顶层，位于加载转圈之上） -->
    <div v-if="gestureMessage" class="msg-view msg-gesture">
      <div class="msg">{{ gestureMessage }}</div>
    </div>
    <!-- 使用 fullscreenState 控制显示 -->
    <controlFullscreen v-if="fullscreenState" :is-playing="isPlaying" :progress="displayProgress" :buffered="buffered"
      :current-time="currentTime" :total-time="totalTime" :video-element="videoRef" :metadataLoaded="metadataLoaded"
      :title="props.title" :server="props.server" :video-files="props.videoFiles"
      :current-definition-index="props.currentDefinitionIndex" @exit="handleExitFullscreen" @toggle-play="togglePlay"
      @progress-change="onProgressChange" @progress-change-end="onProgressChangeEnd" @gesture="handleGestureEvent"
      :is-refreshing-server="props.isRefreshingServer" @refresh-server="handleRefreshServer"
      @definition-change="handleDefinitionChange" @replay="replay"
      :video-ended="videoEnded" :is-like="props.isLike" :vid="props.vid" :like-num="props.likeNum"
      :username="props.username" :author-name="props.authorName" :poster="props.poster" :play-num="props.playNum"
      @like="(val: boolean) => emit('like', val)" />
    <control v-else :is-playing="isPlaying" :progress="displayProgress" :buffered="buffered" :current-time="currentTime"
      :total-time="totalTime" :metadataLoaded="metadataLoaded" @toggle-play="togglePlay" @progress-change="onProgressChange"
      @progress-change-end="onProgressChangeEnd" @enter-fullscreen="enterFullscreen" @go-back="goBack" @go-home="goHome"
      @gesture="handleGestureEvent" @replay="replay" :video-ended="videoEnded" />
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
    background-color: rgba(0, 0, 0, 0.5);
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

    // 加载转圈在底层
    &.msg-loading {
      z-index: 18;
    }

    // 手势操作提示在顶层
    &.msg-gesture {
      z-index: 21;
    }

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

// 视频加载失败（样式与重新播放按钮保持一致）
.fail-view {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #fff;
  z-index: 3;

  .fail-text {
    font-size: 0.9rem;
    opacity: 0.8;
  }

  .fail-retry {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    background: none;
    border: none;
    padding: 12px 16px;
    color: #fff;

    svg {
      font-size: 1.4rem;
    }

    span {
      font-size: 0.9rem;
    }

    &:active {
      opacity: 0.7;
    }
  }
}
</style>
