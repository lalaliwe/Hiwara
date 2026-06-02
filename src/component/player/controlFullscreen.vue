<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import Hammer from 'hammerjs'
import { exitImmersive } from '../../plugins/immersive'
import { lockPortrait } from '../../plugins/useOrientation'
import { getNetworkInfo, getBatteryInfo } from '../../plugins/deviceInfo'
import customRange from './customRange.vue'

// Props - 接收父组件传递的数据
const props = defineProps<{
  isPlaying: boolean
  progress: number
  buffered: number
  currentTime: string
  totalTime: string
  videoElement: HTMLVideoElement | null
  metadataLoaded?: boolean // 是否已经播放过
  title?: string // 视频标题
  server?: string // 服务器名称
  videoFiles?: Array<{ id: string; name: string; server: string; type: string; view: string; download: string }> // 视频文件列表
  currentDefinitionIndex?: number // 当前选中的清晰度索引
  videoEnded?: boolean // 视频是否播放完成
  isRefreshingServer?: boolean // 是否正在切换服务器
}>()

// Emits - 向父组件事件
const emit = defineEmits<{
  (e: 'exit'): void
  (e: 'togglePlay'): void
  (e: 'progressChange', value: number): void
  (e: 'progressChangeEnd'): void
  (e: 'gesture', event: { type: string; value?: number; isEnd?: boolean }): void
  (e: 'replay'): void
  (e: 'refreshServer'): void // 刷新服务器列表
  (e: 'definitionChange', index: number): void // 切换清晰度
}>()

// 本地进度状态，用于UI实时更新
const localProgress = ref(props.progress)

// 监听父组件传来的progress变化，同步到本地
watch(() => props.progress, (newVal) => {
  localProgress.value = newVal
})

// 监听 videoEnded：播放完成后常显控件，重播后恢复自动隐藏
watch(() => props.videoEnded, (ended) => {
  if (ended) {
    showControl.value = true
    clearHideTimer()
  } else {
    resetHideTimer()
  }
})

// 控制栏显示状态
const showControl = ref(true)
// console.log('[controlFullscreen.vue] 初始化 showControl:', showControl.value)

// Drawer 显示状态
const showDrawer = ref(false)

// 自动隐藏定时器
let hideTimer: number | null = null

// 点击计数和定时器（用于区分单击/双击）
let clickTimer: number | null = null
let clickCount = 0
// 双击后重置 clickCount 的定时器，防止后续单击被阻塞
let doubleTapResetTimer: number | null = null
// 上次点击时间戳，用于过滤硬件噪声导致的假双击（如 10ms 间隔的触点抖动）
let lastClickTime = 0
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
  showDrawer.value = false // 隐藏控制栏时也隐藏 drawer
  clearHideTimer()
}

// 重置自动隐藏定时器
const resetHideTimer = () => {
  // console.log('[controlFullscreen.vue] resetHideTimer 被调用, pointerType:', pointerType.value)
  clearHideTimer()

  // 如果视频还没有开始播放过，不设置自动隐藏
  if (!props.metadataLoaded) {
    // console.log('[controlFullscreen.vue] 视频未播放，不自动隐藏')
    return
  }

  // 播放完成后常显控件，不自动隐藏
  if (props.videoEnded) {
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
  mc.get('tap').set({ taps: 2, posThreshold: 150 }) // 双击，位置容差约 1cm²（~150px @300DPI），避免手指晃动导致识别失败

  // 记录起始位置和状态
  let startX = 0
  let startY = 0
  let startProgress = 0
  let isPanning = false
  let panType: 'seek' | 'brightness' | 'volume' | null = null // 记录本次滑动的类型

  // 处理 pan 开始
  mc.on('panstart', (ev: HammerInput) => {
    // 只在触摸屏上响应，且元数据加载完成才能操作
    if (pointerType.value !== 'touch' || !props.metadataLoaded) return

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
    // 只在触摸屏上响应，且元数据加载完成才能操作
    if (pointerType.value !== 'touch' || !isPanning || !panType || !props.metadataLoaded) return

    const deltaX = ev.center.x - startX
    const deltaY = ev.center.y - startY
    const elementWidth = (ev.target as HTMLElement).offsetWidth
    const elementHeight = (ev.target as HTMLElement).offsetHeight

    // 在第一次有明显移动时，根据初始滑动方向确定最终的操作类型
    // 角度死区系数：K=1.73（≈30°），滑动方向与轴夹角 < 30° 才被确认
    // 避免垂直滑动中微小水平偏移被误判为 seek
    const DIRECTION_THRESHOLD = 1.73
    if (panType === 'seek' && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      // 根据初始的主要滑动方向确定类型，之后不再改变
      if (Math.abs(deltaX) > Math.abs(deltaY) * DIRECTION_THRESHOLD) {
        // 初始是左右滑动 → 进度调整
        panType = 'seek'
        // console.log('[controlFullscreen.vue] 确定为左右滑动 - 进度调整')
      } else if (Math.abs(deltaY) > Math.abs(deltaX) * DIRECTION_THRESHOLD) {
        // 初始是上下滑动 → 触控区域四等分，最左1/4亮度，最右1/4音量
        const sectionWidth = elementWidth / 4
        if (startX < sectionWidth) {
          // 最左边四分之一区域 → 亮度
          panType = 'brightness'
        } else if (startX > elementWidth - sectionWidth) {
          // 最右边四分之一区域 → 音量
          panType = 'volume'
        } else {
          // 中间区域（1/4 ~ 3/4）垂直滑动不触发操作
          panType = null
        }
        // console.log('[controlFullscreen.vue] 确定为上下滑动', { panType })
      }
      // 死区：两个条件都不满足，保持 panType = 'seek' 等待更多数据
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
      emit('gesture', { type: 'brightness', value: deltaPercent, isEnd: false })
    } else if (panType === 'volume') {
      // 右边上下滑动 - 调整音量
      const deltaPercent = -(deltaY / elementHeight) * 100
      emit('gesture', { type: 'volume', value: deltaPercent, isEnd: false })
    }
  })

  // 处理 pan 结束
  mc.on('panend', () => {
    if (pointerType.value !== 'touch' || !props.metadataLoaded) return

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
    // 只在触摸屏上响应，且元数据加载完成才能操作
    if (pointerType.value !== 'touch' || !props.metadataLoaded) return

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

    // 阻止后续 DOM click 触发新的单击定时器
    // Hammer 处理原始 touch 事件比 DOM click 快，
    // 必须将 clickCount 设为 >=2，否则后续 DOM click 会将它从 0 加回 1 重新启动定时器
    if (clickTimer) {
      clearTimeout(clickTimer)
      clickTimer = null
    }
    clickCount = 2
    // 延迟重置 clickCount，使后续单击恢复正常
    // 等待第 2 个 DOM click 过去（~300ms）后清除阻塞状态
    if (doubleTapResetTimer !== null) {
      clearTimeout(doubleTapResetTimer)
    }
    doubleTapResetTimer = window.setTimeout(() => {
      clickCount = 0
      doubleTapResetTimer = null
    }, 350)
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

  // 过滤硬件噪声导致的假双击：相邻 click 间隔 < 100ms 视为触点抖动，忽略
  // 人手最快双击间隔约 150ms，100ms 阈值足够安全
  const now = Date.now()
  if (now - lastClickTime < 100) {
    return
  }
  lastClickTime = now

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
      // 触摸双击：由 Hammer.js 的 doubletap 全权处理，此处不再重复触发
      // 仅需确认单击定时器已被清除（防止单击逻辑执行）
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

// 刷新服务器列表
const handleRefreshServer = () => {
  // console.log('[controlFullscreen.vue] 刷新服务器列表')
  emit('refreshServer')
}

// 格式化清晰度文本
const definitionTextFormat = (text: string): string => {
  // 如果输入是数字，返回值后面加个P
  if (!isNaN(Number(text))) {
    return `${text}P`;
  }
  // 如果输入是Source，返回原画
  if (text === 'Source') {
    return '原画';
  }
  // 其他情况返回原文本
  return text;
}

// 过滤并排序视频文件列表
const sortedVideoFiles = computed(() => {
  if (!props.videoFiles) return [];

  // 先过滤掉 preview
  const filtered = props.videoFiles.filter(file => file.name.toLowerCase() !== 'preview');

  // 排序函数
  return filtered.sort((a, b) => {
    // Source(原画)排最后
    if (a.name === 'Source' && b.name !== 'Source') return 1;
    if (a.name !== 'Source' && b.name === 'Source') return -1;

    // 都是数字类型,按数值大小排序
    const aNum = Number(a.name);
    const bNum = Number(b.name);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }

    // 其他情况保持原顺序
    return 0;
  });
});

// 获取排序后文件在原数组中的索引
const getOriginalIndex = (file: { id: string }) => {
  if (!props.videoFiles) return -1;
  return props.videoFiles.findIndex(f => f.id === file.id);
};

// 切换清晰度
const selectDefinition = (index: number) => {
  // 如果选择的清晰度与当前相同,则不执行切换
  if (index === props.currentDefinitionIndex) {
    showDrawer.value = false;
    return;
  }

  // 触发事件通知父组件
  emit('definitionChange', index);
  showDrawer.value = false;
}

// 切换 drawer 显示状态
const toggleDrawer = () => {
  showDrawer.value = !showDrawer.value
  // 如果打开了 drawer，清除自动隐藏定时器，防止控制栏自动隐藏
  if (showDrawer.value) {
    clearHideTimer()
  } else {
    // 如果关闭了 drawer，重新启动自动隐藏定时器
    resetHideTimer()
  }
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
  if (doubleTapResetTimer !== null) {
    clearTimeout(doubleTapResetTimer)
    doubleTapResetTimer = null
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
          {{ title || '未知标题' }}
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

    <!-- 重新播放按钮（播放完成时显示，在控制栏内部） -->
    <div v-if="videoEnded" class="replay-button" @click="emit('replay')">
      <font-awesome-icon icon="fa-solid fa-rotate-right" />
      <span>重新播放</span>
    </div>
    <!-- 中间区域 -->
    <div class="middle" :class="{ 'middle-disabled': videoEnded }" @pointerdown="handlePointerDown"
      @click="handleMiddleClick"></div>

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
        <span @click="!props.isRefreshingServer && handleRefreshServer()"
              :class="{ 'text-btn-disabled': props.isRefreshingServer }">
          <template v-if="props.isRefreshingServer">
            <v-progress-circular :size="16" :width="2" color="inherit" indeterminate />
          </template>
          <template v-else>
            <font-awesome-icon icon="fa-solid fa-server" />{{ server || 'hiwara' }}
          </template>
        </span>
        <span @click="toggleDrawer">
          <font-awesome-icon icon="fa-solid fa-film" />{{ definitionTextFormat(videoFiles?.[currentDefinitionIndex ||
            0]?.name || '1080P') }}
        </span>
      </div>
      <div>
        <span class="btn" @click="handleExitFullscreen">
          <font-awesome-icon icon="fa-solid fa-compress" />
        </span>
      </div>
    </div>

    <!-- 右侧Drawer -->
    <div class="drawer" :class="{ 'drawer-open': showDrawer }">
      <div class="drawer-header">
        <span class="drawer-title">选择清晰度</span>
        <span class="btn" @click="toggleDrawer">
          <font-awesome-icon icon="fa-solid fa-xmark" />
        </span>
      </div>
      <v-divider></v-divider>
      <div class="drawer-content">
        <div v-for="(file, index) in sortedVideoFiles" :key="file.id" class="definition-item"
          :class="{ active: getOriginalIndex(file) === currentDefinitionIndex }"
          @click="selectDefinition(getOriginalIndex(file))">
          <font-awesome-icon icon="fa-solid fa-film" />
          <span class="definition-text">{{ definitionTextFormat(file.name) }}</span>
          <font-awesome-icon v-if="getOriginalIndex(file) === currentDefinitionIndex" icon="fa-solid fa-check"
            class="check-icon" />
        </div>
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
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), transparent 20%, transparent 80%, rgba(0, 0, 0, 0.4));

  .top {
    position: relative;
    z-index: 5;
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

    &.middle-disabled {
      pointer-events: none;
    }
  }

  .progress {
    padding: 0 16px;
  }

  .bottom {
    position: relative;
    z-index: 5;
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

      .text-btn-disabled {
        opacity: 0.5;
        pointer-events: none;
        min-width: 60px;
        justify-content: center;
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

  .drawer {
    background-color: rgba(0, 0, 0, 0.4);
    position: absolute;
    top: 0px;
    right: -280px;
    height: 100%;
    width: 280px;
    transition: right 0.3s ease-in-out;
    z-index: 30;
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(10px);

    &.drawer-open {
      right: 0;
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;

      .drawer-title {
        font-size: 1.1rem;
        font-weight: bold;
      }
    }

    .drawer-content {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;

      .definition-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        user-select: none;
        gap: 12px;
        transition: background-color 0.2s;

        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        &.active {
          background-color: rgba(0, 121, 107, 0.3);
        }

        .definition-text {
          flex: 1;
        }

        .check-icon {
          color: #00796B;
        }
      }
    }
  }
}

.replay-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  cursor: pointer;
  user-select: none;
  z-index: 3;
  background: none;
  border: none;
  padding: 12px 16px;
}

.replay-button svg {
  font-size: 1.4rem;
}

.replay-button span {
  font-size: 0.9rem;
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