<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router';
import { lockPortrait, lockLandscape } from '../../core/useOrientation'
import { enterImmersive, exitImmersive } from '../../core/immersive'
import customRange from './customRange.vue';

const fullscreenState = ref(false); // 内部维护的全屏状态
const videoPlayerRef = ref<HTMLElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);

const isPlaying = ref(false);
const progress = ref<number>(0);
const buffered = ref<number>(0);
const currentTime = ref<string>('00:00');
const totalTime = ref<string>('00:00');
const isLoading = ref(false); // 缓冲加载状态
const currentSystemTime = ref<string>(''); // 当前系统时间

const router = useRouter();

let timeInterval: number | undefined; // 定时器 ID

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 格式化当前系统时间
const formatCurrentTime = (): string => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 更新系统时间
const updateSystemTime = () => {
  currentSystemTime.value = formatCurrentTime();
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

// 退出全屏
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

// 切换全屏
// const toggleFullscreen = async () => {
//   if (fullscreenState.value) {
//     await exitFullscreen();
//   } else {
//     await enterFullscreen();
//   }
// };

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

// 挂载/卸载监听
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  window.addEventListener('popstate', handlePopState);

  // 初始化并定时更新系统时间
  updateSystemTime();
  const timeInterval = setInterval(updateSystemTime, 1000);

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

  // 清除系统时间定时器
  clearInterval(timeInterval);

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

// 返回
function goBack() {
  router.back();
}
// 回到主界面
function goHome() {
  router.push('/');
}
</script>

<template>
  <div class="video-player" ref="videoPlayerRef">
    <video ref="videoRef" src="https://ro.qisato.top:2096/public/VID_20220416_033049_395.mp4"
      @click="togglePlay"></video>
    <!-- 仅在缓冲时显示加载指示器 -->
    <div v-if="isLoading" class="msg-view">
      <v-progress-circular color="#00796B" bg-color="#ffffff66" :size="70" :width="7" indeterminate></v-progress-circular>
    </div>
    <!-- 使用 fullscreenState 控制显示 -->
    <div v-if="fullscreenState" class="control-fullscreen">
      <!-- 全屏模式 -->
      <div class="top">
        <div>
          <span class="btn" @click="exitFullscreen">
            <font-awesome-icon icon="fa-solid fa-angle-left" />
          </span>
        </div>
        <div class="title">
          <div class="title-text">
            测试标题
          </div>
        </div>
        <div class="status">
          <span>
            <font-awesome-icon icon="fa-solid fa-wifi" /> WiFi
          </span>
          <span>
            <font-awesome-icon icon="fa-solid fa-battery-full" />
          </span>
          <span>{{ currentSystemTime }}</span>
        </div>
        <div>
          <span class="btn">
            <font-awesome-icon icon="fa-regular fa-heart" />
          </span>
          <span class="btn">
            <font-awesome-icon icon="fa-regular fa-camera" />
          </span>
          <span class="btn">
            <font-awesome-icon icon="fa-solid fa-download" />
          </span>
          <span class="btn">
            <font-awesome-icon icon="fa-solid fa-ellipsis-vertical" />
          </span>
        </div>
      </div>
      <div class="middle"></div>
      <div class="progress">
        <customRange v-model="progress" :buffered="buffered" :min="0" :max="100"
          @update:modelValue="onProgressChange" />
      </div>
      <div class="bottom">
        <div>
          <span class="btn" @click="togglePlay">
            <font-awesome-icon v-if="isPlaying" icon="fa-solid fa-pause" />
            <font-awesome-icon v-else icon="fa-solid fa-play" />
          </span>
        </div>
        <div class="time">
          {{ currentTime }}/{{ totalTime }}
        </div>
        <div class="space"></div>
        <div class="text-btn">
          <span>
            <font-awesome-icon icon="fa-solid fa-server" />hiwara
          </span>
          <span>
            <font-awesome-icon icon="fa-solid fa-film" />1080P
          </span>
        </div>
        <div>
          <span class="btn" @click="exitFullscreen">
            <font-awesome-icon icon="fa-solid fa-compress" />
          </span>
        </div>
      </div>
    </div>
    <div v-else class="control">
      <!-- 非全屏模式 -->
      <div class="top">
        <div>
          <span class="btn" @click="goBack">
            <font-awesome-icon icon="fa-solid fa-angle-left" />
          </span>
          <span class="btn" @click="goHome">
            <font-awesome-icon icon="fa-regular fa-house" />
          </span>
        </div>
        <div></div>
        <div>
          <!-- 功能未实现 -->
          <!-- <span class="btn">
            <font-awesome-icon icon="fa-solid fa-picture-in-picture" />
          </span>
          <span class="btn">
            <font-awesome-icon icon="fa-solid fa-tv" />
          </span>
          <span class="btn">
            <font-awesome-icon icon="fa-solid fa-ellipsis-vertical" />
          </span> -->
        </div>
      </div>
      <div class="middle"></div>
      <div class="bottom">
        <div>
          <span class="btn" @click="togglePlay">
            <font-awesome-icon v-if="isPlaying" icon="fa-solid fa-pause" />
            <font-awesome-icon v-else icon="fa-solid fa-play" />
          </span>
        </div>
        <div class="progress">
          <customRange v-model="progress" :buffered="buffered" :min="0" :max="100"
            @update:modelValue="onProgressChange" />
        </div>
        <div class="time">
          {{ currentTime }}/{{ totalTime }}
        </div>
        <div>
          <span class="btn" @click="enterFullscreen">
            <font-awesome-icon icon="fa-solid fa-expand" />
          </span>
        </div>
      </div>
    </div>
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

  .control {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    color: #fff;

    .top {
      display: flex;

      >div:nth-child(2) {
        flex: 1;
      }
    }

    .middle {
      flex: 1;
    }

    .bottom {
      display: flex;

      .progress {
        flex: 1;
        padding: 0 6px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .time {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
        padding: 0 6px;
      }
    }

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

  .control-fullscreen {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    color: #fff;

    .top {
      display: flex;
      padding: 16px 16px 0 16px;

      .title {
        font-size: 1.1rem;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: start;
        overflow: hidden;
        min-width: 0; // 防止 flex 子项溢出


        .title-text {
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .status {
        display: grid;
        grid-auto-flow: column;
        gap: 6px;
        padding: 0 4px;
        align-items: center;
        font-size: 1rem;
      }
    }

    .middle {
      flex: 1;
    }

    .progress {
      padding: 0 16px;
    }

    .bottom {
      display: flex;
      padding: 0 16px 16px 16px;

      .time {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 140px;
      }

      .space {
        flex: 1;
      }

      .text-btn {
        display: flex;
        align-items: center;
        justify-content: center;

        span {
          display: inline-block;
          padding: 0 4px;
          cursor: pointer;
          user-select: none;
        }
      }
    }



    .btn {
      display: inline-flex;
      margin: 4px;
      width: 40px;
      height: 40px;
      justify-content: center;
      align-items: center;
      font-size: 1.4rem;
      cursor: pointer;
      user-select: none;
    }
  }
}
</style>
