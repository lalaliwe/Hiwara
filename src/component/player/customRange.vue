<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';

interface Props {
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  buffered?: number; // 0-100 的百分比
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 0.1,
  disabled: false,
  buffered: 0,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

// 检测是否为桌面端（非触摸设备）
const isDesktop = ref(true);

onMounted(() => {
  // 通过检测触摸能力或用户代理来判断是否为移动设备
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  isDesktop.value = !isTouchDevice && !isMobileUA;
});

// 唯一的 JS 逻辑：处理 Input 输入
const handleInput = (e: Event) => {
  emit('update:modelValue', Number((e.target as HTMLInputElement).value));
};

// 计算样式：直接返回 transform 对象，避免在模板中计算
const fillStyle = computed(() => ({
  transform: `scaleX(${(props.modelValue - props.min) / (props.max - props.min)})`
}));

const bufferStyle = computed(() => ({
  transform: `scaleX(${props.buffered / 100})`
}));

const thumbStyle = computed(() => ({
  left: `${((props.modelValue - props.min) / (props.max - props.min)) * 100}%`
}));
</script>
<template>
  <div class="video-range-container" :class="{ 'is-desktop': isDesktop }">
    <!-- 原生 Input：只负责交互逻辑 -->
    <input type="range" class="range-input" :value="modelValue" @input="handleInput" :min="min" :max="max" :step="step"
      :disabled="disabled" />

    <!-- 自定义 UI 层：纯展示，pointer-events: none -->
    <div class="range-track-wrapper">
      <!-- 背景轨道 -->
      <div class="track-bg"></div>

      <!-- 缓冲进度：通过 CSS 变量设置宽度 -->
      <div class="track-buffer" :style="bufferStyle"></div>

      <!-- 播放进度：通过 CSS 变量设置宽度 -->
      <div class="track-fill" :style="fillStyle"></div>

      <!-- 滑块：双层同心圆 -->
      <div class="slider-thumb" :style="thumbStyle">
        <div class="slider-circle-outer"></div>
        <div class="slider-circle-inner"></div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.video-range-container {
  position: relative;
  width: 100%;
  height: 20px;
  /* 点击热区 */
  cursor: pointer;
}

/* --- 原生 Input --- */
.range-input {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 10;
  opacity: 0;
  cursor: pointer;
  margin: 0;
}

/* --- UI 层 --- */
.range-track-wrapper {
  position: absolute;
  top: 50%;
  width: 100%;
  height: 4px;
  /* 默认轨道高度 */
  transform: translateY(-50%);
  pointer-events: none;
  /* 核心：让点击穿透 */
  border-radius: 2px;
  /* overflow: hidden; 移除裁剪，让滑块可以超出轨道显示 */
  background: rgba(255, 255, 255, 0.2);

  /* 只有高度变化有过渡，width/transform 不要过渡，否则不跟手 */
  transition: height 0.1s ease;
}

/* 背景层 (已有 .range-track-wrapper 背景，此 div 可省略或用于差异化样式) */
.track-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  background: transparent;
}

/* 缓冲层 */
.track-buffer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.4);
  transform-origin: left center;
  will-change: transform;
  /* GPU 加速 */
}

/* 播放进度层 */
.track-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #00796B;
  /* 视频红 */
  transform-origin: left center;
  will-change: transform;
  /* GPU 加速 */
}

/* 滑块：双层同心圆 */
.slider-thumb {
  position: absolute;
  top: 50%;
  width: 20px;
  height: 20px;
  background: transparent;
  border-radius: 0;
  transform: translate(-50%, -50%);
  box-shadow: none;
  z-index: 20;
  will-change: transform;
  /* GPU 加速 */

  /* 默认隐藏（仅桌面端非悬停状态） */
  opacity: 0;
  
  /* 添加过渡效果 */
  transition: opacity 0.2s ease;
}

/* 移动端始终显示滑块 */
@media (hover: none) and (pointer: coarse) {
  .slider-thumb {
    opacity: 1;
  }
}

/* 桌面端悬停时显示滑块 */
.video-range-container.is-desktop:hover .slider-thumb {
  opacity: 1;
}

/* 外层白色圆环 */
.slider-circle-outer {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  background: #ffffff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 内层绿色圆 */
.slider-circle-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  background: #00796B;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* ========== 纯 CSS 交互控制 ========== */

/* 1. 鼠标悬停时：轨道变高 (仅桌面端生效) */
.video-range-container.is-desktop:hover .range-track-wrapper {
  height: 6px;
}

/* 2. 禁用状态 */
.video-range-container:has(.range-input:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>