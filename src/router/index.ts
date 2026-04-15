import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import home from '../views/home.vue'
import player from '../views/player.vue'
import image from '../views/image.vue'
import search from '../views/search.vue'
import zone from '../views/zone.vue'
import friends from '../views/friends.vue'
import setup from '../views/setup.vue'

// 定义路由元信息接口
interface RouteMeta {
  transition?: string
  depth?: number
  isFirstLoad?: boolean  // 添加标识是否是首次加载
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
    path: '/zone',
    name: 'Zone',
    component: zone,
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

// 标识是否是首次加载应用
let isFirstLoad = true;

// 导航守卫
router.beforeEach((to, from) => {
  // 如果是首次加载并且访问的是首页，则不使用过渡动画
  if (isFirstLoad && to.path === '/') {
    to.meta!.isFirstLoad = true;
    to.meta!.transition = '';  // 设置为空字符串，不使用过渡动画
    isFirstLoad = false;      // 重置标识
  } else if (isFirstLoad) {
    // 如果是首次加载但不是首页（比如直接访问某个深层页面），也需要设置标识
    to.meta!.isFirstLoad = true;
    isFirstLoad = false;
  }

  const toDepth = (to.meta?.depth as number) || 0
  const fromDepth = (from.meta?.depth as number) || 0

  let isBack = false
  if (historyStack.length > 1 && historyStack[historyStack.length - 2] === to.fullPath) {
    isBack = true
  }

  // 添加辅助函数判断是否应该缓存页面
  const shouldCachePage = (routeName: string | symbol | undefined) => {
    return routeName && typeof routeName === 'string' && !cachedPages.includes(routeName);
  };

  if (from.name === undefined) {
    to.meta.transition = to.meta?.isFirstLoad ? '' : 'stack'
    historyStack.push(to.fullPath)
    // 首次访问时也要考虑缓存目标页面
    if (shouldCachePage(to.name)) {
      cachedPages.push(to.name as string)
    }
  } else if (toDepth > fromDepth) {
    to.meta.transition = to.meta?.isFirstLoad ? '' : 'stack'
    historyStack.push(to.fullPath)
    // 缓存来源页面（父级页面）
    if (shouldCachePage(from.name)) {
      cachedPages.push(from.name as string)
    }
    // 同时也要缓存目标页面（当前访问的页面）
    if (shouldCachePage(to.name)) {
      cachedPages.push(to.name as string)
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
      to.meta.transition = to.meta?.isFirstLoad ? '' : 'stack'
      historyStack.push(to.fullPath)
      if (to.name && !cachedPages.includes(to.name as string)) {
        cachedPages.push(to.name as string)
      }
    }
  }

  // [修复] 特殊处理：当回到主页时，仅重置你自己的历史栈和缓存
  // 修改此部分，使首页也能被缓存（可选）
  if (to.path === '/' && from.path !== '/') {
    historyStack.length = 0
    historyStack.push(to.fullPath)
    // 注释掉清空缓存，改为只保留首页缓存
    // cachedPages = []
    // 只保留首页和其他必要的页面
    cachedPages = cachedPages.filter(pageName => {
      const pageRoute = routes.find(route => route.name === pageName)
      return pageRoute?.path === '/' // 只保留首页，可根据需要调整
    })
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