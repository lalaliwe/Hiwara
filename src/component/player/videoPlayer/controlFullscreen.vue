<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
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
}>()

// Emits - 向父组件事件
const emit = defineEmits<{
  (e: 'exit'): void
  (e: 'togglePlay'): void
  (e: 'progressChange', value: number): void
}>()

// 本地进度状态，用于UI实时更新
const localProgress = ref(props.progress)

// 监听父组件传来的progress变化，同步到本地
watch(() => props.progress, (newVal) => {
  localProgress.value = newVal
})

// 控制栏显示状态
const showControl = ref(true)
console.log('[controlFullscreen.vue] 初始化 showControl:', showControl.value)

// 自动隐藏定时器
let hideTimer: number | null = null

// 点击计数和定时器（用于区分单击/双击）
let clickTimer: number | null = null
let clickCount = 0
const pointerType = ref<'mouse' | 'touch' | 'pen'>('mouse')

// 显示控制栏并重置自动隐藏定时器
const showControlBar = () => {
  console.log('[controlFullscreen.vue] showControlBar 被调用')
  showControl.value = true
  resetHideTimer()
}

// 隐藏控制栏
const hideControlBar = () => {
  console.log('[controlFullscreen.vue] hideControlBar 被调用')
  showControl.value = false
  clearHideTimer()
}

// 重置自动隐藏定时器
const resetHideTimer = () => {
  console.log('[controlFullscreen.vue] resetHideTimer 被调用, pointerType:', pointerType.value)
  clearHideTimer()
  hideTimer = window.setTimeout(() => {
    // 只在鼠标设备时自动隐藏
    if (pointerType.value === 'mouse') {
      console.log('[controlFullscreen.vue] 5秒后自动隐藏控制栏')
      hideControlBar()
    } else {
      console.log('[controlFullscreen.vue] 触摸设备，不自动隐藏')
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
  console.log('[controlFullscreen.vue] handleExitFullscreen 被调用')
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

// 记录指针类型
const handlePointerDown = (event: PointerEvent) => {
  pointerType.value = event.pointerType as 'mouse' | 'touch' | 'pen'
  console.log('[controlFullscreen.vue] pointerdown 事件, pointerType:', pointerType.value)
}

// 处理中间区域点击
const handleMiddleClick = () => {
  console.log('[controlFullscreen.vue] handleMiddleClick 被调用, 当前 clickCount:', clickCount, 'pointerType:', pointerType.value)
  clickCount++
  
  if (clickCount === 1) {
    console.log('[controlFullscreen.vue] 检测到第一次点击，设置250ms延迟')
    clickTimer = window.setTimeout(() => {
      console.log('[controlFullscreen.vue] 250ms后执行单击逻辑')
      if (pointerType.value === 'mouse') {
        // 鼠标单击：暂停/播放
        console.log('[controlFullscreen.vue] 鼠标单击 - 触发 togglePlay')
        emit('togglePlay')
      } else if (pointerType.value === 'touch') {
        // 触摸单击：切换控制栏显示
        console.log('[controlFullscreen.vue] 触摸单击 - 切换控制栏, 当前状态:', showControl.value)
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
    console.log('[controlFullscreen.vue] 检测到双击')
    if (clickTimer) {
      clearTimeout(clickTimer)
      clickTimer = null
      console.log('[controlFullscreen.vue] 清除单击定时器')
    }
    
    if (pointerType.value === 'mouse') {
      // 鼠标双击：退出全屏
      console.log('[controlFullscreen.vue] 鼠标双击 - 退出全屏')
      handleExitFullscreen()
    } else if (pointerType.value === 'touch') {
      // 触摸双击：暂停/播放
      console.log('[controlFullscreen.vue] 触摸双击 - 触发 togglePlay')
      emit('togglePlay')
      resetHideTimer()
    }
    
    clickCount = 0
  }
}

// 鼠标移动时显示控制栏
const handleMouseMove = () => {
  if (pointerType.value === 'mouse') {
    console.log('[controlFullscreen.vue] 鼠标移动 - 显示控制栏')
    showControlBar()
  }
}

// 切换播放/暂停
const handleTogglePlay = () => {
  console.log('[controlFullscreen.vue] handleTogglePlay 被调用')
  emit('togglePlay')
  resetHideTimer()
}

// 进度条变化 - 直接更新本地值并触发事件
const handleProgressChange = (value: number) => {
  console.log('[controlFullscreen.vue] 进度条变化:', value)
  localProgress.value = value
  emit('progressChange', value)
  resetHideTimer()
}

onMounted(() => {
  console.log('[controlFullscreen.vue] 组件已挂载')
  fetchNetworkInfo()
  fetchBatteryInfo()
  updateSystemTime()
  timeInterval = setInterval(updateSystemTime, 1000)
  // 启动自动隐藏定时器
  resetHideTimer()
})

onUnmounted(() => {
  console.log('[controlFullscreen.vue] 组件即将卸载')
  clearInterval(timeInterval)
  clearHideTimer()
  if (clickTimer !== null) {
    clearTimeout(clickTimer)
    clickTimer = null
  }
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
    <div 
      class="middle" 
      @pointerdown="handlePointerDown"
      @click="handleMiddleClick"
    ></div>

    <!-- 进度条 -->
    <div class="progress">
      <customRange 
        v-model="localProgress"
        :buffered="buffered" 
        :min="0" 
        :max="100"
        @update:modelValue="handleProgressChange" 
      />
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
}
</style>