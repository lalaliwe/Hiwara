<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { lockPortrait, lockLandscape } from '../../core/useOrientation'
import { enterImmersive, exitImmersive } from '../../core/immersive'

const fullscreenState = ref(false); // 内部维护的全屏状态
const videoPlayerRef = ref<HTMLElement | null>(null);

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
const toggleFullscreen = async () => {
  if (fullscreenState.value) {
    await exitFullscreen();
  } else {
    await enterFullscreen();
  }
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

// 挂载/卸载监听
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  window.addEventListener('popstate', handlePopState);
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  window.removeEventListener('popstate', handlePopState);
});
</script>

<template>
  <div class="video-player" ref="videoPlayerRef">
    <video src="https://ro.qisato.top:2096/public/VID_20220416_033049_395.mp4"></video>
    <!-- 使用 fullscreenState 控制显示 -->
    <div v-if="fullscreenState" class="control-fullscreen">
      <div class="top">
        
      </div>
      <div class="middle"></div>
      <div class="bottom"></div>
    </div>
    <div v-else class="control">

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

  .control {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    .top{}
    .middle{
      flex: 1;
    }
    .bottom{}
  }

  .control-fullscreen {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
  }
}
</style>
