<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import Hammer from 'hammerjs'
import { exitImmersive } from '../../../plugins/immersive'
import { lockPortrait } from '../../../plugins/useOrientation'
import { getNetworkInfo, getBatteryInfo } from '../../../plugins/deviceInfo'
import customRange from '../customRange.vue'

// Props - 接收父组件传递的数据
const props = defineProps<{
  isPlaying: boolean
  progress: number
  buffered: number
  currentTime: string
  totalTime: string
  videoElement: HTMLVideoElement | null
  hasPlayed?: boolean // 是否已经播放过
}>()

// Emits - 向父组件事件
const emit = defineEmits<{
  (e: 'exit'): void
  (e: 'togglePlay'): void
  (e: 'progressChange', value: number): void
  (e: 'progressChangeEnd'): void
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
// console.log('[controlFullscreen.vue] 初始化 showControl:', showControl.value)

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
  // console.log('[controlFullscreen.vue] showControlBar 被调用')
  showControl.value = true
  resetHideTimer()
}

// 隐藏控制栏
const hideControlBar = () => {
  // console.log('[controlFullscreen.vue] hideControlBar 被调用')
  showControl.value = false
  clearHideTimer()
}

// 重置自动隐藏定时器
const resetHideTimer = () => {
  // console.log('[controlFullscreen.vue] resetHideTimer 被调用, pointerType:', pointerType.value)
  clearHideTimer()

  // 如果视频还没有开始播放过，不设置自动隐藏
  if (!props.hasPlayed) {
    // console.log('[controlFullscreen.vue] 视频未播放，不自动隐藏')
    return
  }

  hideTimer = window.setTimeout(() => {
    // 鼠标和触摸设备都自动隐藏
    // console.log('[controlFullscreen.vue] 5秒后自动隐藏控制栏')
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

// 内部状态
const currentSystemTime = ref<string>('')
type NetworkType = 'wifi' | 'cellular' | 'ethernet' | 'other' | 'none' | 'unknown' | 'loading'
const networkState = ref<NetworkType>('loading')
const batteryLevel = ref<number | 'none'>('none')
const isCharging = ref(false)

// 格式化当前系统时间
const formatCurrentTime = (): string => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 更新系统时间
const updateSystemTime = () => {
  currentSystemTime.value = formatCurrentTime()
}

let timeInterval: number | undefined

// 获取网络信息
const fetchNetworkInfo = async () => {
  const timeoutMs = 5000
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('获取网络信息超时')), timeoutMs)
  })

  try {
    const msg = await Promise.race([getNetworkInfo(), timeoutPromise])
    networkState.value = msg.networkType
  } catch (error) {
    console.error('获取网络信息失败:', error)
    networkState.value = 'unknown'
  }
}

// 获取设备电量
const fetchBatteryInfo = async () => {
  const timeoutMs = 5000
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('获取设备电量信息超时')), timeoutMs)
  })
  try {
    const msg = await Promise.race([getBatteryInfo(), timeoutPromise])
    batteryLevel.value = msg.level
    isCharging.value = msg.isCharging
  } catch (error) {
    console.error('获取设备电量信息失败:', error)
    batteryLevel.value = 'none'
  }
}

// 退出全屏
const handleExitFullscreen = async () => {
  // console.log('[controlFullscreen.vue] handleExitFullscreen 被调用')
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      exitImmersive()
      lockPortrait()
    }
  } catch (err) {
    console.error('退出全屏失败:', err)
  }
  emit('exit')
  resetHideTimer()
}

// 初始化 Hammer.js
const initHammer = () => {
  const middleElement = document.querySelector('.control-fullscreen .middle')
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

    // console.log('[controlFullscreen.vue] panstart', { x: startX, y: startY, isLeftSide, initialPanType: panType })
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
        // console.log('[controlFullscreen.vue] 确定为左右滑动 - 进度调整')
      } else {
        // 初始是上下滑动 → 根据左右区域判断是亮度还是音量
        const isLeftSide = startX < (elementWidth / 2)
        panType = isLeftSide ? 'brightness' : 'volume'
        // console.log('[controlFullscreen.vue] 确定为上下滑动', { panType })
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
      // console.log('[controlFullscreen.vue] 左边边缘双击 - 快退')
      emit('gesture', { type: 'rewind' })
    } else if (isRightEdge) {
      // 右边边缘双击 - 快进10s
      // console.log('[controlFullscreen.vue] 右边边缘双击 - 快进')
      emit('gesture', { type: 'forward' })
    } else {
      // 中间区域双击 - 播放/暂停
      // console.log('[controlFullscreen.vue] 中间区域双击 - 播放/暂停')
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
  // console.log('[controlFullscreen.vue] pointerdown 事件, pointerType:', pointerType.value)
}

// 处理中间区域点击
const handleMiddleClick = () => {
  // console.log('[controlFullscreen.vue] handleMiddleClick 被调用, 当前 clickCount:', clickCount, 'pointerType:', pointerType.value)
  clickCount++

  if (clickCount === 1) {
    // console.log('[controlFullscreen.vue] 检测到第一次点击，设置250ms延迟')
    clickTimer = window.setTimeout(() => {
      // console.log('[controlFullscreen.vue] 250ms后执行单击逻辑')
      if (pointerType.value === 'mouse') {
        // 鼠标单击：暂停/播放
        // console.log('[controlFullscreen.vue] 鼠标单击 - 触发 togglePlay')
        emit('togglePlay')
      } else if (pointerType.value === 'touch') {
        // 触摸单击：切换控制栏显示
        // console.log('[controlFullscreen.vue] 触摸单击 - 切换控制栏, 当前状态:', showControl.value)
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
    // console.log('[controlFullscreen.vue] 检测到双击')
    if (clickTimer) {
      clearTimeout(clickTimer)
      clickTimer = null
      // console.log('[controlFullscreen.vue] 清除单击定时器')
    }

    if (pointerType.value === 'mouse') {
      // 鼠标双击：退出全屏
      // console.log('[controlFullscreen.vue] 鼠标双击 - 退出全屏')
      handleExitFullscreen()
    } else if (pointerType.value === 'touch') {
      // 触摸双击：暂停/播放
      // console.log('[controlFullscreen.vue] 触摸双击 - 触发 togglePlay')
      emit('togglePlay')
      resetHideTimer()
    }

    clickCount = 0
  }
}

// 鼠标移动时显示控制栏
const handleMouseMove = () => {
  if (pointerType.value === 'mouse') {
    // console.log('[controlFullscreen.vue] 鼠标移动 - 显示控制栏')
    showControlBar()
  }
}

// 切换播放/暂停
const handleTogglePlay = () => {
  // console.log('[controlFullscreen.vue] handleTogglePlay 被调用')
  emit('togglePlay')
  resetHideTimer()
}

// 进度条变化 - 直接更新本地值并触发事件
const handleProgressChange = (value: number) => {
  // console.log('[controlFullscreen.vue] 进度条变化:', value)
  localProgress.value = value
  emit('progressChange', value)
  resetHideTimer()
}

// 处理进度条拖动结束
const handleProgressChangeEnd = () => {
  // console.log('[controlFullscreen.vue] 进度条拖动结束')
  emit('progressChangeEnd')
}

onMounted(() => {
  // console.log('[controlFullscreen.vue] 组件已挂载')
  fetchNetworkInfo()
  fetchBatteryInfo()
  updateSystemTime()
  timeInterval = setInterval(updateSystemTime, 1000)
  // 启动自动隐藏定时器
  resetHideTimer()
  // 初始化 Hammer.js
  initHammer()
})

onUnmounted(() => {
  // console.log('[controlFullscreen.vue] 组件即将卸载')
  clearInterval(timeInterval)
  clearHideTimer()
  if (clickTimer !== null) {
    clearTimeout(clickTimer)
    clickTimer = null
  }
  // 销毁 Hammer 实例
  destroyHammer()
})
</script>

<template>
  <div class="control-fullscreen" v-show="showControl" @mousemove="handleMouseMove">
    <!-- 顶部栏 -->
    <div class="top">
      <div>
        <span class="btn" @click="handleExitFullscreen">
          <font-awesome-icon icon="fa-solid fa-angle-left" />
        </span>
      </div>
      <div class="title">
        <div class="title-text">
          测试标题
        </div>
      </div>
      <div class="status">
        <span v-if="networkState === 'wifi'">
          <font-awesome-icon icon="fa-solid fa-wifi" />
          WiFi
        </span>
        <span v-else-if="networkState === 'cellular'">
          <font-awesome-icon icon="fa-solid fa-signal" />
          移动数据
        </span>
        <span v-else-if="networkState === 'ethernet'">
          <font-awesome-icon icon="fa-solid fa-ethernet" />
          有线连接
        </span>
        <span v-else-if="networkState === 'other'">
          <font-awesome-icon icon="fa-solid fa-network-wired" />
          其他
        </span>
        <span v-else-if="networkState === 'none'">
          <font-awesome-icon icon="fa-solid fa-wifi" />
          <span style="position: relative;left: -1.25rem;width: 0;display: inline-block;">
            <font-awesome-icon icon="fa-solid fa-slash" />
          </span>
          无网络
        </span>
        <span v-else-if="networkState === 'unknown'">
          <font-awesome-icon icon="fa-solid fa-network-wired" />
          未知网络
        </span>
        <span v-if="batteryLevel != 'none'">
          <font-awesome-icon v-if="batteryLevel >= 100" icon="fa-solid fa-battery-full"
            :style="{ color: isCharging ? '#00E676' : 'auto' }" />
          <font-awesome-icon v-else-if="batteryLevel >= 60 && batteryLevel < 100"
            icon="fa-solid fa-battery-three-quarters" :style="{ color: isCharging ? '#00E676' : 'auto' }" />
          <font-awesome-icon v-else-if="batteryLevel >= 40 && batteryLevel < 60" icon="fa-solid fa-battery-half"
            :style="{ color: isCharging ? '#00E676' : 'auto' }" />
          <font-awesome-icon v-else-if="batteryLevel >= 20 && batteryLevel < 40" icon="fa-solid fa-battery-quarter"
            :style="{ color: isCharging ? '#00E676' : 'auto' }" />
          <font-awesome-icon v-else-if="batteryLevel < 20" icon="fa-solid fa-battery-empty"
            :style="{ color: isCharging ? '#00E676' : '#FF3D00' }" />
          <span v-if="isCharging"
            style="position: relative;left: -1.1rem;top:-0.1rem;width: 0;display: inline-block;color:#FFFF00;font-size: 0.8rem;">
            <font-awesome-icon icon="fa-solid fa-bolt" />
          </span>
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

    <!-- 中间区域 -->
    <div class="middle" @pointerdown="handlePointerDown" @click="handleMiddleClick"></div>

    <!-- 进度条 -->
    <div class="progress">
      <customRange v-model="localProgress" :buffered="buffered" :min="0" :max="100"
        @update:modelValue="handleProgressChange" @change="handleProgressChangeEnd" />
    </div>

    <!-- 底部控制栏 -->
    <div class="bottom">
      <div>
        <span class="btn" @click="handleTogglePlay">
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
        <span class="btn" @click="handleExitFullscreen">
          <font-awesome-icon icon="fa-solid fa-compress" />
        </span>
      </div>
    </div>
  </div>
  <div class="touch" v-show="!showControl" @click="handleMiddleClick" @mousemove="handleMouseMove"></div>
</template>

<style lang="scss" scoped>
.control-fullscreen {
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
    padding: 16px 16px 0 16px;

    .title {
      font-size: 1.1rem;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: start;
      overflow: hidden;
      min-width: 0;

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
    cursor: pointer;
    touch-action: none; // 阻止默认触摸行为，让 Hammer.js 接管
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
      justify-content: start;
      padding-left: 4px;
      width: 100px;
    }

    .space {
      flex: 1;
    }

    .text-btn {
      display: flex;
      align-items: center;
      justify-content: center;

      span {
        display: inline-flex;
        align-items: center;
        gap: 4px;
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