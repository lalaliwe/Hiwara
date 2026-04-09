<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// 官方 API：Android 返回键
import { onBackButtonPress } from '@tauri-apps/api/app'
import type { PluginListener } from '@tauri-apps/api/core'
import { exit } from '@tauri-apps/plugin-process';
import { showShortToast } from './core/toast'
import { getCachedPages } from './router/index'

const route = useRoute()
const router = useRouter()

// 存储需要缓存的页面名称
const cachedPages = ref<string[]>([])

// 计算过渡名称
const transitionName = computed(() => {
  const transition = route.meta?.transition
  return typeof transition === 'string' ? transition : 'fade'
})

// 更新缓存页面列表
const updateCachedPages = async () => {
  await nextTick()
  const pages = getCachedPages()
  cachedPages.value = pages
}

// 监听路由变化
watch(
  () => route.path,
  () => {
    setTimeout(updateCachedPages, 0)
  },
  { immediate: true }
)

router.afterEach(() => {
  setTimeout(updateCachedPages, 0)
})

// =====================
// Toast / Snackbar 状态
// =====================
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarTimeout = ref(2000)
const snackbarColor = ref('#00796B')

// 监听自定义事件来显示 snackbar
onMounted(() => {
  window.addEventListener('show-snackbar', (event: any) => {
    snackbarText.value = event.detail.message
    snackbarTimeout.value = event.detail.timeout || 2000
    snackbarColor.value = event.detail.color || '#00796B'
    snackbar.value = true
  })

  // 只在 Android 上有效；桌面端不会触发
  onBackButtonPress(async ({ canGoBack }) => {
    // 检查是否为双击返回
    const currentTime = Date.now();

    // 1. 如果当前在首页
    if (route.path === '/') {
      // 双击返回退出应用
      if (lastBackPressedTime && currentTime - lastBackPressedTime <= DOUBLE_BACK_PRESS_TIMEOUT) {
        await exit(0);
        return;
      } else {
        // 第一次点击，提示用户再按一次退出
        lastBackPressedTime = currentTime;
        showShortToast('再按一次返回键退出应用')
        return;
      }
    }

    // 2. 不在首页：希望"回退到上一页"
    // 优先用 Tauri 提供的 canGoBack 信息
    if (canGoBack) {
      router.back()
      return
    }

    // 3. 极端情况：不在首页，且 WebHistory 已经回退到底
    // 再按返回，就直接退出应用
    if (lastBackPressedTime && currentTime - lastBackPressedTime <= DOUBLE_BACK_PRESS_TIMEOUT) {
      await exit(0);
      return;
    } else {
      // 提示用户再按一次退出
      lastBackPressedTime = currentTime;
      // 替换原来的console.log，使用toast提示
      showShortToast('再按一次返回键退出应用');
      return;
    }
  }).then(listener => {
    backListener = listener;
  })
})

// =====================
// Android 返回键处理（Tauri v2 官方 API）
// =====================

let backListener: PluginListener | null = null
// 添加双击返回检测相关变量
let lastBackPressedTime: number | null = null;
const DOUBLE_BACK_PRESS_TIMEOUT = 2000; // 2秒内再次按下返回键则退出

onUnmounted(() => {
  // 取消监听，防止内存泄漏
  backListener?.unregister()
})
</script>

<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <transition :name="transitionName" appear>
        <keep-alive :include="cachedPages" :max="10">
          <component :is="Component" :key="route.fullPath" v-if="Component" />
        </keep-alive>
      </transition>
    </router-view>

    <!-- Vuetify Snackbar -->
    <v-snackbar v-model="snackbar" :timeout="snackbarTimeout" :color="snackbarColor" top centered class="snackbar">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: #fafafa;
}

// 基础过渡样式
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 前进动画 - 新页面从右侧滑入并覆盖（同时执行）
.stack-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  border-radius: 12px 0 0 12px;
  will-change: transform, opacity;
}

.stack-enter-from {
  transform: translateX(100%) scale(0.98);
  opacity: 0.9;
}

.stack-enter-to {
  transform: translateX(0) scale(1);
  opacity: 1;
}

// 前进动画 - 旧页面向左移动（同时执行）
.stack-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
  will-change: transform, opacity;
}

.stack-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.stack-leave-to {
  transform: translateX(-25%);
  opacity: 0.8;
}

// 后退动画 - 底层页面从左侧进入（同时执行）
.stack-reverse-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
  will-change: transform, opacity;
}

.stack-reverse-enter-from {
  transform: translateX(-20%);
  opacity: 0.85;
}

.stack-reverse-enter-to {
  transform: translateX(0);
  opacity: 1;
}

// 后退动画 - 顶层页面向右侧滑出（同时执行）
.stack-reverse-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  border-radius: 0 12px 12px 0;
  will-change: transform, opacity;
}

.stack-reverse-leave-from {
  transform: translateX(0) scale(1);
  opacity: 1;
}

.stack-reverse-leave-to {
  transform: translateX(100%) scale(0.98);
  opacity: 0.9;
}

// 传统水平滑动（用于同级页面）
.slide-horizontal-enter-active,
.slide-horizontal-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
  will-change: transform;
}

.slide-horizontal-enter-from {
  transform: translateX(100%);
}

.slide-horizontal-leave-to {
  transform: translateX(-100%);
}

.snackbar {
  // 向上平移80px
  transform: translateY(calc(-80px - env(safe-area-inset-bottom, 0)));
}
</style>
