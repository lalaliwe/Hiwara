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
const loadState = ref<'loading' | 'success' | 'failed'>('loading') // 加载状态：loading/success/failed

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

// 更新 WebView 边界
const updateWebviewBounds = async () => {
  if (!webviewContainer.value || !externalWebview.value) return

  try {
    const rect = webviewContainer.value.getBoundingClientRect()

    // 直接计算 topBar 高度：safe-area-inset-top + 60px
    const safeAreaTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('safe-area-inset-top')) || 0
    const topBarHeight = safeAreaTop + 60

    console.log('TopBar 高度:', topBarHeight, '容器位置:', rect)

    // WebView 从 topBar 下方开始
    await externalWebview.value.setPosition(new LogicalPosition(rect.left, rect.top + topBarHeight))
    await externalWebview.value.setSize(new LogicalSize(rect.width, rect.height - topBarHeight))

    console.log('WebView 边界已更新')
  } catch (error) {
    console.error('更新 webview 边界失败:', error)
  }
}

// 初始化 WebView
const initWebview = async () => {
  await nextTick()

  if (!webviewContainer.value) {
    console.error('webviewContainer 未找到')
    return
  }

  console.log('开始初始化 WebView, URL:', url.value)

  // 等待路由切换动画完成（250ms）
  await new Promise(resolve => setTimeout(resolve, 300))
  console.log('路由动画完成，开始创建 WebView')

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
    console.log('WebView 容器位置:', rect)

    // 创建新的 WebView
    const newWebview = new Webview(windowInstance, webviewLabel, {
      url: url.value,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      focus: true,
      dragDropEnabled: true,
      transparent: true // 设置 WebView 背景透明
    })

    externalWebview.value = newWebview

    // 监听容器尺寸变化
    containerResizeObserver = new ResizeObserver(() => {
      updateWebviewBounds()
    })
    containerResizeObserver.observe(webviewContainer.value)

    // 监听窗口 resize 事件
    windowResizeListener = () => {
      updateWebviewBounds()
    }
    window.addEventListener('resize', windowResizeListener, { passive: true })

    // 监听创建事件
    newWebview.once('tauri://created', async () => {
      console.log('WebView 创建成功')

      try {
        // 从数据库获取 token
        const token = await getUserToken()
        console.log('获取到 token:', token ? '存在' : '不存在')

        // 提取当前 WebView 的域名
        const urlObj = new URL(url.value)
        const domain = urlObj.hostname

        // 获取该域名的 CSS 配置
        const cssConfig = domainCSSConfig[domain]
        console.log('域名:', domain, 'CSS 配置:', cssConfig ? '存在' : '不存在')

        // 如果有 CSS 配置，注入初始化 CSS
        if (cssConfig) {
          // 构建完整的 CSS 规则
          let cssRules = ''

          // 1. 添加隐藏规则
          if (cssConfig.hideSelectors.length > 0) {
            cssRules += cssConfig.hideSelectors
              .map(selector => `${selector} { display: none !important; }`)
              .join('\n')
          }

          // 2. 添加自定义 CSS
          if (cssConfig.customCSS) {
            cssRules += '\n' + cssConfig.customCSS
          }

          if (cssRules.trim()) {
            console.log('注入初始化 CSS:', cssRules)

            await invoke('inject_webview_initialization_script', {
              webviewLabel: webviewLabel,
              cssRules: cssRules
            })

            console.log('初始化 CSS 注入成功')
          }
        }

        // 构建 JavaScript 脚本（仅处理 token 注入）
        const script = `
          (function() {
            // 设置认证 token
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

        // 调用 Rust 命令执行脚本
        await invoke('inject_webview_script', {
          webviewLabel: webviewLabel,
          script: script
        })

        console.log('脚本注入成功')
      } catch (error) {
        console.error('注入脚本失败:', error)
      }

      await updateWebviewBounds()
      loadState.value = 'success'
      console.log('加载完成，显示网页内容')
    })

    // 监听错误事件
    newWebview.once('tauri://error', (error) => {
      console.error('WebView 创建失败:', error)
      externalWebview.value = null
      loadState.value = 'failed' // 设置为失败状态
    })

  } catch (error) {
    console.error('创建 webview 失败:', error)
    // 降级方案：在系统浏览器中打开
    console.log('尝试在系统浏览器中打开')
    loadState.value = 'failed' // 设置为失败状态
    try {
      await openUrl(url.value)
    } catch (openError) {
      console.error('在浏览器中打开失败:', openError)
    }
  }
}

// 返回上一页
const goBack = async () => {
  console.log('返回上一页，关闭 WebView')
  // 先关闭 WebView
  await destroyWebview()
  router.back()
}

// 销毁 WebView
const destroyWebview = async () => {
  if (externalWebview.value) {
    try {
      await externalWebview.value.close()
      console.log('WebView 已关闭')
      externalWebview.value = null
    } catch (error) {
      console.error('关闭 webview 失败:', error)
    }
  }

  // 清理监听器
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
  background-color: #fafafa;
}

.topBar {
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 400;
  padding-top: env(safe-area-inset-top, 0);
  height: calc(env(safe-area-inset-top, 0) + 60px);
  background-color: rgba(0, 121, 107, 1);
  color: #fff;
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
  background-color: #fafafa;
  z-index: 100;
}

.loading-text {
  color: #999;
  font-size: 14px;
}
</style>