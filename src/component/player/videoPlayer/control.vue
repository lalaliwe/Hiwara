<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import customRange from '../customRange.vue'

// Props - 接收父组件传递的数据
const props = defineProps<{
  isPlaying: boolean
  progress: number
  buffered: number
  currentTime: string
  totalTime: string
}>()

// Emits - 向父组件事件
const emit = defineEmits<{
  (e: 'togglePlay'): void
  (e: 'progressChange', value: number): void
  (e: 'enterFullscreen'): void
  (e: 'goBack'): void
  (e: 'goHome'): void
}>()

// 本地进度状态，用于UI实时更新
const localProgress = ref(props.progress)

// 监听父组件传来的progress变化，同步到本地
watch(() => props.progress, (newVal) => {
  localProgress.value = newVal
})

// 控制栏显示状态
const showControl = ref(true)
console.log('[control.vue] 初始化 showControl:', showControl.value)

// 自动隐藏定时器
let hideTimer: number | null = null

// 点击计数和定时器（用于区分单击/双击）
let clickTimer: number | null = null
let clickCount = 0
const pointerType = ref<'mouse' | 'touch' | 'pen'>('mouse')

// 显示控制栏并重置自动隐藏定时器
const showControlBar = () => {
  console.log('[control.vue] showControlBar 被调用')
  showControl.value = true
  resetHideTimer()
}

// 隐藏控制栏
const hideControlBar = () => {
  console.log('[control.vue] hideControlBar 被调用')
  showControl.value = false
  clearHideTimer()
}

// 重置自动隐藏定时器
const resetHideTimer = () => {
  console.log('[control.vue] resetHideTimer 被调用, pointerType:', pointerType.value)
  clearHideTimer()
  hideTimer = window.setTimeout(() => {
    // 只在鼠标设备时自动隐藏
    if (pointerType.value === 'mouse') {
      console.log('[control.vue] 5秒后自动隐藏控制栏')
      hideControlBar()
    } else {
      console.log('[control.vue] 触摸设备，不自动隐藏')
    }
  }, 5000)
}

// 清除自动隐藏定时器
const clearHideTimer = () => {
  if (hideTimer !== null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

// 组件挂载时启动自动隐藏
onMounted(() => {
  console.log('[control.vue] 组件已挂载')
  resetHideTimer()
})

// 组件卸载时清除定时器
onUnmounted(() => {
  console.log('[control.vue] 组件即将卸载')
  clearHideTimer()
  if (clickTimer !== null) {
    clearTimeout(clickTimer)
    clickTimer = null
  }
})

// 记录指针类型
const handlePointerDown = (event: PointerEvent) => {
  pointerType.value = event.pointerType as 'mouse' | 'touch' | 'pen'
  console.log('[control.vue] pointerdown 事件, pointerType:', pointerType.value)
}

// 处理中间区域点击
const handleMiddleClick = () => {
  console.log('[control.vue] handleMiddleClick 被调用, 当前 clickCount:', clickCount, 'pointerType:', pointerType.value)
  clickCount++
  
  if (clickCount === 1) {
    console.log('[control.vue] 检测到第一次点击，设置250ms延迟')
    clickTimer = window.setTimeout(() => {
      console.log('[control.vue] 250ms后执行单击逻辑')
      if (pointerType.value === 'mouse') {
        // 鼠标单击：暂停/播放
        console.log('[control.vue] 鼠标单击 - 触发 togglePlay')
        emit('togglePlay')
      } else if (pointerType.value === 'touch') {
        // 触摸单击：切换控制栏显示
        console.log('[control.vue] 触摸单击 - 切换控制栏, 当前状态:', showControl.value)
        if (showControl.value) {
          hideControlBar()
        } else {
          showControlBar()
        }
      }
      clickCount = 0
      clickTimer = null
    }, 250)
  } else if (clickCount === 2) {
    // 双击
    console.log('[control.vue] 检测到双击')
    if (clickTimer) {
      clearTimeout(clickTimer)
      clickTimer = null
      console.log('[control.vue] 清除单击定时器')
    }
    
    if (pointerType.value === 'mouse') {
      // 鼠标双击：全屏
      console.log('[control.vue] 鼠标双击 - 触发 enterFullscreen')
      emit('enterFullscreen')
    } else if (pointerType.value === 'touch') {
      // 触摸双击：暂停/播放
      console.log('[control.vue] 触摸双击 - 触发 togglePlay')
      emit('togglePlay')
      resetHideTimer()
    }
    
    clickCount = 0
  }
}

// 鼠标移动时显示控制栏
const handleMouseMove = () => {
  if (pointerType.value === 'mouse') {
    console.log('[control.vue] 鼠标移动 - 显示控制栏')
    showControlBar()
  }
}

// 切换播放/暂停
const handleTogglePlay = () => {
  console.log('[control.vue] handleTogglePlay 被调用')
  emit('togglePlay')
  resetHideTimer()
}

// 进度条变化 - 直接更新本地值并触发事件
const handleProgressChange = (value: number) => {
  console.log('[control.vue] 进度条变化:', value)
  localProgress.value = value
  emit('progressChange', value)
  resetHideTimer()
}

// 进入全屏
const handleEnterFullscreen = () => {
  console.log('[control.vue] handleEnterFullscreen 被调用')
  emit('enterFullscreen')
  resetHideTimer()
}
</script>

<template>
  <div class="control" v-show="showControl" @mousemove="handleMouseMove">
    <!-- 顶部栏 -->
    <div class="top">
      <div>
        <span class="btn" @click="$emit('goBack')">
          <font-awesome-icon icon="fa-solid fa-angle-left" />
        </span>
        <span class="btn" @click="$emit('goHome')">
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
    <!-- 中间区域 -->
    <div 
      class="middle" 
      @pointerdown="handlePointerDown"
      @click="handleMiddleClick"
    ></div>
    <!-- 底部控制栏 -->
    <div class="bottom">
      <div>
        <span class="btn" @click="handleTogglePlay">
          <font-awesome-icon v-if="isPlaying" icon="fa-solid fa-pause" />
          <font-awesome-icon v-else icon="fa-solid fa-play" />
        </span>
      </div>
      <div class="progress">
        <customRange v-model="localProgress" :buffered="buffered" :min="0" :max="100"
          @update:modelValue="handleProgressChange" />
      </div>
      <div class="time">
        {{ currentTime }}/{{ totalTime }}
      </div>
      <div>
        <span class="btn" @click="handleEnterFullscreen">
          <font-awesome-icon icon="fa-solid fa-expand" />
        </span>
      </div>
    </div>
  </div>
  <div class="touch" v-show="!showControl" @click="handleMiddleClick" @mousemove="handleMouseMove"></div>
</template>

<style lang="scss" scoped>
.control {
  user-select: none;
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
    cursor: pointer;
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

.touch {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 25;
  cursor: pointer;
}
</style>