import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import home from '../views/home.vue'
import player from '../views/player.vue'
import image from '../views/image.vue'
import search from '../views/search.vue'
import friends from '../views/friends.vue'
import setup from '../views/setup.vue'

// 定义路由元信息接口
interface RouteMeta {
  transition?: string
  depth?: number
}

// 页面缓存栈 - 存储应该被缓存的页面名称
let cachedPages: string[] = []

// 历史记录栈 - 用于判断同级路由的前进/后退
const historyStack: string[] = []

const routes: Array<RouteRecordRaw & { meta?: RouteMeta }> = [
  {
    path: '/',
    name: 'Home',
    component: home,
    meta: { transition: 'stack', depth: 0 },
  },
  {
    path: '/player',
    name: 'Player',
    component: player,
    meta: { transition: 'stack', depth: 1 },
  },
  {
    path: '/image',
    name: 'Image',
    component: image,
    meta: { transition: 'stack', depth: 1 },
  },
  {
    path: '/search',
    name: 'Search',
    component: search,
    meta: { transition: 'stack', depth: 1 },
  },
  {
    path: '/friends',
    name: 'Friends',
    component: friends,
    meta: { transition: 'stack', depth: 1 },
  },
  {
    path: '/setup',
    name: 'Setup',
    component: setup,
    meta: { transition: 'stack', depth: 1 },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导航守卫
router.beforeEach((to, from) => {
  const toDepth = (to.meta?.depth as number) || 0
  const fromDepth = (from.meta?.depth as number) || 0

  let isBack = false
  if (historyStack.length > 1 && historyStack[historyStack.length - 2] === to.fullPath) {
    isBack = true
  }

  if (from.name === undefined) {
    to.meta.transition = 'stack'
    historyStack.push(to.fullPath)
  } else if (toDepth > fromDepth) {
    to.meta.transition = 'stack'
    historyStack.push(to.fullPath)
    if (from.name && !cachedPages.includes(from.name as string)) {
      cachedPages.push(from.name as string)
    }
  } else if (toDepth < fromDepth) {
    to.meta.transition = 'stack-reverse'
    historyStack.pop()
    cachedPages = cachedPages.filter(pageName => {
      const pageRoute = routes.find(route => route.name === pageName)
      const pageDepth = (pageRoute?.meta?.depth as number) || 0
      return pageDepth <= toDepth
    })
  } else {
    if (isBack) {
      to.meta.transition = 'stack-reverse'
      historyStack.pop()
    } else {
      to.meta.transition = 'stack'
      historyStack.push(to.fullPath)
      if (to.name && !cachedPages.includes(to.name as string)) {
        cachedPages.push(to.name as string)
      }
    }
  }

  // [修复] 特殊处理：当回到主页时，仅重置你自己的历史栈和缓存
  if (to.path === '/' && from.path !== '/') {
    historyStack.length = 0
    historyStack.push(to.fullPath)
    cachedPages = []

    // 🚨 注意：这里千万不要写 return！
    // 让原本的 router.replace('/') 或 router.back() 自然执行下去即可
  }
})

export function getCachedPages(): string[] {
  const pages = [...cachedPages]
  if (pages.length === 0) {
    const homeRoute = routes.find(r => r.name === 'Home')
    if (homeRoute && !pages.includes('Home')) {
      pages.push('Home')
    }
  }
  return pages
}

export const resetNavigationHistory = () => {
  cachedPages = []
  historyStack.length = 0
}

export default router
