<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import huawuLoadingPng from '../static/img/huawuLoading.png'

const TOTAL_FRAMES = 33
const ANIMATION_DURATION = 2500 // ms
const FRAME_INTERVAL = ANIMATION_DURATION / TOTAL_FRAMES

const isLinux = ref(false)
const jsImgRef = ref<HTMLImageElement | null>(null)
let rafId: number | null = null
let startTime = 0

function startJsAnimation() {
  function animate(timestamp: number) {
    if (!jsImgRef.value) {
      rafId = requestAnimationFrame(animate)
      return
    }
    if (!startTime) startTime = timestamp
    const elapsed = timestamp - startTime
    const frameIndex = Math.floor(elapsed / FRAME_INTERVAL) % TOTAL_FRAMES
    const offset = (frameIndex / TOTAL_FRAMES) * 100
    jsImgRef.value.style.transform = `translateY(-${offset}%)`
    rafId = requestAnimationFrame(animate)
  }
  rafId = requestAnimationFrame(animate)
}

onMounted(async () => {
  try {
    const { getDeviceInfo } = await import('../plugins/deviceInfo')
    const deviceInfo = await getDeviceInfo()
    const osName = deviceInfo.osName.toLowerCase()
    if (osName.includes('linux')) {
      isLinux.value = true
      await nextTick()
      startJsAnimation()
    }
  } catch {
    // 无法获取设备信息时，保持默认 CSS 动画
  }
})

onUnmounted(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
})
</script>

<template>
  <div class="loading-huawu-container">
    <div class="animation">
      <img
        v-if="!isLinux"
        :src="huawuLoadingPng"
        alt=""
        class="sprite css-sprite"
      >
      <img
        v-else
        ref="jsImgRef"
        :src="huawuLoadingPng"
        alt=""
        class="sprite js-sprite"
      >
    </div>
    <div v-if="$slots.default" class="loading-text">
      <slot></slot><span class="dots"></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@font-face {
  font-family: 'AaXinRui85-2';
  src: url('/fonts/AaXinRui85-2.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

.loading-huawu-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.animation {
  overflow: hidden;
  width: 200px;
  aspect-ratio: 1086 / 724;

  .sprite {
    display: block;
    width: 100%;
    height: auto;
  }

  .css-sprite {
    animation: moveUp 2.5s steps(33, end) infinite;
  }
}

@keyframes moveUp {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-100%);
  }
}

.loading-text {
  font-family: 'AaXinRui85-2';
  color: var(--color-primary);
  // margin-top: 16px;

  .dots::after {
    content: '';
    animation: dotsAnimation 1s infinite;
  }
}

@keyframes dotsAnimation {
  0% {
    content: '.';
  }

  16.66% {
    content: '..';
  }

  33.32% {
    content: '...';
  }

  49.98% {
    content: '....';
  }

  66.64% {
    content: '.....';
  }

  83.3% {
    content: '......';
  }

  100% {
    content: '.';
  }
}
</style>
