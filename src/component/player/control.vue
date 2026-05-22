<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import Hammer from 'hammerjs'
import customRange from './customRange.vue'

// Props - 接收父组件传递的数据
const props = defineProps<{
  isPlaying: boolean
  progress: number
  buffered: number
  currentTime: string
  totalTime: string
  metadataLoaded?: boolean // 是否已经播放过
}>()

// Emits - 向父组件事件
const emit = defineEmits<{
  (e: 'togglePlay'): void
  (e: 'progressChange', value: number): void
  (e: 'progressChangeEnd'): void
  (e: 'enterFullscreen'): void
  (e: 'goBack'): void
  (e: 'goHome'): void
  (e: 'gesture', event: { type: string; value?: number; isEnd?: boolean }): void
}>()

// 本地进度状态，用于UI实时更新
const localProgress = ref(props.progress)

// 监听父组件传来的progress变化，同步到本地
watch(() => props.progress, (newVal) => {
  localProgress.value = newVal
})

// 控制栏显示状态
const showControl = ref(true)

// 自动隐藏定时器
let hideTimer: number | null = null

// 点击计数和定时器（用于区分单击/双击）
let clickTimer: number | null = null
let clickCount = 0
const pointerType = ref<'mouse' | 'touch' | 'pen'>('mouse')

// Hammer.js 实例
let hammerMiddle: InstanceType<typeof Hammer> | null = null
let hammerTouch: InstanceType<typeof Hammer> | null = null

// 显示控制栏并重置自动隐藏定时器
const showControlBar = () => {
  // console.log('[control.vue] showControlBar 被调用')
  showControl.value = true
  resetHideTimer()
}

// 隐藏控制栏
const hideControlBar = () => {
  // console.log('[control.vue] hideControlBar 被调用')
  showControl.value = false
  clearHideTimer()
}

// 重置自动隐藏定时器
const resetHideTimer = () => {
  // console.log('[control.vue] resetHideTimer 被调用, pointerType:', pointerType.value)
  clearHideTimer()

  // 如果视频还没有开始播放过，不设置自动隐藏
  if (!props.metadataLoaded) {
    // console.log('[control.vue] 视频未播放，不自动隐藏')
    return
  }

  hideTimer = window.setTimeout(() => {
    // 鼠标和触摸设备都自动隐藏
    // console.log('[control.vue] 5秒后自动隐藏控制栏')
    hideControlBar()
  }, 5000)
}

// 清除自动隐藏定时器
const clearHideTimer = () => {
  if (hideTimer !== null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

// 监听 metadataLoaded 变化，如果从未播放变为已播放，则启动自动隐藏
watch(() => props.metadataLoaded, (newVal) => {
  if (newVal && showControl.value) {
    // 视频第一次播放后，如果控制栏正在显示，启动自动隐藏
    resetHideTimer()
  }
})

// 组件挂载时启动自动隐藏
onMounted(() => {
  resetHideTimer()
  initHammer()
})

// 组件卸载时清除定时器和 Hammer 实例
onUnmounted(() => {
  clearHideTimer()
  if (clickTimer !== null) {
    clearTimeout(clickTimer)
    clickTimer = null
  }
  destroyHammer()
})

// 初始化 Hammer.js
const initHammer = () => {
  const middleElement = document.querySelector('.control .middle')
  const touchElement = document.querySelector('.touch')

  if (!middleElement || !touchElement) return

  // 为 .middle 创建 Hammer 实例
  hammerMiddle = new Hammer(middleElement as HTMLElement)
  setupHammerGestures(hammerMiddle)

  // 为 .touch 创建 Hammer 实例
  hammerTouch = new Hammer(touchElement as HTMLElement)
  setupHammerGestures(hammerTouch)
}

// 销毁 Hammer 实例
const destroyHammer = () => {
  if (hammerMiddle) {
    hammerMiddle.destroy()
    hammerMiddle = null
  }
  if (hammerTouch) {
    hammerTouch.destroy()
    hammerTouch = null
  }
}

// 配置 Hammer 手势
const setupHammerGestures = (mc: InstanceType<typeof Hammer>) => {
  // 启用所有需要的手势
  mc.get('pan').set({ direction: Hammer.DIRECTION_ALL })
  mc.get('tap').set({ taps: 2 }) // 双击

  // 记录起始位置和状态
  let startX = 0
  let startY = 0
  let startProgress = 0
  let isPanning = false
  let panType: 'seek' | 'brightness' | 'volume' | null = null // 记录本次滑动的类型

  // 处理 pan 开始
  mc.on('panstart', (ev: HammerInput) => {
    // 只在触摸屏上响应
    if (pointerType.value !== 'touch') return

    isPanning = true
    startX = ev.center.x
    startY = ev.center.y
    startProgress = localProgress.value

    // 根据起始位置确定操作类型（只判断左右区域，不判断滑动方向）
    const elementWidth = (ev.target as HTMLElement).offsetWidth
    const isLeftSide = startX < (elementWidth / 2)

    // 默认先假设为左右滑动（进度调整）
    panType = 'seek'

    // console.log('[control.vue] panstart', { x: startX, y: startY, isLeftSide, initialPanType: panType })
  })

  // 处理 pan 移动
  mc.on('panmove', (ev: HammerInput) => {
    // 只在触摸屏上响应
    if (pointerType.value !== 'touch' || !isPanning || !panType) return

    const deltaX = ev.center.x - startX
    const deltaY = ev.center.y - startY
    const elementWidth = (ev.target as HTMLElement).offsetWidth
    const elementHeight = (ev.target as HTMLElement).offsetHeight

    // 在第一次有明显移动时，根据初始滑动方向确定最终的操作类型
    if (panType === 'seek' && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      // 根据初始的主要滑动方向确定类型，之后不再改变
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 初始是左右滑动 → 进度调整
        panType = 'seek'
        // console.log('[control.vue] 确定为左右滑动 - 进度调整')
      } else {
        // 初始是上下滑动 → 根据左右区域判断是亮度还是音量
        const isLeftSide = startX < (elementWidth / 2)
        panType = isLeftSide ? 'brightness' : 'volume'
        // console.log('[control.vue] 确定为上下滑动', { panType })
      }
    }

    // 根据确定的类型执行相应操作（之后无论怎么滑动都不会改变类型）
    if (panType === 'seek') {
      // 左右滑动 - 调整视频进度
      const deltaProgress = (deltaX / elementWidth) * 100
      let newProgress = startProgress + deltaProgress
      newProgress = Math.max(0, Math.min(100, newProgress))

      emit('gesture', { type: 'seek', value: newProgress, isEnd: false })
      localProgress.value = newProgress
    } else if (panType === 'brightness') {
      // 左边上下滑动 - 调整亮度
      const deltaPercent = -(deltaY / elementHeight) * 100
      emit('gesture', { type: 'brightness', value: Math.max(0, Math.min(100, deltaPercent)), isEnd: false })
    } else if (panType === 'volume') {
      // 右边上下滑动 - 调整音量
      const deltaPercent = -(deltaY / elementHeight) * 100
      emit('gesture', { type: 'volume', value: Math.max(0, Math.min(100, deltaPercent)), isEnd: false })
    }
  })

  // 处理 pan 结束
  mc.on('panend', () => {
    if (pointerType.value !== 'touch') return

    isPanning = false

    // 发送滑动结束信号
    if (panType) {
      emit('gesture', { type: panType, isEnd: true })
    }

    // 重置类型
    panType = null
  })

  // 处理双击
  mc.on('doubletap', (ev: HammerInput) => {
    // 只在触摸屏上响应
    if (pointerType.value !== 'touch') return

    const elementWidth = (ev.target as HTMLElement).offsetWidth
    const tapX = ev.center.x

    // 定义边缘区域为左右各 20% 的区域
    const edgeThreshold = elementWidth * 0.2
    const isLeftEdge = tapX < edgeThreshold
    const isRightEdge = tapX > (elementWidth - edgeThreshold)

    // 根据点击位置触发不同操作
    if (isLeftEdge) {
      // 左边边缘双击 - 快退10s
      // console.log('[control.vue] 左边边缘双击 - 快退')
      emit('gesture', { type: 'rewind' })
    } else if (isRightEdge) {
      // 右边边缘双击 - 快进10s
      // console.log('[control.vue] 右边边缘双击 - 快进')
      emit('gesture', { type: 'forward' })
    } else {
      // 中间区域双击 - 播放/暂停
      // console.log('[control.vue] 中间区域双击 - 播放/暂停')
      emit('togglePlay')
      resetHideTimer()
    }

    // 重置单击计时器，避免触发单击逻辑
    if (clickTimer) {
      clearTimeout(clickTimer)
      clickTimer = null
      clickCount = 0
    }
  })
}

// 记录指针类型
const handlePointerDown = (event: PointerEvent) => {
  pointerType.value = event.pointerType as 'mouse' | 'touch' | 'pen'
  // console.log('[control.vue] pointerdown 事件, pointerType:', pointerType.value)
}

// 处理中间区域点击
const handleMiddleClick = () => {
  // 视频元数据未加载完成时不处理点击
  if (!props.metadataLoaded)
    return

  clickCount++
  if (clickCount === 1) {
    // 单击
    clickTimer = window.setTimeout(() => {
      if (pointerType.value === 'mouse') {
        // 鼠标单击：暂停/播放
        emit('togglePlay')
      } else if (pointerType.value === 'touch') {
        // 触摸单击：切换控制栏显示
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
    if (clickTimer) {
      clearTimeout(clickTimer)
      clickTimer = null
    }

    if (pointerType.value === 'mouse') {
      // 鼠标双击：全屏
      emit('enterFullscreen')
    } else if (pointerType.value === 'touch') {
      // 触摸双击：暂停/播放（已被 Hammer 的双击接管，这里不会执行）
      emit('togglePlay')
      resetHideTimer()
    }

    clickCount = 0
  }
}

// 鼠标移动时显示控制栏
const handleMouseMove = () => {
  if (pointerType.value === 'mouse') {
    // console.log('[control.vue] 鼠标移动 - 显示控制栏')
    showControlBar()
  }
}

// 切换播放/暂停
const handleTogglePlay = () => {
  // console.log('[control.vue] handleTogglePlay 被调用')
  emit('togglePlay')
  resetHideTimer()
}

// 进度条变化 - 直接更新本地值并触发事件
const handleProgressChange = (value: number) => {
  // console.log('[control.vue] 进度条变化:', value)
  localProgress.value = value
  emit('progressChange', value)
  resetHideTimer()
}

// 处理进度条拖动结束
const handleProgressChangeEnd = () => {
  // console.log('[control.vue] 进度条拖动结束')
  emit('progressChangeEnd')
}

// 进入全屏
const handleEnterFullscreen = () => {
  // console.log('[control.vue] handleEnterFullscreen 被调用')
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
    <div class="middle" @pointerdown="handlePointerDown" @click="handleMiddleClick"></div>
    <!-- 底部控制栏 - 只有在视频已经播放过后才显示 -->
    <div class="bottom" v-if="metadataLoaded">
      <div>
        <span class="btn" @click="handleTogglePlay">
          <font-awesome-icon v-if="isPlaying" icon="fa-solid fa-pause" />
          <font-awesome-icon v-else icon="fa-solid fa-play" />
        </span>
      </div>
      <div class="progress">
        <customRange v-model="localProgress" :buffered="buffered" :min="0" :max="100"
          @update:modelValue="handleProgressChange" @change="handleProgressChangeEnd" />
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
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), transparent 20%, transparent 80%, rgba(0, 0, 0, 0.4));

  .top {
    display: flex;

    >div:nth-child(2) {
      flex: 1;
    }
  }

  .middle {
    flex: 1;
    cursor: pointer;
    touch-action: none; // 阻止默认触摸行为，让 Hammer.js 接管
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
  touch-action: none; // 阻止默认触摸行为，让 Hammer.js 接管
}
</style>