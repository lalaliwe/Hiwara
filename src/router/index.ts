import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import home from '../views/home.vue'
import player from '../views/player.vue'

// 定义路由元信息接口
interface RouteMeta {
  transition?: string
  depth?: number
}

// 页面缓存栈 - 存储应该被缓存的页面名称
let cachedPages: string[] = []

const routes: Array<RouteRecordRaw & { meta?: RouteMeta }> = [
  {
    path: '/',
    name: 'Home',
    component: home,
    meta: { transition: 'stack', depth: 0 },
  }, {
    path: '/player',
    name: 'Player',
    component: player,
    meta: { transition: 'stack', depth: 1 },
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导航守卫
router.beforeEach((to, from) => {
  const toDepth = (to.meta?.depth as number) || 0
  const fromDepth = (from.meta?.depth as number) || 0
  
  // 设置过渡方向
  if (from.name === undefined) {
    // 初始导航
    to.meta.transition = 'stack'
  } else if (toDepth > fromDepth) {
    // 前进导航
    to.meta.transition = 'stack'
    // 前进时保留来源页面
    if (from.name && !cachedPages.includes(from.name as string)) {
      cachedPages.push(from.name as string)
      // console.log('✅ 路由守卫：前进导航，缓存页面:', from.name)
    }
  } else if (toDepth < fromDepth) {
    // 后退导航
    to.meta.transition = 'stack-reverse'
    // 后退时清理深层页面
    const oldLength = cachedPages.length
    cachedPages = cachedPages.filter(pageName => {
      const pageRoute = routes.find(route => route.name === pageName)
      const pageDepth = (pageRoute?.meta?.depth as number) || 0
      return pageDepth <= toDepth
    })
    if (oldLength !== cachedPages.length) {
      // console.log('✅ 路由守卫：后退导航，清理缓存')
    }
  } else {
    // 同级导航
    to.meta.transition = 'fade'
  }
})

// 获取缓存页面列表
export function getCachedPages(): string[] {
  // 确保返回非空数组，至少包含Home作为默认缓存
  const pages = [...cachedPages]
  if (pages.length === 0) {
    // 初始状态下确保Home被缓存
    const homeRoute = routes.find(r => r.name === 'Home')
    if (homeRoute && !pages.includes('Home')) {
      pages.push('Home')
    }
  }
  // console.log('✅ 获取缓存页面列表:', pages)
  return pages
}

// 重置方法
export const resetNavigationHistory = () => {
  cachedPages = []
}

export default router