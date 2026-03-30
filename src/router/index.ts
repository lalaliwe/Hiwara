import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import home from '../views/home.vue'
import player from '../views/player.vue'
import image from '../views/image.vue'

// 定义路由元信息接口
interface RouteMeta {
  transition?: string
  depth?: number
}

// 页面缓存栈 - 存储应该被缓存的页面名称
let cachedPages: string[] = []

// [新增] 历史记录栈 - 用于判断同级路由的前进/后退
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
  }, {
    path: '/image',
    name: 'Image',
    component: image,
    meta: { transition: 'stack', depth: 2 },
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

  // [新增] 判断是否为后退行为
  let isBack = false
  // 检查历史栈中倒数第二个是否为目标路由（fullPath 匹配）
  if (historyStack.length > 1 && historyStack[historyStack.length - 2] === to.fullPath) {
    isBack = true
  }

  // 设置过渡方向
  if (from.name === undefined) {
    // 初始导航
    to.meta.transition = 'stack'
    historyStack.push(to.fullPath) // 记录初始路径
  } else if (toDepth > fromDepth) {
    // --- 跨层级前进 (例如 Home -> Player) ---
    to.meta.transition = 'stack'
    historyStack.push(to.fullPath) // 入栈

    if (from.name && !cachedPages.includes(from.name as string)) {
      cachedPages.push(from.name as string)
    }
  } else if (toDepth < fromDepth) {
    // --- 跨层级后退 (例如 Player -> Home) ---
    to.meta.transition = 'stack-reverse'
    historyStack.pop() // 出栈

    // 清理深层页面缓存
    const oldLength = cachedPages.length
    cachedPages = cachedPages.filter(pageName => {
      const pageRoute = routes.find(route => route.name === pageName)
      const pageDepth = (pageRoute?.meta?.depth as number) || 0
      return pageDepth <= toDepth
    })
  } else {
    // --- 同层级导航 (Query 改变场景) ---
    if (isBack) {
      // 后退 (例如 Player?id=2 -> Player?id=1)
      to.meta.transition = 'stack-reverse'
      historyStack.pop() // 出栈

      // 注意：这里不需要修改 cachedPages。
      // 因为 keep-alive 结合 :key="fullPath" 已经缓存了旧实例。
      // 当我们后退时，旧实例会被恢复；当前实例会被隐藏。
    } else {
      // 前进 (例如 Player?id=1 -> Player?id=2)
      to.meta.transition = 'stack'
      historyStack.push(to.fullPath) // 入栈

      // 确保当前组件名在缓存列表中
      if (to.name && !cachedPages.includes(to.name as string)) {
        cachedPages.push(to.name as string)
      }
    }
  }

  // [新增] 特殊处理：当回到主页时，重置历史栈
  // 这样在主页按返回键不会回到上一个页面
  if (to.path === '/' && from.path !== '/') {
    // 无论通过何种方式回到主页，都清空历史栈，只保留主页
    historyStack.length = 0
    historyStack.push(to.fullPath)
    // 清理所有深层页面缓存
    cachedPages = []
  }
})

// 获取缓存页面列表
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

// 重置方法
export const resetNavigationHistory = () => {
  cachedPages = []
  historyStack.length = 0 // 清空历史栈
}

export default router
