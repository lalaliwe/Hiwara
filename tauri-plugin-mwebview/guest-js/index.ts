import { invoke } from '@tauri-apps/api/core'

/**
 * Ping - 测试插件桥接是否正常
 */
export async function ping(value?: string): Promise<{ value?: string; message?: string }> {
  return await invoke('plugin:mwebview|ping', {
    payload: { value }
  })
}

/**
 * 创建嵌入式 WebView
 * @param options - WebView 配置
 */
export async function createWebview(options: {
  url: string
  x: number
  y: number
  width: number
  height: number
  transparent?: boolean
}): Promise<void> {
  await invoke('plugin:mwebview|create_webview', {
    payload: options
  })
}

/**
 * 更新 WebView 位置和尺寸
 * 配合 ResizeObserver 实现响应式布局
 */
export async function updateWebviewBounds(options: {
  x: number
  y: number
  width: number
  height: number
}): Promise<void> {
  await invoke('plugin:mwebview|update_webview_bounds', {
    payload: options
  })
}

/**
 * 销毁 WebView
 */
export async function destroyWebview(): Promise<void> {
  await invoke('plugin:mwebview|destroy_webview')
}

/**
 * 注入 JavaScript 脚本（页面加载后执行）
 * @param script - 要执行的 JavaScript 代码
 */
export async function injectScript(script: string): Promise<void> {
  await invoke('plugin:mwebview|inject_script', {
    payload: { script }
  })
}

/**
 * 注入初始化脚本/CSS（页面加载前执行，避免闪烁）
 * @param cssRules - CSS 规则字符串
 */
export async function injectInitScript(cssRules: string): Promise<void> {
  await invoke('plugin:mwebview|inject_init_script', {
    payload: { cssRules }
  })
}

/**
 * WebView 后退导航
 */
export async function webviewGoBack(): Promise<void> {
  await invoke('plugin:mwebview|webview_go_back')
}

/**
 * 检查是否能后退
 */
export async function webviewCanGoBack(): Promise<{ canGoBack: boolean }> {
  return await invoke('plugin:mwebview|webview_can_go_back')
}
