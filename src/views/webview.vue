<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { setStatusBarTextStyle } from '../plugins/navbarStyle'
import { Webview } from '@tauri-apps/api/webview'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { openUrl } from '@tauri-apps/plugin-opener'
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi'
import { invoke } from '@tauri-apps/api/core'
import { getUserToken } from '../core/database'
import LoadingHuawu from '../component/loadingHuawu.vue'
import errorHuawu from '../component/errorHuawu.vue'

defineOptions({
  name: 'Webview'
})

setStatusBarTextStyle('light')

const route = useRoute()
const router = useRouter()

// 从路由参数获取要加载的 URL
const url = ref(route.query.url as string)
const title = ref(route.query.title as string || url.value)

// WebView 容器引用
const webviewContainer = ref<HTMLElement | null>(null)
const externalWebview = ref<Webview | null>(null)
const webviewLabel = 'embedded-webview'
const loadState = ref<'loading' | 'success' | 'failed'>('loading')

// 平台检测（延迟初始化）
const isMobile = ref(false)
let platformChecked = false

// 域名 CSS 配置（扩展版）
interface DomainCSSConfig {
  hideSelectors: string[];  // 需要隐藏的元素选择器
  customCSS: string;        // 自定义 CSS 代码
}

const domainCSSConfig: Record<string, DomainCSSConfig> = {
  'www.iwara.tv': {
    hideSelectors: ['.header__menu', 'footer'],
    customCSS: `
      .header__logo{margin-left: 10px;}
      .header{pointer-events: none;}
    `  // 可以添加自定义 CSS
  },
  // 可以继续添加其他域名的配置
  // 'example.com': {
  //   hideSelectors: ['.ad-banner', '#popup'],
  //   customCSS: `
  //     body { font-size: 16px !important; }
  //     .container { padding: 20px !important; }
  //   `
  // }
}

let containerResizeObserver: ResizeObserver | null = null
let windowResizeListener: (() => void) | null = null

// ========== 通用工具函数 ==========

/** 检测是否移动端平台 */
const checkPlatform = async (): Promise<boolean> => {
  if (platformChecked) return isMobile.value
  platformChecked = true
  // 使用 User-Agent 检测移动端
  // Tauri Android WebView 的 UA 包含 "Android"
  // Tauri iOS WebView 的 UA 包含 "iPhone"/"iPad"/"iPod"
  isMobile.value = /android|iphone|ipad|ipod/i.test(navigator.userAgent)
  console.log('平台检测(UA):', navigator.userAgent, '→ 移动端:', isMobile.value)
  return isMobile.value
}

/** 测试插件桥接是否正常 */
const testPluginBridge = async (): Promise<boolean> => {
  try {
    const result = await invoke<{ value?: string; message?: string }>('plugin:mwebview|ping', {
      payload: { value: 'test' }
    })
    console.log('MWebview 插件桥接测试成功:', result)
    return true
  } catch (error) {
    console.error('MWebview 插件桥接测试失败:', error)
    return false
  }
}

/** 计算 topBar 下方起始 Y 坐标 */
const getWebviewStartY = (rect: DOMRect): number => {
  const safeAreaTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('safe-area-inset-top')) || 0
  const topBarHeight = safeAreaTop + 60
  return rect.top + topBarHeight
}

/** 构建注入用 CSS 规则字符串 */
const buildCSSRules = (cssConfig: DomainCSSConfig): string => {
  let cssRules = ''
  if (cssConfig.hideSelectors.length > 0) {
    cssRules += cssConfig.hideSelectors
      .map(selector => `${selector} { display: none !important; }`)
      .join('\n')
  }
  if (cssConfig.customCSS) {
    cssRules += '\n' + cssConfig.customCSS
  }
  return cssRules.trim()
}

/** 构建 token 注入脚本 */
const buildTokenScript = (token: string | null): string => {
  return `
    (function() {
      if ('${token}') {
        try {
          localStorage.setItem('token', '${token}');
          console.log('[WebView] Auth token injected to localStorage');
        } catch (e) {
          console.error('[WebView] Failed to set localStorage:', e);
        }
      }
    })();
  `
}

/** 注入 CSS 和 token 到 WebView（通用逻辑，平台无关） */
const injectContentToWebview = async () => {
  try {
    const token = await getUserToken()
    console.log('获取到 token:', token ? '存在' : '不存在')

    const urlObj = new URL(url.value)
    const domain = urlObj.hostname
    const cssConfig = domainCSSConfig[domain]
    console.log('域名:', domain, 'CSS 配置:', cssConfig ? '存在' : '不存在')

    if (isMobile.value) {
      // == 移动端：使用插件注入 ==
      if (cssConfig) {
        const cssRules = buildCSSRules(cssConfig)
        if (cssRules) {
          console.log('注入初始化 CSS:', cssRules)
          await invoke('plugin:mwebview|inject_init_script', {
            payload: { cssRules }
          })
          console.log('初始化 CSS 注入成功')
        }
      }

      const script = buildTokenScript(token)
      await invoke('plugin:mwebview|inject_script', {
        payload: { script }
      })
      console.log('脚本注入成功')
    } else {
      // == 桌面端：使用 Rust 命令注入 ==
      if (cssConfig) {
        const cssRules = buildCSSRules(cssConfig)
        if (cssRules) {
          console.log('注入初始化 CSS:', cssRules)
          await invoke('inject_webview_initialization_script', {
            webviewLabel: webviewLabel,
            cssRules: cssRules
          })
          console.log('初始化 CSS 注入成功')
        }
      }

      const script = buildTokenScript(token)
      await invoke('inject_webview_script', {
        webviewLabel: webviewLabel,
        script: script
      })
      console.log('脚本注入成功')
    }
  } catch (error) {
    console.error('注入内容失败:', error)
    throw error // 向上传播，让调用方处理
  }
}

// ========== 桌面端 WebView ==========

/** 桌面端：更新 WebView 边界 */
const updateDesktopWebviewBounds = async () => {
  if (!webviewContainer.value || !externalWebview.value) return
  try {
    const rect = webviewContainer.value.getBoundingClientRect()
    const startY = getWebviewStartY(rect)
    console.log('桌面端 TopBar 高度 offset:', startY - rect.top, '容器位置:', rect)

    await externalWebview.value.setPosition(new LogicalPosition(rect.left, startY))
    await externalWebview.value.setSize(new LogicalSize(rect.width, rect.height - (startY - rect.top)))
    console.log('桌面端 WebView 边界已更新')
  } catch (error) {
    console.error('更新桌面端 webview 边界失败:', error)
  }
}

/** 桌面端：初始化 Tauri 子 WebView */
const initDesktopWebview = async () => {
  if (!webviewContainer.value) return

  const windowInstance = getCurrentWebviewWindow()

  // 关闭已存在的 webview
  try {
    const existing = await Webview.getByLabel(webviewLabel)
    if (existing) {
      console.log('关闭已存在的 webview')
      await existing.close()
    }
  } catch (error) {
    console.log('没有找到已存在的 webview')
  }

  try {
    const rect = webviewContainer.value.getBoundingClientRect()
    console.log('桌面端 WebView 容器位置:', rect)

    const newWebview = new Webview(windowInstance, webviewLabel, {
      url: url.value,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      focus: true,
      dragDropEnabled: true,
      transparent: true
    })

    externalWebview.value = newWebview

    // 监听容器尺寸变化
    containerResizeObserver = new ResizeObserver(() => {
      updateDesktopWebviewBounds()
    })
    containerResizeObserver.observe(webviewContainer.value)

    // 监听窗口 resize 事件
    windowResizeListener = () => {
      updateDesktopWebviewBounds()
    }
    window.addEventListener('resize', windowResizeListener, { passive: true })

    // 监听创建事件
    newWebview.once('tauri://created', async () => {
      console.log('桌面端 WebView 创建成功')
      await injectContentToWebview()
      await updateDesktopWebviewBounds()
      loadState.value = 'success'
      console.log('桌面端加载完成，显示网页内容')
    })

    // 监听错误事件
    newWebview.once('tauri://error', () => {
      console.error('桌面端 WebView 创建失败')
      externalWebview.value = null
      loadState.value = 'failed'
    })

  } catch (error) {
    console.error('创建桌面端 webview 失败:', error)
    loadState.value = 'failed'
    try {
      await openUrl(url.value)
    } catch (openError) {
      console.error('在浏览器中打开失败:', openError)
    }
  }
}

/** 桌面端：销毁 WebView */
const destroyDesktopWebview = async () => {
  if (externalWebview.value) {
    try {
      await externalWebview.value.close()
      console.log('桌面端 WebView 已关闭')
      externalWebview.value = null
    } catch (error) {
      console.error('关闭桌面端 webview 失败:', error)
    }
  }
}

// ========== 移动端 WebView（插件） ==========

/** 移动端：更新 WebView 边界 */
const updateMobileWebviewBounds = async () => {
  if (!webviewContainer.value) return
  try {
    const rect = webviewContainer.value.getBoundingClientRect()
    const startY = getWebviewStartY(rect)
    console.log('移动端 TopBar 高度 offset:', startY - rect.top, '容器位置:', rect)

    await invoke('plugin:mwebview|update_webview_bounds', {
      payload: {
        x: rect.left,
        y: startY,
        width: rect.width,
        height: rect.height - (startY - rect.top)
      }
    })
    console.log('移动端 WebView 边界已更新')
  } catch (error) {
    console.error('更新移动端 webview 边界失败:', error)
  }
}

/** 移动端：通过插件初始化原生 WebView */
const initMobileWebview = async () => {
  if (!webviewContainer.value) {
    console.error('webviewContainer 未找到')
    return
  }

  console.log('开始初始化移动端 WebView, URL:', url.value)

  // 1. 先测试插件桥接
  const bridgeOk = await testPluginBridge()
  if (!bridgeOk) {
    console.error('MWebview 插件不可用，回退到系统浏览器')
    loadState.value = 'failed'
    try {
      await openUrl(url.value)
    } catch (openError) {
      console.error('在浏览器中打开失败:', openError)
    }
    return
  }

  // 等待路由切换动画完成
  await new Promise(resolve => setTimeout(resolve, 300))
  console.log('路由动画完成，开始创建移动端 WebView')

  // 先销毁已存在的 WebView
  try {
    await invoke('plugin:mwebview|destroy_webview')
  } catch (error) {
    console.log('没有已存在的 webview 需要销毁')
  }

  try {
    const rect = webviewContainer.value.getBoundingClientRect()
    const startY = getWebviewStartY(rect)
    console.log('移动端 WebView 容器位置:', rect, '起始 Y:', startY)

    // 创建原生 WebView
    await invoke('plugin:mwebview|create_webview', {
      payload: {
        url: url.value,
        x: rect.left,
        y: startY,
        width: rect.width,
        height: rect.height - (startY - rect.top),
        transparent: true
      }
    })
    console.log('移动端 WebView 创建成功')

    // 设置容器尺寸变化监听
    containerResizeObserver = new ResizeObserver(() => {
      updateMobileWebviewBounds()
    })
    containerResizeObserver.observe(webviewContainer.value)

    // 窗口 resize 监听
    windowResizeListener = () => {
      updateMobileWebviewBounds()
    }
    window.addEventListener('resize', windowResizeListener, { passive: true })

    // 注入 CSS 和 token
    await injectContentToWebview()

    // 首次更新边界
    await updateMobileWebviewBounds()

    loadState.value = 'success'
    console.log('移动端加载完成，显示网页内容')

  } catch (error) {
    console.error('创建移动端 webview 失败:', error)
    loadState.value = 'failed'
    try {
      await openUrl(url.value)
    } catch (openError) {
      console.error('在浏览器中打开失败:', openError)
    }
  }
}

/** 移动端：销毁 WebView */
const destroyMobileWebview = async () => {
  try {
    await invoke('plugin:mwebview|destroy_webview')
    console.log('移动端 WebView 已销毁')
  } catch (error) {
    console.error('销毁移动端 webview 失败:', error)
  }
}

// ========== 统一接口 ==========

/** 更新 WebView 边界（平台自适应） */
const updateWebviewBounds = async () => {
  if (isMobile.value) {
    await updateMobileWebviewBounds()
  } else {
    await updateDesktopWebviewBounds()
  }
}

/** 初始化 WebView（平台自适应） */
const initWebview = async () => {
  await nextTick()

  if (!webviewContainer.value) {
    console.error('webviewContainer 未找到')
    return
  }

  // 先检测平台
  const mobile = await checkPlatform()
  console.log('开始初始化 WebView, URL:', url.value, '平台:', mobile ? '移动端' : '桌面端')

  if (mobile) {
    await initMobileWebview()
  } else {
    await initDesktopWebview()
  }
}

// 返回上一页
const goBack = async () => {
  console.log('返回上一页，关闭 WebView')
  await destroyWebview()
  router.back()
}

// 销毁 WebView（平台自适应）
const destroyWebview = async () => {
  if (isMobile.value) {
    await destroyMobileWebview()
  } else {
    await destroyDesktopWebview()
  }

  // 清理监听器（通用）
  if (containerResizeObserver) {
    containerResizeObserver.disconnect()
    containerResizeObserver = null
  }
  if (windowResizeListener) {
    window.removeEventListener('resize', windowResizeListener)
    windowResizeListener = null
  }
}

onMounted(async () => {
  console.log('组件挂载，初始化 WebView')
  await initWebview()
})

onUnmounted(async () => {
  console.log('组件卸载，清理资源')
  await destroyWebview()
})
</script>
<template>
  <div class="webview-container">
    <div class="topBar">
      <div class="goback" @click="goBack">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </div>
      <div class="label">
        {{ title }}
      </div>
    </div>
    <!-- 加载状态显示 -->
    <div v-if="loadState === 'loading'" class="loading-overlay">
      <LoadingHuawu>正在加载中</LoadingHuawu>
    </div>
    <div v-else-if="loadState === 'failed'" class="loading-overlay">
      <errorHuawu>网页加载失败了喵~</errorHuawu>
    </div>

    <!-- WebView 容器 -->
    <div ref="webviewContainer" class="webview-iframe"></div>
  </div>
</template>
<style lang="scss" scoped>
.webview-container {
  width: 100%;
  height: 100vh;
  position: relative;
  background-color: var(--color-bg-page);
}

.topBar {
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 400;
  padding-top: env(safe-area-inset-top, 0);
  height: calc(env(safe-area-inset-top, 0) + 60px);
  background-color: var(--color-primary-solid);
  color: var(--color-text-on-primary);
  display: flex;
  align-items: center;
  user-select: none;

  .goback {
    padding: 0 16px;
    height: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;

    svg {
      font-size: 1.5rem;
      color: white;
    }

    &:active {
      opacity: 0.7;
    }
  }

  .label {
    font-size: 1.2rem;
    font-weight: 500;
  }
}

.webview-iframe {
  width: 100%;
  height: 100vh;
  border: none;
  padding-top: calc(env(safe-area-inset-top, 0) + 60px);
  box-sizing: border-box;
}

// 加载指示器遮罩层
.loading-overlay {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0) + 60px);
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-page);
  z-index: 100;
}

.loading-text {
  color: var(--color-text-placeholder-light);
  font-size: 14px;
}
</style>
