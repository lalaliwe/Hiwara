import { createRouter, createWebHistory, type RouteRecordRaw, type RouteLocationNormalized } from 'vue-router';
import home from '../views/home.vue';
import player from '../views/player.vue';
import image from '../views/image.vue';
import search from '../views/search.vue';
import zone from '../views/zone.vue';
import forum from '../views/forum.vue';
import forumPost from '../views/forum/post.vue';
import forumPublish from '../views/forum/publish.vue';
import friends from '../views/friends.vue';
import history from '../views/history.vue';
import setup from '../views/setup.vue';
import favorites from '../views/favorites.vue';
import offlineCache from '../views/offlineCache.vue';
import login from '../views/login.vue'; // 导入登录页面
import webviewFrame from '../views/webview.vue';

// setup子页面
import setup_definition from '../views/setup/definition.vue';
import setup_searchMode from '../views/setup/searchMode.vue';
import setup_download from '../views/setup/download.vue';
import setup_aria2 from '../views/setup/aria2.vue';
import setup_language from '../views/setup/language.vue';
import setup_about from '../views/setup/about.vue';

// ========================
// 类型定义
// ========================
interface RouteMeta {
  transition?: string
  isFirstLoad?: boolean
  componentName?: string // 显式声明组件名（可选）
  cacheKey?: string       // 用于 keep-alive 的唯一标识
}

type PageStackItem = {
  key: string               // 路由唯一标识 (name + sorted params)
  cacheKey: string          // 用于 keep-alive include 的唯一标识
  path: string
  fullPath: string
}

// ========================
// 工具函数
// ========================
const getPageKey = (route: RouteLocationNormalized): string => {
  const params = route.params || {}
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((obj, key) => {
      obj[key] = params[key]
      return obj
    }, {} as Record<string, any>)
  return `${String(route.name)}_${JSON.stringify(sortedParams)}`
}

/** 从路由配置中提取组件名称 */
const getComponentName = (route: RouteLocationNormalized): string => {
  const matched = route.matched
  if (matched.length === 0) return 'AnonymousComponent'
  const component = matched[matched.length - 1].components?.default
  if (typeof component === 'object' && component !== null) {
    // @ts-ignore 尝试读取 name 属性
    if (component.name) return component.name
    // @ts-ignore 或 __name (组合式 API 编译后)
    if (component.__name) return component.__name
  }
  return 'AnonymousComponent'
}

// ========================
// 路由配置
// ========================
const routes: Array<RouteRecordRaw & { meta?: RouteMeta }> = [
  {
    path: '/login',
    name: 'Login',
    component: login,
    meta: { transition: 'stack' },
  },
  {
    path: '/',
    name: 'Home',
    component: home,
    meta: { transition: 'stack', componentName: 'Home' },
  },
  {
    path: '/player/:id',
    name: 'Player',
    component: player,
    meta: { transition: 'stack', componentName: 'Player' },
  },
  {
    path: '/image/:id',
    name: 'Image',
    component: image,
    meta: { transition: 'stack', componentName: 'Image' },
  },
  {
    path: '/search',
    name: 'Search',
    component: search,
    meta: { transition: 'stack', componentName: 'Search' },
  },
  {
    path: '/zone/:username?',
    name: 'Zone',
    component: zone,
    meta: { transition: 'stack', componentName: 'Zone' },
  },
  {
    path: '/forum',
    name: 'Forum',
    component: forum,
    meta: { transition: 'stack', componentName: 'Forum' },
  },
  {
    path: '/forum/post',
    name: 'ForumPost',
    component: forumPost,
    meta: { transition: 'stack', componentName: 'ForumPost' },
  },
  {
    path: '/forum/publish',
    name: 'ForumPublish',
    component: forumPublish,
    meta: { transition: 'stack', componentName: 'ForumPublish' },
  },
  {
    path: '/friends/:uid?',
    name: 'Friends',
    component: friends,
    meta: { transition: 'stack', componentName: 'Friends' },
  },
  {
    path: '/history',
    name: 'History',
    component: history,
    meta: { transition: 'stack', componentName: 'History' },
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: favorites,
    meta: { transition: 'stack', componentName: 'Favorites' },
  },
  {
    path: '/offline-cache',
    name: 'OfflineCache',
    component: offlineCache,
    meta: { transition: 'stack', componentName: 'OfflineCache' },
  },
  {
    path: '/setup',
    name: 'Setup',
    component: setup,
    meta: { transition: 'stack', componentName: 'Setup' },
  },
  // ------setup子页面------
  {
    path: '/setup/definition',
    name: 'SetupDefinition',
    component: setup_definition,
    meta: { transition: 'stack', componentName: 'SetupDefinition' },
  },
  {
    path: '/setup/searchMode',
    name: 'SetupSearchMode',
    component: setup_searchMode,
    meta: { transition: 'stack', componentName: 'SetupSearchMode' },
  },
  {
    path: '/setup/download',
    name: 'SetupDownload',
    component: setup_download,
    meta: { transition: 'stack', componentName: 'SetupDownload' },
  },
  {
    path: '/setup/aria2',
    name: 'SetupAria2',
    component: setup_aria2,
    meta: { transition: 'stack', componentName: 'SetupAria2' },
  },
  {
    path: '/setup/language',
    name: 'SetupLanguage',
    component: setup_language,
    meta: { transition: 'stack', componentName: 'SetupLanguage' },
  },
  {
    path: '/setup/about',
    name: 'SetupAbout',
    component: setup_about,
    meta: { transition: 'stack', componentName: 'SetupAbout' },
  },
  // ------end------
  {
    path: '/webview',
    name: 'Webview',
    component: webviewFrame,
    meta: { transition: 'stack', componentName: 'Webview' },
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ========================
// 页面栈管理
// ========================
let pageStack: PageStackItem[] = []
let isFirstLoad = true

/** 将当前路由信息转换为栈项 */
const createStackItem = (route: RouteLocationNormalized): PageStackItem => {
  const key = getPageKey(route)
  // 优先使用 meta.componentName，否则从组件定义推断
  const metaName = (route.meta as RouteMeta)?.componentName
  const baseComponentName = metaName || getComponentName(route)

  // 生成唯一缓存标识：对于动态路由，拼接 id 参数
  let cacheKey = baseComponentName
  const id = route.params.id
  if (id) {
    cacheKey = `${baseComponentName}_${id}`
  }

  return {
    key,
    cacheKey,
    path: route.path,
    fullPath: route.fullPath,
  }
}

// ========================
// 路由守卫 - 登录验证
// ========================
// 移除了初始化逻辑，因为已在 main.ts 中统一初始化

router.beforeEach(async (to, from) => {
  // 首次加载处理（禁用首页动画）
  if (isFirstLoad) {
    to.meta = to.meta || {}
    to.meta.isFirstLoad = true
    if (to.path === '/') {
      to.meta.transition = ''
    }
    isFirstLoad = false
  }

  const toItem = createStackItem(to)
  const fromKey = from.name ? getPageKey(from) : null

  // 将 cacheKey 存入 meta，供 App.vue 使用
  to.meta.cacheKey = toItem.cacheKey

  // 检查登录状态 - 直接从 Store 获取（已在 main.ts 中初始化）
  const { isLogin } = await import('../core/store');
  const isLoggedIn = isLogin().value;

  // 如果未登录且目标不是登录页，重定向到登录页
  if (!isLoggedIn && to.path !== '/login') {
    return '/login';
  }

  // 如果已登录且目标是登录页，重定向到首页
  if (isLoggedIn && to.path === '/login') {
    return '/';
  }

  // 初始化：无来源路由（冷启动直接进入）
  if (!fromKey) {
    pageStack = [toItem]
    to.meta.transition = to.meta?.isFirstLoad ? '' : 'stack'
    return
  }

  // 同一页面（key 相同）导航（仅 query/hash 变化），无动画，不改变栈
  if (toItem.key === fromKey) {
    to.meta.transition = ''
    return
  }

  const stackIndex = pageStack.findIndex(item => item.key === toItem.key)
  const isBack = stackIndex !== -1 && stackIndex < pageStack.length - 1

  // 特殊处理：主动跳转至首页（非后退）→ 清空栈，只保留首页
  if (to.path === '/' && from.path !== '/') {
    pageStack = [toItem]
    to.meta.transition = 'stack-reverse' // 回到首页用反向动画，视觉舒适
    return
  }

  if (isBack) {
    // 后退：截断栈，销毁被出栈的页面
    pageStack = pageStack.slice(0, stackIndex + 1)
    to.meta.transition = 'stack-reverse'
  } else {
    // 前进：当前页入栈，新页追加
    // 注意：这里并未将 from 对应的栈项重复推入，因为 from 已在栈中
    // 仅需确保 toItem 不在栈尾时才 push
    if (pageStack[pageStack.length - 1]?.key !== toItem.key) {
      pageStack.push(toItem)
    }
    to.meta.transition = 'stack'
  }
})

// ========================
// 导出函数供外部使用
// ========================
/** 获取当前 keep-alive 应缓存的组件唯一标识数组（去重） */
export function getCachedComponentNames(): string[] {
  const keys = pageStack.map(item => item.cacheKey)
  return [...new Set(keys)]
}

/** 获取当前栈中所有页面的唯一标识（调试用） */
export function getCachedPageKeys(): string[] {
  return pageStack.map(item => item.key)
}

/** 重置导航历史（如退出登录后调用） */
export const resetNavigationHistory = () => {
  pageStack = []
  isFirstLoad = true
}

export default router