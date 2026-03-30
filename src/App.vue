<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  // console.log('✅ App.vue缓存更新:', pages)
}

// 监听路由变化
watch(
  () => route.path,
  () => {
    // 立即更新缓存
    setTimeout(updateCachedPages, 0)
  },
  { immediate: true }
)

// 额外监听路由变化事件
router.afterEach(() => {
  setTimeout(updateCachedPages, 0)
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

.fade-enter-from {
  opacity: 0;
}

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
</style>